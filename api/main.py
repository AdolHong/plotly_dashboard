# coding=utf-8
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
import io
import pandas as pd
import json
from pathlib import Path
import os

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
async def get_dashboard_config(filepath: str = "dashboard_config.json"):
    """获取仪表盘配置"""
    try:
        # 支持路径参数
        config_path = Path(__file__).parent.parent / "data" / filepath
        
        if not config_path.exists():
            return {
                "status": "error",
                "message": f"配置文件不存在: {filepath}"
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
        parameters = request.get("parameters", [])

        if not sql_query:
            raise HTTPException(status_code=400, detail="SQL query is required")
        
        # 替换SQL查询中的参数占位符
        processed_sql = replace_parameters_in_sql(sql_query, param_values, parameters)

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
        processed_sql = replace_parameters_in_sql(sql_query, param_values, dashboard_config.get("parameters", {}))

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

        print("inferred_options", inferred_options)
        print("inferred_option_choices", inferred_option_choices)
        
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
        filepath = request.get("filepath", "dashboard_config.json")

        print(filepath)
        config_path = Path(__file__).parent.parent / "data" / filepath
        
        # 检查目录是否存在，不存在则创建
        config_dir = config_path.parent
        if not config_dir.exists():
            config_dir.mkdir(parents=True, exist_ok=True)

        # 获取请求中的配置数据
        updated_config = request.get("config", {})

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

@app.get("/api/folder_structure")
async def get_folder_structure():
    """获取数据文件夹结构"""
    try:
        data_dir = Path(__file__).parent.parent / "data"
        
        if not data_dir.exists():
            return {
                "status": "error",
                "message": "数据目录不存在"
            }
        
        def scan_dir(directory):
            result = []
            for item in directory.iterdir():
                if item.is_file() and item.suffix == '.json':
                    result.append({
                        "type": "file",
                        "name": item.name,
                        "path": str(item.relative_to(data_dir))
                    })
                elif item.is_dir():
                    children = scan_dir(item)
                    result.append({
                        "type": "directory",
                        "name": item.name,
                        "path": str(item.relative_to(data_dir)),
                        "children": children
                    })
            return result
        
        structure = scan_dir(data_dir)
        
        return {
            "status": "success",
            "data": structure
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"获取文件夹结构失败: {str(e)}"
        }

@app.post("/api/create_folder")
async def create_folder(request: dict):
    """创建新文件夹"""
    try:
        folder_path = request.get("path", "")
        if not folder_path:
            raise HTTPException(status_code=400, detail="文件夹路径不能为空")
        
        new_folder = Path(__file__).parent.parent / "data" / folder_path
        new_folder.mkdir(parents=True, exist_ok=True)
        
        return {
            "status": "success",
            "message": f"文件夹 {folder_path} 创建成功"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"创建文件夹失败: {str(e)}"
        }

@app.post("/api/delete_file")
async def delete_dashboard_file(request: dict):
    """删除仪表盘配置文件"""
    try:
        filepath = request.get("filepath", "")
        if not filepath:
            raise HTTPException(status_code=400, detail="文件路径不能为空")
        
        file_path = Path(__file__).parent.parent / "data" / filepath
        
        if not file_path.exists():
            return {
                "status": "error",
                "message": f"文件不存在: {filepath}"
            }
        
        if file_path.is_file():
            file_path.unlink()
            return {
                "status": "success",
                "message": f"文件 {filepath} 删除成功"
            }
        else:
            return {
                "status": "error",
                "message": f"无法删除非文件: {filepath}"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"删除文件失败: {str(e)}"
        }

@app.post("/api/create_dashboard")
async def create_dashboard(request: dict):
    """创建新的仪表盘配置文件"""
    try:
        filepath = request.get("filepath", "")
        template = request.get("template", {})
        
        if not filepath:
            raise HTTPException(status_code=400, detail="文件路径不能为空")
        
        file_path = Path(__file__).parent / "data" / filepath
        
        # 检查目录是否存在，不存在则创建
        file_dir = file_path.parent
        if not file_dir.exists():
            file_dir.mkdir(parents=True, exist_ok=True)
        
        # 检查文件是否已存在
        if file_path.exists():
            return {
                "status": "error",
                "message": f"文件已存在: {filepath}"
            }
        
        # 如果未提供模板，使用默认模板
        if not template:
            template = {
                "query": {
                    "code": "SELECT * FROM data",
                    "executor_type": "MySQL",
                    "data_frame_name": "df",
                    "update_mode": "手动更新"
                },
                "parameters": [],
                "visualization": [
                    {
                        "type": "python",
                        "title": "数据表格",
                        "options": [],
                        "description": "显示查询结果的原始数据表格",
                        "code": "# 返回表格\nresult = df"
                    }
                ]
            }
        
        # 保存配置文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(template, f, ensure_ascii=False, indent=2)
        
        return {
            "status": "success",
            "message": f"仪表盘配置文件 {filepath} 创建成功",
            "config": template
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"创建仪表盘配置文件失败: {str(e)}"
        }

@app.post("/api/delete_folder")
async def delete_folder(request: dict):
    """删除文件夹（仅限空文件夹）"""
    try:
        folder_path = request.get("folder_path", "")
        if not folder_path:
            raise HTTPException(status_code=400, detail="文件夹路径不能为空")
        
        full_path = Path(__file__).parent.parent / "data" / folder_path
        print(full_path)
        
        if not full_path.exists():
            return {
                "status": "error",
                "message": f"文件夹不存在: {folder_path}"
            }
        
        if not full_path.is_dir():
            return {
                "status": "error",
                "message": f"路径不是文件夹: {folder_path}"
            }
        
        # 检查文件夹是否为空
        if any(full_path.iterdir()):
            return {
                "status": "error",
                "message": f"只能删除空文件夹，{folder_path} 不为空"
            }
        
        # 删除空文件夹
        full_path.rmdir()
        
        return {
            "status": "success",
            "message": f"文件夹 {folder_path} 删除成功"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"删除文件夹失败: {str(e)}"
        }
