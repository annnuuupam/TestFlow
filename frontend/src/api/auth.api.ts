import api from './axios'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  register: (data: { username: string; fullName: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/register', data).then(r => r.data),

  login: (data: { username: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then(r => r.data),

  me: () =>
    api.get<User>('/auth/me').then(r => r.data),
}
