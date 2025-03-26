import React, { useRef, useEffect } from 'react';
import { Typography, Alert, message } from 'antd';
import Plot from 'react-plotly.js';
import * as echarts from 'echarts';
import 'echarts-gl';

const { Text } = Typography;



const VisualizerDisplayView = ({ resultType, visualizationData, tableData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (resultType !== 'echarts') {
      return;
    };

    // 确保 DOM 元素已经渲染且有数据
    if (chartRef.current && visualizationData) {
      // 如果图表实例不存在，则创建
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
      
      // 使用 requestAnimationFrame 确保在下一帧更新
      requestAnimationFrame(() => {
        chartInstance.current?.setOption(visualizationData);
      });
    }

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [visualizationData]); // 当 visualizationData 变化时重新渲染

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (resultType === 'figure' && visualizationData) {
    // 从plotData中提取数据和布局

    
    const { data, layout, config, frames } = visualizationData;
    
    // console.info(JSON.stringify(config));

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
          font: { family: 'Arial, sans-serif' },
          sliders: layout.sliders  // 确保滑块配置被传递
        }}
        frames={frames}  // 明确传递动画帧
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
  } else if (resultType === 'echarts' && visualizationData) {
    console.info(JSON.stringify(visualizationData));
    return (
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '400px',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
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

export default VisualizerDisplayView;