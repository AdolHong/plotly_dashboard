import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Form, message, Select, Input } from 'antd';
import { FilterOutlined, BarChartOutlined, CodeOutlined } from '@ant-design/icons';
import ParamEditView from './ParamEditView';
import VisualizationEditView from './VisualizationEditView';
import SQLEditor from './SQLEditor';
import axios from 'axios';

const EditModal = ({ visible, onCancel, onSave, parameters, visualizations = [], dashboardConfig }) => {
  const [paramList, setParamList] = useState([]);
  const [visualizationList, setVisualizationList] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [sqlCode, setSqlCode] = useState('');
  const [executorType, setExecutorType] = useState('MySQL');
  const [dataFrameName, setDataFrameName] = useState('df1');
  const [updateMode, setUpdateMode] = useState('手动更新');

  // 当modal显示或dashboardConfig变化时初始化SQL相关配置
  useEffect(() => {
    message.info(JSON.stringify(dashboardConfig))
    if (dashboardConfig?.query) {
      message.info(2)
      message.info(JSON.stringify(dashboardConfig))
      setSqlCode(dashboardConfig.query.code || '');
      setExecutorType(dashboardConfig.query.executorType || 'MySQL');
      setDataFrameName(dashboardConfig.query.dataFrameName || 'df1');
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
  }, [parameters, visualizations, visible]);

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
    {
      key: '3',
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
              initialSqlCode={sqlCode}
              onCodeChange={(code) => setSqlCode(code)}
              readOnly={false}
              queryButtonVisible={false}
            />
          </div>
        </div>
      ),
    },
  ];

  const handleSave = async () => {
    try {

      const newConfig = { 
        ...dashboardConfig, 
        parameters: paramList,
        visualization: visualizationList || dashboardConfig.visualization,
        query: {
          ...dashboardConfig.query,
          code: sqlCode,
          executorType,
          dataframeName:dataFrameName,
          updateMode,
        }};


      // 保存到后端
      const response = await axios.post('http://localhost:8000/api/update_config', {
          config: newConfig
      });

      if (response.data.status === 'success') {
        message.success('配置已保存');
        onSave(paramList, visualizationList, sqlCode);
      } else {
        message.error('保存失败：' + response.data.message);
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败：' + error.message);
    }
  };

  return (
    <Modal
      title="编辑报表"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="save" type="primary" onClick={handleSave}>保存</Button>
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