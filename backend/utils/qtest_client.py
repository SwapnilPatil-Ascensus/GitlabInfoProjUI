"""
Shared qTest API client with bearer authentication and retry support.
"""
from typing import Any, Dict, List, Optional
import logging
import time

import requests

try:
    from backend.config import get_settings
except ImportError:
    from config import get_settings

logger = logging.getLogger(__name__)

try:
    import urllib3
except ImportError:
    urllib3 = None


def _disable_ssl_warnings() -> None:
    if urllib3 is not None:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


try:
    settings = get_settings()
    if not settings.QTEST_VERIFY_SSL:
        _disable_ssl_warnings()
except Exception:
    _disable_ssl_warnings()


class QTestClient:
    """Shared qTest API client for authenticated requests."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.QTEST_BASE_URL
        self.authorization = self.settings.get_qtest_auth_header()
        self.verify_ssl = self.settings.QTEST_VERIFY_SSL
        self.headers = {
            "Authorization": self.authorization,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def is_configured(self) -> bool:
        return bool(self.authorization and self.base_url)

    def get_base_url(self) -> str:
        return self.base_url

    def get_headers(self) -> Dict[str, str]:
        return self.headers.copy()

    def _request(self, method: str, url: str, **kwargs) -> requests.Response:
        timeout = kwargs.pop("timeout", 30)
        max_attempts = kwargs.pop("max_attempts", 3)
        backoff_seconds = kwargs.pop("backoff_seconds", 2)

        last_error: Optional[Exception] = None
        for attempt in range(1, max_attempts + 1):
            try:
                response = requests.request(
                    method,
                    url,
                    headers=self.get_headers(),
                    verify=self.verify_ssl,
                    timeout=timeout,
                    **kwargs,
                )

                if response.status_code == 429 and attempt < max_attempts:
                    retry_after = response.headers.get("retry-after") or response.headers.get("Retry-After")
                    wait_seconds = int(retry_after) if retry_after and str(retry_after).isdigit() else backoff_seconds * attempt
                    logger.warning("qTest rate limited for %s seconds", wait_seconds)
                    time.sleep(wait_seconds)
                    continue

                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_error = exc
                if attempt >= max_attempts:
                    break
                time.sleep(backoff_seconds * attempt)

        assert last_error is not None
        raise last_error

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
        response = self._request("GET", url, params=params)
        return response.json()

    def post(self, path: str, json_body: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
        response = self._request("POST", url, json=json_body, params=params)
        return response.json()


_client: Optional[QTestClient] = None


def get_qtest_client() -> QTestClient:
    global _client
    if _client is None:
        _client = QTestClient()
    return _client


def reset_qtest_client() -> None:
    global _client
    _client = None
