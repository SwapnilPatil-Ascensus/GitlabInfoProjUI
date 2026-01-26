"""
Service layer for GitLab operations.
Separates business logic from API endpoints and data models.
"""
from typing import List, Optional
from datetime import datetime
import logging

try:
    from backend.utils.gitlab_client import get_gitlab_client
    from backend.utils.cache import cached
    from backend.models.merge_request import MergeRequest
    from backend.models.commit import Commit
    from backend.models.branch import Branch
    from backend.models.pipeline import Pipeline
    from backend.models.user import User
    from backend.models.project import Project
except ImportError:
    from utils.gitlab_client import get_gitlab_client
    from utils.cache import cached
    from models.merge_request import MergeRequest
    from models.commit import Commit
    from models.branch import Branch
    from models.pipeline import Pipeline
    from models.user import User
    from models.project import Project

logger = logging.getLogger(__name__)


class GitLabService:
    """Service for GitLab API operations."""
    
    def __init__(self):
        self.client = get_gitlab_client()
        self.base_url = self.client.get_base_url()
    
    def _parse_date(self, date_str: str) -> str:
        """Parse date from MM/DD/YYYY format to ISO 8601."""
        try:
            dt = datetime.strptime(date_str, "%m/%d/%Y")
            return dt.isoformat()
        except ValueError as e:
            raise ValueError(f"Invalid date format: {date_str}. Expected MM/DD/YYYY") from e
    
    @cached(ttl=300)  # Cache for 5 minutes
    def get_merge_requests(
        self,
        project_id: int,
        start_date: str,
        end_date: str
    ) -> List[MergeRequest]:
        """
        Get merge requests for a project within date range.
        
        Args:
            project_id: GitLab project ID
            start_date: Start date in MM/DD/YYYY format
            end_date: End date in MM/DD/YYYY format
            
        Returns:
            List of MergeRequest objects
        """
        start_iso = self._parse_date(start_date)
        end_iso = self._parse_date(end_date)
        
        url = f"{self.base_url}/api/v4/projects/{project_id}/merge_requests"
        params = {
            'updated_after': start_iso,
            'updated_before': end_iso,
            'scope': 'all',
            'per_page': 100,
            'order_by': 'updated_at',
            'sort': 'desc',
        }
        
        return self.client.fetch_paginated(url, params, MergeRequest)
    
    @cached(ttl=300)
    def get_commits(
        self,
        project_id: int,
        start_date: str,
        end_date: str
    ) -> List[Commit]:
        """
        Get commits for a project within date range.
        
        Args:
            project_id: GitLab project ID
            start_date: Start date in MM/DD/YYYY format
            end_date: End date in MM/DD/YYYY format
            
        Returns:
            List of Commit objects
        """
        start_iso = self._parse_date(start_date)
        end_iso = self._parse_date(end_date)
        
        url = f"{self.base_url}/api/v4/projects/{project_id}/repository/commits"
        params = {
            'since': start_iso,
            'until': end_iso,
            'per_page': 100,
        }
        
        return self.client.fetch_paginated(url, params, Commit)
    
    @cached(ttl=600)  # Cache branches for 10 minutes
    def get_branches(self, project_id: int) -> List[Branch]:
        """
        Get all branches for a project.
        
        Args:
            project_id: GitLab project ID
            
        Returns:
            List of Branch objects
        """
        url = f"{self.base_url}/api/v4/projects/{project_id}/repository/branches"
        params = {'per_page': 100}
        
        # Fetch raw branch data (not using model_class to get raw dicts)
        branches_data = self.client.fetch_paginated(url, params, transform_func=lambda x: x)
        
        # Fetch author for each branch
        branches = []
        headers = self.client.get_headers()
        
        for branch_data in branches_data:
            author_name = None
            commit_id = branch_data.get('commit', {}).get('id')
            
            if commit_id:
                # Get first commit to find author
                commits_url = f"{self.base_url}/api/v4/projects/{project_id}/repository/commits"
                commits_params = {
                    'ref_name': branch_data['name'],
                    'per_page': 1,
                    'order': 'asc',
                }
                try:
                    import requests
                    commits_resp = requests.get(
                        commits_url,
                        headers=headers,
                        params=commits_params,
                        verify=self.client.verify_ssl,
                        timeout=30
                    )
                    if commits_resp.status_code == 200:
                        commits_data = commits_resp.json()
                        if commits_data and isinstance(commits_data, list) and len(commits_data) > 0:
                            author_name = commits_data[0].get('author_name')
                except Exception as e:
                    logger.warning(f"Could not fetch author for branch {branch_data['name']}: {e}")
            
            branches.append(Branch.from_gitlab(branch_data, str(project_id), author_name))
        
        return branches
    
    @cached(ttl=180)  # Cache pipelines for 3 minutes
    def get_pipelines(self, project_id: int) -> List[Pipeline]:
        """
        Get all pipelines for a project.
        
        Args:
            project_id: GitLab project ID
            
        Returns:
            List of Pipeline objects
        """
        url = f"{self.base_url}/api/v4/projects/{project_id}/pipelines"
        params = {'per_page': 100}
        
        return self.client.fetch_paginated(url, params, Pipeline)
    
    @cached(ttl=1800)  # Cache users for 30 minutes
    def get_users(self, project_id: int) -> List[User]:
        """
        Get all project members.
        
        Args:
            project_id: GitLab project ID
            
        Returns:
            List of User objects
        """
        url = f"{self.base_url}/api/v4/projects/{project_id}/members/all"
        params = {'per_page': 100}
        
        return self.client.fetch_paginated(url, params, User)
    
    @cached(ttl=1800)  # Cache project for 30 minutes
    def get_project(self, project_id: int) -> Project:
        """
        Get project details.
        
        Args:
            project_id: GitLab project ID
            
        Returns:
            Project object
        """
        url = f"{self.base_url}/api/v4/projects/{project_id}"
        
        return self.client.fetch_single(url, model_class=Project)
