import unittest
import pandas as pd

# 添加父目录到路径以导入模块
from src.utils.cascade_options import get_cascade_options

class TestCascadeOptions(unittest.TestCase):
    
    def setUp(self):
        # 设置测试数据
        data = {
            'category': [1, 1, 1, 2, 2, 3],
            'subcategory': [11, 11, 12, 21, 22, 31],
            'product': [111, 112, 121, 211, 221, 311]
        }
        self.hierarchy = ["category", "subcategory", "product"]
        self.df = pd.DataFrame(data)
    
    def test_filter_by_category(self):
        """测试按顶层类别筛选"""
        param_values = {"category": 1, "subcategory": None, "product": None}
        result = get_cascade_options(self.df, self.hierarchy, param_values)
        
        expected = {
            'category': [1],
            'subcategory': [11, 12],
            'product': [111, 112, 121]
        }
        self.assertEqual(result, expected)
    
    def test_filter_by_subcategory(self):
        """测试按中间层级筛选"""
        param_values = {"category": None, "subcategory": 11, "product": None}
        result = get_cascade_options(self.df, self.hierarchy, param_values)
        
        expected = {
            'category': [1],
            'subcategory': [11],
            'product': [111, 112]
        }
        self.assertEqual(result, expected)
    
    def test_filter_by_product(self):
        """测试按底层产品筛选"""
        param_values = {"category": None, "subcategory": None, "product": 111}
        result = get_cascade_options(self.df, self.hierarchy, param_values)
        
        expected = {
            'category': [1],
            'subcategory': [11],
            'product': [111]
        }
        self.assertEqual(result, expected)
    
    def test_filter_by_multiple_levels(self):
        """测试按多个层级筛选"""
        param_values = {"category": 1, "subcategory": None, "product": 111}
        result = get_cascade_options(self.df, self.hierarchy, param_values)
        
        expected = {
            'category': [1],
            'subcategory': [11],
            'product': [111]
        }
        self.assertEqual(result, expected)
    
    def test_with_no_filters(self):
        """测试不设置任何筛选条件"""
        param_values = {"category": None, "subcategory": None, "product": None}
        result = get_cascade_options(self.df, self.hierarchy, param_values)
        
        expected = {
            'category': [1, 2, 3],
            'subcategory': [11, 12, 21, 22, 31],
            'product': [111, 112, 121, 211, 221, 311]
        }
        self.assertEqual(result, expected)
    
    def test_with_no_matching_results(self):
        """测试无匹配结果的情况"""
        param_values = {"category": 99, "subcategory": None, "product": None}
        result = get_cascade_options(self.df, self.hierarchy, param_values)
        
        expected = {
            'category': [],
            'subcategory': [],
            'product': []
        }
        self.assertEqual(result, expected)

if __name__ == '__main__':
    unittest.main() 
