import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Typography, message, Form, Select, Input, DatePicker, Space, Card, Divider } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Title } = Typography;

const { Option } = Select;
const { RangePicker } = DatePicker;

const SQLEditor = ({ sessionId, onQuerySuccess, initialSqlCode, configLoaded, dashboardConfig }) => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM sales LIMIT 10');
  const [loading, setLoading] = useState(false);
  const [paramValues, setParamValues] = useState({});
  const [form] = Form.useForm();
  
  // 当配置加载完成后，设置初始SQL代码和参数默认值
  useEffect(() => {
    if (configLoaded && initialSqlCode) {
      setSqlQuery(initialSqlCode);
      
      // 初始化参数默认值
      if (dashboardConfig && dashboardConfig.parameters) {
        const defaultValues = {};
        
        dashboardConfig.parameters.forEach(param => {
          if (param.default !== undefined) {
            // 处理日期类型的默认值
            if (param.param_type === 'date_picker' && param.default) {
              defaultValues[param.name] = moment(param.default);
            } else if (param.param_type === 'date_range' && Array.isArray(param.default) && param.default.length === 2) {
              defaultValues[param.name] = [moment(param.default[0]), moment(param.default[1])];
            } else {
              defaultValues[param.name] = param.default;
            }
          }
        });
        
        setParamValues(defaultValues);
        form.setFieldsValue(defaultValues);
      }
    }
  }, [configLoaded, initialSqlCode, dashboardConfig, form]);
  
  // 处理参数值变更
  const handleParamChange = (name, value) => {
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
  const renderParamControls = () => {
    if (!dashboardConfig || !dashboardConfig.parameters || dashboardConfig.parameters.length === 0) {
      return null;
    }
    
    return (
      <Card title="查询参数" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={paramValues}
          onValuesChange={(changedValues) => {
            const name = Object.keys(changedValues)[0];
            handleParamChange(name, changedValues[name]);
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {dashboardConfig.parameters.map(param => {
              const { name, param_type, label, choices, placeholder } = param;
              const displayLabel = label || name;
              
              switch (param_type) {
                case 'single_select':
                  return (
                    <Form.Item 
                      key={name} 
                      name={name} 
                      label={displayLabel}
                      style={{ minWidth: '200px' }}
                    >
                      <Select placeholder={placeholder || `请选择${displayLabel}`}>
                        {(choices || []).map(choice => (
                          <Option key={choice} value={choice}>{choice}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                  
                case 'multi_select':
                  return (
                    <Form.Item 
                      key={name} 
                      name={name} 
                      label={displayLabel}
                      style={{ minWidth: '200px' }}
                    >
                      <Select 
                        mode="multiple" 
                        placeholder={placeholder || `请选择${displayLabel}`}
                      >
                        {(choices || []).map(choice => (
                          <Option key={choice} value={choice}>{choice}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                  
                case 'date_picker':
                  return (
                    <Form.Item 
                      key={name} 
                      name={name} 
                      label={displayLabel}
                      style={{ minWidth: '200px' }}
                    >
                      <DatePicker 
                        style={{ width: '100%' }}
                        placeholder={placeholder || `请选择${displayLabel}`}
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  );
                  
                case 'date_range':
                  return (
                    <Form.Item 
                      key={name} 
                      name={name} 
                      label={displayLabel}
                      style={{ minWidth: '300px' }}
                    >
                      <RangePicker 
                        style={{ width: '100%' }}
                        placeholder={[`开始${displayLabel}`, `结束${displayLabel}`]}
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  );
                  
                case 'single_input':
                  return (
                    <Form.Item 
                      key={name} 
                      name={name} 
                      label={displayLabel}
                      style={{ minWidth: '200px' }}
                    >
                      <Input placeholder={placeholder || `请输入${displayLabel}`} />
                    </Form.Item>
                  );
                  
                case 'multi_input':
                  return (
                    <Form.Item 
                      key={name} 
                      name={name} 
                      label={displayLabel}
                      style={{ minWidth: '200px' }}
                    >
                      <Select 
                        mode="tags" 
                        placeholder={placeholder || `请输入${displayLabel}，回车分隔`}
                      />
                    </Form.Item>
                  );
                  
                default:
                  return null;
              }
            })}
          </div>
        </Form>
      </Card>
    );
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <Title level={4}>SQL 查询</Title>
      
      {renderParamControls()}
      
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