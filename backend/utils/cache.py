"""
Simple in-memory cache implementation.
Can be replaced with Redis or other caching solutions in production.
"""
from typing import Any, Optional, Callable
import time
import hashlib
import json
from functools import wraps

try:
    from backend.config import get_settings
except ImportError:
    from config import get_settings

settings = get_settings()


class SimpleCache:
    """Simple in-memory cache with TTL support."""
    
    def __init__(self, ttl: int = None):
        self.cache: dict = {}
        self.ttl = ttl or settings.CACHE_TTL
    
    def _make_key(self, *args, **kwargs) -> str:
        """Create a cache key from function arguments."""
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        if not settings.CACHE_ENABLED:
            return None
        
        if key in self.cache:
            value, expiry = self.cache[key]
            if time.time() < expiry:
                return value
            else:
                # Expired, remove it
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any) -> None:
        """Set value in cache with TTL."""
        if not settings.CACHE_ENABLED:
            return
        
        expiry = time.time() + self.ttl
        self.cache[key] = (value, expiry)
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
    
    def invalidate(self, pattern: str = None) -> None:
        """Invalidate cache entries matching pattern."""
        if pattern:
            keys_to_remove = [k for k in self.cache.keys() if pattern in k]
            for key in keys_to_remove:
                del self.cache[key]
        else:
            self.clear()


# Global cache instance
_cache = SimpleCache()


def cached(ttl: int = None):
    """
    Decorator to cache function results.
    
    Usage:
        @cached(ttl=300)
        def my_function(arg1, arg2):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__module__}.{func.__name__}:{_cache._make_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = _cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache_ttl = ttl or settings.CACHE_TTL
            _cache.set(cache_key, result)
            
            return result
        return wrapper
    return decorator


def get_cache() -> SimpleCache:
    """Get the global cache instance."""
    return _cache
