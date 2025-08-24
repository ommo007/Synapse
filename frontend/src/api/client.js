import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
console.log('🔗 API URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // IMPORTANT for cookie-based auth across domains
  headers: { 'Content-Type': 'application/json' },
})

export const authAPI = {
  githubLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/github/login`
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
  getGeminiSummary: (sha) => api.get(`/commits/${sha}/gemini-summary`),
}

export const aiAPI = {
  askQuestion: (data) => api.post('/ai/qna', data),
}

export default api