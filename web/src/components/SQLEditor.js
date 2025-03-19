import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Typography, message, Form, Select, Input, DatePicker, Space, Card, Divider, Row, Col } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';


// Important: extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { Option } = Select;

const SQLEditor = ({ sessionId, onQuerySuccess, initialSqlCode, configLoaded }) => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM sales LIMIT 10');
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [paramValues, setParamValues] = useState({});
  const [form] = Form.useForm();
  
  // 当配置加载完成后，设置初始SQL代码并加载参数
  useEffect(() => {
    if (configLoaded && initialSqlCode) {
      setSqlQuery(initialSqlCode);
      fetchParameters();
    }
  }, [configLoaded, initialSqlCode]);
  
  // 获取参数配置
  const fetchParameters = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/config');
      
      if (response.data.status === 'success' && response.data.config.parameters) {
        const params = response.data.config.parameters;
        setParameters(params);
        

        // 设置默认参数值
        const defaultValues = {};
        params.forEach(param => {
          if (param.default !== undefined) {
            if (param.type === 'date_picker' && param.default) {
              defaultValues[param.name] = dayjs(param.default);
            } else {
              defaultValues[param.name] = param.default;
            }
          }
        });
        
        setParamValues(defaultValues);
        form.setFieldsValue(defaultValues);
      }
    } catch (error) {
      console.error('获取参数配置失败:', error);
      message.error('获取参数配置失败');
    }
  };
  
  // 处理参数值变化
  const handleParamChange = (name, value) => {
    message.info(`${name}: ${JSON.stringify(value)}`);
    // 特殊处理日期类型，避免时区问题
    setParamValues(prev => ({
      ...prev,
      [name]: value
    }));
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
      
      message.info(JSON.stringify(paramValues, null, 2));

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

  // 渲染参数控件
  const renderParameterControls = () => {
    if (!parameters || parameters.length === 0) {
      return null;
    }

    return (
      <Card title="查询参数" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="horizontal"
          initialValues={paramValues}
        >
          <Row gutter={16}>
          {parameters.map(param => {
            const { name, type, choices, default: defaultValue } = param;
            
            switch (type) {
              case 'single_select':
                return (
                  <Col span={8} key={name}>
                    <Form.Item label={name} name={name}>
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
                  <Col span={8} key={name}>
                    <Form.Item label={name} name={name}>
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
                  <Col span={8} key={name}>
                    <Form.Item label={name} name={name}>
                    <DatePicker 
                      style={{ width: '100%' }}
                      // 自动转换成北京时区
                      onChange={(date) => handleParamChange(name, dayjs(date).tz('Asia/Shanghai').format())}
                      format="YYYY-MM-DD"
                      showTime={false}
                      showToday                      
                    />
                    </Form.Item>
                  </Col>
                );
                
              case 'single_input':
                return (
                  <Col span={8} key={name}>
                    <Form.Item label={name} name={name}>
                    <Input 
                      placeholder={`请输入${name}`}
                      onChange={(e) => handleParamChange(name, e.target.value)}
                    />
                    </Form.Item>
                  </Col>
                );
                
              case 'multi_input':
                return (
                  <Col span={8} key={name}>
                    <Form.Item label={name} name={name}>
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
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <Title level={4}>SQL 查询</Title>
      
      {/* 参数控件 */}
      {renderParameterControls()}
      
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