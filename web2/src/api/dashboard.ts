import { axiosInstance } from '@/lib/axios';
import type { DashboardResponse as DashboardConfig } from '@/types';


export const dashboardApi = {
  async getDashboardConfig(dashboardId: string): Promise<DashboardConfig> {
    return axiosInstance.get(`/dashboard/${dashboardId}`);
  },

  async updateDashboardConfig(config: DashboardConfig): Promise<DashboardConfig> {
    return axiosInstance.post('/update_config', { config });
  },

  // 可以添加更多仪表板相关的 API 方法
  async listDashboards() {
    return axiosInstance.get('/dashboards');
  },

  async createDashboard(dashboardData: Partial<DashboardConfig>) {
    return axiosInstance.post('/dashboard', dashboardData);
  },
}; 