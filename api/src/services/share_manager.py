import hashlib
import json
import os
from typing import Dict, Any, Optional
from pathlib import Path
import time

class ShareManager:
    def __init__(self, share_dir: str = "shares"):
        self.share_dir = Path(share_dir)
        self.share_dir.mkdir(exist_ok=True)
    
    def generate_share_id(self) -> str:
        """Generate a unique share ID based on timestamp and random hash"""
        timestamp = str(int(time.time()))
        random_str = timestamp + str(os.urandom(8).hex())
        return hashlib.md5(random_str.encode()).hexdigest()[:10]
    
    def get_share_path(self, share_id: str) -> Path:
        """Get the path for shared dashboard state"""
        return self.share_dir / f"{share_id}.json"
    
    def save_dashboard_state(self, dashboard_state: Dict[str, Any]) -> str:
        """Save dashboard state and return the share ID"""
        share_id = self.generate_share_id()
        share_path = self.get_share_path(share_id)
        
        with open(share_path, 'w') as f:
            json.dump(dashboard_state, f)
        
        return share_id
    
    def get_dashboard_state(self, share_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve shared dashboard state"""
        share_path = self.get_share_path(share_id)
        
        if not share_path.exists():
            return None
        
        with open(share_path) as f:
            return json.load(f)