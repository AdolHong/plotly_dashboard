import pandas as pd
from typing import List, Dict, Any, Optional

def get_cascade_options(df: pd.DataFrame, hierarchy: List[str], param_values: Dict[str, Any]) -> Dict[str, List[Any]]:
    """
    根据当前参数值返回层级数据的级联选项。
    
    参数:
        df: 包含层级数据的DataFrame
        hierarchy: 定义层级结构的列名列表（从上到下）
        param_values: 将参数名映射到其选定值的字典（如果未选择则为None）
    
    返回:
        根据选择将每个参数映射到其可用选项的字典
    """
    # 创建数据帧副本
    filtered_df = df.copy()
    
    # 第一步：应用非None值的过滤器获取过滤后的数据集
    for param, value in param_values.items():
        if value is not None:
            filtered_df = filtered_df[filtered_df[param] == value]
    
    # 第二步：获取每个层级参数的可用选项
    result = {}
    for param in hierarchy:
        result[param] = sorted(filtered_df[param].unique().tolist())
    
    return result 