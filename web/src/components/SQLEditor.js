import React, { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Tabs, Space, Typography, Modal, Tooltip, message } from 'antd';
import axios from 'axios';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const SQLEditor = ({ onDataReceived, onPlotDataReceived, onError, onPrintOutputReceived }) => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM sales LIMIT 10');
  const [pythonCode, setPythonCode] = useState('# 处理数据示例\n# 返回DataFrame显示表格\n# result = df.groupby("category").sum().reset_index()\n\n# 或返回Plotly图表\n# import plotly.express as px\n# result = px.bar(df.groupby("category").sum().reset_index(), x="category", y="price")');
  const [loading, setLoading] = useState(false);
  const [printOutput, setPrintOutput] = useState('');
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [hasPrintOutput, setHasPrintOutput] = useState(false);

  // 执行查询和分析
  const handleExecuteQuery = async () => {
    setLoading(true);
    setPrintOutput('');
    setHasPrintOutput(false);
    
    try {
      const response = await axios.post('http://localhost:8000/api/analyze', {
        sql_query: sqlQuery,
        python_code: pythonCode || null
      });
      
      // 保存print输出（无论成功还是失败）
      if (response.data.print_output) {
        const output = response.data.print_output;
        setPrintOutput(output);
        setHasPrintOutput(true);
        
        // 将print输出传递给父组件
        if (onPrintOutputReceived) {
          onPrintOutputReceived(output);
        }
        
        // 自动显示print输出对话框
        if (response.data.status === 'error') {
          setIsPrintModalVisible(true);
        }
      }
      
      if (response.data.status === 'success') {
        // 清除之前的错误
        if (onError) onError(null);
        
        if (response.data.result_type === 'dataframe') {
          // 如果结果是DataFrame，显示表格
          onDataReceived(response.data.data);
          onPlotDataReceived(null);
          message.success('查询执行成功');
        } else if (response.data.result_type === 'figure') {
          // 如果结果是Plotly图表，显示图表
          onDataReceived([]);
          onPlotDataReceived(response.data.plot_data);
          message.success('可视化生成成功');
        }
      } else if (response.data.status === 'error') {
        // 处理错误情况，但仍然保留print输出
        message.error('执行失败: ' + response.data.message);
        // 清除之前的数据
        onDataReceived([]);
        onPlotDataReceived(null);
      }
    } catch (error) {
      console.error('执行失败:', error);
      
      // 尝试从错误响应中获取print输出
      const errorResponse = error.response?.data;
      
      if (errorResponse) {
        // 如果是API返回的格式化错误
        if (errorResponse.detail) {
          // 检查detail是否为字符串或对象
          if (typeof errorResponse.detail === 'object') {
            // 尝试从detail对象中获取print_output
            if (errorResponse.detail.print_output) {
              const output = errorResponse.detail.print_output;
              setPrintOutput(output);
              setHasPrintOutput(true);
              
              // 将print输出传递给父组件
              if (onPrintOutputReceived) {
                onPrintOutputReceived(output);
              }
              
              // 自动显示print输出对话框
              setIsPrintModalVisible(true);
            }
            message.error('执行失败: ' + (errorResponse.detail.message || '未知错误'));
          } else {
            message.error('执行失败: ' + errorResponse.detail);
          }
        } else {
          // 尝试从其他位置获取print_output
          if (errorResponse.print_output) {
            const output = errorResponse.print_output;
            setPrintOutput(output);
            setHasPrintOutput(true);
            
            // 将print输出传递给父组件
            if (onPrintOutputReceived) {
              onPrintOutputReceived(output);
            }
            
            // 自动显示print输出对话框
            setIsPrintModalVisible(true);
          }
          message.error('执行失败: ' + (errorResponse.message || JSON.stringify(errorResponse)));
        }
      } else {
        // 如果是网络错误等其他错误
        message.error('执行失败: ' + error.message);
      }
      
      // 清除之前的数据
      onDataReceived([]);
      onPlotDataReceived(null);
    } finally {
      setLoading(false);
      
      // 如果有print输出但hasPrintOutput没有设置为true，强制设置为true
      if (printOutput && !hasPrintOutput) {
        setHasPrintOutput(true);
        
        // 将print输出传递给父组件
        if (onPrintOutputReceived && printOutput) {
          onPrintOutputReceived(printOutput);
        }
      }
    }
  };

  // 显示print输出对话框
  const showPrintModal = () => {
    setIsPrintModalVisible(true);
  };

  // 关闭print输出对话框
  const handlePrintModalClose = () => {
    setIsPrintModalVisible(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <Title level={4}>SQL + Python 数据可视化</Title>

      <Tabs defaultActiveKey="sql">
        <TabPane tab="SQL 查询" key="sql">
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
        </TabPane>
        <TabPane tab="Python 处理" key="python">
          <AceEditor
            mode="python"
            theme="github"
            name="python-editor"
            value={pythonCode}
            onChange={setPythonCode}
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
        </TabPane>
      </Tabs>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button 
          type="primary" 
          onClick={handleExecuteQuery} 
          loading={loading}
        >
          执行分析
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
        
        {hasPrintOutput && (
          <Text type="secondary" style={{ marginLeft: '10px' }}>
            有Python输出可查看
          </Text>
        )}
      </div>
      
      {/* Print输出对话框 */}
      <Modal
        title="Python 输出"
        open={isPrintModalVisible}
        onCancel={handlePrintModalClose}
        footer={[
          <Button key="close" onClick={handlePrintModalClose}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <div 
          style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            maxHeight: '400px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}
        >
          {printOutput || '没有输出'}
        </div>
      </Modal>
    </div>
  );
};

export default SQLEditor;