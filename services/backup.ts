import api from './api';

export const backupService = {
  createBackup: async (): Promise<{ message: string; downloadUrl: string }> => {
    const response = await api.post('/backup/create');
    return response.data;
  },
  
  restoreBackup: async (): Promise<{ message: string }> => {
    const response = await api.post('/backup/restore');
    return response.data;
  },
};
