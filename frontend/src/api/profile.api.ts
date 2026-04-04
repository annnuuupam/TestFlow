import api from './axios'
import type { ProfileResponse, ActivityPoint } from '@/types'

export const profileApi = {
  getMyProfile: () => 
    api.get<ProfileResponse>('/profile/me').then(r => r.data),
    
  getActivity: () => 
    api.get<ActivityPoint[]>('/profile/activity').then(r => r.data),
    
  updateProfile: (data: Partial<ProfileResponse>) => 
    api.put('/profile/me', data).then(r => r.data),
}
