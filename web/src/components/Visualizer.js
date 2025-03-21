import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Card, Typography, Tooltip, message, Space, Select, Checkbox, InputNumber, Input, Form, Row, Col, Divider, Alert } from 'antd';
import PrintModal from './PrintModal';
import Plot from 'react-plotly.js';
import axios from 'axios';

const Text = Typography;

const Visualizer = ({ sessionId, queryHash, index, initialPythonCode, configLoaded, inferredOptions, config, readOnly, optionValues: initialOptionValues, isSharedMode, shareId }) => {
  const [pythonCode, setPythonCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([]);
  const [optionValues, setOptionValues] = useState({});
  
  // 当配置加载完成后，设置初始Python代码和标题、描述
  useEffect(() => {
    if (configLoaded && initialPythonCode) {
      setPythonCode(initialPythonCode);
      
      // 从props中获取标题、描述和选项
      if (config) {
        setTitle(config.title || "");
        setDescription(config.description || "");
        
        // 设置选项
        if (config.options && Array.isArray(config.options)) {
          // 复制选项以避免修改原始对象
          const optionsCopy = JSON.parse(JSON.stringify(config.options));
          setOptions(optionsCopy);
        }
      }
      
      // 如果提供了初始选项值（用于分享模式），则设置它们
      if (initialOptionValues) {
        setOptionValues(initialOptionValues);
      }
    }
  }, [configLoaded, initialPythonCode, config, initialOptionValues]);
  
  // 当推断的选项变化时更新选项配置
  useEffect(() => {
    if (inferredOptions && options.length > 0) {
      // 复制选项以避免修改原始对象
      const optionsCopy = JSON.parse(JSON.stringify(options));
      
      // 使用从DataFrame中推断的选项更新选项配置
      // 遍历选项，查找需要从DataFrame中推断的选项
      optionsCopy.forEach(option => {
        // 检查选项是否需要从DataFrame中推断
        if (option.name && option.infer === "column" && option.infer_column) {
          // 检查inferredOptions中是否有对应的选项
          if (inferredOptions[option.name]) {
            const inferredOption = inferredOptions[option.name];
            
            // 更新选项的choices
            option.choices = inferredOption.choices || [];
            
            // 如果是单选且没有默认值，设置第一个值为默认值
            if (!option.multiple && !option.default && option.choices.length > 0) {
              option.default = option.choices[0];
            }
            // 如果是多选且没有默认值，设置为空列表
            else if (option.multiple && !option.default) {
              option.default = [];
            }
          }
        }
      })
      
      setOptions(optionsCopy);
    }
  }, [inferredOptions]);
  
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
      // 如果是只读模式且提供了初始选项值，则使用这些值执行可视化
      if (readOnly && initialOptionValues) {
        handleExecuteVisualization(initialOptionValues);
      } else {
        handleExecuteVisualization();
      }
      // 记录已处理的queryHash
      setProcessedQueryHash(queryHash);
    }
  }, [queryHash, processedQueryHash, readOnly, initialOptionValues]);

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
    message.info("什么情况:",resultType)

    if (resultType === 'figure' && visualizationData) {
      // 从plotData中提取数据和布局
      const { data, layout, config } = visualizationData;
      
      // 检查数据结构是否完整
      if (!data) {
        console.error('Visualization data is missing the data property:', visualizationData);
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Alert
              message="可视化数据错误"
              description="无法渲染图表，数据结构不完整"
              type="error"
              showIcon
            />
          </div>
        );
      }

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
            ...(config || {}),
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
          <Text type="secondary">暂无可视化结果，result为None</Text>
        </div>
      );
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
  
  // 渲染选项区域
  const renderOptions = () => {
    if (!options || options.length === 0) {
      return null;
    }
    
    // 在只读模式下显示选项值
    if (readOnly) {
      return (
        <div style={{ marginBottom: '16px' }}>
          <Divider orientation="left">选项设置</Divider>
          <Row gutter={12}>
            {options.map((option, optionIndex) => {
              const { name } = option;
              if (!name) return null;
              
              const value = optionValues[name];
              return (
                <Col span={4} key={`${name}-${optionIndex}`} style={{ marginBottom: '8px' }}>
                  <div>
                    <strong>{name}:</strong>{' '}
                    {Array.isArray(value) ? value.join(', ') : String(value !== undefined ? value : '')}
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      );
    }
    
    // 非只读模式下显示可编辑控件
    return (
      <div style={{ marginBottom: '16px' }}>
        <Divider orientation="left">选项设置</Divider>
        <Form layout="vertical">
          <Row gutter={12}>
            {options.map((option, optionIndex) => {
              const { name, type, choices, multiple } = option;
              
              if (!name) return null;
              
              return (
                <Col span={4} key={`${name}-${optionIndex}`} style={{ marginBottom: '8px' }}>
                  <Form.Item label={name}>
                    {type === 'bool' && (
                      <Checkbox
                        checked={!!optionValues[name]}
                        onChange={e => handleOptionChange(name, e.target.checked)}
                      >
                        {name}
                      </Checkbox>
                    )}
                    
                    {(type === 'str' || !type) && choices && !multiple && (
                      <Select
                        style={{ width: '100%' }}
                        value={optionValues[name]}
                        onChange={value => handleOptionChange(name, value)}
                      >
                        {choices.map((choice, i) => (
                          <Select.Option key={`${choice}-${i}`} value={choice}>
                            {choice}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                    
                    {(type === 'str' || !type) && choices && multiple && (
                      <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        value={optionValues[name] || []}
                        onChange={value => handleOptionChange(name, value)}
                      >
                        {choices.map((choice, i) => (
                          <Select.Option key={`${choice}-${i}`} value={choice}>
                            {choice}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                    
                    {type === 'int' && !choices && (
                      <InputNumber
                        style={{ width: '100%' }}
                        value={optionValues[name]}
                        onChange={value => handleOptionChange(name, value)}
                      />
                    )}
                    
                    {type === 'double' && !choices && (
                      <InputNumber
                        style={{ width: '100%' }}
                        value={optionValues[name]}
                        step={0.1}
                        onChange={value => handleOptionChange(name, value)}
                      />
                    )}
                    
                    {(type === 'int' || type === 'double') && choices && !multiple && (
                      <Select
                        style={{ width: '100%' }}
                        value={optionValues[name]}
                        onChange={value => handleOptionChange(name, value)}
                      >
                        {choices.map((choice, i) => (
                          <Select.Option key={`${choice}-${i}`} value={choice}>
                            {choice}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                    
                    {(type === 'int' || type === 'double') && choices && multiple && (
                      <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        value={optionValues[name] || []}
                        onChange={value => handleOptionChange(name, value)}
                      >
                        {choices.map((choice, i) => (
                          <Select.Option key={`${choice}-${i}`} value={choice}>
                            {choice}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                </Col>
              );
            })}
          </Row>
        </Form>
      </div>
    );
  };
  
  return (
    <Card 
      title={title ? `${title}` : `可视化区域 ${index}`} 
      style={{ marginBottom: '20px', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)' }}
      extra={
        !readOnly && (
          <Space>
            <Button 
              type="primary" 
              onClick={() => handleExecuteVisualization()}  // 使用箭头函数包装
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
        )
      }
    >
      {description && (
        <Text type="secondary" style={{ display: 'block', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
          {description}
        </Text>
      )}
      
      {/* 选项区域 */}
      {renderOptions()}
      
      {/* Python代码编辑器 - 只在非只读模式下显示 */}
      {!readOnly && (
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
      )}
      
      {/* 在只读模式下显示代码 */}
      {readOnly && pythonCode && (
        <div style={{ marginBottom: '16px' }}>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflow: 'auto' }}>
            {pythonCode}
          </pre>
        </div>
      )}
      
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