import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/useAuthStore'
import type { Role } from '@/types'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(50),
  fullName: z.string().min(2, 'Full name required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function Register() {
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
      const res = await authApi.register({
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      })
      setAuth({ token: res.token, userId: res.userId, username: res.username,
                fullName: res.fullName, email: res.email, role: res.role as Role })
      toast.success('Account created! Welcome to TestFlow')
      navigate('/student')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Create account</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Join TestFlow and start your learning journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username"
            placeholder="john_doe"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Full Name"
            placeholder="John Doe"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone (optional)"
          placeholder="+91 9999999999"
          autoComplete="tel"
          {...register('phone')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="min. 6 characters"
                className={`w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all pr-10 ${
                  errors.password ? 'border-red-500/60 focus:ring-red-500/25 focus:border-red-500' : ''
                }`}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-medium text-red-500">{errors.password.message}</p>}
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="repeat password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {!loading && <UserPlus size={16} />}
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
      </p>
    </div>
  )
}