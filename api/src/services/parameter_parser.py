import datetime
from typing import Dict, List, Any, Optional, Union

class ParameterParser:
    """
    参数解析器，用于处理仪表盘配置中的参数
    支持六种参数类型：
    1. single_select: 单选下拉框
    2. multi_select: 多选下拉框
    3. date_picker: 日期选择器
    4. date_range: 日期范围选择器
    5. single_input: 单个输入框
    6. multi_input: 多个输入框
    """
    
    def __init__(self, parameters: List[Dict[str, Any]]):
        """
        初始化参数解析器
        
        Args:
            parameters: 参数配置列表
        """
        self.parameters = parameters
        self.param_values = {}
        
        # 初始化默认值
        for param in parameters:
            name = param.get('name')
            if not name:
                continue
                
            default = param.get('default')
            if default is not None:
                self.param_values[name] = default
    
    def set_param_value(self, name: str, value: Any):
        """
        设置参数值
        
        Args:
            name: 参数名
            value: 参数值
        """
        self.param_values[name] = value
    
    def set_param_values(self, values: Dict[str, Any]):
        """
        批量设置参数值
        
        Args:
            values: 参数值字典
        """
        for name, value in values.items():
            self.param_values[name] = value
    
    def get_param_value(self, name: str) -> Any:
        """
        获取参数值
        
        Args:
            name: 参数名
            
        Returns:
            参数值
        """
        return self.param_values.get(name)
    
    def get_param_values(self) -> Dict[str, Any]:
        """
        获取所有参数值
        
        Returns:
            参数值字典
        """
        return self.param_values
    
    def get_param_config(self, name: str) -> Optional[Dict[str, Any]]:
        """
        获取参数配置
        
        Args:
            name: 参数名
            
        Returns:
            参数配置
        """
        for param in self.parameters:
            if param.get('name') == name:
                return param
        return None
    
    def format_param_value(self, name: str) -> str:
        """
        格式化参数值，根据参数类型进行格式化
        
        Args:
            name: 参数名
            
        Returns:
            格式化后的参数值
        """
        param_config = self.get_param_config(name)
        if not param_config:
            return ''
            
        value = self.get_param_value(name)
        if value is None:
            return ''
            
        param_type = param_config.get('param_type', '')
        value_type = param_config.get('value_type', 'string')
        
        # 根据参数类型进行格式化
        if param_type == 'single_select':
            # 单选下拉框，直接返回值
            return self._format_single_value(value, value_type)
            
        elif param_type == 'multi_select':
            # 多选下拉框，将列表转换为字符串
            sep = param_config.get('sep', ',')
            wrapper = param_config.get('wrapper', '')
            return self._format_multi_value(value, value_type, sep, wrapper)
            
        elif param_type == 'date_picker':
            # 日期选择器，格式化日期
            date_format = param_config.get('format', 'yyyy-MM-dd')
            return self._format_date(value, date_format)
            
        elif param_type == 'date_range':
            # 日期范围选择器，格式化日期范围
            date_format = param_config.get('format', 'yyyy-MM-dd')
            return self._format_date_range(value, date_format)
            
        elif param_type == 'single_input':
            # 单个输入框，直接返回值
            return self._format_single_value(value, value_type)
            
        elif param_type == 'multi_input':
            # 多个输入框，将列表转换为字符串
            sep = param_config.get('sep', ',')
            wrapper = param_config.get('wrapper', '')
            return self._format_multi_value(value, value_type, sep, wrapper)
            
        # 默认直接返回字符串值
        return str(value)
    
    def _format_single_value(self, value: Any, value_type: str) -> str:
        """
        格式化单个值
        
        Args:
            value: 参数值
            value_type: 值类型
            
        Returns:
            格式化后的值
        """
        if value_type == 'string':
            return f"'{value}'"
        return str(value)
    
    def _format_multi_value(self, values: List[Any], value_type: str, sep: str, wrapper: str) -> str:
        """
        格式化多个值
        
        Args:
            values: 参数值列表
            value_type: 值类型
            sep: 分隔符
            wrapper: 包装符
            
        Returns:
            格式化后的值
        """
        if not values:
            return ''
            
        formatted_values = []
        for value in values:
            if value_type == 'string':
                formatted_values.append(f"{wrapper}{value}{wrapper}")
            else:
                formatted_values.append(str(value))
                
        return sep.join(formatted_values)
    
    def _format_date(self, date_str: str, date_format: str) -> str:
        """
        格式化日期
        
        Args:
            date_str: 日期字符串
            date_format: 日期格式
            
        Returns:
            格式化后的日期
        """
        # 将前端日期格式转换为Python日期格式
        py_format = self._convert_date_format(date_format)
        
        try:
            # 尝试解析日期字符串
            date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
            # 格式化为指定格式
            return f"'{date_obj.strftime(py_format)}'"
        except (ValueError, TypeError):
            return f"'{date_str}'"
    
    def _format_date_range(self, date_range: List[str], date_format: str) -> str:
        """
        格式化日期范围
        
        Args:
            date_range: 日期范围列表 [开始日期, 结束日期]
            date_format: 日期格式
            
        Returns:
            格式化后的日期范围
        """
        if not date_range or len(date_range) != 2:
            return ''
            
        start_date = self._format_date(date_range[0], date_format)
        end_date = self._format_date(date_range[1], date_format)
        
        return f"BETWEEN {start_date} AND {end_date}"
    
    def _convert_date_format(self, date_format: str) -> str:
        """
        将前端日期格式转换为Python日期格式
        
        Args:
            date_format: 前端日期格式
            
        Returns:
            Python日期格式
        """
        # 简单替换，可以根据需要扩展
        py_format = date_format.replace('yyyy', '%Y')
        py_format = py_format.replace('MM', '%m')
        py_format = py_format.replace('dd', '%d')
        return py_format
    
    def replace_sql_params(self, sql_query: str) -> str:
        """
        替换SQL查询中的参数占位符
        
        Args:
            sql_query: SQL查询语句
            
        Returns:
            替换参数后的SQL查询语句
        """
        result = sql_query
        
        # 替换所有参数
        for name in self.param_values.keys():
            placeholder = f"${{{name}}}"
            formatted_value = self.format_param_value(name)
            result = result.replace(placeholder, formatted_value)
            
        return result