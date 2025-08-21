import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  githubLogin: () => {
    window.location.href = `${API_URL}/auth/github/login`
  },
}

export const projectsAPI = {
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}`),
  getCommits: (id, page = 1) => api.get(`/projects/${id}/commits?page=${page}`),
}

export const commitsAPI = {
  get: (sha) => api.get(`/commits/${sha}`),
  summarize: (sha) => api.post(`/commits/${sha}/summarize`),
}

export const aiAPI = {
  ask: (projectId, data) => api.post(`/ai/qna?project_id=${projectId}`, data),
}

export default api
