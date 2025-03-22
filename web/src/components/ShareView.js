import React, { useState, useEffect } from 'react';
import { Layout, Typography, Divider, Spin, Alert, message } from 'antd';
import axios from 'axios';
import Visualizer from './Visualizer';
import { useParamValues, useOptionValues } from '../hooks/useVisualizerContext';
import SQLEditor from './SQLEditor';

const { Content } = Layout;
const { Title, Text } = Typography;

const ShareView = ({ shareId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { paramValues, setParamValues} = useParamValues();
  const { getOptionValues, setAllOptionValues, allOptionValues} = useOptionValues();
  
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [processedSql, setProcessedSql] = useState(null);
  const [queryHash, setQueryHash] = useState(null);
  const [inferredOptions, setInferredOptions] = useState(null);
  
  // Load shared dashboard state
  useEffect(() => {
    const fetchSharedDashboard = async () => {
      try {
        if (!shareId) {
          setError('Share ID is missing');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`http://localhost:8000/api/share/${shareId}`);
      
        if (response.data.status === 'success') {
          setParamValues(response.data.paramValues);
          setAllOptionValues(response.data.allOptionValues);
          setDashboardConfig(response.data.dashboardConfig);
          setInferredOptions(response.data.inferredOptions);
          setProcessedSql(response.data.processedSql);
          setQueryHash(response.data.queryHash);
        } else {
          setError(response.data.message || 'Failed to load shared dashboard');
        }
      } catch (error) {
        console.error('Error loading shared dashboard:', error);
        setError('Failed to load shared dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedDashboard();
  }, [shareId]);
  
  // loading效果
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>
          <Text>Loading shared dashboard...</Text>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }
  
  if (!dashboardConfig|| !allOptionValues) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Not Found"
          description="The shared dashboard could not be found"
          type="warning"
          showIcon
        />
      </div>
    );
  }
  

  const { visualization: visualizationConfig } = dashboardConfig;
  
  return (
    <Content style={{ padding: '0 50px', marginTop: '10px' }}>
      <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
        <Title level={2}>Shared Dashboard</Title>
        {processedSql && (
          <div>
            <Divider orientation="left">SQL Query</Divider>
            <SQLEditor
              sessionId={shareId}
              initialSqlCode={processedSql}
              configLoaded={true}
              configParameters={dashboardConfig.parameters}
              dashboardConfig={dashboardConfig}
              editable={false}
              parameterReadOnly={true}
              SQLEditorVisible={false}
              queryButonVisible={false}
            />
          </div>
        )}
        
        <Divider orientation="left">Visualizations</Divider>
        
        {visualizationConfig && visualizationConfig.length > 0 ? (
          visualizationConfig.map((visualization, index) => (
            <Visualizer
              index={index}
              sessionId={shareId}
              shareId={shareId}
              queryHash={queryHash}
              config={visualization}
              initialPythonCode={visualization.code}
              configLoaded={true}
              inferredOptions={inferredOptions}
              optionValues={getOptionValues(index)}
              readOnly={true}
            />
          ))
        ) : (
          <Alert
            message="No Visualizations"
            description="This shared dashboard does not contain any visualizations"
            type="info"
            showIcon
          />
        )}
      </div>
    </Content>
  );
};

export default ShareView;