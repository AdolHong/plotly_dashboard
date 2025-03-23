import React, { useState } from 'react';
import { Form, Input, Select, Button, Space, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import PythonEditor from './PythonEditor';

const { Option } = Select;

const VisualizationEditView = ({ visualizationList, setVisualizationList }) => {
  const [currentEditVisualization, setCurrentEditVisualization] = useState(null);
  const [visualizationEditModalVisible, setVisualizationEditModalVisible] = useState(false);
  const [visualizationEditForm] = Form.useForm();
  
  // 选项编辑相关状态
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [optionForm] = Form.useForm();

  // 添加新图表
  const handleAddVisualization = () => {
    setCurrentEditVisualization(null);
    visualizationEditForm.resetFields();
    visualizationEditForm.setFieldsValue({
      type: 'python',
      title: '',
      description: '',
      code: '# 返回表格\nresult = df',
      options: '[]'
    });
    setVisualizationEditModalVisible(true);
  };

  // 编辑图表
  const handleEditVisualization = (visualization, index) => {
    setCurrentEditVisualization({ ...visualization, index });
    
    // 将options转换为JSON字符串以便编辑
    const optionsStr = JSON.stringify(visualization.options || [], null, 2);
    
    visualizationEditForm.setFieldsValue({
      type: visualization.type || 'python',
      title: visualization.title || '',
      description: visualization.description || '',
      code: visualization.code || '',
      options: optionsStr
    });
    
    setVisualizationEditModalVisible(true);
  };

  // 删除图表
  const handleDeleteVisualization = (index) => {
    const newVisualizationList = [...visualizationList];
    newVisualizationList.splice(index, 1);
    setVisualizationList(newVisualizationList);
  };

  // 保存图表编辑
  const handleSaveVisualizationEdit = () => {
    visualizationEditForm.validateFields().then(values => {
      const { type, title, description, code, options } = values;
      
      // 解析options JSON字符串
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(options);
      } catch (error) {
        message.error('选项格式不正确，请检查JSON格式');
        return;
      }
      
      const visualizationData = {
        type,
        title,
        description,
        code,
        options: parsedOptions
      };
      
      const newVisualizationList = [...visualizationList];
      if (currentEditVisualization !== null) {
        // 更新现有图表
        newVisualizationList[currentEditVisualization.index] = visualizationData;
      } else {
        // 添加新图表
        newVisualizationList.push(visualizationData);
      }
      
      setVisualizationList(newVisualizationList);
      setVisualizationEditModalVisible(false);
    });
  };

  // 打开选项编辑模态框
  const handleOpenOptionModal = () => {
    try {
      const currentOptionsStr = visualizationEditForm.getFieldValue('options') || '[]';
      const parsedOptions = JSON.parse(currentOptionsStr);
      setCurrentOptions(parsedOptions);
      setOptionModalVisible(true);
    } catch (error) {
      message.error('选项格式不正确，请检查JSON格式');
    }
  };

  // 添加新选项
  const handleAddOption = () => {
    optionForm.resetFields();
    optionForm.setFieldsValue({
      name: '',
      type: 'str',
      multiple: false,
      infer: '',
      inferColumn: '',
      choices: ''
    });
    Modal.confirm({
      title: '添加选项',
      content: (
        <Form form={optionForm} layout="vertical">
          <Form.Item name="name" label="选项名称" rules={[{ required: true }]}>
            <Input placeholder="请输入选项名称" />
          </Form.Item>
          <Form.Item name="type" label="选项类型">
            <Select defaultValue="str">
              <Option value="str">字符串</Option>
              <Option value="int">整数</Option>
              <Option value="double">浮点数</Option>
              <Option value="bool">布尔值</Option>
            </Select>
          </Form.Item>
          <Form.Item name="multiple" label="是否多选" valuePropName="checked">
            <Select defaultValue={false}>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item name="infer" label="推断来源">
            <Select defaultValue="">
              <Option value="">无</Option>
              <Option value="column">数据列</Option>
            </Select>
          </Form.Item>
          <Form.Item name="inferColumn" label="推断列名">
            <Input placeholder="请输入推断列名" />
          </Form.Item>
          <Form.Item name="choices" label="选项列表" help="多个选项用逗号分隔">
            <Input.TextArea placeholder="选项1,选项2,选项3" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        optionForm.validateFields().then(values => {
          const { name, type, multiple, infer, inferColumn, choices } = values;
          
          // 处理选项列表
          const choicesList = choices ? choices.split(',').map(item => item.trim()).filter(item => item) : [];
          
          const newOption = {
            name,
            type,
            multiple: !!multiple,
            ...(infer ? { infer, inferColumn } : {}),
            ...(choicesList.length > 0 ? { choices: choicesList } : {})
          };
          
          const newOptions = [...currentOptions, newOption];
          setCurrentOptions(newOptions);
          
          // 更新表单中的options字段
          visualizationEditForm.setFieldsValue({
            options: JSON.stringify(newOptions, null, 2)
          });
        });
      }
    });
  };

  // 删除选项
  const handleDeleteOption = (index) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个选项吗？',
      onOk: () => {
        const newOptions = [...currentOptions];
        newOptions.splice(index, 1);
        setCurrentOptions(newOptions);
        
        // 更新表单中的options字段
        visualizationEditForm.setFieldsValue({
          options: JSON.stringify(newOptions, null, 2)
        });
      }
    });
  };

  // 编辑选项
  const handleEditOption = (option, index) => {
    optionForm.resetFields();
    optionForm.setFieldsValue({
      name: option.name || '',
      type: option.type || 'str',
      multiple: !!option.multiple,
      infer: option.infer || '',
      inferColumn: option.inferColumn || '',
      choices: option.choices ? option.choices.join(',') : ''
    });
    
    Modal.confirm({
      title: '编辑选项',
      content: (
        <Form form={optionForm} layout="vertical">
          <Form.Item name="name" label="选项名称" rules={[{ required: true }]}>
            <Input placeholder="请输入选项名称" />
          </Form.Item>
          <Form.Item name="type" label="选项类型">
            <Select>
              <Option value="str">字符串</Option>
              <Option value="int">整数</Option>
              <Option value="double">浮点数</Option>
              <Option value="bool">布尔值</Option>
            </Select>
          </Form.Item>
          <Form.Item name="multiple" label="是否多选" valuePropName="checked">
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item name="infer" label="推断来源">
            <Select>
              <Option value="">无</Option>
              <Option value="column">数据列</Option>
            </Select>
          </Form.Item>
          <Form.Item name="inferColumn" label="推断列名">
            <Input placeholder="请输入推断列名" />
          </Form.Item>
          <Form.Item name="choices" label="选项列表" help="多个选项用逗号分隔">
            <Input.TextArea placeholder="选项1,选项2,选项3" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        optionForm.validateFields().then(values => {
          const { name, type, multiple, infer, inferColumn, choices } = values;
          
          // 处理选项列表
          const choicesList = choices ? choices.split(',').map(item => item.trim()).filter(item => item) : [];
          
          const updatedOption = {
            name,
            type,
            multiple: !!multiple,
            ...(infer ? { infer, inferColumn } : {}),
            ...(choicesList.length > 0 ? { choices: choicesList } : {})
          };
          
          const newOptions = [...currentOptions];
          newOptions[index] = updatedOption;
          setCurrentOptions(newOptions);
          
          // 更新表单中的options字段
          visualizationEditForm.setFieldsValue({
            options: JSON.stringify(newOptions, null, 2)
          });
        });
      }
    });
  };

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVisualization}>
          添加图表
        </Button>
      </div>
      
      <div>
        {visualizationList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>暂无图表，请点击上方按钮添加</div>
        ) : (
          visualizationList.map((visualization, index) => (
            <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{visualization.title || `图表 ${index + 1}`}</strong>
                  {visualization.description && (
                    <div style={{ fontSize: '12px', color: '#888' }}>{visualization.description}</div>
                  )}
                </div>
                <Space>
                  <Button 
                    icon={<EditOutlined />} 
                    type="text" 
                    onClick={() => handleEditVisualization(visualization, index)}
                  >
                    编辑
                  </Button>
                  <Button 
                    icon={<DeleteOutlined />} 
                    type="text" 
                    danger 
                    onClick={() => handleDeleteVisualization(index)}
                  >
                    删除
                  </Button>
                </Space>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                <div>类型: {visualization.type || 'python'}</div>
                <div>选项数量: {(visualization.options || []).length}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 图表编辑模态框 */}
      <Modal
        title={currentEditVisualization ? "编辑图表" : "添加图表"}
        open={visualizationEditModalVisible}
        onCancel={() => setVisualizationEditModalVisible(false)}
        onOk={handleSaveVisualizationEdit}
        width={800}
      >
        <Form
          form={visualizationEditForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="图表标题"
            rules={[{ required: true, message: '请输入图表标题' }]}
          >
            <Input placeholder="请输入图表标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="图表描述"
          >
            <Input.TextArea placeholder="请输入图表描述" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="图表类型"
            rules={[{ required: true, message: '请选择图表类型' }]}
          >
            <Select placeholder="请选择图表类型">
              <Option value="python">Python</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="code"
            label="Python代码"
            rules={[{ required: true, message: '请输入Python代码' }]}
          >
            <PythonEditor
              pythonCode={visualizationEditForm.getFieldValue('code') || '# 返回表格\nresult = df'}
              setPythonCode={(value) => visualizationEditForm.setFieldsValue({ code: value })}
              readOnly={false}
            />
          </Form.Item>
          
          <Form.Item
            name="options"
            label="图表选项配置"
            help="JSON格式，可视化图表的配置选项"
          >
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '2px', padding: '8px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <Button 
                  type="primary" 
                  onClick={handleAddOption}
                  icon={<PlusOutlined />}
                  style={{ flex: '1' }}
                >
                  添加选项
                </Button>
                <Button 
                  type="default" 
                  onClick={handleOpenOptionModal}
                  style={{ flex: '1' }}
                >
                  管理选项
                </Button>
              </div>
              <Input.TextArea 
                placeholder="[]" 
                autoSize={{ minRows: 4, maxRows: 8 }}
                style={{ fontFamily: 'monospace' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                提示：选项配置将被用于图表渲染，请确保格式正确
              </div>
            </div>
          </Form.Item>