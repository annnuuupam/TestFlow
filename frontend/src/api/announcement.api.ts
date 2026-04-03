import api from './axios'
import type { Announcement } from '@/types'

export const announcementApi = {
  getActive: () =>
    api.get<Announcement[]>('/announcements').then(r => r.data),

  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/announcements/all', { params }).then(r => r.data),

  create: (data: { title: string; content: string }) =>
    api.post<Announcement>('/announcements', data).then(r => r.data),

  toggle: (id: number) =>
    api.put(`/announcements/${id}/toggle`),

  delete: (id: number) =>
    api.delete(`/announcements/${id}`),
}
