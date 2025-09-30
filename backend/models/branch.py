
from typing import List, Optional
import requests
import os

class Branch:
    """Data model for a GitLab Branch."""
    def __init__(
        self,
        name: str,
        merged: Optional[bool] = None,
        protected: Optional[bool] = None,
        default: Optional[bool] = None,
        web_url: Optional[str] = None,
        commit_id: Optional[str] = None,
        author_name: Optional[str] = None,
    ):
        self.name = name
        self.merged = merged
        self.protected = protected
        self.default = default
        self.web_url = web_url
        self.commit_id = commit_id
        self.author_name = author_name

    @classmethod
    def from_gitlab(cls, data: dict, project_id: str, author_name: Optional[str] = None) -> 'Branch':
        web_url = f"https://gitlab.com/api/v4/projects/{project_id}/repository/branches/{data['name']}"
        return cls(
            name=data['name'],
            merged=data.get('merged'),
            protected=data.get('protected'),
            default=data.get('default'),
            web_url=web_url,
            commit_id=data.get('commit', {}).get('id'),
            author_name=author_name,
        )

def fetch_branches_from_gitlab(project: dict) -> List[Branch]:
    """
    Fetch all branches for a project from GitLab.
    """
    token = os.environ.get('GITLAB_TOKEN')
    if not token:
        raise RuntimeError("Token environment variable 'GITLAB_TOKEN' not set.")
    base_url = "https://gitlab.com"
    project_id = project['id']
    url = f"{base_url}/api/v4/projects/{project_id}/repository/branches"
    params = {
        'per_page': 100,
    }
    headers = {"PRIVATE-TOKEN": token}
    branches = []
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
        for b in data:
            # Fetch the first commit for the branch to get the author
            commit_id = b.get('commit', {}).get('id')
            author_name = None
            if commit_id:
                # Get the first commit (root) for this branch
                commits_url = f"https://gitlab.com/api/v4/projects/{project_id}/repository/commits"
                commits_params = {
                    'ref_name': b['name'],
                    'per_page': 1,
                    'order': 'asc',
                }
                commits_resp = requests.get(commits_url, headers=headers, params=commits_params, verify=False)
                if commits_resp.status_code == 200:
                    commits_data = commits_resp.json()
                    if commits_data and isinstance(commits_data, list) and len(commits_data) > 0:
                        author_name = commits_data[0].get('author_name')
            branches.append(Branch.from_gitlab(b, project_id, author_name=author_name))
        if len(data) < 100:
            break
        page += 1
    return branches
