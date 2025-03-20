import React, { useState, useEffect } from 'react';
import { Button, Divider, Typography, Space, message } from 'antd';
import SQLEditor from './SQLEditor';
import Visualizer from './Visualizer';
import axios from 'axios';

const { Title } = Typography;

const Dashboard = () => {
  const [sessionId, setSessionId] = useState('');
  const [queryHash, setQueryHash] = useState('');
  const [visualizerCount, setVisualizerCount] = useState(1);
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [initialSqlCode, setInitialSqlCode] = useState('');
  const [initialPythonCodes, setInitialPythonCodes] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // 获取会话ID
  useEffect(() => {
    // 使用App.js中存储的会话ID，确保前后端使用相同的ID
    const storedSessionId = sessionStorage.getItem('sessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);
  
  // 从后端获取仪表盘配置
  useEffect(() => {
    const fetchDashboardConfig = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/config');
        
        if (response.data.status === 'success') {
          const config = response.data.config;
          setDashboardConfig(config);
          
          // 设置初始SQL代码
          if (config.query && config.query.code) {
            setInitialSqlCode(config.query.code);
          }
          
          // 设置初始Python代码并调整可视化区域数量
          if (config.visualization && Array.isArray(config.visualization)) {
            const pythonCodes = config.visualization.map(item => item.code || '');
            setInitialPythonCodes(pythonCodes);
            setVisualizerCount(pythonCodes.length || 1);
            
            // 保存完整的可视化配置，以便传递title和description
            window.visualizationConfig = config.visualization;
          }
          
          setConfigLoaded(true);
        } else {
          console.error('获取仪表盘配置失败:', response.data.message);
        }
      } catch (error) {
        console.error('获取仪表盘配置错误:', error);
        message.error('获取仪表盘配置失败，使用默认配置');
        setConfigLoaded(true);
      }
    };
    
    fetchDashboardConfig();
  }, []);
  
  // 处理SQL查询成功
  const handleQuerySuccess = (hash) => {
    if (!hash) {
      console.error('收到无效的查询哈希值');
      return;
    }
    // 每次查询成功时，添加时间戳使queryHash变化，强制触发可视化区域更新
    setQueryHash(`${hash}_${new Date().getTime()}`);
  };
  
  // 添加新的可视化区域
  const handleAddVisualizer = () => {
    setVisualizerCount(prev => prev + 1);
  };
  
  return (
    <div>
      <Title level={4}>SQL + Python 数据可视化</Title>
      
      {/* SQL查询区域 */}
      <SQLEditor 
        sessionId={sessionId} 
        onQuerySuccess={handleQuerySuccess}
        initialSqlCode={initialSqlCode}
        configLoaded={configLoaded}
      />
      
      <Divider orientation="left">Python 可视化区域</Divider>
      
      {/* 可视化区域列表 */}
      {Array.from({ length: visualizerCount }).map((_, index) => (
        <Visualizer 
          key={index}
          index={index + 1}
          sessionId={sessionId}
          queryHash={queryHash}
          initialPythonCode={initialPythonCodes[index] || ''}
          configLoaded={configLoaded}
        />
      ))}
      
      {/* 添加可视化区域按钮 */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Button 
          type="dashed" 
          onClick={handleAddVisualizer}
        >
          添加可视化区域
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;