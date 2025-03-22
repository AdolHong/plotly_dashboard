import React, { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Space, Tooltip } from 'antd';
import PrintModal from './PrintModal';


const PythonEditor = ({
  pythonCode,
  setPythonCode,
  onExecute,
  printOutput,
  hasPrintOutput,
  readOnly,
}) => {
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);

  // 显示print输出对话框
  const showPrintModal = () => {
    setIsPrintModalVisible(true);
  };

  // 关闭print输出对话框
  const handlePrintModalClose = () => {
    setIsPrintModalVisible(false);
  };

  return (
    <div>
      {/* Python代码编辑器 - 只在非只读模式下显示 */}
      {!readOnly && (
        <div style={{ marginBottom: '16px' }}>
          <AceEditor
            mode="python"
            theme="github"
            name="python-editor"
            value={pythonCode}
            onChange={setPythonCode}
            fontSize={14}
            width="100%"
            height="150px"
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
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button 
                type="primary" 
                onClick={onExecute}
              >
                执行
              </Button>
              <Tooltip title={hasPrintOutput ? "查看Python代码的print输出" : "没有print输出"}>
                <Button 
                  type="default" 
                  onClick={showPrintModal} 
                  disabled={!hasPrintOutput}
                  icon={<span role="img" aria-label="console">📋</span>}
                >
                  查看输出
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      )}
      
      {/* 在只读模式下显示代码 */}
      {readOnly && pythonCode && (
        <div style={{ marginBottom: '16px' }}>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflow: 'auto' }}>
            {pythonCode}
          </pre>
        </div>
      )}
      
      {/* Print输出对话框 */}
      <PrintModal
        title="Python 输出"
        isVisible={isPrintModalVisible}
        onClose={handlePrintModalClose}
        output={printOutput}
      />
    </div>
  );
};

export default PythonEditor;