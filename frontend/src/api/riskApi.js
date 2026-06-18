import apiClient from './apiClient';

export const analyzeLoginRisk = async (data) => {
  const response = await apiClient.post('/risk/analyze-login', data);
  return response.data;
};

export const analyzeTransactionRisk = async (data) => {
  const response = await apiClient.post('/risk/analyze-transaction', data);
  return response.data;
};
