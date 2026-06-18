import apiClient from './apiClient';

export const getSimulationStatus = async () => {
  const response = await apiClient.get('/simulation/status');
  return response.data;
};

export const startSimulation = async (speed = 2.0) => {
  const response = await apiClient.post('/simulation/start', { speed });
  return response.data;
};

export const stopSimulation = async () => {
  const response = await apiClient.post('/simulation/stop');
  return response.data;
};

export const subscribeToEvents = (token, onEvent) => {
  const eventSource = new EventSource(
    `${apiClient.defaults.baseURL}/simulation/stream?token=${token}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (e) {
      console.error('Failed to parse SSE event:', e);
    }
  };

  eventSource.onerror = () => {};

  return eventSource;
};
