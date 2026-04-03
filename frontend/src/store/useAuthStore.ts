import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface AuthState {
  token: string | null
  userId: number | null
  username: string | null
  fullName: string | null
  email: string | null
  role: Role | null
  isAuthenticated: boolean

  setAuth: (data: {
    token: string
    userId: number
    username: string
    fullName: string
    email: string
    role: Role
  }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      fullName: null,
      email: null,
      role: null,
      isAuthenticated: false,

      setAuth: (data) => set({
        token: data.token,
        userId: data.userId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        isAuthenticated: true,
      }),

      logout: () => set({
        token: null,
        userId: null,
        username: null,
        fullName: null,
        email: null,
        role: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'ots-auth',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        username: state.username,
        fullName: state.fullName,
        email: state.email,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
