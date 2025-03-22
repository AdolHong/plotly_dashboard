import React, { useState, useEffect } from 'react';
import { Card, Typography, message } from 'antd';
import axios from 'axios';
import PythonEditor from './PythonEditor';
import VisualizerOptions from './VisualizerOptions';
import VisualizerDisplayView from './VisualizerDisplayView';

const Text = Typography;

const Visualizer = ({ sessionId, queryHash, index, configLoaded, inferredOptions, config, readOnly, optionValues: initialOptionValues, shareId }) => {
  const [pythonCode, setPythonCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [optionConfig, setOptionConfig] = useState([]);
  const [optionValues, setOptionValues] = useState({});
  
  // 当配置加载完成后，设置初始Python代码和标题、描述
  useEffect(() => {
    if (configLoaded && config && config.code) {
      setPythonCode(config.code);
      setTitle(config.title || "");
      setDescription(config.description || "");
      
      // 设置选项
      if (config.options && Array.isArray(config.options)) {
        // 复制选项以避免修改原始对象
        const optionConfigCopy = JSON.parse(JSON.stringify(config.options));
        setOptionConfig(optionConfigCopy);
      }
      
      // 如果提供了初始选项值（用于分享模式），则设置它们
      if (initialOptionValues) {
        setOptionValues(initialOptionValues);
      }
    }
  }, [configLoaded, config, initialOptionValues]);
  

  
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
      // todo: share部份 没想明白
      // 如果是只读模式且提供了初始选项值，则使用这些值执行可视化
      if (readOnly && initialOptionValues) {
        handleExecuteVisualization(initialOptionValues);
      } else {
        handleExecuteVisualization();
      }
      // 记录已处理的queryHash
      setProcessedQueryHash(queryHash);
    }
  }, [queryHash]);

  // 处理选项值变化
  const handleOptionChange = (name, value) => {
    const newOptionValues = {
      ...optionValues,
      [name]: value
    };
    
    setOptionValues(newOptionValues);
    handleExecuteVisualization(newOptionValues);
  };


  // 执行Python可视化
  const handleExecuteVisualization = async (overrideOptionValues = null) => {
    if (!sessionId) {
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
      const currentOptionValues = overrideOptionValues || optionValues;
      let visualizeResponse;
      
      // 使用 shareId 判断是否为共享模式
      if (shareId) {
        visualizeResponse = await axios.post('http://localhost:8000/api/share/visualize', {
          share_id: shareId,
          python_code: pythonCode || null,
          option_values: currentOptionValues
        });
      } else {
        // 使用常规会话的可视化API
        visualizeResponse = await axios.post('http://localhost:8000/api/visualize', {
          session_id: sessionId,
          query_hash: queryHash.split('_')[0], // 移除时间戳部分，只使用原始查询哈希值
          python_code: pythonCode || null,
          option_values: currentOptionValues,
          option_config: optionConfig
        });
      }
      
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
      title={title ? `${title}` : `可视化区域 ${index}`} 
      style={{ marginBottom: '20px', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)' }}
    >
      {description && (
        <Text type="secondary" style={{ display: 'block', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
          {description}
        </Text>
      )}
      
      {/* 选项区域 */}
      <VisualizerOptions 
        optionConfig={optionConfig} 
        optionValues={optionValues}
        handleOptionChange={handleOptionChange}
        inferredOptions={inferredOptions}
      />
      
      {/* Python代码编辑器 */}
      <PythonEditor 
        pythonCode={pythonCode}
        setPythonCode={setPythonCode}
        onExecute={() => handleExecuteVisualization()}
        printOutput={printOutput}
        hasPrintOutput={hasPrintOutput}
        readOnly={readOnly}
      />
      
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