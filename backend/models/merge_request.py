
from typing import List, Optional
from datetime import datetime
import requests
import os

class MergeRequest:
    """Data model for a GitLab Merge Request."""
    def __init__(
        self,
        id: int,
        title: str,
        web_url: str,
        author: dict,
        created_at: str,
        merged_at: Optional[str],
        state: str,
        source_branch: str,
        target_branch: str,
        reviewers: Optional[list] = None,
        labels: Optional[list] = None,
        merged_by: Optional[dict] = None,
    ):
        self.id = id
        self.title = title
        self.web_url = web_url
        self.author = author
        self.created_at = created_at
        self.merged_at = merged_at
        self.state = state
        self.source_branch = source_branch
        self.target_branch = target_branch
        self.reviewers = reviewers or []
        self.labels = labels or []
        self.merged_by = merged_by or {}

    @classmethod
    def from_gitlab(cls, data: dict) -> 'MergeRequest':
        # reviewers: list of dicts with at least 'name'
        reviewers = data.get('reviewers', [])
        # author: dict with at least 'name'
        author = data.get('author', {}) if data.get('author') else {}
        # merged_by: dict with at least 'name'
        merged_by = data.get('merged_by', {}) if data.get('merged_by') else {}
        return cls(
            id=data['id'],
            title=data['title'],
            web_url=data['web_url'],
            author=author,
            created_at=data['created_at'],
            merged_at=data.get('merged_at'),
            state=data['state'],
            source_branch=data.get('source_branch', ''),
            target_branch=data.get('target_branch', ''),
            reviewers=reviewers,
            labels=data.get('labels', []),
            merged_by=merged_by,
        )

def fetch_merge_requests_from_gitlab(project: dict, start_date: str, end_date: str) -> List[MergeRequest]:
    """
    Fetch merge requests for a project from GitLab within the given date range.
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
    url = f"{base_url}/api/v4/projects/{project_id}/merge_requests"
    params = {
        'updated_after': start_iso,
        'updated_before': end_iso,
        'scope': 'all',
        'per_page': 100,
        'order_by': 'updated_at',
        'sort': 'desc',
    }
    headers = {"PRIVATE-TOKEN": token}
    mrs = []
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
        mrs.extend([MergeRequest.from_gitlab(mr) for mr in data])
        if len(data) < 100:
            break
        page += 1
    return mrs
