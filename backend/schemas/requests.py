"""
Pydantic models for request validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import re


def _normalize_project_id(value) -> str:
    """Accept numeric IDs or GitLab project paths (raw or URL-encoded)."""
    if isinstance(value, int):
        if value <= 0:
            raise ValueError("project_id must be a positive integer")
        return str(value)

    if not isinstance(value, str):
        raise ValueError("project_id must be a string or positive integer")

    project_id = value.strip()
    if not project_id:
        raise ValueError("project_id is required")

    if project_id.isdigit():
        if int(project_id) <= 0:
            raise ValueError("project_id must be a positive integer")
        return project_id

    # Allow path-like IDs such as group/subgroup/project or URL-encoded variants.
    if not re.fullmatch(r"[A-Za-z0-9._%\-/]+", project_id):
        raise ValueError("project_id must be a positive integer or valid GitLab project path")

    return project_id


class DateRangeRequest(BaseModel):
    """Request model for endpoints requiring date range."""
    project_id: str = Field(..., description="GitLab project ID or URL-encoded path")
    start_date: str = Field(..., description="Start date in MM/DD/YYYY format")
    end_date: str = Field(..., description="End date in MM/DD/YYYY format")

    @validator('project_id', pre=True)
    def validate_project_id(cls, v):
        """Validate and normalize project identifier."""
        return _normalize_project_id(v)
    
    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        """Validate date format."""
        try:
            datetime.strptime(v, "%m/%d/%Y")
            return v
        except ValueError:
            raise ValueError("Date must be in MM/DD/YYYY format")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        """Validate that end_date is after start_date."""
        if 'start_date' in values:
            try:
                start = datetime.strptime(values['start_date'], "%m/%d/%Y")
                end = datetime.strptime(v, "%m/%d/%Y")
                if end < start:
                    raise ValueError("end_date must be after start_date")
            except (ValueError, KeyError):
                pass  # Let format validator handle it
        return v


class ProjectRequest(BaseModel):
    """Request model for endpoints requiring only project_id."""
    project_id: str = Field(..., description="GitLab project ID or URL-encoded path")

    @validator('project_id', pre=True)
    def validate_project_id(cls, v):
        """Validate and normalize project identifier."""
        return _normalize_project_id(v)


class TeamMergeReportRequest(DateRangeRequest):
    """Request model for team merge report endpoint."""
    team_members: Optional[List[str]] = Field(
        default=None,
        description="Optional list of team member names/usernames to filter by"
    )
    target_branch: Optional[str] = Field(
        default=None,
        description="Optional target branch filter"
    )
    merged_by: Optional[str] = Field(
        default=None,
        description="Optional merged-by user filter"
    )

    @validator('team_members', pre=True)
    def normalize_team_members(cls, v):
        """Accept comma-separated string or list and normalize values."""
        if v is None or v == '':
            return None
        if isinstance(v, str):
            members = [m.strip() for m in v.split(',') if m.strip()]
            return members or None
        if isinstance(v, list):
            members = [str(m).strip() for m in v if str(m).strip()]
            return members or None
        raise ValueError("team_members must be a comma-separated string or array")

    @validator('target_branch', 'merged_by', pre=True)
    def normalize_optional_text(cls, v):
        """Normalize optional string filters by trimming empty values."""
        if v is None:
            return None
        value = str(v).strip()
        return value or None


class UserWorkDashboardRequest(DateRangeRequest):
    """Request model for leadership per-user dashboard."""
    users: List[str] = Field(
        default_factory=list,
        description="List of GitLab usernames or names"
    )

    @validator('users', pre=True)
    def normalize_users(cls, v):
        """Accept comma-separated string or array and normalize."""
        if v is None:
            return []
        if isinstance(v, str):
            return [x.strip() for x in v.split(',') if x and x.strip()]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        raise ValueError("users must be a comma-separated string or array")

    @validator('users')
    def validate_users(cls, v):
        if not v:
            raise ValueError("At least one user is required")
        return v
