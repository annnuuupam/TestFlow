import api from './axios'
import type { Exam, PageResponse } from '@/types'

export const testApi = {
  getActive: () =>
    api.get<Exam[]>('/tests').then(r => r.data),

  getById: (id: number) =>
    api.get<Exam>(`/tests/${id}`).then(r => r.data),

  // Admin
  adminGetAll: (params?: { search?: string; page?: number; size?: number }) =>
    api.get<PageResponse<Exam>>('/admin/tests', { params }).then(r => r.data),

  adminGetById: (id: number) =>
    api.get<Exam>(`/admin/tests/${id}`).then(r => r.data),

  adminCreate: (data: Partial<Exam>) =>
    api.post<Exam>('/admin/tests', data).then(r => r.data),

  adminUpdate: (id: number, data: Partial<Exam>) =>
    api.put<Exam>(`/admin/tests/${id}`, data).then(r => r.data),

  adminToggle: (id: number) =>
    api.put(`/admin/tests/${id}/toggle`),

  adminDelete: (id: number) =>
    api.delete(`/admin/tests/${id}`),

  adminAddSection: (examId: number, data: { title: string; sectionType: string; marksPerQuestion: number }) =>
    api.post(`/admin/tests/${examId}/sections`, data).then(r => r.data),

  adminDeleteSection: (sectionId: number) =>
    api.delete(`/admin/tests/sections/${sectionId}`),
}
