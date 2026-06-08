import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("akb_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/auth/profile", profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.put("/auth/password", passwordData);
  return response.data;
};

export const listStaff = async (params = {}) => {
  const response = await api.get("/staff", { params });
  return response.data;
};

export const getStaffMember = async (id) => {
  const response = await api.get(`/staff/${id}`);
  return response.data;
};

export const createStaffMember = async (staffData) => {
  const response = await api.post("/staff", staffData);
  return response.data;
};

export const updateStaffMember = async (id, staffData) => {
  const response = await api.put(`/staff/${id}`, staffData);
  return response.data;
};

export const updateStaffStatus = async (id, isActive) => {
  const response = await api.patch(`/staff/${id}/status`, { isActive });
  return response.data;
};

export const deleteStaffMember = async (id) => {
  const response = await api.delete(`/staff/${id}`);
  return response.data;
};

export const listAssessments = async () => {
  const response = await api.get("/assessments");
  return response.data;
};

export const submitAssessment = async (courseId, answers) => {
  const response = await api.post(`/assessments/${courseId}/submit`, {
    answers,
  });
  return response.data;
};

export const listMyResults = async () => {
  const response = await api.get("/results/me");
  return response.data;
};

export const listAllResults = async () => {
  const response = await api.get("/results");
  return response.data;
};

export const listStaffResults = async (staffId) => {
  const response = await api.get(`/results/staff/${staffId}`);
  return response.data;
};

export const listPublishedMaterials = async () => {
  const response = await api.get("/materials/published");
  return response.data;
};

export const listMaterials = async (params = {}) => {
  const response = await api.get("/materials", { params });
  return response.data;
};

export const createMaterial = async (materialData) => {
  const response = await api.post("/materials", materialData);
  return response.data;
};

export const updateMaterial = async (id, materialData) => {
  const response = await api.put(`/materials/${id}`, materialData);
  return response.data;
};

export const deleteMaterial = async (id) => {
  const response = await api.delete(`/materials/${id}`);
  return response.data;
};

export const getMyProgressSummary = async () => {
  const response = await api.get("/progress/me/summary");
  return response.data;
};

export const getCourseProgress = async (courseId) => {
  const response = await api.get(`/progress/${courseId}`);
  return response.data;
};

export const completeChapter = async (courseId, chapterId) => {
  const response = await api.post(
    `/progress/${courseId}/chapters/${chapterId}/complete`
  );
  return response.data;
};

export const getGemsLeaderboard = async () => {
  const response = await api.get("/progress/leaderboard");
  return response.data;
};

export const getStaffCourseCompletions = async () => {
  const response = await api.get("/progress/staff-completions");
  return response.data;
};

export default api;
