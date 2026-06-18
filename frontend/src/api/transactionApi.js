import apiClient from './apiClient';

export const getTransactions = async () => {
  const response = await apiClient.get('/transactions/');
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await apiClient.post('/transactions/', data);
  return response.data;
};

export const getTransaction = async (id) => {
  const response = await apiClient.get(`/transactions/${id}`);
  return response.data;
};
