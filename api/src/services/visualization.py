# coding: utf-8

from typing import Dict, Any, Optional,  Union
import traceback
import io
from contextlib import redirect_stdout
import pandas as pd
import plotly
import json



def process_analysis_request(df: pd.DataFrame, code: Optional[str], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """使用Python代码处理数据，返回结果、结果类型和print输出"""
    if not code:
        return format_visualization_oupput(print_output="", result=df)
    
    # 捕获print输出
    stdout_buffer = io.StringIO()
    print_output, error_msg  = "", ""

    
    try:        
        # step1: 设置dataframe
        global_vars = {"df": df.copy()}

        # step2: 设置常用包
        engine_code = """import pandas as pd\nimport numpy as np\nimport plotly.express as px\nimport plotly.graph_objects as go\nimport json"""    
        exec(engine_code, global_vars)
        
        # step3: 是否限制系统函数
        # global_vars['__builtins__'] = {"print": print}
        
        # step4: 添加选项值到局部变量
        if options:
            for key, value in options.items():
                global_vars[key] = value
        
        # step5: 执行代码, 输出重定向
        with redirect_stdout(stdout_buffer):
            exec(code, global_vars)

        # step6: 获取print输出
        print_output = stdout_buffer.getvalue()
        
        # step7: 获取处理后的结果
        if "result" in global_vars:
            return format_visualization_oupput(result=global_vars["result"], print_output=print_output)
        else:
            error_msg = "Python代码必须将结果存储在名为'result'的变量中"
            raise ValueError(error_msg)
            
    except Exception as e:
        # 即使发生错误，也要获取print输出
        print_output = stdout_buffer.getvalue()
        error_msg = f"Python代码执行错误: {str(e)}\n{traceback.format_exc()}"
        return format_visualization_oupput(print_output=print_output, error_msg=error_msg)


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
    elif'pyecharts' in str(type(result)):
        # 返回echarts图表对象
        return {
            "result_type": "echarts",
            "data": [],
            "plot_data": json.loads(result.dump_options()),
            "print_output": print_output
        }
    else:
        error_msg = "Python代码的result变量必须是DataFrame或Plotly图表对象"
        raise ValueError(error_msg)
