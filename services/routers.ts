import api from './api';

export interface RouterData {
  id: string;
  name: string;
  ipAddress: string;
  apiPort: number;
  username: string;
  location?: string;
  status: string;
  lastConnected?: string;
}

export const routerService = {
  getRouters: async (): Promise<RouterData[]> => {
    const response = await api.get('/routers/');
    return response.data;
  },
  
  createRouter: async (routerData: any): Promise<RouterData> => {
    const response = await api.post('/routers/', routerData);
    return response.data;
  },
  
  testRouter: async (id: string): Promise<{ status: string; message: string; latencyMs: number }> => {
    const response = await api.post(`/routers/${id}/test`);
    return response.data;
  },
  
  getRouterDashboard: async (id: string): Promise<{
    cpuUsage: number;
    freeMemory: number;
    totalMemory: number;
    uptime: string;
    connectedUsers: number;
    interfaces: any[];
  }> => {
    const response = await api.get(`/routers/${id}/dashboard`);
    return response.data;
  },
};
