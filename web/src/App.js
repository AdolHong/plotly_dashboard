import React, { useState } from 'react';
import { Layout, Typography, Divider } from 'antd';
import 'antd/dist/reset.css';
import SQLEditor from './components/SQLEditor';
import DataTable from './components/DataTable';
import Visualization from './components/Visualization';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const [data, setData] = useState([]);
  const [plotData, setPlotData] = useState(null);

  // 根据结果类型显示不同的组件
  const renderResult = () => {
    if (plotData) {
      // 如果有图表数据，显示图表
      return <Visualization plotData={plotData} />;
    } else if (data && data.length > 0) {
      // 如果有表格数据，显示表格
      return <DataTable data={data} />;
    } else {
      // 如果没有数据，显示提示信息
      return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', marginTop: '20px' }}>
          <Title level={4}>结果区域</Title>
          <p>请在上方输入SQL查询和Python代码，然后点击"执行分析"按钮</p>
        </div>
      );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px' }}>
        <Title level={2} style={{ margin: '16px 0' }}>SQL + Python 数据可视化平台</Title>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: '20px' }}>
        <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
          <SQLEditor 
            onDataReceived={setData} 
            onPlotDataReceived={setPlotData} 
          />
          
          <Divider />
          
          {renderResult()}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        SQL + Python 数据可视化平台 ©{new Date().getFullYear()} 由 Devbox 提供支持
      </Footer>
    </Layout>
  );
}

export default App; 