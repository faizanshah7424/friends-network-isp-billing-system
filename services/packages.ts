import api from './api';
import { Package } from '@/types';

export const packageService = {
  getPackages: async (): Promise<Package[]> => {
    const response = await api.get('/packages/');
    return response.data;
  },
  
  createPackage: async (pkgData: Omit<Package, 'id'>): Promise<Package> => {
    const response = await api.post('/packages/', pkgData);
    return response.data;
  },
  
  updatePackage: async (pkgData: Package): Promise<Package> => {
    const { id, ...data } = pkgData;
    const response = await api.put(`/packages/${id}`, data);
    return response.data;
  },
  
  deletePackage: async (id: string): Promise<Package> => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  },
};
