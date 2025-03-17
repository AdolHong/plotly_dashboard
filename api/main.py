from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
import io
from contextlib import redirect_stdout

from src.models.schemas import (
    SQLQueryRequest, 
    ErrorResponse, 
    SuccessResponse
)
from src.services.visualization import  process_analysis_request
from src.database.db import execute_query, init_db

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

@app.post("/api/analyze")
async def analyze_data(request: dict):
    """分析数据，自动判断结果类型"""
    # 捕获print输出
    stdout_buffer = io.StringIO()
    print_output = ""
    
    try:
        # 使用重定向捕获可能的print输出
        with redirect_stdout(stdout_buffer):
            # 处理分析请求
            result = process_analysis_request(
                sql_query=request.get("sql_query", ""),
                python_code=request.get("python_code")
            )
        
        # 获取print输出 - 合并两处可能的print输出
        api_print_output = stdout_buffer.getvalue()
        result_print_output = result.get("print_output", "")
        print_output = api_print_output + result_print_output
        
        # 如果是错误结果，返回错误信息和print输出
        if result.get("result_type") == "error":
            return {
                "status": "error",
                "message": result.get("error_message", "未知错误"),
                "print_output": print_output
            }
        
        # 正常返回结果
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

@app.get("/api/tables")
async def get_tables():
    """获取所有表名"""
    try:
        df = execute_query("SELECT name FROM sqlite_master WHERE type='table'")
        tables = df['name'].tolist()
        return SuccessResponse(data=tables)
    except Exception as e:
        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=400, 
            detail=ErrorResponse(
                message=f"获取表名失败: {str(e)}", 
                details=error_detail
            ).dict()
        )
