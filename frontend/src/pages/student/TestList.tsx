import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { testApi } from '@/api/test.api'
import type { Exam } from '@/types'
import { Clock, BookOpen, Target, Users, ArrowRight, ZapIcon } from 'lucide-react'

export default function StudentTestList() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testApi.getActive().then(setExams).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Available Tests</h1>
        <p className="page-subtitle">{exams.length} test{exams.length !== 1 ? 's' : ''} available for you</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="space-y-3"><div className="skeleton h-5 w-3/4 rounded" /><div className="skeleton h-4 rounded" /><div className="skeleton h-8 rounded" /></div>
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <BookOpen size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No tests available right now. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="glass-card p-5 flex flex-col gap-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-tight">{exam.title}</h3>
                  <span className="badge-active inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0">Live</span>
                </div>
                {exam.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{exam.description}</p>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Clock, label: `${exam.durationMinutes} min`, color: 'text-amber-400' },
                  { icon: Target, label: `${exam.totalMarks} marks`, color: 'text-primary' },
                  { icon: BookOpen, label: `${exam.totalQuestions} questions`, color: 'text-violet-400' },
                  { icon: Users, label: `${exam.attemptCount} attempts`, color: 'text-emerald-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon size={13} className={color} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Negative marking warning */}
              {exam.negativeMarking && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-2.5 py-1.5">
                  <ZapIcon size={12} /> Negative marking: -{exam.negativeMarksPerWrong} per wrong answer
                </div>
              )}

              {/* Passing info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Passing: {exam.passingMarks}/{exam.totalMarks}</span>
                <span>{exam.maxAttempts} attempt{exam.maxAttempts !== 1 ? 's' : ''} allowed</span>
              </div>

              {/* CTA */}
              <Link
                to={`/student/tests/${exam.id}/attempt`}
                className="mt-auto flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group-hover:gap-3"
              >
                Start Test <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
