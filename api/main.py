# coding=utf-8
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
import io
import pandas as pd
import json
from pathlib import Path

from src.services.visualization import process_analysis_request
from src.services.session_manager import SessionManager
from src.services.share_manager import ShareManager
from src.database.db import execute_query, init_db
from src.services.parameter_handler import replace_parameters_in_sql
from src.services.option_handler import process_visualization_options
from src.services.option_handler import infer_options_from_dataframe

# Initialize session manager
session_manager = SessionManager()

# Initialize share manager
share_manager = ShareManager()

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

@app.get("/api/config")
async def get_dashboard_config():
    """获取仪表盘配置"""
    try:
        config_path = Path(__file__).parent / "data" / "dashboard_config.json"
        
        if not config_path.exists():
            return {
                "status": "error",
                "message": "配置文件不存在"
            }
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        return {
            "status": "success",
            "config": config
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/parse_sql")
async def parse_sql_query(request: dict):
    """解析SQL查询中的参数，但不执行查询"""
    try:
        sql_query = request.get("sql_query", "")
        param_values = request.get("param_values", {})
        if not sql_query:
            raise HTTPException(status_code=400, detail="SQL query is required")
        
        # 替换SQL查询中的参数占位符
        processed_sql = replace_parameters_in_sql(sql_query, param_values)

        return {
            "status": "success",
            "message": "SQL解析成功",
            "processed_sql": processed_sql
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/api/query")
async def execute_sql_query(request: dict):
    """Execute SQL query and cache the results"""
    try:
        sql_query = request.get("sql_query", "")
        session_id = request.get("session_id", "")
        param_values = request.get("param_values", {})
        dashboard_config = request.get("dashboard_config", {})

        
        if not sql_query or not session_id:
            raise HTTPException(status_code=400, detail="SQL query and session ID are required")
        
        # 替换SQL查询中的参数占位符
        processed_sql = replace_parameters_in_sql(sql_query, param_values)

        # Execute query and get DataFrame
        df = execute_query(processed_sql)
        
        # 获取可视化配置

        visualization_options = []
        if "visualization" in dashboard_config:
            # 收集所有可视化区域的选项
            for vis in dashboard_config["visualization"]:
                if "options" in vis and isinstance(vis["options"], list):
                    visualization_options.extend(vis["options"])
        
        # 从DataFrame中推断选项
        inferred_options = infer_options_from_dataframe(visualization_options, df)
        
        # 提取需要从DataFrame中推断的选项
        inferred_option_choices = {}
        for option in inferred_options:
            if option.get("infer") == "column" and "infer_column" in option and "choices" in option:
                option_name = option.get("name")
                if option_name:
                    inferred_option_choices[option_name] = {
                        "choices": option.get("choices", []),
                        "default": option.get("default")
                    }
        
        # Convert DataFrame to dict for caching
        result = {
            "data": df.to_json(orient='records'),
            "dashboard_config": dashboard_config
        }
        
        # Cache the result and get query hash
        query_hash = session_manager.save_query_result(session_id, sql_query, result)
        return {
            "status": "success",
            "message": "Query executed successfully",
            "query_hash": query_hash,
            "processed_sql": processed_sql,
            "inferred_options": inferred_option_choices
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/visualize")
async def visualize_data(request: dict):
    print_output = ""
    """Process Python visualization code using cached query results"""    
    try:
        session_id = request.get("session_id", "")
        query_hash = request.get("query_hash", "")
        python_code = request.get("python_code")
        option_values = request.get("option_values", {})
        option_config = request.get("option_config", {})
        
        if not session_id or not query_hash:
            raise HTTPException(status_code=400, detail="Session ID and query hash are required")
        
        # Get cached query result
        cached_result = session_manager.get_query_result(session_id, query_hash)
        if not cached_result:
            raise HTTPException(status_code=404, detail="Cached result not found")
        
        # Convert cached data back to DataFrame
        df = pd.DataFrame(json.loads(cached_result["data"]))
        
        # 处理选项值
        processed_options = process_visualization_options(option_config, option_values, df)
        
        # Process visualization
        result = process_analysis_request(
            df=df,
            code=python_code,
            options=processed_options
        )

        # Get print output
        print_output = result.get("print_output", "")
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
        # 尝试从错误消息中提取print输出
        error_str = str(e)
        
        if "Print输出:" in error_str:
            # 尝试从错误消息中提取print输出
            parts = error_str.split("Print输出:", 1)
            if len(parts) > 1:
                error_msg = parts[0].strip()
                print_output = parts[1].strip()
            else:
                error_msg = error_str
        else:
            error_msg = error_str
        error_detail = traceback.format_exc()
        
        # 返回错误信息和print输出
        return {
            "status": "error",
            "message": f"分析处理失败: {error_msg}",
            "print_output": print_output,
            "error_detail": error_detail
        }

@app.post("/api/share")
async def share_dashboard(request: dict):
    """Save dashboard state for sharing"""
    try:
        # Get dashboard state from request

        dashboard_state = request.get("dashboard_state", {})        
        if not dashboard_state:
            raise HTTPException(status_code=400, detail="Dashboard state is required")
        
        # Get query hash from dashboard state
        session_id = request.get("session_id")
        query_hash = request.get("dashboard_state", {}).get("query_hash")
        
        # Get DataFrame data if query hash and session ID are provided
        dataframe_data = None
        if query_hash and session_id:
            cached_result = session_manager.get_query_result(session_id, query_hash)
            if cached_result and "data" in cached_result:
                dataframe_data = cached_result["data"]

        print(dashboard_state)

        # Save dashboard state and get share ID
        share_id = share_manager.save_dashboard_state(dashboard_state, dataframe_data)
        
        return {
            "status": "success",
            "message": "Dashboard shared successfully",
            "share_id": share_id
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/share/{share_id}")
async def get_shared_dashboard(share_id: str):
    """Get shared dashboard state"""
    try:
        # Get dashboard state from share ID
        dashboard_state = share_manager.get_dashboard_state(share_id)
        
        if not dashboard_state:
            raise HTTPException(status_code=404, detail="Shared dashboard not found")
        
        sql_query = dashboard_state.get("sql_query", "")
        inferred_options = dashboard_state.get("inferred_options", {})
        param_values, all_option_values = dashboard_state.get("param_values", {}), dashboard_state.get("all_option_values", {})
        
        # Convert DataFrame to dict for caching
        result = {
            "data": dashboard_state.get("dataframe_data"),
            "dashboard_config": dashboard_state.get("dashboard_config")
        }
        
        # Cache the result and get query hash
        query_hash = session_manager.save_query_result(share_id, sql_query, result)
        return {
            "status": "success",
            "message": "Shared dashboard retrieved successfully",
            "query_hash": query_hash,
            "processed_sql": sql_query,
            "inferred_options": inferred_options,
            "param_values": param_values,
            "all_option_values": all_option_values,
            "dashboard_config": dashboard_state.get("dashboard_config")
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/update_config")
async def update_dashboard_config(request: dict):
    """更新仪表盘配置"""
    try:
        # 获取配置文件路径
        config_path = Path(__file__).parent / "data" / "dashboard_config.json"
        
        

        # 获取请求中的配置数据
        updated_config = request.get("config", [])


        

        # 保存更新后的配置
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(updated_config, f, ensure_ascii=False, indent=2)
        return {
            "status": "success",
            "message": "配置更新成功",
            "config": updated_config
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"更新配置失败: {str(e)}"
        }
