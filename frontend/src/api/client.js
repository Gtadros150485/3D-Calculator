import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

export const projectsAPI = {
  list: () => api.get("/projects/"),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects/", data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  calculate: (id) => api.post(`/projects/${id}/calculate`),
  generateAI: (id) => api.post(`/projects/${id}/generate-ai`),
};


export const filesAPI = {
  upload: (projectId, file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/projects/${projectId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  status: (projectId) => api.get(`/projects/${projectId}/model/status`),
};
