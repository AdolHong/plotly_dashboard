import React from 'react';
import { Typography, Alert } from 'antd';
import Plot from 'react-plotly.js';

const { Text } = Typography;

const VisualizationResult = ({ resultType, visualizationData, tableData }) => {
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

export default VisualizationResult;