from typing import List, Optional
import requests
import os

class Pipeline:
    """Data model for a GitLab Pipeline."""
    def __init__(
        self,
        id: int,
        status: str,
        ref: str,
        web_url: str,
        sha: str,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
    ):
        self.id = id
        self.status = status
        self.ref = ref
        self.web_url = web_url
        self.sha = sha
        self.created_at = created_at
        self.updated_at = updated_at

    @classmethod
    def from_gitlab(cls, data: dict) -> 'Pipeline':
        return cls(
            id=data['id'],
            status=data.get('status', ''),
            ref=data.get('ref', ''),
            web_url=data.get('web_url', ''),
            sha=data.get('sha', ''),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
        )

def fetch_pipelines_from_gitlab(project: dict) -> List[Pipeline]:
    """
    Fetch all pipelines for a project from GitLab.
    """
    token = os.environ.get('GITLAB_TOKEN')
    if not token:
        raise RuntimeError("Token environment variable 'GITLAB_TOKEN' not set.")
    base_url = "https://gitlab.com"
    project_id = project['id']
    url = f"{base_url}/api/v4/projects/{project_id}/pipelines"
    params = {
        'per_page': 100,
    }
    headers = {"PRIVATE-TOKEN": token}
    pipelines = []
    page = 1
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    while True:
        params['page'] = page
        resp = requests.get(url, headers=headers, params=params, verify=False)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        pipelines.extend([Pipeline.from_gitlab(p) for p in data])
        if len(data) < 100:
            break
        page += 1
    return pipelines
