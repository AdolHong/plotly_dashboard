# coding: utf-8
import pandas as pd
from typing import Dict, List, Any, Optional, Union, Tuple, Set

def process_visualization_options(options: List[Dict[str, Any]], option_values: Dict[str, Any], df: pd.DataFrame) -> Dict[str, Any]:
    """
    处理可视化选项，将选项值添加到局部变量中
    
    Args:
        options: 可视化配置中定义的选项列表
        option_values: 前端传递的选项值
        df: 数据DataFrame，用于从列中推断选项
        
    Returns:
        包含处理后选项值的字典
    """
    processed_options = {}
    
    for option in options:
        option_name = option.get("name")
        if not option_name:
            continue
            
        option_type = option.get("type", "str")
        is_multiple = option.get("multiple", False)
        
        # 从前端获取选项值，如果没有则使用默认值
        if option_name in option_values:
            value = option_values.get(option_name)
        else:
            # 使用默认值
            value = option.get("default")
            
            # 如果没有提供默认值
            if value is None:
                # 对于单选，默认选择第一个选项
                if not is_multiple and "choices" in option and option["choices"]:
                    value = option["choices"][0]
                # 对于多选，默认为空列表
                elif is_multiple:
                    value = []
        
        # 根据类型转换值
        if value is not None:
            if option_type == "int":
                if is_multiple and isinstance(value, list):
                    value = [int(v) for v in value if str(v).isdigit()]
                elif not is_multiple and not isinstance(value, list):
                    try:
                        value = int(value)
                    except (ValueError, TypeError):
                        # 如果转换失败，使用默认值或第一个选项
                        if "default" in option:
                            value = option["default"]
                        elif "choices" in option and option["choices"]:
                            value = option["choices"][0]
                        else:
                            value = 0
            
            elif option_type == "double" or option_type == "float":
                if is_multiple and isinstance(value, list):
                    value = [float(v) for v in value if str(v).replace(".", "", 1).isdigit()]
                elif not is_multiple and not isinstance(value, list):
                    try:
                        value = float(value)
                    except (ValueError, TypeError):
                        # 如果转换失败，使用默认值或第一个选项
                        if "default" in option:
                            value = option["default"]
                        elif "choices" in option and option["choices"]:
                            value = option["choices"][0]
                        else:
                            value = 0.0
            
            elif option_type == "bool":
                if is_multiple and isinstance(value, list):
                    value = [bool(v) for v in value]
                elif not is_multiple and not isinstance(value, list):
                    if isinstance(value, str):
                        value = value.lower() in ["true", "1", "yes", "y"]
                    else:
                        value = bool(value)
        
        # 将处理后的值添加到结果字典中
        processed_options[option_name] = value
    return processed_options


def infer_options_from_dataframe(options: List[Dict[str, Any]], df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    从DataFrame中推断选项的choices
    
    Args:
        options: 可视化配置中定义的选项列表
        df: 数据DataFrame，用于从列中推断选项
        
    Returns:
        更新了choices的选项列表
    """
    if df is None or df.empty:
        return options
    
    updated_options = []
    
    for option in options:
        # 复制选项以避免修改原始对象
        option_copy = option.copy()
        
        # 检查是否需要从DataFrame列中推断选项
        if option.get("infer") == "column" and "infer_column" in option:
            column_name = option.get("infer_column")
            
            # 检查列是否存在于DataFrame中
            if column_name in df.columns:
                # 获取列中的唯一值
                unique_values = df[column_name].dropna().unique().tolist()
                
                # 转换为字符串列表
                unique_values = [str(val) for val in unique_values]
                
                # 更新选项的choices
                option_copy["choices"] = unique_values
                
                # 如果是单选且没有默认值，设置第一个值为默认值
                if not option.get("multiple", False) and "default" not in option and unique_values:
                    option_copy["default"] = unique_values[0]
                # 如果是多选且没有默认值，设置为空列表
                elif option.get("multiple", False) and "default" not in option:
                    option_copy["default"] = []
        
        updated_options.append(option_copy)
    
    return updated_options

def preprocess_visualization_options(config: Dict[str, Any], df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
    """
    预处理可视化选项配置，确保选项配置的完整性
    
    Args:
        config: 仪表盘配置
        df: 可选的DataFrame，用于从列中推断选项
        
    Returns:
        处理后的配置
    """
    if "visualization" not in config:
        return config
    
    for idx, vis in enumerate(config["visualization"]):
        if "options" not in vis:
            continue
            
        for option_idx, option in enumerate(vis["options"]):
            # 确保选项有名称
            if "name" not in option:
                continue
                
            # 确保选项有类型
            if "type" not in option:
                option["type"] = "str"
            
            # 确保单选的默认值在选项中
            if not option.get("multiple", False) and "default" in option and "choices" in option:
                if option["default"] not in option["choices"]:
                    option["choices"].append(option["default"])
                    
            # 确保多选的默认值在选项中
            if option.get("multiple", False) and "default" in option and isinstance(option["default"], list) and "choices" in option:
                for default_value in option["default"]:
                    if default_value not in option["choices"]:
                        option["choices"].append(default_value)
            
            # 更新选项
            vis["options"][option_idx] = option
        
        # 更新可视化配置
        config["visualization"][idx] = vis

    return config