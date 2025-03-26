import React, { useState, useEffect } from 'react';
import { Button, Divider, message, Modal, Input, Menu, Dropdown, Layout, Tree, Space, Typography } from 'antd';
import { ShareAltOutlined, EditOutlined, FolderOutlined, FileOutlined, PlusOutlined, DeleteOutlined, FolderAddOutlined, ReloadOutlined } from '@ant-design/icons';
import SQLEditor from './SQLEditor';
import Visualizer from './Visualizer';
import EditModal from './EditModal';
import axios from 'axios';
import { useParamValues, useOptionValues } from '../hooks/useVisualizerContext';

const { Header, Sider, Content } = Layout;
const { DirectoryTree } = Tree;
const { Title } = Typography;

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
  const [isParameterEditModalVisible, setIsParameterEditModalVisible] = useState(false);
  // 文件夹相关状态
  const [folderStructure, setFolderStructure] = useState([]);
  const [currentFilePath, setCurrentFilePath] = useState('default.json');
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [isCreateFileModalVisible, setIsCreateFileModalVisible] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // 刷新文件夹结构
  const refreshFolderStructure = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/folder_structure');
      if (response.data.status === 'success') {
        setFolderStructure(response.data.data);
      } else {
        console.error('获取文件夹结构失败:', response.data.message);
        message.error('获取文件夹结构失败');
      }
    } catch (error) {
      console.error('获取文件夹结构错误:', error);
      message.error('获取文件夹结构失败');
    }
  };
  
  // 加载文件夹结构
  useEffect(() => {
    refreshFolderStructure();
  }, []);
  
  // 从后端获取仪表盘配置
  useEffect(() => {
    const fetchDashboardConfig = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/config?filepath=${encodeURIComponent(currentFilePath)}`);
        
        if (response.data.status === 'success') {
          const config = response.data.config;
          // 直接使用从服务器获取的配置，不解析动态参数
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
          
          // 切换文件时，清除查询结果，以便需要手动点击查询按钮
          setQueryHash('');
        } else {
          console.error('获取仪表盘配置失败:', response.data.message);
          message.error(`获取仪表盘配置失败: ${response.data.message}`);
        }
      } catch (error) {
        console.error('获取仪表盘配置错误:', error);
        message.error('获取仪表盘配置失败，使用默认配置');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentFilePath) {
      fetchDashboardConfig();
    }
  }, [currentFilePath]);
  
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
  
  // 处理文件/文件夹树选择
  const onTreeSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0 && info.node.type === 'file') {
      setCurrentFilePath(info.node.path);
    }
  };
  
  // 创建新文件夹
  const createFolder = async () => {
    if (!newFolderPath) {
      message.error('请输入文件夹路径');
      return;
    }
    
    // 清理路径，移除开头和结尾的斜杠以及多余的空格
    const cleanPath = newFolderPath.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      message.error('请输入有效的文件夹路径');
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8000/api/create_folder', {
        path: cleanPath
      });
      
      if (response.data.status === 'success') {
        message.success('文件夹创建成功');
        setIsCreateFolderModalVisible(false);
        setNewFolderPath('');
        
        // 刷新文件夹结构
        await refreshFolderStructure();
      } else {
        message.error('创建文件夹失败: ' + response.data.message);
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
      message.error('创建文件夹失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 创建新仪表盘文件
  const createDashboardFile = async () => {
    if (!newFilePath) {
      message.error('请输入文件路径');
      return;
    }
    
    // 清理路径，移除开头和结尾的斜杠以及多余的空格
    let cleanPath = newFilePath.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      message.error('请输入有效的文件路径');
      return;
    }
    
    // 确保文件以.json结尾
    if (!cleanPath.endsWith('.json')) {
      cleanPath = cleanPath + '.json';
    }
    
    try {
      const response = await axios.post('http://localhost:8000/api/create_dashboard', {
        filepath: cleanPath
      });
      
      if (response.data.status === 'success') {
        message.success('仪表盘文件创建成功');
        setIsCreateFileModalVisible(false);
        setNewFilePath('');
        
        // 刷新文件夹结构并切换到新创建的文件
        await refreshFolderStructure();
        setCurrentFilePath(cleanPath);
      } else {
        message.error('创建仪表盘文件失败: ' + response.data.message);
      }
    } catch (error) {
      console.error('创建仪表盘文件失败:', error);
      message.error('创建仪表盘文件失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 删除文件
  const deleteFile = async () => {
    if (!currentFilePath) {
      message.error('请先选择文件');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确认要删除文件 "${currentFilePath}" 吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await axios.post('http://localhost:8000/api/delete_file', {
            filepath: currentFilePath
          });
          
          if (response.data.status === 'success') {
            message.success('文件删除成功');
            
            // 刷新文件夹结构并重置当前文件
            await refreshFolderStructure();
            setCurrentFilePath('default.json'); // 重置为默认文件
          } else {
            message.error('删除文件失败: ' + response.data.message);
          }
        } catch (error) {
          console.error('删除文件失败:', error);
          message.error('删除文件失败: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };
  
  // 保存仪表盘配置
  const saveDashboardConfig = async (newParameters, newVisualizations, newSqlCode) => {
    try {
      // 更新参数配置
      setConfigParameters(newParameters);
      
      // 更新仪表盘配置
      if (dashboardConfig) {
        const newConfig = { 
          ...dashboardConfig, 
          parameters: newParameters,
          visualization: newVisualizations || dashboardConfig.visualization,
          query: {
            ...dashboardConfig.query,
            code: newSqlCode
          }
        };
        
        // 保存到服务器
        const response = await axios.post('http://localhost:8000/api/update_config', {
          filepath: currentFilePath,
          config: newConfig
        });
        
        if (response.data.status === 'success') {
          setDashboardConfig(newConfig);
          
          // 更新SQL代码
          setInitialSqlCode(newSqlCode);
          setCurrentSqlQuery(newSqlCode);
          
          // 更新可视化配置和数量
          if (newVisualizations) {
            setVisualizationConfig(newVisualizations);
            setVisualizerCount(newVisualizations.length || 1);
          }
          
          message.success('仪表盘配置已更新');
        } else {
          message.error('保存配置失败: ' + response.data.message);
        }
      }
      
      setIsParameterEditModalVisible(false);
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 将文件列表数据转换为Tree组件所需的格式
  const convertToTreeData = (data) => {
    return data.map(item => {
      const node = {
        title: (
          <Typography.Text ellipsis={{ tooltip: item.name }}>
            {item.name}
          </Typography.Text>
        ),
        key: item.path,
        type: item.type,
        path: item.path,
        icon: item.type === 'directory' ? <FolderOutlined /> : <FileOutlined />
      };
      
      if (item.type === 'directory') {
        // 确保目录节点始终有children属性，即使是空数组
        node.children = item.children ? convertToTreeData(item.children) : [];
      }
      
      return node;
    });
  };
  
  // Tree组件所需的数据格式
  const treeData = convertToTreeData(folderStructure);
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={250} 
        collapsible 
        collapsed={siderCollapsed} 
        onCollapse={(collapsed) => setSiderCollapsed(collapsed)}
        style={{ background: '#fff' }}
      >
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text strong style={{ fontSize: '16px', display: siderCollapsed ? 'none' : 'block' }}>
            仪表盘文件
          </Typography.Text>
          <Space>
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={refreshFolderStructure}
              title="刷新文件列表"
            />
            <Button 
              type="text" 
              icon={<FolderAddOutlined />} 
              onClick={() => setIsCreateFolderModalVisible(true)}
              title="新建文件夹"
            />
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={() => setIsCreateFileModalVisible(true)}
              title="新建仪表盘"
            />
          </Space>
        </div>
        <DirectoryTree
          treeData={treeData}
          defaultExpandAll
          onSelect={onTreeSelect}
          selectedKeys={[currentFilePath]}
          style={{ padding: '0 8px', overflowX: 'hidden' }}
          showIcon
          blockNode
          selectable
          autoExpandParent
        />
      </Sider>
      <Layout>
        <Content style={{ padding: '16px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }} title={currentFilePath}>
              {currentFilePath}
            </Title>
            <Space>
              <Button 
                icon={<DeleteOutlined />} 
                danger
                onClick={deleteFile}
                disabled={!currentFilePath || currentFilePath === 'default.json'}
                title="删除当前文件"
              >
                删除
              </Button>
              <Button 
                icon={<EditOutlined />} 
                onClick={() => setIsParameterEditModalVisible(true)}
                title="编辑仪表盘配置"
              >
                编辑
              </Button>
              <Button 
                type="primary" 
                icon={<ShareAltOutlined />} 
                onClick={handleShare}
                loading={isSharing}
                disabled={!queryHash}
                title="分享仪表盘"
              >
                分享
              </Button>
            </Space>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', padding: '0 10px' }}>
            <div style={{ flex: '1 1 auto', minWidth: '200px', marginRight: '20px' }}>
              <Divider orientation="left" style={{ margin: '10px 0' }}>SQL 查询区域</Divider>
            </div>
          </div>
          
          {/* SQL查询区域 - 只读模式但参数可交互 */}
          <SQLEditor 
            sessionId={sessionId} 
            onQuerySuccess={handleQuerySuccess}
            initialSqlCode={initialSqlCode}
            configLoaded={configLoaded}
            configParameters={configParameters}
            dashboardConfig={dashboardConfig}
            parameterReadOnly = {false} // 允许在只读模式下编辑参数
            SQLEditorVisible = {false} // 设置为可见
            queryButonVisible = {true} // 设置为可见
          />
          
          <Divider orientation="left">数据可视化区域</Divider>
          
          {/* 可视化区域列表 */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
          ) : (
            Array.from({ length: visualizerCount }).map((_, index) => (
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
            ))
          )}
        </Content>
      </Layout>
      
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
      
      {/* 仪表盘配置编辑模态框 */}
      <EditModal 
        visible={isParameterEditModalVisible}
        onCancel={() => setIsParameterEditModalVisible(false)}
        initialSqlCode={currentSqlQuery || initialSqlCode}
        onSave={saveDashboardConfig}
        parameters={configParameters}
        visualizations={visualizationConfig}
        dashboardConfig={dashboardConfig}
      />
      
      {/* 创建文件夹对话框 */}
      <Modal
        title="创建新文件夹"
        open={isCreateFolderModalVisible}
        onCancel={() => {
          setIsCreateFolderModalVisible(false);
          setNewFolderPath('');
        }}
        onOk={createFolder}
      >
        <Input 
          placeholder="请输入文件夹路径，例如: folder1/subfolder" 
          value={newFolderPath}
          onChange={(e) => setNewFolderPath(e.target.value)}
          style={{ marginTop: '16px' }}
        />
      </Modal>
      
      {/* 创建仪表盘文件对话框 */}
      <Modal
        title="创建新仪表盘"
        open={isCreateFileModalVisible}
        onCancel={() => {
          setIsCreateFileModalVisible(false);
          setNewFilePath('');
        }}
        onOk={createDashboardFile}
      >
        <Input 
          placeholder="请输入文件路径，例如: folder1/dashboard.json" 
          value={newFilePath}
          onChange={(e) => setNewFilePath(e.target.value)}
          style={{ marginTop: '16px' }}
        />
      </Modal>
    </Layout>
  );
};

export default DashboardView;