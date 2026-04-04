import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/api/admin.api'
import { testApi } from '@/api/test.api'
import type { Analytics, Exam } from '@/types'
import { formatRelative } from '@/utils'
import {
  Users, BookOpen, ClipboardCheck, TrendingUp,
  PlusCircle, ArrowRight, Activity, Target, Award,
  Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string
}) {
  return (
    <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-current/10`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex flex-col items-end">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-[10px] font-medium text-emerald-500">+12%</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1.5 flex items-center gap-1">
          <Activity size={10} /> {sub}
        </p>}
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

  const pieData = analytics?.categoryDistribution 
    ? Object.entries(analytics.categoryDistribution).map(([name, value]) => ({ name, value }))
    : []

  const trendData = analytics?.attemptTrends || []

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">Real-time platform performance and user engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            Download Report
          </button>
          <Link to="/admin/tests/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/25">
            <PlusCircle size={18} /> Create New Test
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="stat-card skeleton h-40 rounded-3xl" />)
        ) : analytics ? (
          <>
            <StatCard icon={Users}         label="Total Candidates" value={analytics.totalStudents}  color="bg-primary"       sub="Active in last 24h" />
            <StatCard icon={BookOpen}      label="Live Exams"       value={analytics.activeExams}    color="bg-indigo-500"    sub={`${analytics.totalExams} total exams`} />
            <StatCard icon={ClipboardCheck} label="Submissions"     value={analytics.totalAttempts}  color="bg-emerald-500"   sub={`${analytics.completedAttempts} graded`} />
            <StatCard icon={Target}        label="Average Grade"    value={`${analytics.averageScore}%`} color="bg-amber-500" sub="Industry parity" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <div className="glass-card p-6 lg:col-span-2 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">Participation Trends</h3>
              <p className="text-xs text-muted-foreground mt-1">Monthly student engagement and performance</p>
            </div>
            <Activity className="text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="count" name="Attempts" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAttempts)" />
              <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#22c55e" strokeWidth={3} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-8">Specializations</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                   paddingAngle={8} dataKey="value" stroke="none">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} className="text-primary" /> Live Activity
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-6">
            {analytics?.recentActivities?.map((activity: any, i: number) => (
              <div key={i} className="flex gap-4 relative">
                {i !== (analytics?.recentActivities?.length || 0) - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-[1px] bg-border" />
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  activity.type === 'TEST_STARTED' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {activity.type === 'TEST_STARTED' ? <Activity size={12} /> : <CheckCircle2 size={12} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
            {(!analytics?.recentActivities || analytics.recentActivities.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No recent activity detected</p>
              </div>
            ) }
          </div>
        </div>

        {/* Top Performing Tests */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Award size={20} className="text-primary" /> Featured Tests
            </h3>
            <Link to="/admin/tests" className="text-xs text-primary font-bold hover:underline">Manage All</Link>
          </div>
          <div className="space-y-4">
            {recentTests.map((test: any) => (
              <div key={test.id} className="p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-border shadow-sm">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{test.title}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                      {test.category || 'General'} • {test.attemptCount} Candidates
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                  test.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {test.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
