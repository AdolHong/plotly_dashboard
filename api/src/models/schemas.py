from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class SQLQueryRequest(BaseModel):
    """SQL查询请求模型"""
    sql: str = Field(..., description="要执行的SQL查询")
    python_code: Optional[str] = Field(None, description="可选的Python处理代码")


class ErrorResponse(BaseModel):
    """错误响应模型"""
    status: str = "error"
    message: str
    details: Optional[str] = None

class SuccessResponse(BaseModel):
    """成功响应模型"""
    status: str = "success"
    data: Any
    plot_data: Optional[Dict[str, Any]] = None 