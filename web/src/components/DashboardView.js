import React, { useState, useEffect } from 'react';
import { Button, Divider, message, Modal, Input } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import SQLEditor from './SQLEditor';
import Visualizer from './Visualizer';
import axios from 'axios';
import { useParamValues, useOptionValues } from '../hooks/useVisualizerContext';

const DashboardView = () => {
  const [sessionId, setSessionId] = useState('');
  const [queryHash, setQueryHash] = useState('');
  const [visualizerCount, setVisualizerCount] = useState(1);
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [initialSqlCode, setInitialSqlCode] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configParameters, setConfigParameters] = useState([]);
  const [inferredOptions, setInferredOptions] = useState(null);
  const [visualizationConfig, setVisualizationConfig] = useState([]);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [currentSqlQuery, setCurrentSqlQuery] = useState('');
  // Use context for paramValues instead of local state
  const { paramValues } = useParamValues();
  const { allOptionValues } = useOptionValues();
  
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

          // 设置初始参数
          if (config.parameters && Array.isArray(config.parameters)) {
            setConfigParameters(config.parameters);
          }
          
          // 设置初始Python代码并调整可视化区域数量
          if (config.visualization && Array.isArray(config.visualization)) {
            const pythonCodes = config.visualization.map(item => item.code || '');
            setVisualizerCount(pythonCodes.length || 1);
            
            // 保存可视化配置到状态变量
            setVisualizationConfig(config.visualization);
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
  const handleQuerySuccess = (hash, options, sqlQuery) => {
    if (!hash) {
      console.error('收到无效的查询哈希值');
      return;
    }
    // 如果有推断的选项，更新inferredOptions状态
    if (options) {
      setInferredOptions(options);
    }
    // 保存当前的SQL查询
    if (sqlQuery) {
      setCurrentSqlQuery(sqlQuery);
    }
    // 每次查询成功时，添加时间戳使queryHash变化，强制触发可视化区域更新
    setQueryHash(`${hash}_${new Date().getTime()}`);
  };
  
  // 处理分享按钮点击
  const handleShare = async () => {
    // 检查是否有查询结果
    if (!queryHash) {
      message.error('请先执行SQL查询');
      return;
    }
    
    setIsSharing(true);
    
    try {      
      // 构建仪表盘状态
      const dashboardState = {
        sqlQuery: currentSqlQuery,
        paramValues,
        allOptionValues,
        dashboardConfig,
        inferredOptions,
        queryHash: queryHash.split('_')[0], // 移除时间戳部分
      };
      
      // 发送到后端保存，包含session_id以便后端获取DataFrame数据
      const response = await axios.post('http://localhost:8000/api/share', {
        dashboard_state: dashboardState,
        session_id: sessionId,
      });
      
      if (response.data.status === 'success') {
        const shareId = response.data.shareId;
        const shareLink = `${window.location.origin}/share?id=${shareId}`;
        
        setShareUrl(shareLink);
        setIsShareModalVisible(true);
        message.success('仪表盘分享成功');
      } else {
        message.error('分享失败: ' + response.data.message);
      }
    } catch (error) {
      console.error('分享失败:', error);
      message.error('分享失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSharing(false);
    }
  };
  
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', padding: '0 10px' }}>
        <div style={{ flex: '1 1 auto', minWidth: '200px', marginRight: '20px' }}>
          <Divider orientation="left" style={{ margin: '10px 0' }}>SQL 查询区域</Divider>
        </div>
        <Button 
          type="primary" 
          icon={<ShareAltOutlined />} 
          onClick={handleShare}
          loading={isSharing}
          disabled={!queryHash}
          style={{ margin: '10px 0', flexShrink: 0 }}
        >
          分享仪表盘
        </Button>
      </div>
      
      {/* SQL查询区域 - 只读模式但参数可交互 */}
      <SQLEditor 
        sessionId={sessionId} 
        onQuerySuccess={handleQuerySuccess}
        initialSqlCode={initialSqlCode}
        configLoaded={configLoaded}
        configParameters={configParameters}
        dashboardConfig={dashboardConfig}
        readOnly={true} // 设置为只读模式，但参数区域仍可交互
      />
      
      <Divider orientation="left">数据可视化区域</Divider>
      
      {/* 可视化区域列表 */}
      {Array.from({ length: visualizerCount }).map((_, index) => (
        <Visualizer 
          key={index}
          index={index}
          sessionId={sessionId}
          queryHash={queryHash}
          config={visualizationConfig[index]}
          configLoaded={configLoaded}
          inferredOptions={inferredOptions}
          className="visualizer-container"
          readOnly={true} // 设置为只读模式
        />
      ))}
      
      {/* 分享链接对话框 */}
      <Modal
        title="分享仪表盘"
        open={isShareModalVisible}
        onCancel={() => setIsShareModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            message.success('链接已复制到剪贴板');
          }}>
            复制链接
          </Button>,
          <Button key="close" onClick={() => setIsShareModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <p>您可以使用以下链接分享此仪表盘：</p>
        <Input.TextArea 
          value={shareUrl} 
          readOnly 
          rows={2} 
          style={{ marginBottom: '10px' }}
        />
      </Modal>
    </div>
  );
};

export default DashboardView;