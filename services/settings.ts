import api from './api';
import { SystemSettings } from '@/types';

export const settingsService = {
  getSettings: async (): Promise<SystemSettings> => {
    const response = await api.get('/settings/');
    return response.data;
  },
  
  updateSettings: async (settingsData: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await api.put('/settings/', settingsData);
    return response.data;
  },
};
