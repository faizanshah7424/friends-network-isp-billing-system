import api from './api';
import { Invoice } from '@/types';

export const billingService = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get('/billing/');
    return response.data;
  },

  createInvoice: async (invoiceData: any): Promise<Invoice> => {
    const response = await api.post('/billing/', invoiceData);
    return response.data;
  },
  
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },
  
  generateMonthlyBilling: async (billingMonth: string, dueDate: string): Promise<any> => {
    const response = await api.post('/billing/generate-monthly', null, {
      params: { billingMonth, dueDate },
    });
    return response.data;
  },
};
