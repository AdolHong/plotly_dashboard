import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Divider, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Option } = Select;

// 参数类型选项
const PARAMETER_TYPES = [
  { value: 'single_select', label: '单选下拉框' },
  { value: 'multi_select', label: '多选下拉框' },
  { value: 'date_picker', label: '日期选择器' },
  { value: 'single_input', label: '单行输入框' },
  { value: 'multi_input', label: '多行输入框' }
];

const ParameterEditModal = ({ visible, onCancel, onSave, parameters }) => {
  const [form] = Form.useForm();
  const [paramList, setParamList] = useState([]);
  const [currentEditParam, setCurrentEditParam] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  // 当参数列表变化时更新表单
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      setParamList([...parameters]);
    } else {
      setParamList([]);
    }
  }, [parameters, visible]);

  // 保存参数配置
  const handleSave = () => {
    onSave(paramList);
  };

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
      choices: param.choices ? param.choices.join('\n') : '',
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
      
      // 处理选项列表
      const processedChoices = choices ? 
        choices.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0) : 
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
      <Modal
        title="编辑筛选条件"
        open={visible}
        onCancel={onCancel}
        width={800}
        footer={[
          <Button key="cancel" onClick={onCancel}>取消</Button>,
          <Button key="save" type="primary" onClick={handleSave}>保存</Button>
        ]}
      >
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
      </Modal>
      
      {/* 参数编辑模态框 */}
      <Modal
        title={currentEditParam ? "编辑筛选条件" : "添加筛选条件"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveParamEdit}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
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
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              
              return (
                <>
                  {(type === 'single_select' || type === 'multi_select') && (
                    <Form.Item
                      name="choices"
                      label="选项列表"
                      rules={[{ required: true, message: '请输入选项列表' }]}
                      help="每行一个选项"
                    >
                      <Input.TextArea 
                        placeholder="每行输入一个选项" 
                        autoSize={{ minRows: 3, maxRows: 6 }}
                      />
                    </Form.Item>
                  )}
                  
                  <Form.Item
                    name="default"
                    label="默认值"
                    help={type === 'multi_select' || type === 'multi_input' ? '多个值请用逗号分隔' : ''}
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
                  
                  {( type === 'multi_select' || type === 'multi_input') && (
                    <>
                      <Form.Item
                        name="sep"
                        label="分隔符"
                        initialValue=","
                      >
                        <Input placeholder="例如: ," />
                      </Form.Item>
                      
                      <Form.Item
                        name="wrapper"
                        label="包装符"
                        initialValue="'"
                      >
                        <Input placeholder="例如: '" />
                      </Form.Item>
                    </>
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

export default ParameterEditModal;