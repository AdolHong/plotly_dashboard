import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import { Button, message, Form, Select, Input, DatePicker, Card, Row, Col } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import PrintModal from './PrintModal';


// Important: extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;

const SQLEditor = ({ sessionId, onQuerySuccess, initialSqlCode, configLoaded }) => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [paramValues, setParamValues] = useState({});
  const [form] = Form.useForm();
  const [processedSql, setProcessedSql] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);
  
  // 当配置加载完成后，设置初始SQL代码并加载参数
  useEffect(() => {
    if (configLoaded && initialSqlCode) {
      setSqlQuery(initialSqlCode);
      fetchParameters(initialSqlCode);
    }
  }, [configLoaded, initialSqlCode]);
  
  // 获取参数配置
  const fetchParameters = async (sql) => {
    try {
      const response = await axios.get('http://localhost:8000/api/config');
      
      if (response.data.status === 'success' && response.data.config.parameters) {
        const params = response.data.config.parameters;
        setParameters(params);
        
        // 设置默认参数值
        const defaultValues = {};
        params.forEach(param => {
          // 为所有参数设置默认值，确保即使前端未填写也有值
          if (param.type === 'single_select' || param.type === 'single_input') {
            // 单选类型默认为空字符串
            defaultValues[param.name] = param.default !== undefined ? param.default : '';
          } else if (param.type === 'multi_select' || param.type === 'multi_input') {
            // 多选类型默认为空数组
            defaultValues[param.name] = param.default !== undefined ? param.default : [];
          } else if (param.type === 'date_picker') {
            // 日期类型特殊处理
            defaultValues[param.name] = param.default ? dayjs(param.default) : null;
          }
        });
        
        setParamValues(defaultValues);
        form.setFieldsValue(defaultValues);
        
        // 自动获取解析后的SQL          
        fetchParsedSQL(sql, defaultValues);
        
      }
    } catch (error) {
      console.error('获取参数配置失败:', error);
      message.error('获取参数配置失败');
    }
  };
  
  // 处理参数值变化
  const handleParamChange = (name, value) => {
    // message.info(`${name}: ${JSON.stringify(value)}`);
    const newParamValues = {
      ...paramValues,
      [name]: value
    };
    setParamValues(newParamValues);
    
    // 参数变更时自动获取解析后的SQL
    if (sqlQuery) {
      fetchParsedSQL(sqlQuery, newParamValues);
    }
  };
  
  // 获取解析后的SQL
  const fetchParsedSQL = async (sql, params) => {
    try {
      const response = await axios.post('http://localhost:8000/api/parse_sql', {
        sql_query: sql,
        param_values: params
      });
      
      if (response.data.status === 'success' && response.data.processed_sql) {
        setProcessedSql(response.data.processed_sql);
      } else if (response.data.status === 'error') {
        console.error('SQL解析失败:', response.data.message);
      }
    } catch (error) {
      console.error('获取解析后的SQL失败:', error);
    }
  };

  // 执行SQL查询
  const handleExecuteQuery = async () => {
    setLoading(true);
    
    try {
      // 检查会话ID是否有效
      if (!sessionId) {
        message.error('无效的会话ID，请刷新页面');
        return;
      }
      
      // message.info(JSON.stringify(paramValues, null, 2));

      // 执行SQL查询并缓存结果
      const queryResponse = await axios.post('http://localhost:8000/api/query', {
        sql_query: sqlQuery,
        session_id: sessionId,
        param_values: paramValues
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
      
      // 保存解析后的SQL代码
      if (queryResponse.data.processed_sql) {
        setProcessedSql(queryResponse.data.processed_sql);
      }
      
      // 处理从DataFrame中推断的选项
      const inferredOptions = queryResponse.data.inferred_options || null;
      
      message.success('SQL查询成功');
      
      // 通知父组件查询成功，传递查询哈希值、推断的选项和SQL查询
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

  // 渲染参数控件
  const renderParameterControls = () => {
    if (!parameters || parameters.length === 0) {
      return null;
    }

    return (
      <Card title="查询参数" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={paramValues}
        >
          <Row gutter={12}>
          {parameters.map(param => {
            const { name, type, choices, default: defaultValue } = param;
            
            switch (type) {
              case 'single_select':
                return (
                  <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                    <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                    <Select 
                      placeholder={`请选择${name}`}
                      style={{ width: '100%' }}
                      onChange={(value) => handleParamChange(name, value)}
                    >
                      {choices && choices.map(choice => (
                        <Option key={choice} value={choice}>{choice}</Option>
                      ))}
                    </Select>
                    </Form.Item>
                  </Col>
                );
                
              case 'multi_select':
                return (
                  <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                    <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                    <Select 
                      mode="multiple"
                      placeholder={`请选择${name}`}
                      style={{ width: '100%' }}
                      onChange={(value) => handleParamChange(name, value)}
                    >
                      {choices && choices.map(choice => (
                        <Option key={choice} value={choice}>{choice}</Option>
                      ))}
                    </Select>
                    </Form.Item>
                  </Col>
                );
                
              case 'date_picker':
                return (
                  <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                    <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                    <DatePicker 
                      style={{ width: '100%' }}
                      onChange={(value) => handleParamChange(name, value)}
                    />
                    </Form.Item>
                  </Col>
                );
                
              case 'single_input':
                return (
                  <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                    <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                    <Input 
                      placeholder={`请输入${name}`}
                      onChange={(e) => handleParamChange(name, e.target.value)}
                    />
                    </Form.Item>
                  </Col>
                );
                
              case 'multi_input':
                return (
                  <Col span={4} key={name} style={{ marginBottom: '8px' }}>
                    <Form.Item label={name} name={name} style={{ marginBottom: '8px' }}>
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder={`请输入${name}，回车分隔多个值`}
                      onChange={(values) => handleParamChange(name, values)}
                    />
                    </Form.Item>
                  </Col>
                );
                
              default:
                return null;
            }
          })}
          </Row>
        </Form>
      </Card>
    );
  };

  return (
    <div>
      
      {/* 参数控件 */}
      {renderParameterControls()}

      <div style={{ marginTop: '20px',marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Button 
          type="primary" 
          onClick={handleExecuteQuery} 
          loading={loading}
        >
          执行SQL查询
        </Button>
        <Button 
          onClick={() => setShowSqlModal(true)}
          disabled={!processedSql}
        >
          查看解析后的SQL
        </Button>
        
        {/* 显示解析后的SQL的模态框 */}
        <PrintModal
          title="解析后的SQL代码"
          isVisible={showSqlModal}
          onClose={() => setShowSqlModal(false)}
          output={processedSql}
        />
      </div>

      
      <AceEditor
        mode="sql"
        theme="github"
        name="sql-editor"
        value={sqlQuery}
        onChange={(newSql) => {
          setSqlQuery(newSql);
          // 当SQL变更且有参数值时，自动获取解析后的SQL
          if (Object.keys(paramValues).length > 0) {
            fetchParsedSQL(newSql, paramValues);
          }
        }}
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
      

    </div>
  );
};

export default SQLEditor;