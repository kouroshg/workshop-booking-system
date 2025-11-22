import api from './api'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'student'
  created_at?: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password })
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    return response.data
  },

  async register(email: string, password: string, name: string, role: 'admin' | 'student' = 'student'): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', { email, password, name, role })
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    return response.data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.role === 'admin'
  },
}

