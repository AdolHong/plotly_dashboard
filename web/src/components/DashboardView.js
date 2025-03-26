import React, { useState, useEffect } from 'react';
import { Button, Divider, message, Modal, Input, Menu, Dropdown, Layout, Tree, Space, Typography, Select } from 'antd';
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
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [availablePaths, setAvailablePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState('');
  
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
  
  // 添加获取可用目录的函数
  const getAvailablePaths = (folderStructure, currentPath = '') => {
    let paths = [currentPath];
    
    folderStructure.forEach(item => {
      if (item.type === 'directory') {
        const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        paths.push(newPath);
        
        if (item.children && item.children.length > 0) {
          const childPaths = getAvailablePaths(item.children, newPath);
          paths = [...paths, ...childPaths];
        }
      }
    });
    
    return paths;
  };
  
  // 修改刷新文件夹结构函数，添加对可用路径的更新
  const refreshFolderStructure = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/folder_structure');
      if (response.data.status === 'success') {
        setFolderStructure(response.data.data);
        // 更新可用路径列表
        const paths = getAvailablePaths(response.data.data);
        setAvailablePaths(paths);
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
  
  // 修改创建文件夹的函数
  const createFolder = async () => {
    if (!newFolderPath) {
      message.error('请输入文件夹名称');
      return;
    }
    
    let fullPath = newFolderPath;
    if (selectedPath) {
      fullPath = `${selectedPath}/${newFolderPath}`;
    }
    
    // 清理路径，移除开头和结尾的斜杠以及多余的空格
    const cleanPath = fullPath.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      message.error('请输入有效的文件夹名称');
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
        setSelectedPath('');
        
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
  
  // 修改创建仪表盘文件的函数
  const createDashboardFile = async () => {
    if (!newFilePath) {
      message.error('请输入文件名称');
      return;
    }
    
    let fullPath = newFilePath;
    if (selectedPath) {
      fullPath = `${selectedPath}/${newFilePath}`;
    }
    
    // 清理路径，移除开头和结尾的斜杠以及多余的空格
    let cleanPath = fullPath.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      message.error('请输入有效的文件名称');
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
        setSelectedPath('');
        
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
  
  // 添加删除文件夹的函数
  const deleteFolder = async (folderPath) => {
    if (!folderPath) {
      message.error('请先选择文件夹');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确认要删除文件夹 "${folderPath}" 吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.info(folderPath);
          const response = await axios.post('http://localhost:8000/api/delete_folder', {
            folderPath: folderPath  // 确保参数名与后端API匹配
          });
          
          if (response.data.status === 'success') {
            message.success('文件夹删除成功');
            
            // 刷新文件夹结构
            await refreshFolderStructure();
          } else {
            message.error('删除文件夹失败: ' + response.data.message);
          }
        } catch (error) {
          console.error('删除文件夹失败:', error);
          message.error('删除文件夹失败: ' + (error.response?.data?.message || error.message));
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
  
  // 添加重命名文件/文件夹功能
  const showRenameModal = (nodeData) => {
    setFileToRename(nodeData);
    // 对于文件，去掉.json后缀
    let initialName = nodeData.name;
    if (nodeData.type === 'file' && initialName.endsWith('.json')) {
      initialName = initialName.slice(0, -5);
    }
    setNewFileName(initialName);
    setIsRenameModalVisible(true);
  };

  const renameFileOrFolder = async () => {
    if (!fileToRename || !newFileName) {
      message.error('请输入有效的名称');
      return;
    }
    
    // 获取目标路径
    const originalPath = fileToRename.path;
    const originalName = fileToRename.name;
    const parentPath = originalPath.substring(0, originalPath.length - originalName.length - 1);
    
    // 构建新路径
    let newName = newFileName;
    if (fileToRename.type === 'file' && !newName.endsWith('.json')) {
      newName = newName + '.json';
    }
    
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    
    message.info(originalPath);
    message.info(newPath);
    message.info(fileToRename.type);
    try {
      let endpoint = fileToRename.type === 'file' ? 'rename_file' : 'rename_folder';
      const response = await axios.post(`http://localhost:8000/api/${endpoint}`, {
        oldPath: originalPath,
        newPath: newPath
      });
      
      if (response.data.status === 'success') {
        message.success(`${fileToRename.type === 'file' ? '文件' : '文件夹'}重命名成功`);
        setIsRenameModalVisible(false);
        
        // 如果当前正在查看被重命名的文件，更新当前文件路径
        if (currentFilePath === originalPath) {
          setCurrentFilePath(newPath);
        }
        
        // 刷新文件夹结构
        await refreshFolderStructure();
      } else {
        message.error(`重命名失败: ${response.data.message}`);
      }
    } catch (error) {
      console.error('重命名失败:', error);
      message.error(`重命名失败: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // 完全重写convertToTreeData函数
  const convertToTreeData = (data) => {
    return data.map(item => {
      const isEmptyFolder = item.type === 'directory' && (!item.children || item.children.length === 0);
      
      // 对于文件类型，去掉.json后缀显示
      let displayName = item.name;
      if (item.type === 'file' && displayName.endsWith('.json')) {
        displayName = displayName.slice(0, -5); // 去掉.json后缀
      }
      
      // 添加重命名按钮
      const titleNode = (
        <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <span style={{ 
            flex: 1, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {displayName}
          </span>
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: '12px' }} />}
              style={{ padding: 0, height: '16px', lineHeight: '16px' }}
              onClick={(e) => {
                e.stopPropagation();
                showRenameModal(item);
              }}
              title="重命名"
            />
            {isEmptyFolder && (
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ fontSize: '12px', color: '#ff4d4f' }} />}
                style={{ padding: 0, height: '16px', lineHeight: '16px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(item.path);
                }}
                title="删除空文件夹"
              />
            )}
          </Space>
        </span>
      );
      
      const node = {
        title: titleNode,
        key: item.path,
        type: item.type,
        path: item.path,
        name: item.name,
        icon: item.type === 'directory' ? <FolderOutlined /> : <FileOutlined />,
        isLeaf: item.type === 'file'
      };
      
      if (item.type === 'directory') {
        node.children = item.children ? convertToTreeData(item.children) : [];
      }
      
      return node;
    });
  };
  
  // Tree组件所需的数据格式
  const treeData = convertToTreeData(folderStructure);
  
  // 在树节点上添加右键菜单
  const onRightClick = ({ event, node }) => {
    if (node.type === 'directory') {
      // 检查是否为空文件夹
      const isEmptyFolder = !node.children || node.children.length === 0;
      if (isEmptyFolder) {
        // 显示右键菜单
        Menu.open({
          event, 
          items: [
            {
              label: '删除文件夹',
              icon: <DeleteOutlined />,
              onClick: () => deleteFolder(node.path)
            }
          ]
        });
      }
    }
  };
  
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
          style={{ 
            padding: '0 8px', 
            overflowX: 'hidden'
          }}
          showIcon
          blockNode
          selectable
          autoExpandParent
          onRightClick={onRightClick}
          className="custom-directory-tree"
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
      
      {/* 添加重命名模态框 */}
      <Modal
        title={`重命名${fileToRename?.type === 'file' ? '文件' : '文件夹'}`}
        open={isRenameModalVisible}
        onCancel={() => setIsRenameModalVisible(false)}
        onOk={renameFileOrFolder}
      >
        <Input 
          placeholder="请输入新名称" 
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          style={{ marginTop: '16px' }}
        />
      </Modal>
      
      {/* 修改创建文件夹对话框 */}
      <Modal
        title="创建新文件夹"
        open={isCreateFolderModalVisible}
        onCancel={() => {
          setIsCreateFolderModalVisible(false);
          setNewFolderPath('');
          setSelectedPath('');
        }}
        onOk={createFolder}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px' }}>选择目录：</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择目录（默认为根目录）"
            value={selectedPath}
            onChange={setSelectedPath}
            options={availablePaths.map(path => ({ value: path, label: path || '根目录' }))}
          />
        </div>
        <Input 
          placeholder="请输入文件夹名称" 
          value={newFolderPath}
          onChange={(e) => setNewFolderPath(e.target.value)}
        />
      </Modal>
      
      {/* 修改创建仪表盘文件对话框 */}
      <Modal
        title="创建新仪表盘"
        open={isCreateFileModalVisible}
        onCancel={() => {
          setIsCreateFileModalVisible(false);
          setNewFilePath('');
          setSelectedPath('');
        }}
        onOk={createDashboardFile}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px' }}>选择目录：</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择目录（默认为根目录）"
            value={selectedPath}
            onChange={setSelectedPath}
            options={availablePaths.map(path => ({ value: path, label: path || '根目录' }))}
          />
        </div>
        <Input 
          placeholder="请输入文件名称（无需添加.json后缀）" 
          value={newFilePath}
          onChange={(e) => setNewFilePath(e.target.value)}
        />
      </Modal>
    </Layout>
  );
};

export default DashboardView;