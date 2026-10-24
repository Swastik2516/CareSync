
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://care-sync-backend-hazel.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

export default apiClient
