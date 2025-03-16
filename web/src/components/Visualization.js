import React from 'react';
import Plot from 'react-plotly.js';
import { Typography, Card, Empty } from 'antd';

const { Title } = Typography;

const Visualization = ({ plotData }) => {
  if (!plotData) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', marginTop: '20px' }}>
        <Title level={4}>数据可视化</Title>
        <Card>
          <Empty description="暂无可视化数据，请生成可视化" />
        </Card>
      </div>
    );
  }

  // 从plotData中提取数据和布局
  const { data, layout, config } = plotData;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '5px', marginTop: '20px' }}>
      <Title level={4}>数据可视化</Title>
      <Card bodyStyle={{ padding: 0, overflow: 'hidden' }}>
        <Plot
          data={data}
          layout={{
            ...layout,
            autosize: true,
            height: 500,
            margin: { l: 50, r: 50, b: 100, t: 100, pad: 4 },
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
      </Card>
    </div>
  );
};

export default Visualization; 