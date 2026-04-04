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
  // Coding question specific fields
  boilerplate?: string
  constraints?: string
  sampleInput?: string
  sampleOutput?: string
  testCases?: TestCase[]
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
  category?: string
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

export interface ProfileResponse {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  currentStreak: number;
  maxStreak: number;
  totalSolved: number;
  totalSubmissions: number;
  accuracy: number;
  lastActiveDate?: string;
  badges: BadgeResponse[];
}

export interface BadgeResponse {
  id: number;
  name: string;
  description: string;
  iconUrl?: string;
  isEarned: boolean;
  awardedAt?: string;
}

export interface ActivityPoint {
  date: string;
  count: number;
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
  activeUsersToday: number
  averageStreak: number
  topStreak: number
  attemptTrends?: TrendPoint[]
  categoryDistribution?: Record<string, number>
  recentActivities?: RecentActivity[]
}

export interface TrendPoint {
  label: string
  count: number
  avgScore: number
}

export interface RecentActivity {
  message: string
  time: string
  type: 'TEST_STARTED' | 'TEST_SUBMITTED' | 'USER_JOINED' | string
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

// ============================================================
// Coding Platform Types
// ============================================================

export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type SubmissionStatus = 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR';
export type Language = 'C' | 'CPP' | 'JAVA' | 'PYTHON' | 'JAVASCRIPT';

export interface TestCase {
  id?: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: ProblemDifficulty;
  tags: string;
  timeLimit: number;
  memoryLimit: number;
  testCases?: TestCase[];
}

export interface Submission {
  id: number;
  problemId: number;
  problemTitle: string;
  code: string;
  language: Language;
  status: SubmissionStatus;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  submittedAt: string;
}
