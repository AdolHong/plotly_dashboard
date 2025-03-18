import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Typography, message } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const SQLEditor = ({ sessionId, onQuerySuccess, initialSqlCode, configLoaded }) => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM sales LIMIT 10');
  const [loading, setLoading] = useState(false);
  
  // 当配置加载完成后，设置初始SQL代码
  useEffect(() => {
    if (configLoaded && initialSqlCode) {
      setSqlQuery(initialSqlCode);
    }
  }, [configLoaded, initialSqlCode]);

  // 执行SQL查询
  const handleExecuteQuery = async () => {
    setLoading(true);
    
    try {
      // 检查会话ID是否有效
      if (!sessionId) {
        message.error('无效的会话ID，请刷新页面');
        return;
      }
      
      // 执行SQL查询并缓存结果
      const queryResponse = await axios.post('http://localhost:8000/api/query', {
        sql_query: sqlQuery,
        session_id: sessionId
      });

      if (queryResponse.data.status === 'error') {
        message.error('SQL查询失败: ' + queryResponse.data.message);
        return;
      }
      
      // 保存查询哈希值并通知父组件查询成功
      const queryHash = queryResponse.data.query_hash;
      if (!queryHash) {
        message.error('服务器未返回有效的查询哈希值');
        return;
      }
      
      message.success('SQL查询成功');
      
      // 通知父组件查询成功，传递查询哈希值
      if (onQuerySuccess) {
        onQuerySuccess(queryHash);
      }
    } catch (error) {
      console.error('SQL查询失败:', error);
      message.error('SQL查询失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <Title level={4}>SQL 查询</Title>
      
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
      
      <div style={{ marginTop: '20px' }}>
        <Button 
          type="primary" 
          onClick={handleExecuteQuery} 
          loading={loading}
        >
          执行SQL查询
        </Button>
      </div>
    </div>
  );
};

export default SQLEditor;