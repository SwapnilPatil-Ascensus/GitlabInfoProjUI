"""
Pydantic models for qTest request validation.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator


ALLOWED_QTEST_OBJECT_TYPES = {"requirements", "test-cases", "test-runs", "defects"}
ALLOWED_QTEST_ATTACHMENT_TYPES = {"releases", "builds", "requirements", "test-cases", "test-steps", "test-logs", "defects"}


class QTestProjectRequest(BaseModel):
    project_id: int = Field(..., description="qTest project ID")

    @validator("project_id", pre=True)
    def validate_project_id(cls, v):
        try:
            project_id = int(v)
        except (TypeError, ValueError) as exc:
            raise ValueError("qTest project_id must be a positive integer") from exc
        if project_id <= 0:
            raise ValueError("qTest project_id must be a positive integer")
        return project_id


class QTestQueryRequest(QTestProjectRequest):
    object_type: str = Field(..., description="qTest object type to query")
    fields: Optional[List[str]] = Field(default_factory=lambda: ["*"], description="Fields to return")
    query: Optional[str] = Field(default=None, description="qTest query summary string")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=100, ge=1, le=100, description="Page size")

    @validator("object_type")
    def validate_object_type(cls, v):
        value = str(v).strip()
        if value not in ALLOWED_QTEST_OBJECT_TYPES:
            raise ValueError(f"object_type must be one of: {', '.join(sorted(ALLOWED_QTEST_OBJECT_TYPES))}")
        return value


class QTestCommentsRequest(QTestProjectRequest):
    object_type: str = Field(..., description="qTest object type")
    object: Optional[str] = Field(default=None, description="Object id or PID")
    authors: Optional[str] = Field(default=None, description="Comma-separated author ids")
    start: Optional[str] = Field(default=None, description="Start ISO datetime")
    end: Optional[str] = Field(default=None, description="End ISO datetime")

    @validator("object_type")
    def validate_comments_object_type(cls, v):
        value = str(v).strip()
        if value not in ALLOWED_QTEST_OBJECT_TYPES:
            raise ValueError(f"object_type must be one of: {', '.join(sorted(ALLOWED_QTEST_OBJECT_TYPES))}")
        return value

    @validator("start", "end", pre=True)
    def normalize_datetime(cls, v):
        if v is None:
            return None
        value = str(v).strip()
        if not value:
            return None
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("DateTime fields must be ISO 8601 strings") from exc
        return value


class QTestAttachmentsRequest(QTestProjectRequest):
    type: str = Field(..., description="Artifact type for attachment lookup")
    ids: Optional[str] = Field(default=None, description="Comma-separated object ids")
    author: Optional[str] = Field(default=None, description="Attachment author id")
    createdDate: Optional[str] = Field(default=None, description="Filter by ISO datetime with operator")

    @validator("type")
    def validate_attachment_type(cls, v):
        value = str(v).strip()
        if value not in ALLOWED_QTEST_ATTACHMENT_TYPES:
            raise ValueError(f"type must be one of: {', '.join(sorted(ALLOWED_QTEST_ATTACHMENT_TYPES))}")
        return value
