import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { leaderboardApi } from '@/api/leaderboard.api'
import { testApi } from '@/api/test.api'
import type { Exam, LeaderboardEntry } from '@/types'
import { Trophy, ArrowLeft, Globe2, FileText } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import LeaderboardPodium from '@/components/leaderboard/LeaderboardPodium'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import { cn } from '@/utils'

export default function StudentLeaderboard() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { username } = useAuthStore()

  const examIdNum = Number(examId)
  const isGlobal = examId === 'all'
  const invalidExam = examId !== undefined && examId !== 'all' && !Number.isInteger(examIdNum)

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])

  const loadEntries = useCallback(() => {
    setLoading(true)
    if (invalidExam) {
      setEntries([])
      setLoading(false)
      return
    }
    const req = isGlobal
      ? leaderboardApi.getGlobal()
      : leaderboardApi.getByExam(examIdNum)
    req.then(setEntries).catch(() => setEntries([])).finally(() => setLoading(false))
  }, [invalidExam, isGlobal, examIdNum])

  useEffect(() => { loadEntries() }, [loadEntries])

  useEffect(() => {
    testApi.getActive().then(setExams).catch(() => setExams([]))
  }, [])

  const activeExamId = isGlobal || invalidExam ? undefined : examIdNum
  const selectedExam = exams.find(e => e.id === activeExamId)

  const switchToGlobal = () => navigate('/student/leaderboard/all', { replace: true })

  const switchToExam = (id: number) => navigate(`/student/leaderboard/${id}`)

  const goToExamTab = () => {
    if (exams.length > 0) switchToExam(exams[0].id)
  }

  const myEntry = entries.find(e => e.username === username)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header flex items-center gap-4">
        <button
          onClick={() => navigate(isGlobal ? '/student' : '/student/results')}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" /> Leaderboard
          </h1>
          <p className="page-subtitle">
            {isGlobal ? 'Top performers across the platform' : selectedExam ? selectedExam.title : 'Top performers for a test'}
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/70 border border-border">
        <button
          onClick={switchToGlobal}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            isGlobal ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Globe2 size={15} /> Global
        </button>
        <button
          onClick={goToExamTab}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            !isGlobal && !invalidExam ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <FileText size={15} /> By Exam
        </button>
      </div>

      {/* Exam picker (By Exam mode) */}
      {!isGlobal && (
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
          <FileText size={15} className="text-muted-foreground" />
          <select
            value={activeExamId?.toString() ?? ''}
            onChange={e => switchToExam(Number(e.target.value))}
            className="flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
          >
            {exams.length === 0 && <option value="">No tests available</option>}
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </div>
      )}

      {invalidExam ? (
        <EmptyState
          icon={Trophy}
          title="Invalid test"
          description="The test you are looking for does not exist."
          className="py-16"
        />
      ) : loading ? (
        <div className="bg-card border border-border rounded-2xl py-14">
          <Spinner label="Loading rankings…" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No results yet"
          description={isGlobal
            ? 'No submissions have been recorded yet. Complete your first test to appear here!'
            : 'Be the first to take this test and set the benchmark!'}
          className="py-16"
        />
      ) : (
        <>
          {myEntry && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                #{myEntry.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Your Rank: #{myEntry.rank} of {entries.length}</p>
                <p className="text-xs text-muted-foreground">{myEntry.score}/{myEntry.totalMarks} marks · {myEntry.percentage.toFixed(1)}%</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-muted-foreground">Percentile</p>
                <p className="text-sm font-bold text-primary">
                  {((1 - myEntry.rank / entries.length) * 100).toFixed(0)}th
                </p>
              </div>
            </div>
          )}

          {entries.length >= 3 && <LeaderboardPodium entries={entries} />}

          <LeaderboardTable entries={entries} currentUsername={username} showExam={isGlobal} />
        </>
      )}
    </div>
  )
}