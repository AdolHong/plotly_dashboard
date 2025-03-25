import { axiosInstance } from '@/lib/axios';

export interface DashboardConfig {
  id?: string;
  parameters?: any[];
  visualization?: any[];
  query?: {
    code?: string;
    executorType?: string;
    dataFrameName?: string;
    updateMode?: string;
  };
}

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