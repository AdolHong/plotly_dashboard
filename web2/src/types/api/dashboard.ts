export interface DashboardResponse {
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