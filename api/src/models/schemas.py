from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class SQLQueryRequest(BaseModel):
    """SQL查询请求模型"""
    sql: str = Field(..., description="要执行的SQL查询")
    python_code: Optional[str] = Field(None, description="可选的Python处理代码")

class PlotConfig(BaseModel):
    """图表配置模型"""
    plot_type: str = Field(..., description="图表类型，如'bar', 'line', 'scatter'等")
    x: str = Field(..., description="X轴字段名")
    y: Union[str, List[str]] = Field(..., description="Y轴字段名或字段名列表")
    color: Optional[str] = Field(None, description="颜色分组字段")
    title: Optional[str] = Field(None, description="图表标题")
    layout: Optional[Dict[str, Any]] = Field(None, description="Plotly布局配置")

class DataVisualizationRequest(BaseModel):
    """数据可视化请求模型"""
    sql_query: str = Field(..., description="SQL查询")
    python_code: Optional[str] = Field(None, description="Python处理代码")
    plot_config: PlotConfig = Field(..., description="图表配置")

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