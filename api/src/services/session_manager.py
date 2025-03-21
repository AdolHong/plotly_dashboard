# coding=utf-8
import hashlib
import json
from typing import Dict, Any, Optional
from pathlib import Path

class SessionManager:
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
    
    def generate_query_hash(self, sql_query: str) -> str:
        """Generate a unique hash for the SQL query"""
        return hashlib.md5(sql_query.encode()).hexdigest()
    
    def get_cache_path(self, session_id: str, query_hash: str) -> Path:
        """Get the path for cached query results"""
        return self.cache_dir / f"{session_id}_{query_hash}.json"
    
    def save_query_result(self, session_id: str, sql_query: str, result: Dict[str, Any]) -> str:
        """Save query result to cache and return the query hash"""
        query_hash = self.generate_query_hash(sql_query)
        cache_path = self.get_cache_path(session_id, query_hash)
        with open(cache_path, 'w') as f:
            json.dump(result, f)
        return query_hash
    
    def get_query_result(self, session_id: str, query_hash: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached query result"""
        cache_path = self.get_cache_path(session_id, query_hash)
        
        if not cache_path.exists():
            return None
        
        with open(cache_path) as f:
            return json.load(f)
    
    def cleanup_session(self, session_id: str):
        """Clean up all cached files for a session"""
        for cache_file in self.cache_dir.glob(f"{session_id}_*.json"):
            cache_file.unlink()