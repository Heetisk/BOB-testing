import apiClient from './apiClient';

export const getCases = async () => {
  const response = await apiClient.get('/cases/');
  return response.data;
};

export const getCase = async (caseId) => {
  const response = await apiClient.get(`/cases/${caseId}`);
  return response.data;
};

export const updateCaseStatus = async (caseId, status, adminNotes) => {
  const response = await apiClient.patch(`/cases/${caseId}`, {
    case_status: status,
    admin_notes: adminNotes,
  });
  return response.data;
};
