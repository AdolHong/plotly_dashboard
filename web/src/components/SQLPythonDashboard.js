import React, { useState } from 'react';
import { Card, Button, Divider, Typography, Space } from 'antd';
import SQLQueryEditor from './SQLQueryEditor';
import PythonVisualizer from './PythonVisualizer';

const { Title } = Typography;

const SQLPythonDashboard = ({ onDataReceived, onPlotDataReceived, onError, onPrintOutputReceived }) => {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [queryHash, setQueryHash] = useState('');
  const [visualizerCount, setVisualizerCount] = useState(1);
  
  // 处理SQL查询成功
  const handleQuerySuccess = (hash) => {
    setQueryHash(hash);
  };
  
  // 添加新的可视化区域
  const handleAddVisualizer = () => {
    setVisualizerCount(prev => prev + 1);
  };
  
  return (
    <div>
      <Title level={4}>SQL + Python 数据可视化</Title>
      
      {/* SQL查询区域 */}
      <SQLQueryEditor 
        sessionId={sessionId} 
        onQuerySuccess={handleQuerySuccess} 
      />
      
      <Divider orientation="left">Python 可视化区域</Divider>
      
      {/* 可视化区域列表 */}
      {Array.from({ length: visualizerCount }).map((_, index) => (
        <PythonVisualizer 
          key={index}
          index={index + 1}
          sessionId={sessionId}
          queryHash={queryHash}
        />
      ))}
      
      {/* 添加可视化区域按钮 */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Button 
          type="dashed" 
          onClick={handleAddVisualizer}
          disabled={!queryHash}
        >
          添加可视化区域
        </Button>
      </div>
    </div>
  );
};

export default SQLPythonDashboard;