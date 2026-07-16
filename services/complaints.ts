import api from './api';
import { Complaint } from '@/types';

export const complaintService = {
  getComplaints: async (): Promise<Complaint[]> => {
    const response = await api.get('/complaints/');
    return response.data;
  },
  
  getComplaintById: async (id: string): Promise<Complaint> => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },
  
  createComplaint: async (complaintData: any): Promise<Complaint> => {
    const response = await api.post('/complaints/', complaintData);
    return response.data;
  },
  
  updateComplaint: async (id: string, complaintData: any): Promise<Complaint> => {
    const response = await api.put(`/complaints/${id}`, complaintData);
    return response.data;
  },
};
