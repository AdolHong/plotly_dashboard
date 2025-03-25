import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import EditModal from '@/components/EditModal';
import { useStore } from '@/lib/store';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardConfig } from '@/api/dashboard';  // Use type-only import
import { toast } from "sonner"

export const Route = createFileRoute('/edit')({
  component: EditPage,
});

function EditPage() {
  const [config, setConfig] = useState<any>(null);
  const { dashboardId } = useStore();
  
  useEffect(() => {
    async function fetchDashboardConfig() {
      toast.success('获取仪表板配置成功1');
      toast.success('获取仪表板配置成功2');
      toast.success('获取仪表板配置成功3');

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

  const handleSave = async (parameters: any[], visualizations: any[], sqlCode: string) => {
    if (!config) return;

    try {
      const updatedConfig: DashboardConfig = { 
        ...config, 
        parameters,
        visualization: visualizations,
        query: {
          ...config.query,
          code: sqlCode,
        }
      };

      await dashboardApi.updateDashboardConfig(updatedConfig);

      // 更新本地状态
      useStore.setState({ 
        dashboardParameters: parameters,
        dashboardVisualizations: visualizations,
        dashboardSqlCode: sqlCode
      });
      
      // 重定向回仪表板页面
      window.history.back();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
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