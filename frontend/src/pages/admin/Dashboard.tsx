import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/api/admin.api'
import { testApi } from '@/api/test.api'
import type { Analytics, Exam } from '@/types'
import { formatRelative } from '@/utils'
import {
  Users, BookOpen, ClipboardCheck, TrendingUp,
  PlusCircle, ArrowRight, Activity, Target, Award
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string
}) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <TrendingUp size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton h-10 w-10 rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-7 w-16 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentTests, setRecentTests] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getAnalytics(),
      testApi.adminGetAll({ size: 5 }),
    ]).then(([ana, tests]) => {
      setAnalytics(ana)
      setRecentTests(tests.content)
    }).finally(() => setLoading(false))
  }, [])

  // Chart data
  const pieData = analytics ? [
    { name: 'Students', value: analytics.totalStudents },
    { name: 'Admins',   value: analytics.totalAdmins },
  ] : []

  const barData = analytics ? [
    { name: 'Users',     count: analytics.totalUsers },
    { name: 'Exams',     count: analytics.totalExams },
    { name: 'Attempts',  count: analytics.totalAttempts },
    { name: 'Questions', count: analytics.totalQuestions },
  ] : []

  const lineData = [
    { month: 'Jan', attempts: 12, score: 68 },
    { month: 'Feb', attempts: 19, score: 72 },
    { month: 'Mar', attempts: 31, score: 65 },
    { month: 'Apr', attempts: 27, score: 78 },
    { month: 'May', attempts: 45, score: 82 },
    { month: 'Jun', attempts: 38, score: 75 },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview and analytics</p>
        </div>
        <Link to="/admin/tests/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <PlusCircle size={16} /> New Test
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : analytics ? (
          <>
            <StatCard icon={Users}         label="Total Users"      value={analytics.totalUsers}       color="bg-primary"         sub={`${analytics.totalStudents} students`} />
            <StatCard icon={BookOpen}      label="Total Exams"      value={analytics.totalExams}       color="bg-violet-500"      sub={`${analytics.activeExams} active`} />
            <StatCard icon={ClipboardCheck} label="Total Attempts"  value={analytics.totalAttempts}    color="bg-emerald-500"     sub={`${analytics.completedAttempts} completed`} />
            <StatCard icon={Target}        label="Avg. Score"       value={`${analytics.averageScore}%`} color="bg-amber-500"    sub={`${analytics.totalQuestions} questions`} />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Attempt Trends
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="attempts" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="score"    stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Award size={16} className="text-primary" /> User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                   paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                   labelLine={false}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4">Platform Stats Overview</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Tests */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Tests</h3>
          <Link to="/admin/tests" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="py-3 skeleton h-8 rounded" />)
          ) : recentTests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tests yet — <Link to="/admin/tests/create" className="text-primary hover:underline">Create one</Link></p>
          ) : (
            recentTests.map(test => (
              <div key={test.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{test.title}</p>
                  <p className="text-xs text-muted-foreground">{test.totalQuestions} questions · {test.durationMinutes}m · {test.attemptCount} attempts</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  test.status === 'ACTIVE' ? 'badge-active' :
                  test.status === 'DRAFT' ? 'badge-draft' :
                  test.status === 'SCHEDULED' ? 'badge-scheduled' : 'badge-disabled'
                }`}>{test.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
