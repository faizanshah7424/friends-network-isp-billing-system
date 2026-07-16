import api from './api';
import { Customer } from '@/types';

export const customerService = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/customers/');
    return response.data;
  },
  
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  
  createCustomer: async (customerData: any): Promise<Customer> => {
    const response = await api.post('/customers/', customerData);
    return response.data;
  },

  updateCustomer: async (id: string, customerData: any): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },
  
  deleteCustomer: async (id: string): Promise<Customer> => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
  
  suspendCustomer: async (id: string): Promise<Customer> => {
    const response = await api.post(`/customers/${id}/suspend`);
    return response.data;
  },
  
  activateCustomer: async (id: string): Promise<Customer> => {
    const response = await api.post(`/customers/${id}/activate`);
    return response.data;
  },
  
  addCustomerNote: async (id: string, content: string): Promise<Customer> => {
    const response = await api.post(`/customers/${id}/notes`, null, {
      params: { content },
    });
    return response.data;
  },

  importPreview: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/customers/import-preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  importCommit: async (customers: any[], updateExisting: boolean): Promise<any> => {
    const response = await api.post('/customers/import-commit', {
      customers,
      updateExisting,
    });
    return response.data;
  },
};
