import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

console.log('🔗 API URL:', API_BASE_URL) // Debug log

const api = axios.create({
  baseURL: API_BASE_URL, // Changed from API_URL to API_BASE_URL
  withCredentials: true, // Added for cookies
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
    window.location.href = `${API_BASE_URL}/auth/github/login` // Changed from API_URL
  },
  
  getCurrentUser: () => api.get('/auth/me'),
  getUserRepositories: () => api.get('/auth/repositories'),
  logout: () => api.post('/auth/logout'),
}

export const projectsAPI = {
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}`),
  getCommits: (id, page = 1) => api.get(`/projects/${id}/commits?page=${page}`),
}

export const commitsAPI = {
  get: (sha) => api.get(`/commits/${sha}`),
  summarize: (sha) => api.post(`/commits/${sha}/summarize`),
  getGeminiSummary: (sha) => api.get(`/commits/${sha}/gemini-summary`), // Added missing endpoint
}

export const aiAPI = {
  ask: (projectId, data) => api.post(`/ai/qna?project_id=${projectId}`, data),
  askQuestion: (data) => api.post('/ai/qna', data), // Added for consistency
}

export default api