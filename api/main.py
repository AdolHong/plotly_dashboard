from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from src.models.schemas import (
    SQLQueryRequest, 
    DataVisualizationRequest, 
    ErrorResponse, 
    SuccessResponse
)
from src.services.visualization import process_visualization_request, process_analysis_request
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

@app.post("/api/query", response_model=SuccessResponse)
async def execute_sql(request: SQLQueryRequest):
    """执行SQL查询"""
    try:
        # 执行SQL查询
        df = execute_query(request.sql)
        
        # 将DataFrame转换为JSON
        data = df.to_dict(orient="records")
        
        return SuccessResponse(data=data)
    except Exception as e:
        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=400, 
            detail=ErrorResponse(
                message=f"查询执行失败: {str(e)}", 
                details=error_detail
            ).dict()
        )

@app.post("/api/visualize", response_model=SuccessResponse)
async def visualize_data(request: DataVisualizationRequest):
    """数据可视化"""
    try:
        # 处理可视化请求
        result = process_visualization_request(
            sql_query=request.sql_query,
            python_code=request.python_code,
            plot_config=request.plot_config.dict()
        )
        
        return SuccessResponse(
            data=result["data"],
            plot_data=result["plot_data"]
        )
    except Exception as e:
        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=400, 
            detail=ErrorResponse(
                message=f"可视化处理失败: {str(e)}", 
                details=error_detail
            ).dict()
        )

@app.post("/api/analyze")
async def analyze_data(request: dict):
    """分析数据，自动判断结果类型"""
    try:
        # 处理分析请求
        result = process_analysis_request(
            sql_query=request.get("sql_query", ""),
            python_code=request.get("python_code")
        )
        
        return {
            "status": "success",
            "result_type": result["result_type"],
            "data": result["data"],
            "plot_data": result["plot_data"]
        }
    except Exception as e:
        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=400, 
            detail=ErrorResponse(
                message=f"分析处理失败: {str(e)}", 
                details=error_detail
            ).dict()
        )

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

@app.get("/api/schema/{table_name}")
async def get_table_schema(table_name: str):
    """获取表结构"""
    try:
        df = execute_query(f"PRAGMA table_info({table_name})")
        schema = df.to_dict(orient="records")
        return SuccessResponse(data=schema)
    except Exception as e:
        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=400, 
            detail=ErrorResponse(
                message=f"获取表结构失败: {str(e)}", 
                details=error_detail
            ).dict()
        ) 