import React, { useState, useEffect } from 'react';
import { Layout, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import 'antd/dist/reset.css';
import PlaygroundView from './components/PlaygroundView';
import ShareView from './components/ShareView';
import DashboardView from './components/DashboardView';
import axios from 'axios';
import {decamelizeKeys, camelizeKeys } from 'humps';
import { VisualizerContextProvider } from './hooks/useVisualizerContext';
import 'ace-builds/webpack-resolver'; // 如果使用 webpack

// 请求拦截器
axios.interceptors.request.use(config => {
  if (config.data) {
    // 序列化和反序列化一次； 保证dayjs的序列化正常
    config.data = JSON.parse(JSON.stringify(config.data))
    // 驼峰转为下划线
    config.data = decamelizeKeys(config.data);
  }
  return config;
});


// 响应拦截器：将下划线转为驼峰
axios.interceptors.response.use(response => {
  if (response.data) {
    response.data = camelizeKeys(response.data);
  }
  return response;
});

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Get existing sessionId from localStorage or create new one
    const existingSessionId = sessionStorage.getItem('sessionId');
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      sessionStorage.setItem('sessionId', newSessionId);
    }
  }, []);

  // SharePage component to handle the share URL parameter
  const SharePage = () => {
    const [searchParams] = useSearchParams();
    const shareId = searchParams.get('id');
    
    return <ShareView shareId={shareId} />;
  };
  
  return (
    <VisualizerContextProvider>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
            <Title level={2} style={{ margin: '16px 0', marginRight: '20px' }}>SQL + Plotly</Title>
          </Header>
          <Routes>
            <Route path="/" element={
              <Content style={{ padding: '0 50px', marginTop: '10px' }}>
                <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
                  <DashboardView />

                </div>
              </Content>
            } />
            <Route path="/playground" element={
              <Content style={{ padding: '0 50px', marginTop: '10px' }}>
                <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
                  <PlaygroundView />
                </div>
              </Content>
            } />
            <Route path="/share" element={<SharePage />} />
          </Routes>
          <Footer style={{ textAlign: 'center' }}>
            当前会话 ID: {sessionId}
          </Footer>
        </Layout>
      </Router>
    </VisualizerContextProvider>
  );
}

export default App;