import api from './api';

export interface Branch {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  branchId?: string;
  name: string;
  category: string;
  serialNumber?: string;
  status: string;
  purchasePrice: number;
  sellingPrice: number;
  purchaseDate?: string;
  supplier?: string;
  warrantyMonths: number;
  quantity: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface Technician {
  id: string;
  branchId?: string;
  fullName: string;
  phone: string;
  cnic?: string;
  assignedArea?: string;
  vehicle?: string;
  availability: string;
  completedJobs: number;
  avgResolutionTimeMins: number;
  createdAt: string;
}

export const erpService = {
  // Branches
  getBranches: async (): Promise<Branch[]> => {
    const response = await api.get('/../../v2/erp/branches');
    return response.data;
  },
  
  createBranch: async (branchData: any): Promise<Branch> => {
    const response = await api.post('/../../v2/erp/branches', branchData);
    return response.data;
  },

  // Inventory
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/../../v2/erp/inventory');
    return response.data;
  },
  
  createInventoryItem: async (itemData: any): Promise<InventoryItem> => {
    const response = await api.post('/../../v2/erp/inventory', itemData);
    return response.data;
  },
  
  updateInventoryItem: async (id: string, itemData: any): Promise<InventoryItem> => {
    const response = await api.put(`/../../v2/erp/inventory/${id}`, itemData);
    return response.data;
  },
  
  deleteInventoryItem: async (id: string): Promise<InventoryItem> => {
    const response = await api.delete(`/../../v2/erp/inventory/${id}`);
    return response.data;
  },

  // Technicians
  getTechnicians: async (): Promise<Technician[]> => {
    const response = await api.get('/../../v2/erp/technicians');
    return response.data;
  },
  
  createTechnician: async (techData: any): Promise<Technician> => {
    const response = await api.post('/../../v2/erp/technicians', techData);
    return response.data;
  },
  
  updateTechnician: async (id: string, techData: any): Promise<Technician> => {
    const response = await api.put(`/../../v2/erp/technicians/${id}`, techData);
    return response.data;
  },
};
