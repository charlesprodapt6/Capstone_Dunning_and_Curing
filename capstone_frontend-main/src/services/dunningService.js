import api from './api';

export const dunningService = {
  getAllRules: async (params = {}) => {
    const response = await api.get('/dunning/rules', { params });
    return response.data;
  },

  getCuringActions: async () => {
    const response = await api.get('/curing/actions');
    return response.data;
  },

  getRuleById: async (id) => {
    const response = await api.get(`/dunning/rules/${id}`);
    return response.data;
  },

  createRule: async (ruleData) => {
    const response = await api.post('/dunning/rules', ruleData);
    return response.data;
  },

  updateRule: async (id, ruleData) => {
    const response = await api.put(`/dunning/rules/${id}`, ruleData);
    return response.data;
  },

  deleteRule: async (id) => {
    await api.delete(`/dunning/rules/${id}`);
  },

  triggerDunningAll: async (customerIds = null) => {
    const response = await api.post('/dunning/apply', { customer_ids: customerIds });
    return response.data;
  },

  triggerDunningSingle: async (customerId) => {
    const response = await api.post(`/dunning/apply/${customerId}`);
    return response.data;
  },

  getDunningLogs: async (params = {}) => {
    const response = await api.get('/dunning/logs', { params });
    return response.data;
  },

  getOverdueCustomers: async () => {
    const response = await api.get('/dunning/overdue-customers');
    return response.data;
  },
};
