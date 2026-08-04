"""
Service layer for GitLab operations.
Separates business logic from API endpoints and data models.
"""
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
import logging
from urllib.parse import quote
from pathlib import Path
import json
import re

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

QA_AUTOMATION_GROUP_KEY = "qa-automation-group"
QA_AUTOMATION_GROUP_PATH = "ascensus-gs/products/depot/qa-automation"
TEAM_MEMBERS_CACHE_PATH = Path(__file__).resolve().parents[1] / "data" / "team_members_cache.json"


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

    def _encode_project_id(self, project_id: str) -> str:
        """Encode project ID/path for GitLab API endpoint URLs."""
        return quote(str(project_id), safe='')

    def _is_parent_group(self, project_id: str) -> bool:
        """Return True when the special parent qa-automation dropdown option is selected."""
        value = str(project_id).strip().lower()
        return value in {QA_AUTOMATION_GROUP_KEY, QA_AUTOMATION_GROUP_PATH.lower()}

    @cached(ttl=1800)
    def get_group_projects(self, group_path: str = QA_AUTOMATION_GROUP_PATH) -> List[Dict[str, Any]]:
        """Get direct child projects for a GitLab group path."""
        encoded_group = self._encode_project_id(group_path)
        url = f"{self.base_url}/api/v4/groups/{encoded_group}/projects"
        params = {
            'include_subgroups': True,
            'per_page': 100,
            'order_by': 'name',
            'sort': 'asc',
        }

        projects = self.client.fetch_paginated(url, params, transform_func=lambda x: x)
        # Keep only projects under the qa-automation group namespace.
        prefix = f"{group_path}/".lower()
        return [
            p for p in projects
            if str(p.get('path_with_namespace', '')).lower().startswith(prefix)
        ]

    def _resolve_project_ids_for_team(self, project_id: str) -> List[str]:
        """Resolve one or more concrete project IDs for team-based aggregation."""
        if not self._is_parent_group(project_id):
            return [str(project_id)]

        child_projects = self.get_group_projects(QA_AUTOMATION_GROUP_PATH)
        return [str(p.get('id')) for p in child_projects if p.get('id')]

    def _read_team_members_cache(self) -> Dict[str, Any]:
        """Read team members cache JSON file if present."""
        try:
            if TEAM_MEMBERS_CACHE_PATH.exists():
                return json.loads(TEAM_MEMBERS_CACHE_PATH.read_text(encoding='utf-8'))
        except Exception as e:
            logger.warning(f"Unable to read team members cache: {e}")
        return {"generated_at": None, "projects": {}}

    def _write_team_members_cache(self, cache_data: Dict[str, Any]) -> None:
        """Write team members cache JSON to disk."""
        TEAM_MEMBERS_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        TEAM_MEMBERS_CACHE_PATH.write_text(
            json.dumps(cache_data, indent=2),
            encoding='utf-8'
        )

    def _serialize_users(self, users: List[User]) -> List[Dict[str, Any]]:
        """Convert user models to serializable dict list."""
        return [u.__dict__ for u in users]

    def _dedupe_users(self, users: List[User]) -> List[User]:
        """Deduplicate users by id while preserving a stable order."""
        seen: Set[int] = set()
        deduped: List[User] = []
        for user in users:
            if user.id in seen:
                continue
            seen.add(user.id)
            deduped.append(user)
        deduped.sort(key=lambda u: (u.name or '').lower())
        return deduped

    def refresh_team_members_cache(self, project_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Refresh cached team-member JSON for selected projects."""
        target_ids = project_ids or [
            QA_AUTOMATION_GROUP_KEY,
            '71904320',
            '71904329',
            '71904336',
            '71904346',
        ]
        cache_data = self._read_team_members_cache()
        cache_data.setdefault('projects', {})

        for project_id in target_ids:
            try:
                users = self.get_users(project_id)
                cache_data['projects'][str(project_id)] = {
                    'updated_at': datetime.utcnow().isoformat(),
                    'users': self._serialize_users(users),
                }
            except Exception as e:
                logger.warning(f"Unable to refresh team members for {project_id}: {e}")

        cache_data['generated_at'] = datetime.utcnow().isoformat()
        self._write_team_members_cache(cache_data)
        return cache_data

    def get_team_members(
        self,
        project_id: str,
        query: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get team members from cached JSON with optional typeahead filtering."""
        cache_data = self._read_team_members_cache()
        project_cache = cache_data.get('projects', {})
        project_key = str(project_id)

        users_data = project_cache.get(project_key, {}).get('users')
        if users_data is None:
            # Warm cache on first use for this project.
            self.refresh_team_members_cache([project_key])
            cache_data = self._read_team_members_cache()
            users_data = cache_data.get('projects', {}).get(project_key, {}).get('users', [])

        needle = (query or '').strip().lower()
        if needle:
            users_data = [
                user for user in users_data
                if needle in str(user.get('name', '')).lower()
                or needle in str(user.get('username', '')).lower()
            ]

        users_data.sort(key=lambda u: str(u.get('name', '')).lower())
        return users_data[:max(1, min(limit, 200))]

    def _parse_gitlab_iso_datetime(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse GitLab ISO datetime values safely."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            return None
    
    @cached(ttl=300)  # Cache for 5 minutes
    def get_merge_requests(
        self,
        project_id: str,
        start_date: str,
        end_date: str
    ) -> List[MergeRequest]:
        """
        Get merge requests for a project within date range.
        
        Args:
            project_id: GitLab project ID or URL-encoded project path
            start_date: Start date in MM/DD/YYYY format
            end_date: End date in MM/DD/YYYY format
            
        Returns:
            List of MergeRequest objects
        """
        start_iso = self._parse_date(start_date)
        end_iso = self._parse_date(end_date)
        encoded_project_id = self._encode_project_id(project_id)
        
        url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/merge_requests"
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
        project_id: str,
        start_date: str,
        end_date: str
    ) -> List[Commit]:
        """
        Get commits for a project within date range.
        
        Args:
            project_id: GitLab project ID or URL-encoded project path
            start_date: Start date in MM/DD/YYYY format
            end_date: End date in MM/DD/YYYY format
            
        Returns:
            List of Commit objects
        """
        start_iso = self._parse_date(start_date)
        end_iso = self._parse_date(end_date)
        encoded_project_id = self._encode_project_id(project_id)
        
        url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/repository/commits"
        params = {
            'since': start_iso,
            'until': end_iso,
            'per_page': 100,
        }
        
        return self.client.fetch_paginated(url, params, Commit)
    
    @cached(ttl=600)  # Cache branches for 10 minutes
    def get_branches(self, project_id: str) -> List[Branch]:
        """
        Get all branches for a project.
        
        Args:
            project_id: GitLab project ID or URL-encoded project path
            
        Returns:
            List of Branch objects
        """
        encoded_project_id = self._encode_project_id(project_id)
        url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/repository/branches"
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
                commits_url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/repository/commits"
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
    def get_pipelines(self, project_id: str) -> List[Pipeline]:
        """
        Get all pipelines for a project.
        
        Args:
            project_id: GitLab project ID or URL-encoded project path
            
        Returns:
            List of Pipeline objects
        """
        encoded_project_id = self._encode_project_id(project_id)
        url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/pipelines"
        params = {'per_page': 100}
        
        return self.client.fetch_paginated(url, params, Pipeline)
    
    @cached(ttl=1800)  # Cache users for 30 minutes
    def get_users(self, project_id: str) -> List[User]:
        """
        Get all project members.
        
        Args:
            project_id: GitLab project ID or URL-encoded project path
            
        Returns:
            List of User objects
        """
        if self._is_parent_group(project_id):
            users: List[User] = []
            for child_project_id in self._resolve_project_ids_for_team(project_id):
                encoded_project_id = self._encode_project_id(child_project_id)
                url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/members/all"
                params = {'per_page': 100}
                users.extend(self.client.fetch_paginated(url, params, User))
            return self._dedupe_users(users)

        encoded_project_id = self._encode_project_id(project_id)
        url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/members/all"
        params = {'per_page': 100}

        return self.client.fetch_paginated(url, params, User)
    
    @cached(ttl=1800)  # Cache project for 30 minutes
    def get_project(self, project_id: str) -> Project:
        """
        Get project details.
        
        Args:
            project_id: GitLab project ID or URL-encoded project path
            
        Returns:
            Project object
        """
        encoded_project_id = self._encode_project_id(project_id)
        url = f"{self.base_url}/api/v4/projects/{encoded_project_id}"
        
        return self.client.fetch_single(url, model_class=Project)

    @cached(ttl=300)
    def get_team_merge_report(
        self,
        project_id: str,
        start_date: str,
        end_date: str,
        team_members: Optional[List[str]] = None,
        target_branch: Optional[str] = None,
        merged_by: Optional[str] = None,
    ) -> List[MergeRequest]:
        """
        Get merged merge requests for a team within a date range.

        Args:
            project_id: GitLab project ID or URL-encoded project path
            start_date: Start date in MM/DD/YYYY format
            end_date: End date in MM/DD/YYYY format
            team_members: Optional author names/usernames filter
            target_branch: Optional target branch filter
            merged_by: Optional merged-by user filter

        Returns:
            Filtered list of merged MergeRequest objects
        """
        start_iso = self._parse_date(start_date)
        end_iso = self._parse_date(end_date)
        start_date_obj = datetime.strptime(start_date, "%m/%d/%Y").date()
        end_date_obj = datetime.strptime(end_date, "%m/%d/%Y").date()

        merged_requests: List[MergeRequest] = []
        for concrete_project_id in self._resolve_project_ids_for_team(project_id):
            encoded_project_id = self._encode_project_id(concrete_project_id)
            url = f"{self.base_url}/api/v4/projects/{encoded_project_id}/merge_requests"
            params = {
                'updated_after': start_iso,
                'updated_before': end_iso,
                'scope': 'all',
                'state': 'merged',
                'per_page': 100,
                'order_by': 'updated_at',
                'sort': 'desc',
            }
            if target_branch:
                params['target_branch'] = target_branch

            merged_requests.extend(self.client.fetch_paginated(url, params, MergeRequest))

        normalized_members = {
            member.strip().lower() for member in (team_members or []) if member and member.strip()
        }
        merged_by_filter = merged_by.strip().lower() if merged_by and merged_by.strip() else None

        filtered: List[MergeRequest] = []
        seen_keys: Set[str] = set()
        for mr in merged_requests:
            mr_key = f"{mr.id}:{mr.web_url}"
            if mr_key in seen_keys:
                continue
            seen_keys.add(mr_key)

            merged_at = self._parse_gitlab_iso_datetime(mr.merged_at)
            if not merged_at:
                continue

            merged_date = merged_at.date()
            if merged_date < start_date_obj or merged_date > end_date_obj:
                continue

            author_name = (mr.author.get('name') or '').strip().lower() if isinstance(mr.author, dict) else ''
            author_username = (mr.author.get('username') or '').strip().lower() if isinstance(mr.author, dict) else ''
            if normalized_members and author_name not in normalized_members and author_username not in normalized_members:
                continue

            if merged_by_filter:
                merged_by_name = (mr.merged_by.get('name') or '').strip().lower() if isinstance(mr.merged_by, dict) else ''
                merged_by_username = (mr.merged_by.get('username') or '').strip().lower() if isinstance(mr.merged_by, dict) else ''
                if merged_by_name != merged_by_filter and merged_by_username != merged_by_filter:
                    continue

            filtered.append(mr)

        filtered.sort(key=lambda m: m.merged_at or '', reverse=True)
        return filtered

    def _extract_repo_path_from_mr_url(self, web_url: str) -> str:
        """Extract repo path from GitLab MR URL."""
        if not web_url:
            return "unknown"
        match = re.search(r"gitlab\.com/(.+)/-/merge_requests/", web_url)
        if not match:
            return "unknown"
        return match.group(1)

    def get_user_work_dashboard(
        self,
        project_id: str,
        start_date: str,
        end_date: str,
        users: List[str],
    ) -> Dict[str, Any]:
        """Build leadership-oriented per-user work dashboard from merged MRs."""
        normalized_users = [u.strip() for u in users if u and u.strip()]
        all_items: List[Dict[str, Any]] = []
        per_user_summary: List[Dict[str, Any]] = []
        timeline: Dict[str, Dict[str, int]] = {}
        repo_counts: Dict[str, int] = {}

        for user in normalized_users:
            user_mrs = self.get_team_merge_report(
                project_id=project_id,
                start_date=start_date,
                end_date=end_date,
                team_members=[user],
                target_branch=None,
                merged_by=None,
            )

            user_items: List[Dict[str, Any]] = []
            touched_repos: Set[str] = set()
            merged_to_main = 0
            last_merged_at = None

            for mr in user_mrs:
                repo_path = self._extract_repo_path_from_mr_url(mr.web_url)
                touched_repos.add(repo_path)
                repo_counts[repo_path] = repo_counts.get(repo_path, 0) + 1
                if (mr.target_branch or '').lower() == 'main':
                    merged_to_main += 1

                merged_at = self._parse_gitlab_iso_datetime(mr.merged_at)
                if merged_at:
                    date_key = merged_at.date().isoformat()
                    timeline.setdefault(date_key, {})
                    timeline[date_key][user] = timeline[date_key].get(user, 0) + 1
                    if last_merged_at is None or merged_at > last_merged_at:
                        last_merged_at = merged_at

                item = {
                    **mr.__dict__,
                    'repo_path': repo_path,
                    'author_name': mr.author.get('name') if isinstance(mr.author, dict) else '',
                    'author_username': mr.author.get('username') if isinstance(mr.author, dict) else '',
                    'merged_by_name': mr.merged_by.get('name') if isinstance(mr.merged_by, dict) else '',
                    'selected_user': user,
                }
                user_items.append(item)
                all_items.append(item)

            per_user_summary.append({
                'user': user,
                'total_merged_mrs': len(user_items),
                'merged_to_main': merged_to_main,
                'repos_touched': len(touched_repos),
                'last_merged_at': last_merged_at.isoformat() if last_merged_at else None,
            })

        all_items.sort(key=lambda x: x.get('merged_at') or '', reverse=True)
        per_user_summary.sort(key=lambda x: x['total_merged_mrs'], reverse=True)

        timeline_rows = []
        for date_key in sorted(timeline.keys()):
            row = {'date': date_key}
            row.update(timeline[date_key])
            timeline_rows.append(row)

        repo_breakdown = [
            {'repo_path': repo, 'count': count}
            for repo, count in sorted(repo_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            'filters': {
                'project_id': project_id,
                'start_date': start_date,
                'end_date': end_date,
                'users': normalized_users,
            },
            'summary': {
                'total_merged_mrs': len(all_items),
                'unique_repos': len(repo_counts),
                'users_count': len(normalized_users),
            },
            'per_user': per_user_summary,
            'repo_breakdown': repo_breakdown,
            'timeline': timeline_rows,
            'items': all_items,
        }
