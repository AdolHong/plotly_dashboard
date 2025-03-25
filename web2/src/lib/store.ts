import { create } from 'zustand';

interface DashboardState {
  dashboardId: string | null;
  dashboardParameters: any[];
  dashboardVisualizations: any[];
  dashboardSqlCode: string;
  
  setDashboardId: (id: string) => void;
}

export const useStore = create<DashboardState>((set) => ({
  dashboardId: null,
  dashboardParameters: [],
  dashboardVisualizations: [],
  dashboardSqlCode: '',
  
  setDashboardId: (id) => set({ dashboardId: id }),
})); 