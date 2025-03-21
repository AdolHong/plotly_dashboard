import React, { useState, useEffect } from 'react';
import { Layout, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import 'antd/dist/reset.css';
import Dashboard from './components/Dashboard';

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <Title level={2} style={{ margin: '16px 0' }}>SQL + Plotly</Title>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: '10px' }}>
        <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
          <Dashboard 
          />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        当前会话 ID: {sessionId}
      </Footer>
    </Layout>
  );
}

export default App;