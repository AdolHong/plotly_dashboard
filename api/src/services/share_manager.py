import hashlib
import json
import os
from typing import Dict, Any, Optional
from pathlib import Path
import time
import pandas as pd

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
    
    def save_dashboard_state(self, dashboard_state: Dict[str, Any], dataframe_data: Optional[str] = None) -> str:
        """Save dashboard state and return the share ID
        
        Args:
            dashboard_state: The dashboard configuration state
            dataframe_data: Optional JSON string representation of the DataFrame data
        """
        share_id = self.generate_share_id()
        share_path = self.get_share_path(share_id)
        
        # Add the DataFrame data to the dashboard state if provided
        if dataframe_data:
            dashboard_state['dataframe_data'] = dataframe_data
        
        with open(share_path, 'w') as f:
            json.dump(dashboard_state, f)
        
        return share_id
    
    def get_dashboard_state(self, share_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve shared dashboard state"""
        share_path = self.get_share_path(share_id)
        
        if not share_path.exists():
            return None
        
        with open(share_path) as f:
            # Return the data in snake_case format
            return json.load(f)
    
    def get_dataframe_from_state(self, dashboard_state: Dict[str, Any]) -> Optional[pd.DataFrame]:
        """Extract DataFrame from dashboard state if available"""
        if not dashboard_state or 'dataframe_data' not in dashboard_state:
            return None
        
        try:
            # Convert the stored JSON data back to DataFrame
            return pd.DataFrame(json.loads(dashboard_state['dataframe_data']))
        except Exception as e:
            print(f"Error converting stored data to DataFrame: {str(e)}")
            return None