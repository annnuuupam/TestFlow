// ============================================================
// All TypeScript types and interfaces for the OTS frontend
// ============================================================

export type Role = 'ADMIN' | 'STUDENT'
export type TestStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'DISABLED'
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'ABANDONED'
export type QuestionType = 'MCQ' | 'MULTI_SELECT' | 'CODING' | 'TRUE_FALSE'
export type SectionType = 'APTITUDE' | 'MCQ' | 'CODING' | 'MULTI_SELECT'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

// Auth
export interface AuthResponse {
  token: string
  tokenType: string
  userId: number
  username: string
  fullName: string
  email: string
  role: Role
}

// User
export interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: Role
  isActive: boolean
  phone?: string
  createdAt: string
  totalAttempts?: number
  completedExams?: number
}

// Option
export interface Option {
  id: number
  optionText: string
  displayOrder: number
  isCorrect?: boolean  // Only present in admin/result view
}

// Question
export interface Question {
  id: number
  questionText: string
  questionType: QuestionType
  marks: number
  difficulty: Difficulty
  displayOrder: number
  options: Option[]
  explanation?: string
}

// Section
export interface Section {
  id: number
  title: string
  sectionType: SectionType
  marksPerQuestion: number
  displayOrder: number
  questionCount: number
  questions?: Question[]
}

// Exam
export interface Exam {
  id: number
  title: string
  description?: string
  durationMinutes: number
  totalMarks: number
  passingMarks: number
  negativeMarking: boolean
  negativeMarksPerWrong: number
  startTime?: string
  endTime?: string
  status: TestStatus
  isRandomized: boolean
  maxAttempts: number
  createdBy?: string
  createdAt: string
  totalQuestions: number
  sectionCount: number
  attemptCount: number
  sections?: Section[]
}

// Attempt answer detail
export interface AnswerDetail {
  questionId: number
  questionText: string
  selectedOptionIds: number[]
  textAnswer?: string
  isCorrect: boolean
  marksObtained: number
  markedForReview: boolean
}

// Test attempt
export interface TestAttempt {
  id: number
  examId: number
  examTitle: string
  userId: number
  username: string
  status: AttemptStatus
  startTime: string
  endTime?: string
  score: number
  totalMarks: number
  correctCount: number
  wrongCount: number
  unansweredCount: number
  percentage: number
  timeTakenSeconds: number
  passed?: boolean
  answerDetails?: AnswerDetail[]
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number
  userId: number
  username: string
  fullName: string
  score: number
  totalMarks: number
  percentage: number
  timeTakenSeconds: number
  passed: boolean
}

// Analytics
export interface Analytics {
  totalUsers: number
  totalStudents: number
  totalAdmins: number
  totalExams: number
  activeExams: number
  totalAttempts: number
  completedAttempts: number
  averageScore: number
  totalQuestions: number
}

// Announcement
export interface Announcement {
  id: number
  title: string
  content: string
  isActive: boolean
  createdBy?: string
  createdAt: string
}

// Paginated response from Spring Boot
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

// Answer state during exam
export interface AnswerState {
  [questionId: number]: {
    selectedOptionIds: number[]
    textAnswer: string
    markedForReview: boolean
  }
}
