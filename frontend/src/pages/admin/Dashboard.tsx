import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/api/admin.api'
import { testApi } from '@/api/test.api'
import type { Analytics, Exam, RecentActivity } from '@/types'
import {
  Users, BookOpen,
  PlusCircle, Activity,
  CheckCircle2, AlertCircle, Flame, UserPlus, Download,
  ClipboardList, Percent, Filter, Edit2
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Legend, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Button } from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { cn, formatDate } from '@/utils'

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

const PERIOD_OPTIONS = [
  { label: 'All', value: 0 },
  { label: 'Last 6', value: 6 },
  { label: 'Last 3', value: 3 },
]

const ACTIVITY_TYPES = ['ALL', 'TEST_STARTED', 'TEST_SUBMITTED', 'USER_JOINED'] as const

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentTests, setRecentTests] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(0)
  const [chartMetric, setChartMetric] = useState<'count' | 'avgScore'>('count')
  const [activityFilter, setActivityFilter] = useState<string>('ALL')

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

  const trendData = useMemo(() => {
    const all = analytics?.attemptTrends || []
    if (period === 0 || all.length === 0) return all
    return all.slice(-period)
  }, [analytics?.attemptTrends, period])

  const filteredActivities = useMemo(() => {
    const acts = analytics?.recentActivities || []
    if (activityFilter === 'ALL') return acts
    return acts.filter(a => a.type === activityFilter)
  }, [analytics?.recentActivities, activityFilter])

  const completionRate = analytics
    ? analytics.totalAttempts > 0
      ? Math.round((analytics.completedAttempts / analytics.totalAttempts) * 100)
      : 0
    : 0

  const exportReport = () => {
    if (!analytics) return
    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Total Users', String(analytics.totalUsers ?? 0)],
      ['Total Students', String(analytics.totalStudents ?? 0)],
      ['Total Admins', String(analytics.totalAdmins ?? 0)],
      ['Total Exams', String(analytics.totalExams ?? 0)],
      ['Active Exams', String(analytics.activeExams ?? 0)],
      ['Total Attempts', String(analytics.totalAttempts ?? 0)],
      ['Completed Attempts', String(analytics.completedAttempts ?? 0)],
      ['Average Score (%)', String(analytics.averageScore ?? 0)],
      ['Active Users Today', String(analytics.activeUsersToday ?? 0)],
      ['Average Streak', String(analytics.averageStreak ?? 0)],
      ['Top Streak', String(analytics.topStreak ?? 0)],
      ['', ''],
      ['Month', 'Attempts', 'Avg Score'],
      ...trendData.map(t => [t.label, String(t.count), String(t.avgScore)]),
    ]
    if (analytics.recentActivities?.length) {
      rows.push(['', ''])
      rows.push(['Recent Activity', 'Time', 'Type'])
      analytics.recentActivities.forEach(a => rows.push([a.message, a.time, a.type]))
    }
    const csv = rows.map(r => r.map(c => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `testflow_report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activityStyle = (type: string) => {
    switch (type) {
      case 'TEST_STARTED':   return { icon: Activity,   cls: 'bg-indigo-500/10 text-indigo-500' }
      case 'TEST_SUBMITTED': return { icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-500' }
      case 'USER_JOINED':    return { icon: UserPlus,   cls: 'bg-sky-500/10 text-sky-500' }
      default:               return { icon: Activity,   cls: 'bg-secondary text-muted-foreground' }
    }
  }

  const activityLabel = (type: string) => {
    switch (type) {
      case 'TEST_STARTED':   return 'Started'
      case 'TEST_SUBMITTED': return 'Submitted'
      case 'USER_JOINED':    return 'Joined'
      default:               return type
    }
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time platform performance and user engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={exportReport} disabled={!analytics}>
            <Download size={15} /> Download Report
          </Button>
          <Link to="/admin/tests/create">
            <Button variant="primary" size="md">
              <PlusCircle size={16} /> Create New Test
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4">
              <div className="skeleton h-9 w-9 rounded-xl mb-3" />
              <div className="skeleton h-6 w-14 rounded" />
              <div className="skeleton h-3 w-20 mt-2 rounded" />
            </div>
          ))
        ) : analytics ? (
          <>
            <StatCard icon={Users} label="Total Users" value={analytics.totalUsers} iconClass="bg-sky-500/10 text-sky-500" hint="All registered" />
            <StatCard icon={BookOpen} label="Total Exams" value={analytics.totalExams} iconClass="bg-indigo-500/10 text-indigo-500" hint={`${analytics.activeExams} active`} />
            <StatCard icon={ClipboardList} label="Total Attempts" value={analytics.totalAttempts} iconClass="bg-violet-500/10 text-violet-500" hint={`${analytics.completedAttempts} completed`} />
            <StatCard icon={Percent} label="Completion" value={`${completionRate}%`} iconClass="bg-emerald-500/10 text-emerald-500" hint="Attempt completion" />
            <StatCard icon={Users} label="Active Today" value={analytics.activeUsersToday} iconClass="bg-primary/10 text-primary" hint="Students online" />
            <StatCard icon={Flame} label="Avg Streak" value={analytics.averageStreak} iconClass="bg-orange-500/10 text-orange-500" hint={`Top: ${analytics.topStreak}`} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 hover-lift" padded="lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Participation Trends</h3>
              <p className="text-xs text-muted-foreground mt-1">Monthly student engagement and performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      period === opt.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                <button
                  onClick={() => setChartMetric('count')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    chartMetric === 'count'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Attempts
                </button>
                <button
                  onClick={() => setChartMetric('avgScore')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    chartMetric === 'avgScore'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Avg Score
                </button>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
              {chartMetric === 'count' ? (
                <Area type="monotone" dataKey="count" name="Attempts" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAttempts)" />
              ) : (
                <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="hover-lift" padded="lg">
          <h3 className="text-base font-semibold text-foreground mb-6">Specializations</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                   paddingAngle={8} dataKey="value" stroke="none">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: 20, fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padded="lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Live Activity
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <div className="flex items-center gap-1 flex-wrap">
              {ACTIVITY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setActivityFilter(type)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border',
                    activityFilter === type
                      ? 'bg-primary/10 text-primary border-primary/25'
                      : 'text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {activityLabel(type)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            {filteredActivities.map((activity: RecentActivity, i: number) => {
              const style = activityStyle(activity.type)
              return (
                <div key={i} className="flex gap-3 relative">
                  {i !== filteredActivities.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-[1px] bg-border" />
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${style.cls}`}>
                    <style.icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              )
            })}
            {(analytics?.recentActivities?.length || 0) > 0 && filteredActivities.length === 0 && (
              <EmptyState icon={Filter} title="No matching activity" description="No activity matches this filter" />
            )}
            {(!analytics?.recentActivities || analytics.recentActivities.length === 0) && (
              <EmptyState icon={AlertCircle} title="No recent activity" description="No recent activity detected" />
            )}
          </div>
        </Card>

        <Card padded="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Featured Tests
            </h3>
            <Link to="/admin/tests">
              <Button variant="link" size="sm">Manage All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentTests.map((test) => (
              <Link
                key={test.id}
                to={`/admin/tests/${test.id}/edit`}
                className="block p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 hover-lift transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{test.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant={test.status === 'ACTIVE' ? 'active' : test.status === 'DRAFT' ? 'draft' : 'neutral'} className="text-[10px]">
                          {test.status}
                        </Badge>
                        {test.category && (
                          <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">{test.category}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/70">{formatDate(test.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{test.attemptCount} attempts</span>
                    <Edit2 size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
