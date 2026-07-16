import api from './api';

export const reportsService = {
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard-stats');
    return response.data;
  },
  
  getFilteredCustomers: async (filters: {
    area?: string;
    category?: string;
    packageName?: string;
    connectionStatus?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/reports/filter-customers', {
      params: filters,
    });
    return response.data;
  },
};
