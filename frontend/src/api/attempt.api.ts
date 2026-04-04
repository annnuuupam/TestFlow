import api from './axios'
import type { TestAttempt } from '@/types'

export const attemptApi = {
  start: (examId: number) =>
    api.post<TestAttempt>(`/tests/${examId}/attempt`).then(r => r.data),

  saveAnswer: (attemptId: number, data: {
    questionId: number
    selectedOptionIds?: number[]
    textAnswer?: string
    codeLanguage?: string
    markedForReview?: boolean
  }) => api.put(`/attempts/${attemptId}/answer`, data),

  submit: (attemptId: number) =>
    api.post<TestAttempt>(`/attempts/${attemptId}/submit`).then(r => r.data),

  getResult: (attemptId: number) =>
    api.get<TestAttempt>(`/attempts/${attemptId}/result`).then(r => r.data),

  getMyAttempts: () =>
    api.get<TestAttempt[]>('/attempts/me').then(r => r.data),
}
