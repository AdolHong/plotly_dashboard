import React, { useState, useEffect } from 'react';
import { Card, Typography, message, Button, Tooltip, Modal } from 'antd';
import axios from 'axios';
import PythonEditor from './PythonEditor';
import VisualizerOptions from './VisualizerOptions';
import VisualizerDisplayView from './VisualizerDisplayView';
import { useOptionValues } from '../hooks/useVisualizerContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Text = Typography;

const Visualizer = ({ index, sessionId, queryHash, configLoaded, initialPythonCode, inferredOptions, config, readOnly, optionValues: initialOptionValues, shareId }) => {
  const [pythonCode, setPythonCode] = useState(config?.code || "");
  const [optionConfig, setOptionConfig] = useState(config?.options || []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  
  // Use the context for optionValues instead of local state
  const { getOptionValues,setOptionValues, handleOptionChange } = useOptionValues();
  
  // 当配置加载完成后，设置初始Python代码和标题、描述
  useEffect(() => {
    if (configLoaded && config) {
      setPythonCode(config.code);
      setTitle(config.title || "");
      setDescription(config.description || "");
      
      // 设置选项
      if (config.options && Array.isArray(config.options)) {
        // 复制选项以避免修改原始对象
        const optionConfigCopy = JSON.parse(JSON.stringify(config.options));
        setOptionConfig(optionConfigCopy);
      }
    }
  }, [configLoaded, config]);
  

  
  const [printOutput, setPrintOutput] = useState('');
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
  }, [queryHash]);

  // 处理选项值变化 - 使用上下文中的handleOptionChange并执行可视化
  const handleOptionChangeAndExecute = (name, value) => {
    const newOptionValues = handleOptionChange(index, name, value);
    handleExecuteVisualization(newOptionValues);
  };


  // 执行Python可视化
  const handleExecuteVisualization = async (overrideOptionValues = null) => {
    if (!sessionId ) {
      message.error('无效的会话ID，请刷新页面');
      return;
    }
    
    // 修改判断条件
    if (!queryHash && !shareId) {
      message.error('请先执行SQL查询');
      return;
    }
    
    // 清除print输出
    setPrintOutput('');
    let printOutput = "";
    
    // 修改 API 调用部分
    try {
      const currentOptionValues = overrideOptionValues || getOptionValues(index);
      let visualizeResponse;
      
      // 使用常规会话的可视化API
      visualizeResponse = await axios.post('http://localhost:8000/api/visualize', {
        session_id: sessionId,
        query_hash: queryHash.split('_')[0], // 移除时间戳部分，只使用原始查询哈希值
        python_code: pythonCode || null,
        option_values: currentOptionValues,
        option_config: optionConfig
      });
    
      
      // 保存print输出（无论成功还是失败）
      if (visualizeResponse.data.printOutput) {
        printOutput = visualizeResponse.data.printOutput;
      }
      
      if (visualizeResponse.data.status === 'success') {
        if (visualizeResponse.data.resultType === 'dataframe') {
          // 如果结果是DataFrame，显示表格
          setTableData(visualizeResponse.data.data);
          setVisualizationData(null);
          setResultType('dataframe');
          message.success('数据处理成功');
        } else if (visualizeResponse.data.resultType === 'figure') {
          // 如果结果是Plotly图表，显示图表
          setTableData([]);
          setVisualizationData(visualizeResponse.data.plotData);
          setResultType('figure');
          message.success('可视化生成成功');
        }
      } else if (visualizeResponse.data.status === 'error') {
        // 抛出错误
        throw new Error(visualizeResponse.data.message);
      }
    } catch (error) {      
      // 如果是网络错误等其他错误
      message.error('执行失败: ' + error.message);
      
      // 清除之前的数据
      setTableData([]);
      setVisualizationData(null);
      setResultType(null);
    } finally {
      // 保存print输出
      setPrintOutput(printOutput);
      setHasPrintOutput(!!printOutput);
    }
  };



  
  return (
    <Card 
      title={
        <div>
          {title ? `${title}` : `可视化区域 ${index}`}
          {description && (
            <Text type="secondary" style={{ fontSize: '13px', color: '#999' }}>
              {description}
            </Text>
          )}
        </div>
      }
      style={{ marginBottom: '20px', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)' }}
      extra={readOnly && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="查看Python代码">
            <Button 
              type="default" 
              onClick={() => {
                Modal.info({
                  title: 'Python 代码',
                  content: (
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                      <SyntaxHighlighter 
                        language="python" 
                        style={tomorrow}
                        customStyle={{ borderRadius: '4px' }}
                      >
                        {pythonCode || '没有代码'}
                      </SyntaxHighlighter>
                    </div>
                  ),
                  width: 600,
                });
              }} 
            >
              查看代码
            </Button>
          </Tooltip>
          <Tooltip title="查看Python代码的print输出">
            <Button 
              type="default" 
              onClick={() => {
                Modal.info({
                  title: 'Python 输出',
                  content: (
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                      <SyntaxHighlighter 
                        language="text" 
                        style={tomorrow}
                        customStyle={{ borderRadius: '4px' }}
                      >
                        {printOutput || '没有输出'}
                      </SyntaxHighlighter>
                    </div>
                  ),
                  width: 600,
                });
              }} 
            >
              查看日志
            </Button>
          </Tooltip>
        </div>
      )}
    >

      
      {/* 选项区域 - 始终显示并保持交互 */}
      <VisualizerOptions 
        optionConfig={optionConfig} 
        optionValues={getOptionValues(index)}
        handleOptionChange={handleOptionChangeAndExecute}
        inferredOptions={inferredOptions}
      />
      
      {/* Python代码编辑器 - 只在非只读模式下显示 */}
      {!readOnly && (
        <PythonEditor 
          pythonCode={pythonCode}
          setPythonCode={setPythonCode}
          onExecute={() => handleExecuteVisualization()}
          printOutput={printOutput}
          hasPrintOutput={hasPrintOutput}
          readOnly={readOnly}
        />
      )}
      
      {/* 可视化结果区域 */}
      <div style={{ marginTop: '16px' }}>
        <VisualizerDisplayView 
          resultType={resultType} 
          visualizationData={visualizationData} 
          tableData={tableData} 
        />
      </div>
    </Card>
  );
};

export default Visualizer;