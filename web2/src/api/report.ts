import { axiosInstance } from "@/lib/axios";
import type { ReportResponse } from "@/types";

export const reportApi = {
  async getReportConfig(reportId: string): Promise<ReportResponse> {
    return axiosInstance.get(`/report/${reportId}`);
  },

  async updateReportConfig(config: ReportResponse): Promise<ReportResponse> {
    return axiosInstance.post("/update_config", { config });
  },

  // 可以添加更多仪表板相关的 API 方法
  async listReports() {
    return axiosInstance.get("/reports");
  },

  async createReport(reportData: Partial<ReportResponse>) {
    return axiosInstance.post("/report", reportData);
  },
};
