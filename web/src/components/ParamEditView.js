import React, { useState } from 'react';
import { Form, Input, Select, Button, Space, message, Modal, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import ParameterControls from './ParameterControls';

const { Option } = Select;

// 参数类型选项
const PARAMETER_TYPES = [
  { value: 'single_select', label: '下拉框, 单选' },
  { value: 'multi_select', label: '下拉框, 多选' },
  { value: 'date_picker', label: '日期选择器' },
  { value: 'single_input', label: '输入框, 单值' },
  { value: 'multi_input', label: '输入框, 多值' }
];


const ParamEditView = ({ paramList, setParamList }) => {
  const [currentEditParam, setCurrentEditParam] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [isFormValid, setIsFormValid] = useState(true);

  // 添加新参数
  const handleAddParam = () => {
    setCurrentEditParam(null);
    editForm.resetFields();
    setEditModalVisible(true);
  };

  // 编辑参数
  const handleEditParam = (param, index) => {
    setCurrentEditParam({ ...param, index });
    editForm.setFieldsValue({
      name: param.name,
      type: param.type,
      default: param.type === 'multi_select' || param.type === 'multi_input' 
        ? Array.isArray(param.default) ? param.default.join(',') : param.default
        : param.default,
      choices: param.choices ? param.choices.join(',') : '',
      format: param.format || '',
      sep: param.sep || ',',
      wrapper: param.wrapper || '\''
    });
    setEditModalVisible(true);
  };

  // 删除参数
  const handleDeleteParam = (index) => {
    const newParamList = [...paramList];
    newParamList.splice(index, 1);
    setParamList(newParamList);
  };

  // 验证默认值是否在选项列表中
  const validateDefaultValue = (defaultValue, choices, type) => {
    if (!defaultValue || !choices || choices.length === 0) return true;
    
    // 处理多选和单选的情况
    const defaultValues = type === 'multi_select' 
      ? defaultValue.split(',').map(v => v.trim())
      : [defaultValue.trim()];
    
    const choicesList = choices.split(',').map(v => v.trim());
    
    // 检查所有默认值是否都在选项列表中
    const invalidValues = defaultValues.filter(v => !choicesList.includes(v));
    
    return invalidValues.length === 0;
  };

  // 修改表单验证逻辑
  const handleFormChange = () => {
    try {
      const type = editForm.getFieldValue('type');
      if (type === 'single_select' || type === 'multi_select') {
        const defaultValue = editForm.getFieldValue('default');
        const choices = editForm.getFieldValue('choices');
        
        if (defaultValue && choices) {
          const isValid = validateDefaultValue(defaultValue, choices, type);
          setIsFormValid(isValid);
        } else {
          setIsFormValid(true);
        }
      } else {
        setIsFormValid(true);
      }
    } catch (error) {
      setIsFormValid(false);
    }
  };

  // 保存参数编辑
  const handleSaveParamEdit = () => {
    editForm.validateFields().then(values => {
      const { name, type, default: defaultValue, choices, format, sep, wrapper } = values;
      
      // 处理默认值
      let processedDefault;
      if (type === 'multi_select' || type === 'multi_input') {
        processedDefault = defaultValue ? defaultValue.split(',').map(item => item.trim()) : [];
      } else {
        processedDefault = defaultValue;
      }
      
      // 处理选项列表 - 改为用逗号分隔
      const processedChoices = choices ? 
        choices.split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0) : 
        [];
      
      const paramData = {
        name,
        type,
        default: processedDefault,
        ...(type === 'single_select' || type === 'multi_select' ? { choices: processedChoices } : {}),
        ...(type === 'date_picker' ? { format } : {}),
        ...(type === 'multi_select' || type === 'multi_input' ? { sep, wrapper } : {}),
        ...(type === 'single_select' ? { sep, wrapper } : {})
      };
      
      const newParamList = [...paramList];
      if (currentEditParam !== null) {
        // 更新现有参数
        newParamList[currentEditParam.index] = paramData;
      } else {
        // 添加新参数
        newParamList.push(paramData);
      }
      
      setParamList(newParamList);
      setEditModalVisible(false);
    });
  };

  // 渲染参数类型的友好名称
  const renderParamTypeName = (type) => {
    const typeObj = PARAMETER_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddParam}>
          添加筛选条件
        </Button>
      </div>
      
      <div>
        {paramList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>暂无筛选条件，请点击上方按钮添加</div>
        ) : (
          paramList.map((param, index) => (
            <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{param.name}</strong> ({renderParamTypeName(param.type)})
                </div>
                <Space>
                  <Button 
                    icon={<EditOutlined />} 
                    type="text" 
                    onClick={() => handleEditParam(param, index)}
                  >
                    编辑
                  </Button>
                  <Button 
                    icon={<DeleteOutlined />} 
                    type="text" 
                    danger 
                    onClick={() => handleDeleteParam(index)}
                  >
                    删除
                  </Button>
                </Space>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                {param.type === 'single_select' || param.type === 'multi_select' ? (
                  <div>选项: {param.choices ? param.choices.join(', ') : '无'}</div>
                ) : null}
                <div>默认值: {Array.isArray(param.default) ? param.default.join(', ') : (param.default || '无')}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 参数编辑模态框 */}
      <Modal
        title={currentEditParam ? "编辑筛选条件" : "添加筛选条件"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveParamEdit}
        okButtonProps={{ disabled: !isFormValid }}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onValuesChange={handleFormChange}
        >
          <Form.Item
            name="name"
            label="筛选条件名称"
            rules={[{ required: true, message: '请输入筛选条件名称' }]}
          >
            <Input placeholder="请输入筛选条件名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="筛选条件类型"
            rules={[{ required: true, message: '请选择筛选条件类型' }]}
          >
            <Select placeholder="请选择筛选条件类型">
              {PARAMETER_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.type !== currentValues.type ||
              prevValues.choices !== currentValues.choices ||
              prevValues.default !== currentValues.default
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              const defaultValue = getFieldValue('default');
              const choices = getFieldValue('choices');
              
              // 验证默认值并显示错误信息
              let defaultValueError = null;
              if (type === 'single_select' || type === 'multi_select') {
                if (defaultValue && choices) {
                  const isValid = validateDefaultValue(defaultValue, choices, type);
                  if (!isValid) {
                    defaultValueError = '默认值必须在选项列表中';
                  }
                }
              }
              
              return (
                <>
                  {(type === 'single_select' || type === 'multi_select') && (
                    <Form.Item
                      name="choices"
                      label="选项列表"
                      rules={[{ required: true, message: '请输入选项列表' }]}
                      help="多个选项用逗号分隔"
                    >
                      <Input.TextArea 
                        placeholder="选项1,选项2,选项3" 
                        autoSize={{ minRows: 3, maxRows: 6 }}
                      />
                    </Form.Item>
                  )}
                  
                  <Form.Item
                    name="default"
                    label="默认值"
                    help={defaultValueError || (type === 'multi_select' || type === 'multi_input' ? '多个值请用逗号分隔' : '')}
                    validateStatus={defaultValueError ? 'error' : ''}
                  >
                    {type === 'date_picker' ? (
                      <Input placeholder="例如: ${yyyy-MM-dd} 表示当前日期" />
                    ) : (
                      <Input placeholder={type === 'multi_select' || type === 'multi_input' ? '多个值请用逗号分隔' : '请输入默认值'} />
                    )}
                  </Form.Item>
                  
                  {type === 'date_picker' && (
                    <Form.Item
                      name="format"
                      label="日期格式"
                      initialValue="yyyy-MM-dd"
                    >
                      <Input placeholder="例如: yyyy-MM-dd" />
                    </Form.Item>
                  )}
                  
                  {(type === 'multi_select' || type === 'multi_input') && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="sep"
                          label="分隔符"
                          initialValue=","
                        >
                          <Input placeholder="例如: ," />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="wrapper"
                          label="包装符"
                          initialValue="'"
                        >
                          <Input placeholder="例如: '" />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ParamEditView;