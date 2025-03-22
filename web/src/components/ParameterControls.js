import React from 'react';
import { Form, Select, Input, DatePicker, Card, Row, Col, message } from 'antd';


const { Option } = Select;

const ParameterControls = ({ parameters, form, onParamChange }) => {
  if (!parameters || parameters.length === 0) {
    return null;
  }
  
  return (
    <Card title="查询参数" style={{ marginBottom: '20px' }}>
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
                      onChange={(value) => onParamChange(name, value)}
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
                      onChange={(value) => onParamChange(name, value)}
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
                      onChange={(value) => onParamChange(name, value)}
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
                      onChange={(e) => onParamChange(name, e.target.value)}
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
                      onChange={(values) => onParamChange(name, values)}
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
    </Card>
  );
};

export default ParameterControls;