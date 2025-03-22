import { useState } from 'react';
import axios from 'axios';
import { message } from 'antd';

export const useSQLQuery = (sessionId, onQuerySuccess) => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [processedSql, setProcessedSql] = useState('');

  // 获取解析后的SQL
  const fetchParsedSQL = async (sql, params) => {
    try {
      const response = await axios.post('http://localhost:8000/api/parse_sql', {
        sql_query: sql,
        param_values: params
      });
      
      if (response.data.status === 'success' && response.data.processedSql) {
        setProcessedSql(response.data.processedSql);
      }
    } catch (error) {
      console.error('获取解析后的SQL失败:', error);
    }
  };

  // 执行SQL查询
  const executeQuery = async (paramValues) => {
    setLoading(true);
    
    try {
      if (!sessionId) {
        message.error('无效的会话ID，请刷新页面');
        return;
      }
      
      const queryResponse = await axios.post('http://localhost:8000/api/query', {
        sqlQuery: sqlQuery,
        sessionId: sessionId,
        paramValues: JSON.parse(JSON.stringify(paramValues))
      });

      if (queryResponse.data.status === 'error') {
        message.error('SQL查询失败: ' + queryResponse.data.message);
        return;
      }
      
      const queryHash = queryResponse.data.queryHash;
      if (!queryHash) {
        message.error('服务器未返回有效的查询哈希值');
        return;
      }
      
      if (queryResponse.data.processedSql) {
        setProcessedSql(queryResponse.data.processedSql);
      }
      
      // todo: 处理inferredOptions, 不应该在这里处理
      const inferredOptions = queryResponse.data.inferredOptions || null;
      
      message.success('SQL查询成功');
      
      if (onQuerySuccess) {
        onQuerySuccess(queryHash, inferredOptions, sqlQuery);
      }
    } catch (error) {
      console.error('SQL查询失败:', error);
      message.error('SQL查询失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return {
    sqlQuery,
    setSqlQuery,
    loading,
    processedSql,
    fetchParsedSQL,
    executeQuery
  };
};