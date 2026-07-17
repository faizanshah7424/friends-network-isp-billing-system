import api from './api';

export const authService = {
  login: async (username: string, password: string) => {
    console.log('[authService.login] Initiating call for username:', username);
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    console.log('[authService.login] URLSearchParameters created, calling API...');
    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('[authService.login] API response received:', response.data);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  listUsers: async (): Promise<any[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createOperatorUser: async (userData: any): Promise<any> => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  deactivateUser: async (id: string): Promise<any> => {
    const response = await api.post(`/auth/users/${id}/deactivate`);
    return response.data;
  },

  activateUser: async (id: string): Promise<any> => {
    const response = await api.post(`/auth/users/${id}/activate`);
    return response.data;
  },

  resetPassword: async (id: string, password: string): Promise<any> => {
    const response = await api.post(`/auth/users/${id}/reset-password`, { password });
    return response.data;
  },
};
