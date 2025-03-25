import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import EditModal from '@/components/EditModal';
import { useStore } from '@/lib/store';
import { dashboardApi } from '@/api/dashboard';
// import type { DashboardConfig } from '@/api/dashboard';  // Use type-only import


export const Route = createFileRoute('/edit')({
  component: EditPage,
});

function EditPage() {
  const [config, setConfig] = useState<any>(null);
  const { dashboardId } = useStore();
  
  useEffect(() => {
    async function fetchDashboardConfig() {
      if (!dashboardId) return;
      
      try {
        const response = await dashboardApi.getDashboardConfig(dashboardId);
        setConfig(response);
      } catch (error) {
        console.error('获取仪表板配置失败:', error);
      } 
    }
    
    fetchDashboardConfig();
  }, [dashboardId]);

  const handleSave = (parameters: any[], visualizations: any[], sqlCode: string) => {
    // 更新状态并重定向回仪表板页面
    useStore.setState({ 
      dashboardParameters: parameters,
      dashboardVisualizations: visualizations,
      dashboardSqlCode: sqlCode
    });
    
    // 可以添加重定向回仪表板页面
    window.history.back();
  };

  return (
    <div>
        <EditModal
          open={true}
          onClose={() => window.history.back()}
          onSave={handleSave}
          parameters={[]}
          visualizations={[]}
          dashboardConfig={null}
          initialSqlCode={''}
        />
    </div>
  );
} 