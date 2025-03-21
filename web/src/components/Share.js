import React, { useState, useEffect } from 'react';
import { Layout, Typography, Divider, Spin, Alert, message } from 'antd';
import axios from 'axios';
import Visualizer from './Visualizer';

const { Content } = Layout;
const { Title, Text } = Typography;

const Share = ({ shareId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardState, setDashboardState] = useState(null);
  const [sessionId, setSessionId] = useState('');
  
  // Load shared dashboard state
  useEffect(() => {
    const fetchSharedDashboard = async () => {

      // 等待0.5秒
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        if (!shareId) {
          setError('Share ID is missing');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`http://localhost:8000/api/share/${shareId}`);
      

        if (response.data.status === 'success') {
          setDashboardState(response.data.dashboardState);
          // Generate a temporary session ID for this view that includes the share ID
          // This will be used for the visualize endpoint
          setSessionId(`share_${shareId}`);
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
  
  if (!dashboardState) {
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
  
  const { sqlQuery, queryHash, visualizations } = dashboardState;
  
  return (
    <Content style={{ padding: '0 50px', marginTop: '10px' }}>
      <div style={{ background: '#fff', padding: '24px', minHeight: '280px' }}>
        <Title level={2}>Shared Dashboard</Title>
        
        {sqlQuery && (
          <div>
            <Divider orientation="left">SQL Query</Divider>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {sqlQuery}
            </pre>
          </div>
        )}
        
        <Divider orientation="left">Visualizations</Divider>
        
        {visualizations && visualizations.length > 0 ? (
          visualizations.map((visualization, index) => (
            <Visualizer
              key={index}
              index={index + 1}
              sessionId={sessionId}
              queryHash={queryHash}
              initialPythonCode={visualization.pythonCode}
              configLoaded={true}
              inferredOptions={visualization.inferredOptions}
              config={visualization.config}
              readOnly={true}
              optionValues={visualization.optionValues}
              shareId={shareId}
              isSharedMode={true}
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

export default Share;