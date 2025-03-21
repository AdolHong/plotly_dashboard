# coding: utf-8
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json
from typing import Dict, Any, Optional,  Union
import traceback
import io
from contextlib import redirect_stdout
import plotly


def format_visualization_oupput(result: Optional[Union[pd.DataFrame, Any]]=None, print_output:str = "", error_msg: Optional[str]=None) -> Dict[str, Any]:
    if  error_msg:
        # 如果失败，返回错误信息和print输出
        return {
            "result_type": "error",
            "data": [],
            "plot_data": None,
            "print_output": print_output,
            "error_message": error_msg
        }
    # 判断结果类型
    if isinstance(result, pd.DataFrame):
        print("result_type: ", "dataframe")
        return {
            "result_type": "dataframe",
            "data": result.to_dict(orient="records"),
            "plot_data": None,
            "print_output": print_output
        }
    elif isinstance(result, plotly.graph_objs._figure.Figure):
        # 返回Plotly图表对象
        return {
            "result_type": "figure",
            "data": [],
            "plot_data": json.loads(result.to_json()),
            "print_output": print_output
        }
    elif'plotly.graph_objs' in str(type(result)):
        raise ValueError("出现了未知的plotly对象:", type)
    else:
        error_msg = "Python代码的result变量必须是DataFrame或Plotly图表对象"
        raise ValueError(error_msg)

def process_analysis_request(df: pd.DataFrame, code: Optional[str], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """使用Python代码处理数据，返回结果、结果类型和print输出"""
    if not code:
        return format_visualization_oupput(print_output="", result=df)
    
    # 捕获print输出
    stdout_buffer = io.StringIO()
    print_output, error_msg  = "", ""

    try:
        # 创建一个安全的局部命名空间，包含常用库和print函数
        local_vars = {
            "df": df.copy(), 
            "pd": pd,
            "np": np,
            "px": px,
            "go": go
        }
        
        # 添加选项值到局部变量
        if options:
            for key, value in options.items():
                local_vars[key] = value
        
        # 重定向标准输出以捕获print
        with redirect_stdout(stdout_buffer):
            # 执行Python代码
            exec(code, {"print": print}, local_vars)
        
        # 获取print输出
        print_output = stdout_buffer.getvalue()
        
        # 获取处理后的结果
        if "result" in local_vars:
            return format_visualization_oupput(result=local_vars["result"], print_output=print_output)
        else:
            error_msg = "Python代码必须将结果存储在名为'result'的变量中"
            raise ValueError(error_msg)
            
    except Exception as e:
        # 即使发生错误，也要获取print输出
        print_output = stdout_buffer.getvalue()
        error_msg = f"Python代码执行错误: {str(e)}\n{traceback.format_exc()}"
        return format_visualization_oupput(print_output=print_output, error_msg=error_msg)
