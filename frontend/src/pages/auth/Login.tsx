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
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
    <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in to your TestFlow account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Username"
          placeholder="your_username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all ${
                errors.password ? 'border-red-500/60 focus:ring-red-500/25 focus:border-red-500' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs font-medium text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {!loading && <LogIn size={16} />}
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-semibold">
          Create one
        </Link>
      </p>
    </div>
  )
}