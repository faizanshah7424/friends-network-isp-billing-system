import api from './api';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  subscriptionPlan: string;
  status: string;
  logoUrl?: string;
  createdAt: string;
}

export const saasService = {
  getTenants: async (): Promise<Tenant[]> => {
    const response = await api.get('/../../v2/tenants/');
    return response.data;
  },
  
  createTenant: async (tenantData: any): Promise<Tenant> => {
    const response = await api.post('/../../v2/tenants/', tenantData);
    return response.data;
  },
  
  suspendTenant: async (id: string): Promise<Tenant> => {
    const response = await api.post(`/../../v2/tenants/${id}/suspend`);
    return response.data;
  },
  
  activateTenant: async (id: string): Promise<Tenant> => {
    const response = await api.post(`/../../v2/tenants/${id}/activate`);
    return response.data;
  },
};
