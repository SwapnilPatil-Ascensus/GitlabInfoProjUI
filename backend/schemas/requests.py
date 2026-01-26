"""
Pydantic models for request validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class DateRangeRequest(BaseModel):
    """Request model for endpoints requiring date range."""
    project_id: int = Field(..., description="GitLab project ID", gt=0)
    start_date: str = Field(..., description="Start date in MM/DD/YYYY format")
    end_date: str = Field(..., description="End date in MM/DD/YYYY format")
    
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
    project_id: int = Field(..., description="GitLab project ID", gt=0)
