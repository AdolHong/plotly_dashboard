import React, { useEffect } from 'react';
import { Form, Select, Input, DatePicker, Card, Row, Col, message } from 'antd';


const { Option } = Select;

const ParameterControls = ({ parameters, form, onParamChange, paramValues, readOnly = false }) => {
  // When paramValues are provided, update the form values
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
                      {choices && choices.map(choice => (
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
                      {choices && choices.map(choice => (
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

export default ParameterControls;