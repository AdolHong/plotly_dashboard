import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import PythonEditor from './PythonEditor';

const { Option } = Select;

const VisualizationEditView = ({ visualizationList, setVisualizationList }) => {
  const [currentEditVisualization, setCurrentEditVisualization] = useState(null);
  const [visualizationEditModalVisible, setVisualizationEditModalVisible] = useState(false);
  const [visualizationEditForm] = Form.useForm();
  const [currentEditedCode, setCurrentEditedCode] = useState('');
  
  // 选项编辑相关状态
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [currentOptionIndex, setCurrentOptionIndex] = useState(null);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [optionForm] = Form.useForm();

  // 添加新的状态
  const [jsonEditModalVisible, setJsonEditModalVisible] = useState(false);

  // 添加新状态
  const [addOptionModalVisible, setAddOptionModalVisible] = useState(false);

  // 监听 Modal 可见性变化
  useEffect(() => {
    if (!visualizationEditModalVisible) {
      // 当 Modal 关闭时重置编辑状态
      setCurrentEditedCode('');
    }
  }, [visualizationEditModalVisible]);

  // 添加新图表
  const handleAddVisualization = () => {
    setCurrentEditVisualization(null);
    // 重置当前选项列表
    setCurrentOptions([]);
    setCurrentEditedCode('# 返回表格\nresult = df');
    
    // 确保表单重置完成
    visualizationEditForm.resetFields();
    setTimeout(() => {
      visualizationEditForm.setFieldsValue({
        type: 'python',
        title: '',
        description: '',
        code: '# 返回表格\nresult = df',
        options: '[]'
      });
    }, 0);
    
    setVisualizationEditModalVisible(true);
  };

  // 编辑图表
  const handleEditVisualization = (visualization, index) => {
    setCurrentEditVisualization({ ...visualization, index });
    
    // 将options转换为JSON字符串以便编辑
    const optionsStr = JSON.stringify(visualization.options || [], null, 2);
    
    // 设置当前选项列表
    setCurrentOptions(visualization.options || []);
    
    // 设置当前编辑的代码
    const code = visualization.code || '# 返回表格\nresult = df';
    setCurrentEditedCode(code);
    
    // 确保表单重置后再设置新的值
    visualizationEditForm.resetFields();
    setTimeout(() => {
      visualizationEditForm.setFieldsValue({
        type: visualization.type || 'python',
        title: visualization.title || '',
        description: visualization.description || '',
        code: code,
        options: optionsStr
      });
    }, 0);
    
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
    // 确保使用最新的 Python 代码
    const formValues = visualizationEditForm.getFieldsValue();
    
    // 如果有编辑过的代码，使用最新的编辑内容
    if (currentEditedCode) {
      formValues.code = currentEditedCode;
    }
    
    console.log('保存图表信息:', formValues);
    
    visualizationEditForm.validateFields().then(values => {
      // 使用 formValues 替代 values，确保包含最新的代码内容
      const { type, title, description, options } = values;
      const code = formValues.code; // 使用我们跟踪的最新代码
      
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
    }).catch(err => {
      console.error('表单验证失败:', err);
      message.error('请检查表单内容是否正确填写');
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

  // 修改添加选项函数
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
    setAddOptionModalVisible(true);
  };

  // 添加保存选项函数
  const handleOptionAddSave = () => {
    optionForm.validateFields().then(values => {
      const { name, type, multiple, infer, inferColumn, choices } = values;
      message.info(1)

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
      
      setAddOptionModalVisible(false);
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
    
    setCurrentOptionIndex(index);
    setOptionModalVisible(true);
  };

  // 修改 JSON 编辑相关函数
  const handleOpenJsonEdit = () => {
    // 确保使用当前的 options 状态
    visualizationEditForm.setFieldsValue({
      options: JSON.stringify(currentOptions, null, 2)
    });
    setJsonEditModalVisible(true);
  };

  const handleSaveJsonEdit = () => {
    try {
      const optionsStr = visualizationEditForm.getFieldValue('options');
      const parsedOptions = JSON.parse(optionsStr);
      setCurrentOptions(parsedOptions);
      setJsonEditModalVisible(false);
    } catch (error) {
      console.error('JSON解析错误:', error);
      message.error('JSON格式不正确，请检查');
    }
  };

  // 修改表单中的选项配置部分
  const renderOptionsSection = () => (
    <Form.Item
      name="options"
      label="图表选项配置"
    >
      <div style={{ border: '1px solid #d9d9d9', borderRadius: '2px', padding: '8px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <Button 
            type="primary" 
            onClick={handleAddOption}
            icon={<PlusOutlined />}
            style={{ flex: '1' }}
          >
            添加选项
          </Button>
          <Button 
            onClick={handleOpenJsonEdit}
            style={{ flex: '1' }}
          >
            JSON编辑
          </Button>
        </div>
        
        {currentOptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>暂无选项，请点击上方按钮添加</div>
        ) : (
          currentOptions.map((option, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '8px', 
                padding: '12px', 
                border: '1px solid #f0f0f0', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{option.name}</strong>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  类型: {option.type}, 
                  {option.multiple ? '多选' : '单选'}
                  {option.infer ? `, 推断自: ${option.infer}` : ''}
                </div>
              </div>
              <Space>
                <Button 
                  icon={<EditOutlined />} 
                  type="text" 
                  onClick={() => handleEditOption(option, index)}
                >
                  编辑
                </Button>
                <Button 
                  icon={<DeleteOutlined />} 
                  type="text" 
                  danger 
                  onClick={() => handleDeleteOption(index)}
                >
                  删除
                </Button>
              </Space>
            </div>
          ))
        )}
      </div>
    </Form.Item>
  );

  const showOptionModal = (option, index) => {
    setCurrentOptionIndex(index);
    
    // 设置表单初始值
    optionForm.setFieldsValue({
      name: option?.name || '',
      type: option?.type || 'str',
      multiple: option?.multiple || false,
      infer: option?.infer || '',
      inferColumn: option?.inferColumn || '',
      choices: option?.choices?.join(',') || ''
    });
    
    setOptionModalVisible(true);
  };

  const handleOptionModalSave = () => {
    optionForm.validateFields().then(values => {
      // 处理表单数据
      const { name, type, multiple, infer, inferColumn, choices } = values;
      const choicesList = choices ? choices.split(',').map(item => item.trim()) : [];
      
      
      const newOption = {
        name,
        type,
        multiple,
        infer,
        inferColumn: infer === 'column' ? inferColumn : '',
        choices: choicesList
      };


      
      
      // 更新选项列表
      const newOptions = [...currentOptions];
      if (currentOptionIndex !== null) {
        newOptions[currentOptionIndex] = newOption;
      } else {
        newOptions.push(newOption);
      }


      setCurrentOptions(newOptions);
      
      // 更新表单中的options字段
      visualizationEditForm.setFieldsValue({
        options: JSON.stringify(newOptions, null, 2)
      });
      
      setOptionModalVisible(false);
    });
  };

  return (
    <div>
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
        onCancel={() => {
          Modal.confirm({
            title: '确认关闭',
            content: '关闭后未保存的内容将会丢失，是否确认关闭？',
            onOk: () => {
              setVisualizationEditModalVisible(false);
            },
          });
        }}
        onOk={handleSaveVisualizationEdit}
        width={800}
        maskClosable={false}
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
            name="code"
            label="Python代码"
            rules={[{ required: true, message: '请输入Python代码' }]}
          >
            <PythonEditor
              pythonCode={ visualizationEditForm.getFieldValue('code') || '# 返回表格\nresult = df'}
              setPythonCode={(value) => {
                setCurrentEditedCode(value);
                // visualizationEditForm.setFieldsValue({ code: value });
              }}
              readOnly={false}
              hideButtons={true}
            />
          </Form.Item>
          
          {renderOptionsSection()}
        </Form>
      </Modal>

      {/* 添加 JSON 编辑模态框 */}
      <Modal
        title="JSON编辑"
        open={jsonEditModalVisible}
        onCancel={() => setJsonEditModalVisible(false)}
        onOk={handleSaveJsonEdit}
        width={600}
      >
        <Form form={visualizationEditForm}>
          <Form.Item
            name="options"
          >
            <Input.TextArea 
              placeholder="[]" 
              autoSize={{ minRows: 10, maxRows: 20 }}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
        <div style={{ fontSize: '12px', color: '#888' }}>
          提示：请输入有效的JSON格式
        </div>
      </Modal>

      {/* 添加选项模态框 */}
      <Modal
        title="添加选项"
        open={addOptionModalVisible}
        onCancel={() => setAddOptionModalVisible(false)}
        onOk={handleOptionAddSave}
        width={600}
      >
        <Form 
          form={optionForm} 
          layout="vertical"
        >
          <Form.Item 
            name="name" 
            label="选项名称" 
            rules={[{ required: true, message: '请输入选项名称' }]}
          >
            <Input placeholder="请输入选项名称" />
          </Form.Item>
          
          <Form.Item 
            name="type" 
            label="选项类型"
            initialValue="str"
          >
            <Select>
              <Option value="str">字符串</Option>
              <Option value="int">整数</Option>
              <Option value="double">浮点数</Option>
              <Option value="bool">布尔值</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="multiple" 
            label="是否多选"
            initialValue={false}
          >
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="infer" 
            label="推断来源"
            initialValue=""
          >
            <Select>
              <Option value="">无</Option>
              <Option value="column">数据列</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.infer !== currentValues.infer}
          >
            {({ getFieldValue }) => {
              const infer = getFieldValue('infer');
              
              return (
                <>
                  {infer === 'column' && (
                    <Form.Item 
                      name="inferColumn" 
                      label="推断列名"
                      rules={[{ required: true, message: '请输入推断列名' }]}
                    >
                      <Input placeholder="请输入推断列名" />
                    </Form.Item>
                  )}
                  
                  {!infer && (
                    <Form.Item 
                      name="choices" 
                      label="选项列表" 
                      help="多个选项用逗号分隔"
                      rules={[{ required: true, message: '请输入选项列表' }]}
                    >
                      <Input.TextArea 
                        placeholder="选项1,选项2,选项3" 
                        autoSize={{ minRows: 3, maxRows: 6 }}
                      />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑选项"
        open={optionModalVisible}
        onCancel={() => setOptionModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setOptionModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleOptionModalSave}>
            保存
          </Button>
        ]}
      >
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
      </Modal>
    </div>
  );
};

export default VisualizationEditView;