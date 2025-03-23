import React, { useState, useEffect, useRef } from 'react';
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
  const [editorContent, setEditorContent] = useState(pythonCode || '');
  const editorRef = useRef(null);
  const isInitialMount = useRef(true);

  // 监听 pythonCode 属性的变化
  useEffect(() => {
    if (pythonCode !== undefined) {
      console.log('PythonEditor - pythonCode prop更新:', pythonCode);
      setEditorContent(pythonCode);
      
      // 如果编辑器已经初始化，更新内容
      if (editorRef.current) {
        editorRef.current.editor.setValue(pythonCode, 1);
      }
    }
  }, [pythonCode]);

  // 组件挂载完成或更新后进行初始设置
  useEffect(() => {
    // 仅在第一次挂载时执行
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('PythonEditor - 初始化完成，初始内容:', editorContent);
    }
    
    return () => {
      // 组件卸载前保存内容
      if (setPythonCode && !readOnly && editorContent) {
        console.log('PythonEditor - 组件卸载时保存内容');
        setPythonCode(editorContent);
      }
    };
  }, []);

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
    if (!readOnly && setPythonCode) {
      console.log('PythonEditor - 内容变化:', value);
      setEditorContent(value);
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
            ref={editorRef}
            mode="python"
            theme="github"
            value={editorContent}
            onChange={handleEditorChange}
            name="python-editor"
            editorProps={{ $blockScrolling: true }}
            width="100%"
            height="200px"
            setOptions={{
              showLineNumbers: true,
              tabSize: 2,
              readOnly: readOnly,
              useWorker: false,
            }}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
            }}
            onLoad={(editor) => {
              console.log('PythonEditor - 编辑器加载完成');
              editor.resize();
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