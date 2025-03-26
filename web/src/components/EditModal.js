import  { useState, useEffect, useRef } from 'react';
import { Modal, Button, Tabs, Select, Input, Form, Switch } from 'antd';
import { FilterOutlined, BarChartOutlined, CodeOutlined, DeleteOutlined } from '@ant-design/icons';
import ParamEditView from './ParamEditView';
import VisualizationEditView from './VisualizationEditView';
import SQLEditor from './SQLEditor';

const { Option } = Select;

const EditModal = ({ visible, onCancel, onSave, parameters, visualizations = [], dashboardConfig, initialSqlCode }) => {
  const [paramList, setParamList] = useState([]);
  const [visualizationList, setVisualizationList] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [sqlCode, setSqlCode] = useState(initialSqlCode|| '');
  const [executorType, setExecutorType] = useState('MySQL');
  const [dataFrameName, setDataFrameName] = useState('df');
  const [updateMode, setUpdateMode] = useState('手动更新');
  const sqlEditorRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [optionCount, setOptionCount] = useState(0);
  const [parameterCount, setParameterCount] = useState(0);
  const [form] = Form.useForm();

  // 当modal显示或dashboardConfig变化时初始化SQL相关配置
  useEffect(() => {
    if (dashboardConfig?.query) {
      setSqlCode(dashboardConfig.query.code || '');
      setExecutorType(dashboardConfig.query.executorType || 'MySQL');
      setDataFrameName(dashboardConfig.query.dataFrameName || 'df');
      setUpdateMode(dashboardConfig.query.updateMode || '手动更新');
    }
  }, [dashboardConfig]);

  // 当参数列表变化时更新表单
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      setParamList([...parameters]);
    } else {
      setParamList([]);
    }
    
    // 当可视化列表变化时更新
    if (visualizations && visualizations.length > 0) {
      setVisualizationList([...visualizations]);
    } else {
      setVisualizationList([]);
    }
  }, [parameters, visualizations]);

  // 修改表单初始化逻辑
  useEffect(() => {
    if (visible && parameters) {
      // 处理参数
      setParameterCount(parameters.length);
      
      // 处理选项，确保multiple字段为布尔值
      const formattedOptions = visualizations?.[0]?.options?.map(option => ({
        ...option,
        multiple: option.multiple === true || option.multiple === 'true'
      })) || [];
      
      setOptions(formattedOptions);
      setOptionCount(formattedOptions.length);
      
      // 初始化表单值
      form.setFieldsValue({
        parameters: parameters,
        sqlCode: initialSqlCode,
        options: formattedOptions,
        // 其他字段...
      });
    }
  }, [visible, parameters, initialSqlCode, visualizations, form]);

  // 添加选项的函数
  const addOption = () => {
    const newOptions = [...options, {
      name: '',
      type: '字符串',
      multiple: false,
      source: '数据列',
      column: ''
    }];
    setOptions(newOptions);
    setOptionCount(prevCount => prevCount + 1);
    form.setFieldsValue({ options: newOptions });
  };

  // 删除选项的函数
  const removeOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    setOptionCount(prevCount => prevCount - 1);
    form.setFieldsValue({ options: newOptions });
  };

  const items = [
    {
      key: '1',
      label: (
        <span>
          <FilterOutlined />
          筛选条件
        </span>
      ),
      children: (
        <ParamEditView 
          paramList={paramList} 
          setParamList={setParamList} 
        />
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <CodeOutlined />
          数据
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>执行引擎:</span>
              <Select
                value={executorType}
                onChange={setExecutorType}
                style={{ width: 120 }}
                options={[
                  { value: 'MySQL', label: 'MySQL' },
                  { value: 'PostgreSQL', label: 'PostgreSQL' },
                  // 其他数据库选项...
                ]}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>更新方式:</span>
              <Select
                value={updateMode}
                onChange={setUpdateMode}
                style={{ width: 120 }}
                options={[
                  { value: '手动更新', label: '手动更新' },
                  { value: '自动更新', label: '自动更新' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>DataFrame名称:</span>
              <Input
                value={dataFrameName}
                onChange={(e) => setDataFrameName(e.target.value)}
                style={{ width: 120 }}
              />
            </div>
          </div>
          <div style={{ height: '400px', border: '1px solid #d9d9d9', borderRadius: '2px' }}>
            <SQLEditor
              ref={sqlEditorRef}
              initialSqlCode={sqlCode}
              configLoaded={true}
              readOnly={false}
              queryButtonVisible={false}
            />
          </div>
        </div>
      ),
    },
        {
      key: '3',
      label: (
        <span>
          <BarChartOutlined />
          图表管理
        </span>
      ),
      children: (
        <VisualizationEditView 
          visualizationList={visualizationList} 
          setVisualizationList={setVisualizationList} 
        />
      ),
    },
  ];

  // 修改表单提交处理逻辑
  const handleOk = () => {
    form.validateFields().then(values => {
      // 确保multiple字段为布尔值
      const processedOptions = values.options?.map(option => ({
        ...option,
        multiple: option.multiple === true || option.multiple === 'true',
        // 如果source不是"选项列表"，则不需要list字段
        list: option.source === "选项列表" ? option.list : undefined
      }));
      
      // 更新可视化配置
      const updatedVisualizations = visualizations.map((viz, index) => {
        if (index === 0) {
          return {
            ...viz,
            options: processedOptions,
            code: values.sqlCode
          };
        }
        return viz;
      });
      
      // 调用保存函数
      onSave(values.parameters, updatedVisualizations, values.sqlCode);
    }).catch(err => {
      console.error('表单验证失败:', err);
    });
  };

  const renderOptionForm = (option, index) => {
    // 解析当前选项的多选状态，确保正确解析布尔值
    const isMultiple = option.multiple === true || option.multiple === 'true';
    
    return (
      <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
        <Form.Item
          label="选项名称"
          name={['options', index, 'name']}
          rules={[{ required: true, message: '请输入选项名称' }]}
        >
          <Input placeholder="选项名称" />
        </Form.Item>
        
        <Form.Item
          label="选项类型"
          name={['options', index, 'type']}
          rules={[{ required: true, message: '请选择选项类型' }]}
        >
          <Select placeholder="请选择选项类型">
            <Select.Option value="字符串">字符串</Select.Option>
            <Select.Option value="数字">数字</Select.Option>
            <Select.Option value="日期">日期</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          label="是否多选"
          name={['options', index, 'multiple']}
          valuePropName="checked"
        >
          <Switch checked={isMultiple} />
        </Form.Item>
        
        <Form.Item
          label="推断来源"
          name={['options', index, 'source']}
          rules={[{ required: true, message: '请选择推断来源' }]}
        >
          <Select 
            placeholder="请选择推断来源" 
            onChange={(value) => {
              // 当推断来源变更时，更新表单中的对应字段
              const newOptions = [...options];
              newOptions[index].source = value;
              setOptions(newOptions);
              form.setFieldsValue({ options: newOptions });
            }}
          >
            <Select.Option value="数据列">数据列</Select.Option>
            <Select.Option value="选项列表">选项列表</Select.Option>
          </Select>
        </Form.Item>
        
        {/* 仅当推断来源为"数据列"时显示列名字段 */}
        {option.source === "数据列" && (
          <Form.Item
            label="推断列名"
            name={['options', index, 'column']}
            rules={[{ required: option.source === "数据列", message: '请输入列名' }]}
          >
            <Input placeholder="数据列名" />
          </Form.Item>
        )}
        
        {/* 仅当推断来源为"选项列表"时显示选项列表 */}
        {option.source === "选项列表" && (
          <Form.Item
            label="选项列表"
            name={['options', index, 'list']}
            rules={[{ required: option.source === "选项列表", message: '请输入选项列表' }]}
          >
            <Input.TextArea 
              placeholder="每行一个选项值" 
              rows={4}
            />
          </Form.Item>
        )}
        
        <Form.Item>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => removeOption(index)}
          >
            删除选项
          </Button>
        </Form.Item>
      </div>
    );
  };

  return (
    <Modal
      title="编辑报表"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="save" type="primary" onClick={handleOk}>保存</Button>
      ]}
    >
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </Modal>
  );
};

export default EditModal;