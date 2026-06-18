import apiClient from './apiClient';

// Admin dashboard
export const getDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
};

export const getRiskDistribution = async () => {
  const response = await apiClient.get('/dashboard/risk-distribution');
  return response.data;
};

export const getFraudReasons = async () => {
  const response = await apiClient.get('/dashboard/fraud-reasons');
  return response.data;
};

export const getLoginTrends = async () => {
  const response = await apiClient.get('/dashboard/login-trends');
  return response.data;
};

// Customer dashboard
export const getCustomerSummary = async () => {
  const response = await apiClient.get('/dashboard/customer/summary');
  return response.data;
};

export const getCustomerRecentLogins = async () => {
  const response = await apiClient.get('/dashboard/customer/recent-logins');
  return response.data;
};

export const getCustomerRecentTransactions = async () => {
  const response = await apiClient.get('/dashboard/customer/recent-transactions');
  return response.data;
};

export const getCustomerDevices = async () => {
  const response = await apiClient.get('/dashboard/customer/devices');
  return response.data;
};

export const getCustomerAlerts = async () => {
  const response = await apiClient.get('/dashboard/customer/alerts');
  return response.data;
};
