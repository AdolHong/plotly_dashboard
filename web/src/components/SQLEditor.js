import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Card, message } from 'antd';
import PrintModal from './PrintModal';
import { useParameters } from '../hooks/useParameters';
import { useSQLQuery } from '../hooks/useSQLQuery';
import { useParamValues } from '../hooks/useVisualizerContext';
import ParameterControls from './ParameterControls';

const SQLEditor = forwardRef(({ sessionId, onQuerySuccess, initialSqlCode, configLoaded, configParameters, dashboardConfig, 
                     parameterReadOnly = false,
                     SQLEditorReadOnly= false, SQLEditorVisible = true,
                     queryButtonVisible = true
                    }, ref) => {
  // Get form and parameters from useParameters, but use context for paramValues
  const { parameters, form } = useParameters(configLoaded, configParameters);
  // Use context for paramValues
  const { paramValues, handleParamChange } = useParamValues();
  // sql editor controls
  const { 
    sqlQuery, 
    setSqlQuery, 
    loading, 
    processedSql, 
    fetchParsedSQL, 
    executeQuery 
  } = useSQLQuery(sessionId, onQuerySuccess, dashboardConfig);
  
  const [showSqlModal, setShowSqlModal] = useState(false);
  
  // 当配置加载完成后，设置初始SQL代码
  useEffect(() => {
    if (configLoaded && initialSqlCode) {
      setSqlQuery(initialSqlCode);
    }
  }, [configLoaded, initialSqlCode]);

  // 当参数变化时更新SQL
  const handleParameterChange = (name, value) => {
    const newValues = handleParamChange(name, value);
    if (sqlQuery) {
      fetchParsedSQL(sqlQuery, newValues);
    }
  };

  // 通过ref暴露内部方法和状态
  useImperativeHandle(ref, () => ({
    // 获取当前SQL查询内容的方法
    getSqlQuery: () => sqlQuery,
    
    // 设置SQL查询内容的方法
    setSqlQuery: (newQuery) => {
      setSqlQuery(newQuery);
    },
    
    // 如果需要，可以暴露更多内部方法...
  }));
  
  // 处理SQL编辑器内容变化
  const handleSqlChange = (newValue) => {
    setSqlQuery(newValue);
  };

  return (
    <Card 
      title="查询参数" 
      style={{ marginBottom: '20px' }}
      extra={
        queryButtonVisible && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              type="primary" 
              onClick={() => executeQuery(paramValues)} 
              loading={loading}
              disabled={false}
            >
              Query
            </Button>
            <Button 
              type="default" 
              onClick={() => setShowSqlModal(true)}
              disabled={false}
            >
              查看代码
            </Button>
            <PrintModal
              title="解析后的SQL代码"
              isVisible={showSqlModal}
              onClose={() => setShowSqlModal(false)}
              output={processedSql}
            />
          </div>
        )
      }
    >
      <ParameterControls 
        parameters={parameters}
        form={form}
        onParamChange={handleParameterChange}
        readOnly={parameterReadOnly}
        paramValues={paramValues}
      />

      {SQLEditorVisible && (
        <AceEditor
          mode="sql"
          theme="github"
          value={sqlQuery}
          onChange={handleSqlChange}
          name="sql-editor"
          editorProps={{ $blockScrolling: true }}
          width="100%"
          height="200px"
          readOnly={SQLEditorReadOnly}
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
      )}
      

    </Card>
  );
});

export default SQLEditor;