"""
FastAPI application entry point.
Refactored to use service layer and improved error handling.
"""
from fastapi import FastAPI, Query, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import traceback
import logging
import os
from datetime import datetime
from pathlib import Path
import re

try:
    # Try absolute imports first (when running as module)
    from backend.config import get_settings
    from backend.services.gitlab_service import GitLabService
    from backend.schemas.requests import DateRangeRequest, ProjectRequest, TeamMergeReportRequest, UserWorkDashboardRequest
    from backend.schemas.qtest_requests import QTestProjectRequest, QTestQueryRequest, QTestCommentsRequest, QTestAttachmentsRequest
    from backend.utils.cache import get_cache
    from backend.utils.gitlab_client import get_gitlab_client, reset_gitlab_client
    from backend.services.qtest_service import QTestService
except ImportError:
    # Fall back to relative imports (when running from backend directory)
    from config import get_settings
    from services.gitlab_service import GitLabService
    from schemas.requests import DateRangeRequest, ProjectRequest, TeamMergeReportRequest, UserWorkDashboardRequest
    from schemas.qtest_requests import QTestProjectRequest, QTestQueryRequest, QTestCommentsRequest, QTestAttachmentsRequest
    from utils.cache import get_cache
    from utils.gitlab_client import get_gitlab_client, reset_gitlab_client
    from services.qtest_service import QTestService

# Configure logging
logging.basicConfig(
    level=get_settings().LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize app
app = FastAPI(
    title="GitLab Project Manager API",
    description="API for retrieving GitLab project information, merge requests, commits, and more",
    version="2.0.0"
)

# Get settings
settings = get_settings()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
gitlab_service = GitLabService()
qtest_service = QTestService()


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.LOG_LEVEL == "DEBUG" else "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "cache_enabled": settings.CACHE_ENABLED,
        "qtest_configured": qtest_service.is_configured(),
    }


