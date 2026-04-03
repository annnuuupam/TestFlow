import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/useAuthStore'
import type { Role } from '@/types'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setAuth({
        token: res.token,
        userId: res.userId,
        username: res.username,
        fullName: res.fullName,
        email: res.email,
        role: res.role as Role,
      })
      toast.success(`Welcome back, ${res.fullName}!`)
      navigate(res.role === 'ADMIN' ? '/admin' : '/student')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-8 shadow-2xl">
      <h2 className="text-xl font-bold mb-1">Sign in</h2>
      <p className="text-sm text-muted-foreground mb-6">Enter your credentials to access your account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Username</label>
          <input
            {...register('username')}
            placeholder="your_username"
            className="w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50
                       focus:border-primary transition-all"
          />
          {errors.username && <p className="text-destructive text-xs mt-1">{errors.username.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50
                         focus:border-primary transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
                     hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </div>
  )
}
