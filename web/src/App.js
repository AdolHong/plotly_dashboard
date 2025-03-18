import React, { useState, useEffect } from 'react';
import { Layout, Typography, Divider } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import 'antd/dist/reset.css';
import SQLPythonDashboard from './components/SQLPythonDashboard';
import DataTable from './components/DataTable';
import Visualization from './components/Visualization';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [data, setData] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [error, setError] = useState(null);
  const [printOutput, setPrintOutput] = useState('');
  const [sessionId, setSessionId] = useState('');

  // 处理数据接收
  const handleDataReceived = (newData) => {
    setData(newData);
  };

  // 处理图表数据接收
  const handlePlotDataReceived = (newPlotData) => {
    setPlotData(newPlotData);
  };

  // 处理print输出接收
  const handlePrintOutputReceived = (output) => {
    setPrintOutput(output);
  };

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

  // 处理错误 - 保留此函数但不在UI中显示错误
  const handleError = (errorMessage) => {
    setError(errorMessage);
    // 错误现在通过SQLEditor组件中的message.error显示
  };

  // 根据结果类型显示不同的组件
  const renderResult = () => {
    // 如果有图表数据，显示图表
    if (plotData) {
      return <Visualization plotData={plotData} />;
    } 
    
    // 如果有表格数据，显示表格
    if (data && data.length > 0) {
      return <DataTable data={data} />;
    } 
    
    // 如果没有数据，显示提示信息
    return (
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', marginTop: '20px' }}>
        <Title level={4}>结果区域</Title>
        <p>请在上方输入SQL查询和Python代码，然后点击"执行分析"按钮</p>
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <Title level={2} style={{ margin: '16px 0' }}>SQL + Python 数据可视化平台</Title>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: '20px' }}>
        <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
          <SQLPythonDashboard 
            onDataReceived={handleDataReceived} 
            onPlotDataReceived={handlePlotDataReceived}
            onPrintOutputReceived={handlePrintOutputReceived}
            onError={handleError}
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