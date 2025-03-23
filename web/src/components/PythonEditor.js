import React, { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Space, Tooltip } from 'antd';
import PrintModal from './PrintModal';


const PythonEditor = ({
  pythonCode,
  setPythonCode,
  printOutput,
  hasPrintOutput,
  readOnly = false,
  hideButtons = false
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

  // 修改 onChange 处理函数
  const handleEditorChange = (value) => {
    if (!readOnly) {
      setPythonCode(value);
    }
  };

  const handleExecute = () => {
    // Implementation of handleExecute
  };

  const handleViewOutput = () => {
    // Implementation of handleViewOutput
  };

  return (
    <div>
      {/* Python代码编辑器 - 只在非只读模式下显示 */}
      {!readOnly && (
        <div style={{ marginBottom: '16px' }}>
          <AceEditor
            mode="python"
            theme="github"
            value={pythonCode}
            onChange={handleEditorChange}
            name="python-editor"
            editorProps={{ $blockScrolling: true }}
            width="100%"
            height="200px"
            setOptions={{
              showLineNumbers: true,
              tabSize: 2,
              readOnly: readOnly,
            }}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
            }}
          />
          {!hideButtons && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <Button type="primary" onClick={handleExecute}>
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
            </div>
          )}
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