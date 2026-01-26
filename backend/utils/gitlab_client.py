"""
Shared GitLab API client with common functionality.
Eliminates code duplication across model files.
"""
from typing import List, TypeVar, Type, Dict, Any, Optional, Callable
import requests
import os
import logging
from functools import wraps
import time

try:
    from backend.config import get_settings
except ImportError:
    from config import get_settings

logger = logging.getLogger(__name__)

# Suppress SSL warnings if SSL verification is disabled
# Initialize settings and suppress warnings at module level
try:
    settings = get_settings()
    if not settings.GITLAB_VERIFY_SSL:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except Exception:
    # If settings can't be loaded, assume SSL verification is disabled
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

T = TypeVar('T')


class GitLabClient:
    """Shared GitLab API client for making authenticated requests."""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.GITLAB_BASE_URL
        self.token = self.settings.GITLAB_TOKEN
        self.verify_ssl = self.settings.GITLAB_VERIFY_SSL
        self._headers = {"PRIVATE-TOKEN": self.token}
    
    def get_headers(self) -> Dict[str, str]:
        """Get authentication headers."""
        return self._headers.copy()
    
    def get_base_url(self) -> str:
        """Get GitLab base URL."""
        return self.base_url
    
    def fetch_paginated(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        model_class: Optional[Type[T]] = None,
        transform_func: Optional[Callable[[Dict], T]] = None,
    ) -> List[T]:
        """
        Fetch paginated data from GitLab API.
        
        Args:
            url: Full URL to fetch from
            params: Query parameters (page will be added automatically)
            model_class: Model class with from_gitlab classmethod
            transform_func: Alternative transformation function
            
        Returns:
            List of model instances or transformed data
        """
        if params is None:
            params = {}
        
        params.setdefault('per_page', self.settings.DEFAULT_PAGE_SIZE)
        
        items: List[T] = []
        page = 1
        
        while True:
            params['page'] = page
            try:
                resp = requests.get(
                    url,
                    headers=self.get_headers(),
                    params=params,
                    verify=self.verify_ssl,
                    timeout=30
                )
                resp.raise_for_status()
                data = resp.json()
                
                if not data:
                    break
                
                # Transform data using model class or transform function
                if model_class:
                    items.extend([model_class.from_gitlab(item) for item in data])
                elif transform_func:
                    items.extend([transform_func(item) for item in data])
                else:
                    items.extend(data)
                
                # Check if we've reached the last page
                if len(data) < params['per_page']:
                    break
                
                page += 1
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching paginated data from {url}: {str(e)}")
                raise
        
        return items
    
    def fetch_single(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        model_class: Optional[Type[T]] = None,
        transform_func: Optional[Callable[[Dict], T]] = None,
    ) -> Optional[T]:
        """
        Fetch a single item from GitLab API.
        
        Args:
            url: Full URL to fetch from
            params: Query parameters
            model_class: Model class with from_gitlab classmethod
            transform_func: Alternative transformation function
            
        Returns:
            Model instance or transformed data, or None if not found
        """
        if params is None:
            params = {}
        
        try:
            resp = requests.get(
                url,
                headers=self.get_headers(),
                params=params,
                verify=self.verify_ssl,
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            
            if model_class:
                return model_class.from_gitlab(data)
            elif transform_func:
                return transform_func(data)
            else:
                return data
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from {url}: {str(e)}")
            raise


# Singleton instance
_client: Optional[GitLabClient] = None


def get_gitlab_client() -> GitLabClient:
    """Get or create the singleton GitLab client instance."""
    global _client
    if _client is None:
        _client = GitLabClient()
    return _client
