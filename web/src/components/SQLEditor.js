import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-github';
import { Button } from 'antd';
import PrintModal from './PrintModal';
import { useParameters } from '../hooks/useParameters';
import { useSQLQuery } from '../hooks/useSQLQuery';
import ParameterControls from './ParameterControls';
import { useParamValues } from '../hooks/useVisualizerContext';


const SQLEditor = ({ sessionId, onQuerySuccess, initialSqlCode, configLoaded, configParameters, dashboardConfig, readOnly = false }) => {
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

  return (
    <div>
      <ParameterControls 
        parameters={parameters}
        form={form}
        onParamChange={handleParameterChange}
        readOnly={readOnly}
        paramValues={paramValues}
      />

      <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <Button 
          type="primary" 
          onClick={() => executeQuery(paramValues)} 
          loading={loading}
          disabled={false} // 允许在只读模式下执行查询
        >
          执行SQL查询
        </Button>
        <Button 
          onClick={() => setShowSqlModal(true)}
          disabled={!processedSql}
        >
          查看解析后的SQL
        </Button>
        
        <PrintModal
          title="解析后的SQL代码"
          isVisible={showSqlModal}
          onClose={() => setShowSqlModal(false)}
          output={processedSql}
        />
      </div>

      {/* 在只读模式下隐藏SQL编辑器 */}
      {!readOnly && (
        <AceEditor
          mode="sql"
          theme="github"
          name="sql-editor"
          value={sqlQuery}
          onChange={(newSql) => {
            setSqlQuery(newSql);
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
      )}
      

    </div>
  );
};

export default SQLEditor;