@app.get("/qtest/projects")
async def qtest_list_projects():
    """List qTest projects available to the configured account."""
    try:
        if not qtest_service.is_configured():
            raise HTTPException(status_code=400, detail="QTEST_AUTH_HEADER or QTEST_TOKEN must be set")
        data = qtest_service.list_projects()
        return {"items": data, "count": len(data) if isinstance(data, list) else 0, "timestamp": datetime.utcnow().isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing qTest projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list qTest projects: {str(e)}")


@app.get("/qtest/projects/{project_id}/permissions")
async def qtest_project_permissions(project_id: int):
    """Get current user permissions for a qTest project."""
    try:
        request_data = QTestProjectRequest(project_id=project_id)
        data = qtest_service.get_current_user_permissions(request_data.project_id)
        return {**data, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching qTest permissions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch qTest permissions: {str(e)}")


@app.post("/qtest/projects/{project_id}/query")
async def qtest_query_objects(project_id: int, request: QTestQueryRequest):
    """Run a qTest query for requirements, test cases, test runs, or defects."""
    try:
        if request.project_id != project_id:
            raise HTTPException(status_code=400, detail="Path project_id must match request body project_id")
        data = qtest_service.query_objects(
            project_id=request.project_id,
            object_type=request.object_type,
            fields=request.fields,
            query=request.query,
            page=request.page,
            page_size=request.page_size,
        )
        return {**data, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying qTest objects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to query qTest objects: {str(e)}")


@app.post("/qtest/projects/{project_id}/comments")
async def qtest_query_comments(project_id: int, request: QTestCommentsRequest):
    """Query qTest comments for requirements, test cases, test runs, or defects."""
    try:
        if request.project_id != project_id:
            raise HTTPException(status_code=400, detail="Path project_id must match request body project_id")
        data = qtest_service.query_comments(
            project_id=request.project_id,
            object_type=request.object_type,
            object_id=request.object,
            authors=request.authors,
            start=request.start,
            end=request.end,
        )
        return {**data, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying qTest comments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to query qTest comments: {str(e)}")


@app.get("/qtest/projects/{project_id}/attachments")
async def qtest_query_attachments(
    project_id: int,
    type: str = Query(..., description="Artifact type"),
    ids: Optional[str] = Query(None, description="Comma-separated object ids"),
    author: Optional[str] = Query(None, description="Author id"),
    createdDate: Optional[str] = Query(None, description="Created date filter"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=100),
):
    """Query qTest attachments for supported object types."""
    try:
        request_data = QTestAttachmentsRequest(
            project_id=project_id,
            type=type,
            ids=ids,
            author=author,
            createdDate=createdDate,
        )
        data = qtest_service.query_attachments(
            project_id=request_data.project_id,
            attachment_type=request_data.type,
            ids=request_data.ids,
            author=request_data.author,
            created_date=request_data.createdDate,
            page=page,
            page_size=pageSize,
        )
        return {**data, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying qTest attachments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to query qTest attachments: {str(e)}")


@app.post("/qtest/projects/{project_id}/histories")
async def qtest_query_histories(
    project_id: int,
    object_type: str = Body(..., embed=True),
    object_query: Optional[str] = Body(None, embed=True),
    query: Optional[str] = Body(None, embed=True),
    fields: Optional[list] = Body(default_factory=lambda: ["*"] , embed=True),
    page: int = Body(1, embed=True),
    pageSize: int = Body(100, embed=True),
):
    """Query qTest history records for requirements, test cases, test runs, or defects."""
    try:
        request_data = QTestQueryRequest(project_id=project_id, object_type=object_type, fields=fields, query=object_query)
        data = qtest_service.client.post(
            f"api/v3/projects/{request_data.project_id}/histories",
            json_body={
                "object_type": request_data.object_type,
                "fields": request_data.fields,
                **({"object_query": object_query} if object_query else {}),
                **({"query": query} if query else {}),
            },
            params={"page": page, "pageSize": pageSize},
        )
        return {**data, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying qTest histories: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to query qTest histories: {str(e)}")


@app.get("/qtest/projects/{project_id}/linked-artifacts")
async def qtest_linked_artifacts(
    project_id: int,
    type: str = Query(..., description="Source object type"),
    ids: str = Query(..., description="Comma-separated artifact ids"),
):
    """Retrieve objects linked to qTest artifacts."""
    try:
        request_data = QTestProjectRequest(project_id=project_id)
        data = qtest_service.client.get(
            f"api/v3/projects/{request_data.project_id}/linked-artifacts",
            params={"type": type, "ids": ids},
        )
        return {"items": data, "count": len(data) if isinstance(data, list) else 0, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching qTest linked artifacts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch qTest linked artifacts: {str(e)}")


# Cache management endpoints
@app.post("/cache/clear")
async def clear_cache():
    """Clear the application cache."""
    try:
        cache = get_cache()
        cache.clear()
        return {"message": "Cache cleared successfully", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")


@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics."""
    cache = get_cache()
    return {
        "cache_enabled": settings.CACHE_ENABLED,
        "cache_size": len(cache.cache),
        "cache_ttl": settings.CACHE_TTL
    }


# API Endpoints
@app.get("/merge-requests")
async def get_merge_requests(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path"),
    start_date: str = Query(..., description="Start date in MM/DD/YYYY format"),
    end_date: str = Query(..., description="End date in MM/DD/YYYY format")
):
    """
    Get merge requests for a project within a date range.
    
    - **project_id**: GitLab project ID
    - **start_date**: Start date in MM/DD/YYYY format
    - **end_date**: End date in MM/DD/YYYY format
    """
    try:
        # Validate request
        request_data = DateRangeRequest(
            project_id=project_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Fetch data
        mrs = gitlab_service.get_merge_requests(
            request_data.project_id,
            request_data.start_date,
            request_data.end_date
        )
        
        return {
            "items": [mr.__dict__ for mr in mrs],
            "count": len(mrs),
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching merge requests: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch merge requests: {str(e)}"
        )


@app.get("/commits")
async def get_commits(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path"),
    start_date: str = Query(..., description="Start date in MM/DD/YYYY format"),
    end_date: str = Query(..., description="End date in MM/DD/YYYY format")
):
    """
    Get commits for a project within a date range.
    
    - **project_id**: GitLab project ID
    - **start_date**: Start date in MM/DD/YYYY format
    - **end_date**: End date in MM/DD/YYYY format
    """
    try:
        # Validate request
        request_data = DateRangeRequest(
            project_id=project_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Fetch data
        commits = gitlab_service.get_commits(
            request_data.project_id,
            request_data.start_date,
            request_data.end_date
        )
        
        return {
            "items": [c.__dict__ for c in commits],
            "count": len(commits),
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching commits: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch commits: {str(e)}"
        )


@app.get("/branches")
async def get_branches(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path")
):
    """
    Get all branches for a project.
    
    - **project_id**: GitLab project ID
    """
    try:
        # Validate request
        request_data = ProjectRequest(project_id=project_id)
        
        # Fetch data
        branches = gitlab_service.get_branches(request_data.project_id)
        
        return {
            "items": [b.__dict__ for b in branches],
            "count": len(branches),
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching branches: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch branches: {str(e)}"
        )


@app.get("/pipelines")
async def get_pipelines(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path")
):
    """
    Get all pipelines for a project.
    
    - **project_id**: GitLab project ID
    """
    try:
        # Validate request
        request_data = ProjectRequest(project_id=project_id)
        
        # Fetch data
        pipelines = gitlab_service.get_pipelines(request_data.project_id)
        
        return {
            "items": [p.__dict__ for p in pipelines],
            "count": len(pipelines),
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching pipelines: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch pipelines: {str(e)}"
        )


@app.get("/users")
async def get_users(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path")
):
    """
    Get all project members.
    
    - **project_id**: GitLab project ID
    """
    try:
        # Validate request
        request_data = ProjectRequest(project_id=project_id)
        
        # Fetch data
        users = gitlab_service.get_users(request_data.project_id)
        
        return {
            "items": [u.__dict__ for u in users],
            "count": len(users),
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching users: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )


@app.get("/project")
async def get_project(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path")
):
    """
    Get project details.
    
    - **project_id**: GitLab project ID
    """
    try:
        # Validate request
        request_data = ProjectRequest(project_id=project_id)
        
        # Fetch data
        project = gitlab_service.get_project(request_data.project_id)
        
        return {
            **project.__dict__,
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching project: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch project: {str(e)}"
        )


@app.get("/team-merge-report")
async def get_team_merge_report(
    project_id: str = Query(..., description="GitLab project ID or URL-encoded path"),
    start_date: str = Query(..., description="Start date in MM/DD/YYYY format"),
    end_date: str = Query(..., description="End date in MM/DD/YYYY format"),
    team_members: Optional[str] = Query(None, description="Comma-separated author names/usernames"),
    target_branch: Optional[str] = Query(None, description="Optional target branch"),
    merged_by: Optional[str] = Query(None, description="Optional merged-by user"),
):
    """
    Get merged merge requests for team activity reporting.

    - **project_id**: GitLab project ID
    - **start_date**: Start date in MM/DD/YYYY format
    - **end_date**: End date in MM/DD/YYYY format
    - **team_members**: Optional comma-separated author names/usernames
    - **target_branch**: Optional target branch filter
    - **merged_by**: Optional merged-by user filter
    """
    try:
        request_data = TeamMergeReportRequest(
            project_id=project_id,
            start_date=start_date,
            end_date=end_date,
            team_members=team_members,
            target_branch=target_branch,
            merged_by=merged_by,
        )

        report_items = gitlab_service.get_team_merge_report(
            request_data.project_id,
            request_data.start_date,
            request_data.end_date,
            request_data.team_members,
            request_data.target_branch,
            request_data.merged_by,
        )

        return {
            "items": [item.__dict__ for item in report_items],
            "count": len(report_items),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching team merge report: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch team merge report: {str(e)}"
        )


@app.get("/team-members")
async def get_team_members(
    project_id: str = Query(..., description="GitLab project ID or qa-automation parent key"),
    q: Optional[str] = Query(None, description="Optional prefix/search text"),
    limit: int = Query(50, ge=1, le=200, description="Max members to return"),
):
    """Get cached team members for autocomplete and multi-select filtering."""
    try:
        request_data = ProjectRequest(project_id=project_id)
        members = gitlab_service.get_team_members(request_data.project_id, q, limit)
        return {
            "items": members,
            "count": len(members),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching team members: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch team members: {str(e)}"
        )


@app.get("/user-work-dashboard")
async def get_user_work_dashboard(
    project_id: str = Query(..., description="GitLab project ID or qa-automation parent key"),
    start_date: str = Query(..., description="Start date in MM/DD/YYYY format"),
    end_date: str = Query(..., description="End date in MM/DD/YYYY format"),
    users: str = Query(..., description="Comma-separated GitLab usernames/names"),
):
    """Get leadership dashboard data for selected users across selected scope."""
    try:
        request_data = UserWorkDashboardRequest(
            project_id=project_id,
            start_date=start_date,
            end_date=end_date,
            users=users,
        )

        dashboard_data = gitlab_service.get_user_work_dashboard(
            project_id=request_data.project_id,
            start_date=request_data.start_date,
            end_date=request_data.end_date,
            users=request_data.users,
        )
        dashboard_data["timestamp"] = datetime.utcnow().isoformat()
        return dashboard_data
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching user work dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user work dashboard: {str(e)}"
        )


# Token management endpoints
@app.get("/config/token")
async def get_token_status():
    """Get token status (without exposing the actual token)."""
    try:
        token = settings.GITLAB_TOKEN
        return {
            "has_token": bool(token),
            "token_length": len(token) if token else 0,
            "token_preview": f"{token[:4]}...{token[-4:]}" if token and len(token) > 8 else "Not set"
        }
    except Exception as e:
        logger.error(f"Error getting token status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get token status")


@app.post("/config/token")
async def update_token(token: str = Body(..., embed=True)):
    """Update GitLab token in .env file."""
    try:
        if not token or len(token.strip()) < 10:
            raise HTTPException(status_code=400, detail="Token is required and must be at least 10 characters")
        
        token = token.strip()
        
        # Find .env file
        env_path = Path(__file__).parent.parent / '.env'
        
        # Read existing .env file or create new one
        env_content = ""
        if env_path.exists():
            env_content = env_path.read_text(encoding='utf-8')
        else:
            # Create from example if it exists
            example_path = Path(__file__).parent.parent / '.env.example'
            if example_path.exists():
                env_content = example_path.read_text(encoding='utf-8')
        
        # Update or add GITLAB_TOKEN
        lines = env_content.split('\n')
        token_updated = False
        new_lines = []
        
        for line in lines:
            if line.strip().startswith('GITLAB_TOKEN='):
                new_lines.append(f'GITLAB_TOKEN={token}')
                token_updated = True
            else:
                new_lines.append(line)
        
        if not token_updated:
            # Add token if it wasn't found
            if new_lines and new_lines[-1].strip():
                new_lines.append('')
            new_lines.append(f'GITLAB_TOKEN={token}')
        
        # Write back to .env file
        env_path.write_text('\n'.join(new_lines), encoding='utf-8')
        
        # Update settings in memory
        os.environ['GITLAB_TOKEN'] = token
        settings.GITLAB_TOKEN = token

        # Recreate shared GitLab client so new requests use updated headers.
        reset_gitlab_client()
        gitlab_service.client = get_gitlab_client()
        gitlab_service.base_url = gitlab_service.client.get_base_url()
        
        # Clear cache to force reload with new token
        cache = get_cache()
        cache.clear()
        
        logger.info("GitLab token updated successfully")
        
        return {
            "message": "Token updated successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update token: {str(e)}")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting GitLab Project Manager API")
    logger.info(f"Cache enabled: {settings.CACHE_ENABLED}")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    # Validate settings
    try:
        settings.validate()
        logger.info("Configuration validated successfully")
        gitlab_service.refresh_team_members_cache()
        logger.info("Team members cache warmed successfully")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise
    except Exception as e:
        logger.warning(f"Team members cache warmup failed: {e}")
