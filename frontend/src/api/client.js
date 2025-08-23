import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API
export const authAPI = {
  githubLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/github/login`
  },
  
  getCurrentUser: () => api.get('/auth/me'),
  
  // Add this function
  getUserRepositories: () => api.get('/auth/repositories'),
  
  logout: () => api.post('/auth/logout'),
}

// Projects API
export const projectsAPI = {
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}`),
  getCommits: (id, page = 1) => api.get(`/projects/${id}/commits?page=${page}`),
}

// Commits API
export const commitsAPI = {
  get: (sha) => api.get(`/commits/${sha}`),
  summarize: (sha) => api.post(`/commits/${sha}/summarize`),
  getGeminiSummary: (sha) => api.get(`/commits/${sha}/gemini-summary`),
}

// AI API
export const aiAPI = {
  askQuestion: (data) => api.post('/ai/qna', data),
}

export default api