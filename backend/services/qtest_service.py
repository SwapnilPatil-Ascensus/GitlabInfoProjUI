"""
Service layer for qTest operations.
"""
from typing import Any, Dict, Optional
import logging

try:
    from backend.utils.qtest_client import get_qtest_client
except ImportError:
    from utils.qtest_client import get_qtest_client

logger = logging.getLogger(__name__)


class QTestService:
    """Service for qTest API operations."""

    def __init__(self):
        self.client = get_qtest_client()

    def is_configured(self) -> bool:
        return self.client.is_configured()

    def list_projects(self):
        return self.client.get("api/v3/projects")

    def get_current_user_permissions(self, project_id: int):
        return self.client.get(f"api/v3/projects/{project_id}/user-profiles/current")

    def query_objects(
        self,
        project_id: int,
        object_type: str,
        fields: Optional[list] = None,
        query: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> Dict[str, Any]:
        payload = {
            "object_type": object_type,
            "fields": fields or ["*"],
        }
        if query:
            payload["query"] = query

        return self.client.post(
            f"api/v3/projects/{project_id}/search",
            json_body=payload,
            params={"page": page, "pageSize": page_size},
        )

    def query_comments(
        self,
        project_id: int,
        object_type: str,
        object_id: Optional[str] = None,
        authors: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"object_type": object_type}
        if object_id:
            payload["object"] = object_id
        if authors:
            payload["authors"] = authors
        if start:
            payload["start"] = start
        if end:
            payload["end"] = end

        return self.client.post(f"api/v3/projects/{project_id}/comments", json_body=payload)

    def query_attachments(
        self,
        project_id: int,
        attachment_type: str,
        ids: Optional[str] = None,
        author: Optional[str] = None,
        created_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"type": attachment_type, "page": page, "pageSize": page_size}
        if ids:
            params["ids"] = ids
        if author:
            params["author"] = author
        if created_date:
            params["createdDate"] = created_date

        return self.client.get(f"api/v3/projects/{project_id}/attachments", params=params)
