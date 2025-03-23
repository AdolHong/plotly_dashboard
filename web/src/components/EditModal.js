import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs } from 'antd';
import { FilterOutlined, BarChartOutlined } from '@ant-design/icons';
import ParamEditView from './ParamEditView';
import VisualizationEditView from './VisualizationEditView';

const EditModal = ({ visible, onCancel, onSave, parameters, visualizations = [] }) => {
  const [paramList, setParamList] = useState([]);
  const [visualizationList, setVisualizationList] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState('1'); // 默认选中筛选条件标签页

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

  // 保存参数配置
  const handleSave = () => {
    onSave(paramList, visualizationList);
  };

  return (
    <Modal
      title="编辑仪表盘配置"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="save" type="primary" onClick={handleSave}>保存</Button>
      ]}
    >
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        items={[
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
        ]}
      />
    </Modal>
  );
};

export default EditModal;