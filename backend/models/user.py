from typing import List, Optional
import requests
import os

class User:
    """Data model for a GitLab User."""
    def __init__(
        self,
        id: int,
        username: str,
        name: str,
        state: str,
        web_url: str,
        avatar_url: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = id
        self.username = username
        self.name = name
        self.state = state
        self.web_url = web_url
        self.avatar_url = avatar_url
        self.created_at = created_at

    @classmethod
    def from_gitlab(cls, data: dict) -> 'User':
        return cls(
            id=data['id'],
            username=data.get('username', ''),
            name=data.get('name', ''),
            state=data.get('state', ''),
            web_url=data.get('web_url', ''),
            avatar_url=data.get('avatar_url'),
            created_at=data.get('created_at'),
        )

def fetch_project_users_from_gitlab(project: dict) -> List[User]:
    """
    Fetch all users (members) for a project from GitLab.
    """
    token = os.environ.get('GITLAB_TOKEN')
    if not token:
        raise RuntimeError("Token environment variable 'GITLAB_TOKEN' not set.")
    base_url = "https://gitlab.com"
    project_id = project['id']
    url = f"{base_url}/api/v4/projects/{project_id}/members/all"
    params = {
        'per_page': 100,
    }
    headers = {"PRIVATE-TOKEN": token}
    users = []
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
        users.extend([User.from_gitlab(u) for u in data])
        if len(data) < 100:
            break
        page += 1
    return users
