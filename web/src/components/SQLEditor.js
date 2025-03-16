import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Tabs, Select, message, Space, Typography, Divider } from 'antd';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title } = Typography;

const SQLEditor = ({ onDataReceived, onPlotDataReceived }) => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM sales LIMIT 10');
  const [pythonCode, setPythonCode] = useState('# 处理数据示例\n# 返回DataFrame显示表格\n# result = df.groupby("category").sum().reset_index()\n\n# 或返回Plotly图表\n# import plotly.express as px\n# result = px.bar(df.groupby("category").sum().reset_index(), x="category", y="price")');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取所有表名
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/tables');
        if (response.data.status === 'success') {
          setTables(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedTable(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error('获取表名失败:', error);
        message.error('获取表名失败');
      }
    };

    fetchTables();
  }, []);

  // 执行查询和分析
  const handleExecuteQuery = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/analyze', {
        sql_query: sqlQuery,
        python_code: pythonCode || null
      });
      
      if (response.data.status === 'success') {
        if (response.data.result_type === 'dataframe') {
          // 如果结果是DataFrame，显示表格
          onDataReceived(response.data.data);
          onPlotDataReceived(null);
          message.success('查询执行成功');
        } else if (response.data.result_type === 'figure') {
          // 如果结果是Plotly图表，显示图表
          onDataReceived([]);
          onPlotDataReceived(response.data.plot_data);
          message.success('可视化生成成功');
        }
      }
    } catch (error) {
      console.error('执行失败:', error);
      message.error(`执行失败: ${error.response?.data?.detail?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 表选择变化时更新SQL
  const handleTableChange = (value) => {
    setSelectedTable(value);
    setSqlQuery(`SELECT * FROM ${value} LIMIT 10`);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <Title level={4}>SQL + Python 数据可视化</Title>
      
      <div style={{ marginBottom: '20px' }}>
        <Space>
          <span>选择表:</span>
          <Select 
            value={selectedTable} 
            onChange={handleTableChange}
            style={{ width: 200 }}
          >
            {tables.map(table => (
              <Option key={table} value={table}>{table}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Tabs defaultActiveKey="sql">
        <TabPane tab="SQL 查询" key="sql">
          <AceEditor
            mode="sql"
            theme="github"
            name="sql-editor"
            value={sqlQuery}
            onChange={setSqlQuery}
            fontSize={14}
            width="100%"
            height="200px"
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </TabPane>
        <TabPane tab="Python 处理" key="python">
          <AceEditor
            mode="python"
            theme="github"
            name="python-editor"
            value={pythonCode}
            onChange={setPythonCode}
            fontSize={14}
            width="100%"
            height="200px"
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </TabPane>
      </Tabs>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Button 
          type="primary" 
          onClick={handleExecuteQuery} 
          loading={loading}
        >
          执行分析
        </Button>
      </div>
    </div>
  );
};

export default SQLEditor; 