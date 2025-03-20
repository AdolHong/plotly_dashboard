import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Card, Typography, Tooltip, message, Space } from 'antd';
import PrintModal from './PrintModal';
import Plot from 'react-plotly.js';
import axios from 'axios';

const Text = Typography;

const Visualizer = ({ sessionId, queryHash, index, initialPythonCode, configLoaded }) => {
  const [pythonCode, setPythonCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // 当配置加载完成后，设置初始Python代码和标题、描述
  useEffect(() => {
    if (configLoaded && initialPythonCode) {
      setPythonCode(initialPythonCode);
      
      // 从全局配置中获取标题和描述
      if (window.visualizationConfig && window.visualizationConfig[index - 1]) {
        const config = window.visualizationConfig[index - 1];
        setTitle(config.title || "");
        setDescription(config.description || "");
      }
    }
  }, [configLoaded, initialPythonCode, index]);
  const [printOutput, setPrintOutput] = useState('');
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [hasPrintOutput, setHasPrintOutput] = useState(false);
  const [visualizationData, setVisualizationData] = useState(null);
  const [resultType, setResultType] = useState(null); // 'dataframe' 或 'figure'
  const [tableData, setTableData] = useState([]);
  const [processedQueryHash, setProcessedQueryHash] = useState('');
  
  // 当queryHash变化时自动执行可视化
  useEffect(() => {
    // 只有当queryHash存在且与上次处理的不同时才执行可视化
    // 这样可以避免新增的可视化区域立即执行现有的queryHash
    if (queryHash && queryHash !== processedQueryHash) {
      handleExecuteVisualization();
      // 记录已处理的queryHash
      setProcessedQueryHash(queryHash);
    }
  }, [queryHash, processedQueryHash]);

  // 执行Python可视化
  const handleExecuteVisualization = async () => {
    if (!sessionId) {
      message.error('无效的会话ID，请刷新页面');
      return;
    }
    
    if (!queryHash) {
      message.error('请先执行SQL查询');
      return;
    }

    setPrintOutput('');
    setHasPrintOutput(false);
    
    try {
      // 发送Python代码处理请求
      const visualizeResponse = await axios.post('http://localhost:8000/api/visualize', {
        session_id: sessionId,
        query_hash: queryHash.split('_')[0], // 移除时间戳部分，只使用原始查询哈希值
        python_code: pythonCode || null
      });
      // 保存print输出（无论成功还是失败）
      if (visualizeResponse.data.print_output) {
        const output = visualizeResponse.data.print_output;
        setPrintOutput(output);
        setHasPrintOutput(true);
        
        // 自动显示print输出对话框
        if (visualizeResponse.data.status === 'error') {
          setIsPrintModalVisible(true);
        }
      }
      
      if (visualizeResponse.data.status === 'success') {
        if (visualizeResponse.data.result_type === 'dataframe') {
          // 如果结果是DataFrame，显示表格
          setTableData(visualizeResponse.data.data);
          setVisualizationData(null);
          setResultType('dataframe');
          message.success('数据处理成功');
        } else if (visualizeResponse.data.result_type === 'figure') {
          // 如果结果是Plotly图表，显示图表
          setTableData([]);
          setVisualizationData(visualizeResponse.data.plot_data);
          setResultType('figure');
          message.success('可视化生成成功');
        }
      } else if (visualizeResponse.data.status === 'error') {
        // 处理错误情况，但仍然保留print输出
        message.error('执行失败: ' + visualizeResponse.data.message);
        // 清除之前的数据
        setTableData([]);
        setVisualizationData(null);
        setResultType(null);
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
      setTableData([]);
      setVisualizationData(null);
      setResultType(null);
    } finally {
      
      // 如果有print输出但hasPrintOutput没有设置为true，强制设置为true
      if (printOutput && !hasPrintOutput) {
        setHasPrintOutput(true);
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

  // 渲染可视化结果
  const renderVisualization = () => {
    if (resultType === 'figure' && visualizationData) {
      // 从plotData中提取数据和布局
      const { data, layout, config } = visualizationData;

      return (
        <Plot
          data={data}
          layout={{
            ...layout,
            autosize: true,
            height: 300,
            margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
            font: { family: 'Arial, sans-serif' }
          }}
          config={{
            ...config,
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
          }}
          style={{ width: '100%', height: '100%' }}
        />
      );
    } else if (resultType === 'dataframe' && tableData && tableData.length > 0) {
      // 简单表格显示
      return (
        <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(tableData[0]).map(key => (
                  <th key={key} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {value === null || value === undefined ? '-' : 
                       typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {tableData.length > 10 && (
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <Text type="secondary">显示前10条记录，共 {tableData.length} 条</Text>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text type="secondary">暂无可视化结果，请执行Python代码</Text>
        </div>
      );
    }
  };

  return (
    <Card 
      title={title ? `${title}` : `可视化区域 ${index}`} 
      style={{ marginBottom: '20px' }}
      extra={
        <Space>
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
      }
    >
      {description && (
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">{description}</Text>
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <AceEditor
          mode="python"
          theme="github"
          name={`python-editor-${index}`}
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
      </div>
      
      <div style={{ marginTop: '16px' }}>
        {renderVisualization()}
      </div>
      
      {/* Print输出对话框 */}
      <PrintModal
        title="Python 输出"
        isVisible={isPrintModalVisible}
        onClose={handlePrintModalClose}
        output={printOutput}
      />
    </Card>
  );
};

export default Visualizer;