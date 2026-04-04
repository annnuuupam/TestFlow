import api from './axios'
import type { Problem } from '../types'

export const problemApi = {
  getAllProblems: () => api.get<Problem[]>('/problems'),
  
  getProblemById: (id: number | string) => api.get<Problem>(`/problems/${id}`),
  
  createProblem: (data: Partial<Problem>) => api.post<Problem>('/problems', data),
  
  deleteProblem: (id: number | string) => api.delete(`/problems/${id}`),
}
