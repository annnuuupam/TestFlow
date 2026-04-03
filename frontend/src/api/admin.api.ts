import api from './axios'
import type { Analytics, PageResponse, User } from '@/types'

export const adminApi = {
  getAnalytics: () =>
    api.get<Analytics>('/admin/analytics/overview').then(r => r.data),

  getUsers: (params?: { search?: string; page?: number; size?: number }) =>
    api.get<PageResponse<User>>('/admin/users', { params }).then(r => r.data),

  toggleUserStatus: (id: number) =>
    api.put<User>(`/admin/users/${id}/toggle-status`).then(r => r.data),

  updateUserRole: (id: number, role: string) =>
    api.put<User>(`/admin/users/${id}/role`, null, { params: { role } }).then(r => r.data),

  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`),

  createQuestion: (data: object) =>
    api.post('/admin/questions', data).then(r => r.data),

  updateQuestion: (id: number, data: object) =>
    api.put(`/admin/questions/${id}`, data).then(r => r.data),

  deleteQuestion: (id: number) =>
    api.delete(`/admin/questions/${id}`),

  bulkImportQuestions: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ message: string; count: number }>('/admin/questions/bulk', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
