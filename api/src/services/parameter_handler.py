# coding: utf-8
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime


def load_dashboard_config() -> Dict[str, Any]:
    """加载仪表盘配置文件"""
    config_path = Path(__file__).parent.parent.parent / "data" / "dashboard_config.json"
    
    if not config_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    return config


def get_parameters() -> List[Dict[str, Any]]:
    """获取参数配置列表"""
    try:
        config = load_dashboard_config()
        return config.get("parameters", [])
    except Exception as e:
        print(f"获取参数配置失败: {str(e)}")
        return []


def process_parameter_value(param: Dict[str, Any], value: Any) -> Any:
    """根据参数类型处理参数值"""
    param_type = param.get("type", "")
    
    if param_type == "single_select":
        # 单选下拉框，直接返回选中的值
        return value
    
    elif param_type == "multi_select":
        # 多选下拉框，根据sep和wrapper参数处理
        if not value or not isinstance(value, list):
            return ""
        
        sep = param.get("sep", ",")
        wrapper = param.get("wrapper", "")
        
        if wrapper:
            # 使用wrapper包装每个值，例如: 'value1','value2'
            wrapped_values = [f"{wrapper}{v}{wrapper}" for v in value]
            return sep.join(wrapped_values)
        else:
            # 不使用wrapper，直接连接，例如: value1,value2
            return sep.join(value)
    
    elif param_type == "date_picker":
        # 日期选择器，根据format参数格式化日期
        if not value:
            # 如果没有值，检查是否有默认值
            default_value = param.get("default", "")
            # 如果默认值是动态日期表达式，解析它
            if default_value and isinstance(default_value, str) and default_value.startswith("${") and default_value.endswith("}"):
                return _parse_date_parameter(default_value)
            return ""
        
        date_format = param.get("format", "yyyy-MM-dd")
        # 将Java风格的日期格式转换为Python风格
        py_format = date_format.replace("yyyy", "%Y").replace("MM", "%m").replace("dd", "%d")
        
        try:
            # 假设value是ISO格式的日期字符串
            date_obj = datetime.fromisoformat(value.replace('Z', '+00:00'))
            return date_obj.strftime(py_format)
        except Exception as e:
            print(f"日期格式化失败: {str(e)}")
            return value
    
    elif param_type == "single_input":
        # 单个输入框，直接返回值
        return value
    
    elif param_type == "multi_input":
        # 多个输入框，根据sep和wrapper参数处理
        if not value or not isinstance(value, list):
            return ""
        
        sep = param.get("sep", ",")
        wrapper = param.get("wrapper", "")
        
        if wrapper:
            # 使用wrapper包装每个值
            wrapped_values = [f"{wrapper}{v}{wrapper}" for v in value]
            return sep.join(wrapped_values)
        else:
            # 不使用wrapper，直接连接
            return sep.join(value)
    
    # 默认情况下直接返回原值
    return value


def _parse_date_parameter(pattern: str) -> str:
    """解析日期参数格式并计算结果
    
    支持的格式：
    - ${yyyy-MM-dd} - 当前日期
    - ${yyyyMMdd+1d} - 明天
    - ${yyyy-MM-dd-1d} - 昨天
    - 其他类似格式
    """
    import re
    from datetime import datetime, timedelta

    # 匹配日期格式和偏移量，支持更灵活的格式
    match = re.match(r'\$\{([yMd-]+)([+-]\d+[d])?\}', pattern)
    if not match:
        return pattern

    date_format, offset = match.groups()
    current_date = datetime.now()

    # 处理日期偏移
    if offset:
        days = int(offset[:-1])  # 去掉'd'后转为整数
        current_date += timedelta(days=days)

    # 转换Java风格的日期格式为Python风格
    py_format = date_format.replace('yyyy', '%Y').replace('MM', '%m').replace('dd', '%d')
    
    return current_date.strftime(py_format)

def replace_parameters_in_sql(sql: str, param_values: Dict[str, Any]) -> str:
    """替换SQL中的参数占位符"""
    if not sql or not param_values:
        return sql
    
    # 获取参数配置
    parameters = get_parameters()
    
    # 处理每个参数值并替换SQL中的占位符
    for param in parameters:
        param_name = param.get("name")
        if not param_name or param_name not in param_values:
            continue
        
        # 获取参数值并根据类型处理
        raw_value = param_values.get(param_name)
        processed_value = process_parameter_value(param, raw_value)
        
        # 替换SQL中的参数占位符 ${param_name}
        placeholder = f"${{{param_name}}}"
        sql = sql.replace(placeholder, str(processed_value))
    
    # 处理日期格式参数
    import re
    date_patterns = re.finditer(r'\$\{[yMd-]+[+-]?\d*[d]?\}', sql)
    for match in date_patterns:
        pattern = match.group()
        sql = sql.replace(pattern, _parse_date_parameter(pattern))
    
    return sql

# 初次加载config，预处理
def preprocess_of_config(config: Dict[str, Any]) ->  Dict[str, Any]:
    """
    预处理config，处理参数中的动态日期值和可视化选项。
    """
    _parse_dynamic_date = lambda v: _parse_date_parameter(v)  if isinstance(v, str) and v.startswith("${")\
                        and v.endswith("}") else v

    try:
        # 预处理可视化选项
        from .option_handler import preprocess_visualization_options
        config = preprocess_visualization_options(config)
        if "parameters" in config:
            # 确保default在choices中
            for idx, param in enumerate(config["parameters"]):
                if param.get("type") in ["single_select", "multi_select"]:
                    # 确保choices存在且为列表
                    if "choices" not in param or not isinstance(param["choices"], list):
                        param["choices"] = []
                    
                    # 确保default在choices中
                    if "default" in param:
                        if isinstance(param["default"], str) and param["default"] not in param["choices"]:
                            param["choices"].append(param["default"])
                        elif isinstance(param["default"], list):
                            # 处理多选的default值列表
                            for i, value in enumerate(param["default"]):
                                # 如果值不在choices中，添加到choices列表末尾
                                if value not in param["choices"]:
                                    param["choices"].append(value)
                    config["parameters"][idx] = param
                    

            # 处理参数中的动态日期值
            for idx, param in enumerate(config["parameters"]):
                param_type = param.get("type")
                # default值为动态日期
                if  "default" in param:
                    if isinstance(param["default"], str):
                        # 处理单选的default值
                        param["default"] = _parse_dynamic_date(param["default"])
                    elif isinstance(param["default"], list):
                        # 处理多选的default值列表
                        for i, value in enumerate(param["default"]):
                            value = _parse_dynamic_date(value)
                            param["default"][i] = value

                # single_select和multi_select类型的choices中包含的动态日期
                elif param_type in ["single_select", "multi_select"]:                    
                    # 处理choices中的动态日期参数
                    for i, choice in enumerate(param["choices"]):
                        param["choices"][i] = _parse_dynamic_date(choice)

                config["parameters"][idx] = param
    except Exception as e:
        print(f"预处理config失败: {str(e)}")
    return config
                    