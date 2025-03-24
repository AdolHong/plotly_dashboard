import React, { useEffect } from 'react';
import { Form, Select, Input, DatePicker, Card, Row, Col, message } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

// 动态日期解析函数
const parseDynamicDate = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  // 匹配三种格式：
  // 1. ${yyyyMMdd} - 当前日期，无偏移
  // 2. ${yyyy-MM-dd+Nd} - 当前日期加N天
  // 3. ${yyyy-MM-dd-Nd} - 当前日期减N天
  const dateMatch = value.match(/\$\{(yyyy-MM-dd|yyyyMMdd)(?:([+-])(\d+)([dMy]))?\}/);
  
  if (dateMatch) {
    const format = dateMatch[1];
    const operation = dateMatch[2] || ''; // '+', '-' 或空字符串
    const amount = dateMatch[3] ? parseInt(dateMatch[3]) : 0;
    const unit = dateMatch[4] || 'd'; // 如果没有指定单位，默认为天
    
    let date = dayjs();
    
    // 根据操作符处理日期
    if (operation === '+') {
      // 加上相应的时间
      if (unit === 'd') {
        date = date.add(amount, 'day');
      } else if (unit === 'M') {
        date = date.add(amount, 'month');
      } else if (unit === 'y') {
        date = date.add(amount, 'year');
      }
    } else if (operation === '-') {
      // 减去相应的时间
      if (unit === 'd') {
        date = date.subtract(amount, 'day');
      } else if (unit === 'M') {
        date = date.subtract(amount, 'month');
      } else if (unit === 'y') {
        date = date.subtract(amount, 'year');
      }
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

const ParameterControls = ({ parameters, form, onParamChange, paramValues, readOnly = false }) => {
  // 当 paramValues 提供时，更新表单值
  useEffect(() => {
    if (paramValues && Object.keys(paramValues).length > 0) {
      form.setFieldsValue(paramValues);
    }
  }, [paramValues, form]);

  if (!parameters || parameters.length === 0) {
    return null;
  }
  
  
  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Row gutter={12}>
      {parameters.map(param => {
        const { name, type, choices } = param;

        // 处理选项中的动态日期
        let processedChoices = choices;
        if (choices && Array.isArray(choices)) {
          processedChoices = choices.map(choice => parseDynamicDate(choice));
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

// 方法1：命名导出和默认导出
export default ParameterControls;

// 方法2：如果需要在其他地方导入
export { parseDynamicDate };