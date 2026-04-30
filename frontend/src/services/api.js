import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cpv_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cpv_token')
      localStorage.removeItem('cpv_user')
      
    }
    return Promise.reject(err)
  }
)

// AUTH
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
}

// CENTRALES
export const centralsAPI = {
  getAll:  ()       => api.get('/centrals'),
  getOne:  (id)     => api.get(`/centrals/${id}`),
  getStats:()       => api.get('/centrals/stats'),
  create:  (data)   => api.post('/centrals', data),
  update:  (id, data) => api.put(`/centrals/${id}`, data),
  delete:  (id)     => api.delete(`/centrals/${id}`),
}

export default api
