import apiClient from './apiClient';

export const getKycStatus = async (userId) => {
  const response = await apiClient.get(`/kyc/user/${userId}`);
  return response.data;
};

export const submitKyc = async (data) => {
  const response = await apiClient.post('/kyc/submit', data);
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await apiClient.get('/audit/logs');
  return response.data;
};

export const getVerificationHistory = async () => {
  const response = await apiClient.get('/verification/history');
  return response.data;
};
