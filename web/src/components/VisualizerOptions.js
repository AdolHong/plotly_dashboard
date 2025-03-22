import React from 'react';
import { Form, Select, Checkbox, InputNumber, Row, Col, Divider } from 'antd';

const VisualizerOptions = ({ options, optionValues, handleOptionChange }) => {

  return (
    <div style={{ marginBottom: '16px' }}>
      <Divider orientation="left">选项设置</Divider>
      <Form layout="vertical">
        <Row gutter={12}>
          {options.map((option, optionIndex) => {
            const { name, type, choices, multiple } = option;
            
            if (!name) return null;
            
            return (
              <Col span={4} key={`${name}-${optionIndex}`} style={{ marginBottom: '8px' }}>
                <Form.Item label={name}>
                  {type === 'bool' && (
                    <Checkbox
                      checked={!!optionValues[name]}
                      onChange={e => handleOptionChange(name, e.target.checked)}
                    >
                      {name}
                    </Checkbox>
                  )}
                  
                  {(type === 'str' || !type) && choices && !multiple && (
                    <Select
                      style={{ width: '100%' }}
                      value={optionValues[name]}
                      onChange={value => handleOptionChange(name, value)}
                    >
                      {choices.map((choice, i) => (
                        <Select.Option key={`${choice}-${i}`} value={choice}>
                          {choice}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                  
                  {(type === 'str' || !type) && choices && multiple && (
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      value={optionValues[name] || []}
                      onChange={value => handleOptionChange(name, value)}
                    >
                      {choices.map((choice, i) => (
                        <Select.Option key={`${choice}-${i}`} value={choice}>
                          {choice}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                  
                  {type === 'int' && !choices && (
                    <InputNumber
                      style={{ width: '100%' }}
                      value={optionValues[name]}
                      onChange={value => handleOptionChange(name, value)}
                    />
                  )}
                  
                  {type === 'double' && !choices && (
                    <InputNumber
                      style={{ width: '100%' }}
                      value={optionValues[name]}
                      step={0.1}
                      onChange={value => handleOptionChange(name, value)}
                    />
                  )}
                  
                  {(type === 'int' || type === 'double') && choices && !multiple && (
                    <Select
                      style={{ width: '100%' }}
                      value={optionValues[name]}
                      onChange={value => handleOptionChange(name, value)}
                    >
                      {choices.map((choice, i) => (
                        <Select.Option key={`${choice}-${i}`} value={choice}>
                          {choice}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                  
                  {(type === 'int' || type === 'double') && choices && multiple && (
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      value={optionValues[name] || []}
                      onChange={value => handleOptionChange(name, value)}
                    >
                      {choices.map((choice, i) => (
                        <Select.Option key={`${choice}-${i}`} value={choice}>
                          {choice}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </Form.Item>
              </Col>
            );
          })}
        </Row>
      </Form>
    </div>
  );
};

export default VisualizerOptions;