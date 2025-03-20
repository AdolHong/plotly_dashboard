# coding: utf-8
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json
from typing import Dict, Any, List, Optional, Union, Tuple
import traceback
import io
from contextlib import redirect_stdout

from ..database.db import execute_query

def execute_sql_query(sql: str) -> pd.DataFrame:
    """执行SQL查询并返回DataFrame"""
    try:
        return execute_query(sql)
    except Exception as e:
        error_msg = f"SQL查询执行错误: {str(e)}"
        raise Exception(error_msg)

def process_data_with_python(df: pd.DataFrame, code: str, options: Optional[Dict[str, Any]] = None) -> Tuple[Any, str, str]:
    """使用Python代码处理数据，返回结果、结果类型和print输出"""
    if not code:
        return df, "dataframe", ""
    
    # 捕获print输出
    stdout_buffer = io.StringIO()
    print_output = ""
    result = None
    result_type = "dataframe"
    error_msg = ""
    
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
            # exec(code, {"__builtins__": __builtins__}, local_vars)
            exec(code, {"print": print}, local_vars)
        
        # 获取print输出
        print_output = stdout_buffer.getvalue()
        
        # 获取处理后的结果
        if "result" in local_vars:
            result = local_vars["result"]
            
            # 判断结果类型
            if isinstance(result, pd.DataFrame):
                result_type = "dataframe"
            elif 'plotly.graph_objs' in str(type(result)):
                # 如果是Plotly图表对象
                result = json.loads(result.to_json())
                result_type = "figure"
            else:
                error_msg = "Python代码的result变量必须是DataFrame或Plotly图表对象"
                raise ValueError(error_msg)
        else:
            error_msg = "Python代码必须将结果存储在名为'result'的变量中"
            raise ValueError(error_msg)
            
    except Exception as e:
        # 即使发生错误，也要获取print输出
        print_output = stdout_buffer.getvalue()
        error_msg = f"Python代码执行错误: {str(e)}\n{traceback.format_exc()}"
        raise Exception(f"{error_msg}\nPrint输出: {print_output}")
    
    return result, result_type, print_output

def process_analysis_request(
    sql_query: str,
    python_code: Optional[str],
    df: Optional[pd.DataFrame] = None,
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """处理分析请求，自动判断结果类型"""
    # 捕获print输出
    stdout_buffer = io.StringIO()
    print_output = ""
    
    try:
        # 如果没有提供DataFrame，执行SQL查询获取
        if df is None:
            df = execute_sql_query(sql_query)
        
        # 使用Python代码处理数据（如果提供）
        if python_code:
            try:
                # 重定向标准输出以捕获可能的print输出
                with redirect_stdout(stdout_buffer):
                    result, result_type, code_print_output = process_data_with_python(df, python_code, options)
                
                # 合并两处捕获的print输出
                print_output = stdout_buffer.getvalue() + code_print_output
            except Exception as e:
                # 获取print输出
                print_output = stdout_buffer.getvalue()
                
                # 从错误消息中提取print输出
                error_str = str(e)
                if "Print输出:" in error_str:
                    parts = error_str.split("Print输出:", 1)
                    error_msg = parts[0].strip()
                    additional_print = parts[1].strip()
                    print_output = print_output + "\n" + additional_print if print_output else additional_print
                
                # 即使处理失败，也返回错误信息和print输出
                return {
                    "result_type": "error",
                    "data": [],
                    "plot_data": None,
                    "print_output": print_output,
                    "error_message": error_str
                }
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
                "plot_data": None,
                "print_output": print_output
            }
        elif result_type == "figure":
            # 返回图表数据
            return {
                "result_type": "figure",
                "data": [],
                "plot_data": result,
                "print_output": print_output
            }
        else:
            raise ValueError(f"不支持的结果类型: {result_type}")
    except Exception as e:
        # 获取print输出（即使发生错误）
        if 'stdout_buffer' in locals():
            print_output = stdout_buffer.getvalue()
        
        # 从错误消息中提取print输出
        error_str = str(e)
        if "Print输出:" in error_str:
            parts = error_str.split("Print输出:", 1)
            error_msg = parts[0].strip()
            additional_print = parts[1].strip()
            print_output = print_output + "\n" + additional_print if print_output else additional_print
            
            # 重新构建错误消息，不包含print输出部分
            error_str = error_msg
        
        raise Exception(f"{error_str}")