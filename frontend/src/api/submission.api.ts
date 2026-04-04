import api from './axios'
import type { Submission } from '../types'

interface SubmitRequest {
    problemId: number;
    code: string;
    language: string;
}

export const submissionApi = {
  submitCode: (data: SubmitRequest) => api.post<Submission>('/submissions', data),
  
  getMySubmissions: () => api.get<Submission[]>('/submissions/me'),
  
  getSubmissionById: (id: number | string) => api.get<Submission>(`/submissions/${id}`),
}
