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
from datetime import datetime
from pathlib import Path
import re

try:
    # Try absolute imports first (when running as module)
    from backend.config import get_settings
    from backend.services.gitlab_service import GitLabService
    from backend.schemas.requests import DateRangeRequest, ProjectRequest
    from backend.utils.cache import get_cache
except ImportError:
    # Fall back to relative imports (when running from backend directory)
    from config import get_settings
    from services.gitlab_service import GitLabService
    from schemas.requests import DateRangeRequest, ProjectRequest
    from utils.cache import get_cache

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
        "cache_enabled": settings.CACHE_ENABLED
    }


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
    project_id: int = Query(..., description="GitLab project ID", gt=0),
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
    project_id: int = Query(..., description="GitLab project ID", gt=0),
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
    project_id: int = Query(..., description="GitLab project ID", gt=0)
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
    project_id: int = Query(..., description="GitLab project ID", gt=0)
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
    project_id: int = Query(..., description="GitLab project ID", gt=0)
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
    project_id: int = Query(..., description="GitLab project ID", gt=0)
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
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise
