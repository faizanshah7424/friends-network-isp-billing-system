import api from './api';

export const balanceSheetService = {
  getSummary: async () => {
    const response = await api.get('/balance-sheet/summary');
    return response.data;
  },
  
  getExpenses: async () => {
    const response = await api.get('/balance-sheet/expenses');
    return response.data;
  },
  
  createExpense: async (expenseData: {
    title: string;
    category: string;
    amount: number;
    date: string;
    description?: string;
  }) => {
    const response = await api.post('/balance-sheet/expenses', expenseData);
    return response.data;
  },
  
  deleteExpense: async (id: string) => {
    const response = await api.delete(`/balance-sheet/expenses/${id}`);
    return response.data;
  },
};
