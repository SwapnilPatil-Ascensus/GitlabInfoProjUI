from typing import Optional
import requests
import os

class Project:
    """Data model for a GitLab Project."""
    def __init__(
        self,
        id: int,
        name: str,
        path_with_namespace: str,
        web_url: str,
        description: Optional[str] = None,
        visibility: Optional[str] = None,
        default_branch: Optional[str] = None,
        created_at: Optional[str] = None,
        last_activity_at: Optional[str] = None,
    ):
        self.id = id
        self.name = name
        self.path_with_namespace = path_with_namespace
        self.web_url = web_url
        self.description = description
        self.visibility = visibility
        self.default_branch = default_branch
        self.created_at = created_at
        self.last_activity_at = last_activity_at

    @classmethod
    def from_gitlab(cls, data: dict) -> 'Project':
        return cls(
            id=data['id'],
            name=data.get('name', ''),
            path_with_namespace=data.get('path_with_namespace', ''),
            web_url=data.get('web_url', ''),
            description=data.get('description'),
            visibility=data.get('visibility'),
            default_branch=data.get('default_branch'),
            created_at=data.get('created_at'),
            last_activity_at=data.get('last_activity_at'),
        )

def fetch_project_from_gitlab(project_id: int) -> Project:
    """
    Fetch project details from GitLab by project ID.
    """
    token = os.environ.get('GITLAB_TOKEN')
    if not token:
        raise RuntimeError("Token environment variable 'GITLAB_TOKEN' not set.")
    base_url = "https://gitlab.com"
    url = f"{base_url}/api/v4/projects/{project_id}"
    headers = {"PRIVATE-TOKEN": token}
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    resp = requests.get(url, headers=headers, verify=False)
    resp.raise_for_status()
    data = resp.json()
    return Project.from_gitlab(data)
