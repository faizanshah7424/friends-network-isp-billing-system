import api from './api';
import { Notification } from '@/types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/');
    return response.data;
  },
  
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },
};
