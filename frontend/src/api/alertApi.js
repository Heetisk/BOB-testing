import apiClient from './apiClient';

export const getAlerts = async () => {
  const response = await apiClient.get('/alerts/');
  return response.data;
};

export const updateAlertStatus = async (alertId, status) => {
  const response = await apiClient.patch(`/alerts/${alertId}`, { status });
  return response.data;
};
