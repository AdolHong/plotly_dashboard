# coding: utf-8
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json
from typing import Dict, Any, List, Optional, Union, Tuple
import traceback
import inspect

from ..database.db import execute_query

def execute_sql_query(sql: str) -> pd.DataFrame:
    """执行SQL查询并返回DataFrame"""
    try:
        return execute_query(sql)
    except Exception as e:
        error_msg = f"SQL查询执行错误: {str(e)}"
        raise Exception(error_msg)

def process_data_with_python(df: pd.DataFrame, code: str) -> Tuple[Any, str]:
    """使用Python代码处理数据，返回结果和结果类型"""
    if not code:
        return df, "dataframe"
    
    try:
        # 创建一个安全的局部命名空间，包含常用库
        local_vars = {
            "df": df.copy(), 
            "pd": pd,
            "np": np,
            "px": px,
            "go": go,
            "print": print
        }
        
        # 执行Python代码
        exec(code, {"__builtins__": {"print": print}}, local_vars)
        
        # 获取处理后的结果
        if "result" in local_vars:
            result = local_vars["result"]
            
            # 判断结果类型
            if isinstance(result, pd.DataFrame):
                return result, "dataframe"
            elif 'plotly.graph_objs' in str(type(result)):
                # 如果是Plotly图表对象
                return json.loads(result.to_json()), "figure"
            else:
                raise ValueError("Python代码的result变量必须是DataFrame或Plotly图表对象")
        else:
            raise ValueError("Python代码必须将结果存储在名为'result'的变量中")
    except Exception as e:
        error_msg = f"Python代码执行错误: {str(e)}\n{traceback.format_exc()}"
        raise Exception(error_msg)

def create_plotly_figure(
    df: pd.DataFrame, 
    plot_type: str, 
    x: str, 
    y: Union[str, List[str]], 
    color: Optional[str] = None,
    title: Optional[str] = None,
    layout: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """创建Plotly图表"""
    try:
        fig = None
        
        # 根据图表类型创建相应的图表
        if plot_type == "bar":
            fig = px.bar(df, x=x, y=y, color=color, title=title)
        elif plot_type == "line":
            fig = px.line(df, x=x, y=y, color=color, title=title)
        elif plot_type == "scatter":
            fig = px.scatter(df, x=x, y=y, color=color, title=title)
        elif plot_type == "pie":
            fig = px.pie(df, names=x, values=y, title=title)
        elif plot_type == "histogram":
            fig = px.histogram(df, x=x, y=y, color=color, title=title)
        elif plot_type == "box":
            fig = px.box(df, x=x, y=y, color=color, title=title)
        elif plot_type == "violin":
            fig = px.violin(df, x=x, y=y, color=color, title=title)
        elif plot_type == "heatmap":
            # 对于热图，需要将数据透视为矩阵形式
            pivot_df = df.pivot(index=x, columns=color if color else None, values=y)
            fig = px.imshow(pivot_df, title=title)
        else:
            raise ValueError(f"不支持的图表类型: {plot_type}")
        
        # 应用自定义布局
        if layout:
            fig.update_layout(**layout)
        
        # 将图表转换为JSON
        return json.loads(fig.to_json())
    except Exception as e:
        error_msg = f"图表创建错误: {str(e)}\n{traceback.format_exc()}"
        raise Exception(error_msg)

def process_visualization_request(
    sql_query: str,
    python_code: Optional[str],
    plot_config: Dict[str, Any]
) -> Dict[str, Any]:
    """处理数据可视化请求"""
    try:
        # 执行SQL查询
        df = execute_sql_query(sql_query)
        
        # 使用Python代码处理数据（如果提供）
        if python_code:
            df = process_data_with_python(df, python_code)[0]
        
        # 创建Plotly图表
        plot_data = create_plotly_figure(
            df=df,
            plot_type=plot_config["plot_type"],
            x=plot_config["x"],
            y=plot_config["y"],
            color=plot_config.get("color"),
            title=plot_config.get("title"),
            layout=plot_config.get("layout")
        )
        
        # 将DataFrame转换为JSON格式
        df_json = df.to_dict(orient="records")
        
        return {
            "data": df_json,
            "plot_data": plot_data
        }
    except Exception as e:
        raise Exception(str(e))

def process_analysis_request(
    sql_query: str,
    python_code: Optional[str]
) -> Dict[str, Any]:
    """处理分析请求，自动判断结果类型"""
    try:
        # 执行SQL查询
        df = execute_sql_query(sql_query)
        
        # 使用Python代码处理数据（如果提供）
        if python_code:
            result, result_type = process_data_with_python(df, python_code)
        else:
            result = df
            result_type = "dataframe"
        
        # 根据结果类型返回不同的数据
        if result_type == "dataframe":
            # 将DataFrame转换为JSON格式
            data = result.to_dict(orient="records")
            return {
                "result_type": "dataframe",
                "data": data,
                "plot_data": None
            }
        elif result_type == "figure":
            # 返回图表数据
            return {
                "result_type": "figure",
                "data": [],
                "plot_data": result
            }
        else:
            raise ValueError(f"不支持的结果类型: {result_type}")
    except Exception as e:
        raise Exception(str(e)) 