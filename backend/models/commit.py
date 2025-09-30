
from typing import List, Optional
from datetime import datetime
import requests
import os

class Commit:
    """Data model for a GitLab Commit."""
    def __init__(
        self,
        id: str,
        short_id: str,
        title: str,
        author_name: str,
        authored_date: str,
        committed_date: str,
        message: str,
        web_url: Optional[str] = None,
    ):
        self.id = id
        self.short_id = short_id
        self.title = title
        self.author_name = author_name
        self.authored_date = authored_date
        self.committed_date = committed_date
        self.message = message
        self.web_url = web_url

    @classmethod
    def from_gitlab(cls, data: dict) -> 'Commit':
        return cls(
            id=data['id'],
            short_id=data.get('short_id', data['id'][:8]),
            title=data.get('title', data.get('message', '').split('\n')[0]),
            author_name=data.get('author_name', ''),
            authored_date=data.get('authored_date', ''),
            committed_date=data.get('committed_date', ''),
            message=data.get('message', ''),
            web_url=data.get('web_url'),
        )

def fetch_commits_from_gitlab(project: dict, start_date: str, end_date: str) -> List[Commit]:
    """
    Fetch commits for a project from GitLab within the given date range.
    Dates should be in MM/DD/YYYY format.
    """
    token = os.environ.get('GITLAB_TOKEN')
    if not token:
        raise RuntimeError("Token environment variable 'GITLAB_TOKEN' not set.")
    base_url = "https://gitlab.com"
    project_id = project['id']
    # Convert dates to ISO 8601
    start_iso = datetime.strptime(start_date, "%m/%d/%Y").isoformat()
    end_iso = datetime.strptime(end_date, "%m/%d/%Y").isoformat()
    url = f"{base_url}/api/v4/projects/{project_id}/repository/commits"
    params = {
        'since': start_iso,
        'until': end_iso,
        'per_page': 100,
        # 'all': True,  # Not supported for project commits endpoint
        # 'with_stats': False,  # Not supported for project commits endpoint
        # 'order': 'desc',  # Not supported for project commits endpoint
    }
    headers = {"PRIVATE-TOKEN": token}
    commits = []
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
        commits.extend([Commit.from_gitlab(c) for c in data])
        if len(data) < 100:
            break
        page += 1
    return commits
