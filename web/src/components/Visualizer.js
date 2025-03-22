import React, { useState, useEffect } from 'react';
import { Card, Typography, message } from 'antd';
import axios from 'axios';
import PythonEditor from './PythonEditor';
import VisualizerOptions from './VisualizerOptions';
import VisualizerDisplayView from './VisualizerDisplayView';

const Text = Typography;

const Visualizer = ({ sessionId, queryHash, index, configLoaded, inferredOptions, config, readOnly, optionValues: initialOptionValues, isSharedMode, shareId }) => {
  const [pythonCode, setPythonCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([]);
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
        const optionsCopy = JSON.parse(JSON.stringify(config.options));
        setOptions(optionsCopy);
      }
      
      // 如果提供了初始选项值（用于分享模式），则设置它们
      if (initialOptionValues) {
        setOptionValues(initialOptionValues);
      }
    }
  }, [configLoaded, config, initialOptionValues]);
  

  
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

  // 执行Python可视化
  const handleExecuteVisualization = async (overrideOptionValues = null) => {
    if (!sessionId) {
      message.error('无效的会话ID，请刷新页面');
      return;
    }
    
    if (!queryHash && !isSharedMode) {
      message.error('请先执行SQL查询');
      return;
    }
    
    setPrintOutput('');
    setHasPrintOutput(false);
    
    try {
      // 使用传入的 overrideOptionValues 或当前的 optionValues
      console.log('overrideOptionValues:', {
        value: overrideOptionValues,
        type: typeof overrideOptionValues,
        isNull: overrideOptionValues === null,
        isUndefined: overrideOptionValues === undefined
      });
            
      const currentOptionValues = overrideOptionValues || optionValues;
      
      let visualizeResponse;
      
      // 根据是否是共享模式选择不同的API端点
      if (isSharedMode && shareId) {
        // 使用共享数据的可视化API
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
          visualization_index: index - 1 // 索引从0开始，但前端显示从1开始
        });
      }

      
      // 保存print输出（无论成功还是失败）
      if (visualizeResponse.data.printOutput) {
        const output = visualizeResponse.data.printOutput;
        setPrintOutput(output);
        setHasPrintOutput(true);
        
        // 自动显示print输出对话框
        if (visualizeResponse.data.status === 'error') {
          setIsPrintModalVisible(true);
        }
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


  // 处理选项值变化
  const handleOptionChange = (name, value) => {
    const newOptionValues = {
      ...optionValues,
      [name]: value
    };
    
    setOptionValues(newOptionValues);
    handleExecuteVisualization(newOptionValues);
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
        options={options} 
        optionValues={(() => {
          // message.info("什么奇奇怪怪的")
          // message.info(JSON.stringify(optionValues, null, 2))
          return optionValues;
        })()}
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