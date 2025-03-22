import React, { useEffect, useState } from 'react';
import { Form, Select, Checkbox, InputNumber, Row, Col, Divider, message } from 'antd';

const VisualizerOptions = ({ optionConfig:initialOptionConfig, optionValues, handleOptionChange, inferredOptions }) => {
  const [optionConfig, setOptionConfig] = useState(initialOptionConfig);
  
  // 当推断的选项变化时更新选项配置
  useEffect(() => {
    if (initialOptionConfig && initialOptionConfig.length > 0) {
      // 复制选项以避免修改原始对象
      const optionsCopy = JSON.parse(JSON.stringify(initialOptionConfig));
      // 使用从DataFrame中推断的选项更新选项配置
      // 遍历选项，查找需要从DataFrame中推断的选项
      const updatedOptions = optionsCopy.map(option => {
        // 检查选项是否需要从DataFrame中推断
        if (option.name && option.infer === "column" && option.inferColumn) {
          // 检查inferredOptions中是否有对应的选项
          if (inferredOptions && inferredOptions[option.name]) {
            const inferredOption = inferredOptions[option.name];
            
            // 创建新的选项对象，避免直接修改原对象
            const updatedOption = { ...option };
            
            // 更新选项的choices
            updatedOption.choices = inferredOption.choices || [];
            
            // 如果是单选且没有默认值，设置第一个值为默认值
            if (!updatedOption.multiple && !updatedOption.default && updatedOption.choices.length > 0) {
              updatedOption.default = updatedOption.choices[0];
            }
            // 如果是多选且没有默认值，设置为空列表
            else if (updatedOption.multiple && !updatedOption.default) {
              updatedOption.default = [];
            }
            return updatedOption;
          }
        }
        return option;
      });
      setOptionConfig(updatedOptions);
    }
  }, [inferredOptions, initialOptionConfig]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <Divider orientation="left">选项设置</Divider>
      <Form layout="vertical">
        <Row gutter={12}>
          {optionConfig.map((option, optionIndex) => {
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
                      allowClear
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
                      allowClear
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