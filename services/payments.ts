import api from './api';
import { Payment } from '@/types';

export const paymentService = {
  getPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/');
    return response.data;
  },
  
  receivePayment: async (
    customerId: string,
    amountReceived: number,
    paymentMethod: string,
    referenceNumber?: string,
    discount?: number,
    remarks?: string
  ): Promise<Payment> => {
    const response = await api.post('/payments/', null, {
      params: {
        customerId,
        amountReceived,
        paymentMethod,
        referenceNumber,
        discount,
        remarks,
      },
    });
    return response.data;
  },
  
  bulkChangePackage: async (customerIds: string[], packageId: string): Promise<any> => {
    const response = await api.post('/payments/bulk-change-package', customerIds, {
      params: { packageId },
    });
    return response.data;
  },
  
  bulkStatusActive: async (customerIds: string[]): Promise<any> => {
    const response = await api.post('/payments/bulk-status-active', customerIds);
    return response.data;
  },
};
