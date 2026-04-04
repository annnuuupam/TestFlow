import api from './axios'
import type { LeaderboardEntry } from '@/types'

export const leaderboardApi = {
  getByExam: (examId: number) =>
    api.get<LeaderboardEntry[]>(`/leaderboard/${examId}`).then(r => r.data),
  getGlobal: () =>
    api.get<LeaderboardEntry[]>('/leaderboard/global').then(r => r.data),
}
