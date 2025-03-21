import React, { useState, useEffect } from 'react';
import { Layout, message, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import 'antd/dist/reset.css';
import Dashboard from './components/Dashboard';
import Share from './components/Share';
import axios from 'axios';
import {decamelizeKeys, camelizeKeys } from 'humps';
import dayjs from 'dayjs';

// 自定义 dayjs 的序列化行为
dayjs.prototype.toJSON = function() {
  return this.format('YYYY-MM-DD');
};

// 请求拦截器：将驼峰转为下划线
axios.interceptors.request.use(config => {
  if (config.data) {
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
    
    return <Share shareId={shareId} />;
  };
  
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 20px' }}>
          <Title level={2} style={{ margin: '16px 0' }}>SQL + Plotly</Title>
        </Header>
        <Routes>
          <Route path="/" element={
            <Content style={{ padding: '0 50px', marginTop: '10px' }}>
              <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
                <Dashboard />
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
  );
}

export default App;