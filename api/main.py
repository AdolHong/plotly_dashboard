from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
import io
from contextlib import redirect_stdout
import pandas as pd

from src.models.schemas import (
    SQLQueryRequest, 
    ErrorResponse, 
    SuccessResponse
)
from src.services.visualization import process_analysis_request
from src.services.session_manager import SessionManager
from src.database.db import execute_query, init_db

# Initialize session manager
session_manager = SessionManager()

# 初始化数据库
init_db()

app = FastAPI(title="数据可视化API", description="SQL+Python数据可视化API")

# 添加CORS中间件以允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "数据可视化API已启动!"}

@app.post("/api/query")
async def execute_sql_query(request: dict):
    """Execute SQL query and cache the results"""
    try:
        sql_query = request.get("sql_query", "")
        session_id = request.get("session_id", "")
        
        if not sql_query or not session_id:
            raise HTTPException(status_code=400, detail="SQL query and session ID are required")
        
        # Execute query and get DataFrame
        df = execute_query(sql_query)
        
        # Convert DataFrame to dict for caching
        result = {
            "data": df.to_json(orient='records')
        }
        
        # Cache the result and get query hash
        query_hash = session_manager.save_query_result(session_id, sql_query, result)

        return {
            "status": "success",
            "message": "Query executed successfully",
            "query_hash": query_hash
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/visualize")
async def visualize_data(request: dict):
    """Process Python visualization code using cached query results"""
    stdout_buffer = io.StringIO()
    print_output = ""
    
    try:
        session_id = request.get("session_id", "")
        query_hash = request.get("query_hash", "")
        python_code = request.get("python_code")
        
        if not session_id or not query_hash:
            raise HTTPException(status_code=400, detail="Session ID and query hash are required")
        
        # Get cached query result
        cached_result = session_manager.get_query_result(session_id, query_hash)
        if not cached_result:
            raise HTTPException(status_code=404, detail="Query result not found")
        
        # Convert cached data back to DataFrame

        import json
        df = pd.DataFrame(json.loads(cached_result["data"]))
        
        # Process visualization
        with redirect_stdout(stdout_buffer):
            result = process_analysis_request(
                sql_query="",  # Not needed as we already have the DataFrame
                python_code=python_code,
                df=df
            )
        
        # Get print output
        api_print_output = stdout_buffer.getvalue()
        result_print_output = result.get("print_output", "")
        print_output = api_print_output + result_print_output
        
        if result.get("result_type") == "error":
            return {
                "status": "error",
                "message": result.get("error_message", "Unknown error"),
                "print_output": print_output
            }
        
        return {
            "status": "success",
            "result_type": result["result_type"],
            "data": result["data"],
            "plot_data": result["plot_data"],
            "print_output": print_output
        }
    except Exception as e:
        # 获取print输出（即使发生错误）
        api_print_output = stdout_buffer.getvalue()
        
        # 尝试从错误消息中提取print输出
        error_str = str(e)
        additional_print_output = ""
        
        if "Print输出:" in error_str:
            # 尝试从错误消息中提取print输出
            parts = error_str.split("Print输出:", 1)
            if len(parts) > 1:
                error_msg = parts[0].strip()
                additional_print_output = parts[1].strip()
            else:
                error_msg = error_str
        else:
            error_msg = error_str
        
        # 合并所有可能的print输出
        print_output = api_print_output
        if additional_print_output:
            if print_output:
                print_output += "\n" + additional_print_output
            else:
                print_output = additional_print_output
        
        error_detail = traceback.format_exc()
        
        # 返回错误信息和print输出
        return {
            "status": "error",
            "message": f"分析处理失败: {error_msg}",
            "print_output": print_output,
            "error_detail": error_detail
        }
