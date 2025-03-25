import { axiosInstance } from '@/lib/axios';
import type { ReportResponse } from '@/types';


export const dashboardApi = {
  async getDashboardConfig(dashboardId: string): Promise<ReportResponse> {
    return axiosInstance.get(`/dashboard/${dashboardId}`);
  },

  async updateDashboardConfig(config: ReportResponse): Promise<ReportResponse> {
    return axiosInstance.post('/update_config', { config });
  },

  // 可以添加更多仪表板相关的 API 方法
  async listDashboards() {
    return axiosInstance.get('/dashboards');
  },

  async createDashboard(dashboardData: Partial<ReportResponse>) {
    return axiosInstance.post('/dashboard', dashboardData);
  },
}; 