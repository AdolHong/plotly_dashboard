import React, { useEffect } from 'react';
import { Form, Select, Input, DatePicker, Card, Row, Col, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

// 动态日期解析函数
const parseDynamicDate = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  // 匹配动态日期格式 ${yyyy-MM-dd} 或 ${yyyyMMdd}
  const dateMatch = value.match(/\$\{(yyyy-MM-dd|yyyyMMdd)-(\d+)([dMy])\}/);
  if (dateMatch) {
    const format = dateMatch[1];
    const amount = parseInt(dateMatch[2]);
    const unit = dateMatch[3];
    
    let date = dayjs();
    
    // 根据单位减去相应的时间
    if (unit === 'd') {
      date = date.subtract(amount, 'day');
    } else if (unit === 'M') {
      date = date.subtract(amount, 'month');
    } else if (unit === 'y') {
      date = date.subtract(amount, 'year');
    }
    
    // 根据格式返回日期
    if (format === 'yyyy-MM-dd') {
      return date.format('YYYY-MM-DD');
    } else if (format === 'yyyyMMdd') {
      return date.format('YYYYMMDD');
    }
  }
  
  return value;
};

const ParameterControls = ({ parameters, form, onParamChange, paramValues, readOnly = false, preserveDynamicDate = false }) => {
  // 当 paramValues 提供时，更新表单值
  useEffect(() => {
    if (paramValues && Object.keys(paramValues).length > 0) {
      form.setFieldsValue(paramValues);
    }
  }, [paramValues, form]);

  if (!parameters || parameters.length === 0) {
    return null;
  }
  
  // 解析参数中的动态日期
  const processParamValue = (param, value) => {
    // 如果需要保留动态日期字符串（例如在编辑模式下），则不进行解析
    if (preserveDynamicDate) {
      return value;
    }
    
    // 处理不同类型的参数值
    if (typeof value === 'string') {
      return parseDynamicDate(value);
    } else if (Array.isArray(value)) {
      return value.map(item => parseDynamicDate(item));
    }
    return value;
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={12}>
      {parameters.map(param => {
        const { name, type, choices, default: defaultValue } = param;
        
        // 处理选项中的动态日期
        let processedChoices = choices;
        if (!preserveDynamicDate && choices && Array.isArray(choices)) {
          processedChoices = choices.map(choice => parseDynamicDate(choice));
        }
        
        // 处理默认值中的动态日期
        let processedDefault = defaultValue;
        if (!preserveDynamicDate && defaultValue) {
          processedDefault = processParamValue(param, defaultValue);
          
          // 如果是日期选择器，将日期字符串转换为 dayjs 对象
          if (type === 'date_picker' && processedDefault) {
            processedDefault = dayjs(processedDefault);
          }
        }
        
        switch (type) {
          case 'single_select':
            return (
              <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                  <Select 
                    placeholder={`请选择${name}`}
                    style={{ width: '100%' }}
                    onChange={(value) => !readOnly && onParamChange(name, value)}
                    disabled={readOnly}
                  >
                    {processedChoices && processedChoices.map(choice => (
                      <Option key={choice} value={choice}>{choice}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            );
            
          case 'multi_select':
            return (
              <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                  <Select 
                    mode="multiple"
                    placeholder={`请选择${name}`}
                    style={{ width: '100%' }}
                    onChange={(value) => !readOnly && onParamChange(name, value)}
                    disabled={readOnly}
                  >
                    {processedChoices && processedChoices.map(choice => (
                      <Option key={choice} value={choice}>{choice}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            );
            
          case 'date_picker':
            return (
              <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                  <DatePicker 
                    style={{ width: '100%' }}
                    onChange={(value) => !readOnly && onParamChange(name, value)}
                    disabled={readOnly}
                  />
                </Form.Item>
              </Col>
            );
            
          case 'single_input':
            return (
              <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                  <Input 
                    placeholder={`请输入${name}`}
                    onChange={(e) => !readOnly && onParamChange(name, e.target.value)}
                    disabled={readOnly}
                  />
                </Form.Item>
              </Col>
            );
            
          case 'multi_input':
            return (
              <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder={`请输入${name}，回车分隔多个值`}
                    onChange={(values) => !readOnly && onParamChange(name, values)}
                    disabled={readOnly}
                  />
                </Form.Item>
              </Col>
            );
          default:
            return null;
        }
      })}
      </Row>
    </Form>
  );
};

// 修改导出方式，使用命名导出
export { parseDynamicDate };
export default ParameterControls;