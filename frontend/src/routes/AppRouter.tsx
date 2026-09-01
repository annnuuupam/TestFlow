import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import Spinner from '@/components/ui/Spinner'

// Layouts (kept eager — small)
import AuthLayout from '@/layouts/AuthLayout'
import AdminLayout from '@/layouts/AdminLayout'
import StudentLayout from '@/layouts/StudentLayout'

// Lazy-loaded routes — each page is its own chunk (keep heavy libs like
// Monaco and recharts out of the initial bundle)
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminTests = lazy(() => import('@/pages/admin/Tests'))
const AdminCreateTest = lazy(() => import('@/pages/admin/CreateTest'))
const AdminQuestions = lazy(() => import('@/pages/admin/Questions'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminResults = lazy(() => import('@/pages/admin/Results'))
const AdminAnnouncements = lazy(() => import('@/pages/admin/Announcements'))
const ManageProblems = lazy(() => import('@/pages/admin/ManageProblems'))
const ProblemEditor = lazy(() => import('@/pages/admin/ProblemEditor'))

const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'))
const StudentTestList = lazy(() => import('@/pages/student/TestList'))
const StudentTestAttempt = lazy(() => import('@/pages/student/TestAttempt'))
const StudentResults = lazy(() => import('@/pages/student/Results'))
const StudentProfile = lazy(() => import('@/pages/student/Profile'))
const StudentLeaderboard = lazy(() => import('@/pages/student/Leaderboard'))
const ProblemList = lazy(() => import('@/pages/student/ProblemList'))
const ProblemSolving = lazy(() => import('@/pages/student/ProblemSolving'))

const HelpCenter = lazy(() => import('@/pages/static/HelpCenter'))
const StudentGuide = lazy(() => import('@/pages/static/StudentGuide'))
const PrivacyPolicy = lazy(() => import('@/pages/static/PrivacyPolicy'))
const TermsConditions = lazy(() => import('@/pages/static/Terms'))
const Landing = lazy(() => import('@/pages/static/Landing'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  )
}

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'ADMIN' | 'STUDENT' }) {
  const { isAuthenticated, role: userRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to={userRole === 'ADMIN' ? '/admin' : '/student'} replace />
  return <>{children}</>
}

export default function AppRouter() {
  const { isAuthenticated, role } = useAuthStore()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Register />} />
        </Route>

        {/* Public Info routes (inside StudentLayout for Navbar/Footer but without RequireAuth) */}
        <Route element={<StudentLayout />}>
          <Route path="/"          element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Landing />} />
          <Route path="/help"      element={<HelpCenter />} />
          <Route path="/guide"     element={<StudentGuide />} />
          <Route path="/privacy"   element={<PrivacyPolicy />} />
          <Route path="/terms"     element={<TermsConditions />} />
        </Route>

        {/* Admin routes */}
        <Route element={<RequireAuth role="ADMIN"><AdminLayout /></RequireAuth>}>
          <Route path="/admin"               element={<AdminDashboard />} />
          <Route path="/admin/tests"         element={<AdminTests />} />
          <Route path="/admin/tests/create"  element={<AdminCreateTest />} />
          <Route path="/admin/tests/:id/edit" element={<AdminCreateTest />} />
          <Route path="/admin/questions"     element={<AdminQuestions />} />
          <Route path="/admin/users"         element={<AdminUsers />} />
          <Route path="/admin/results"       element={<AdminResults />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/problems"      element={<ManageProblems />} />
          <Route path="/admin/problems/create" element={<ProblemEditor />} />
        </Route>

        {/* Student routes */}
        <Route element={<RequireAuth role="STUDENT"><StudentLayout /></RequireAuth>}>
          <Route path="/student"                    element={<StudentDashboard />} />
          <Route path="/student/tests"              element={<StudentTestList />} />
          <Route path="/student/tests/:id/attempt"  element={<StudentTestAttempt />} />
          <Route path="/student/results"            element={<StudentResults />} />
          <Route path="/student/profile"            element={<StudentProfile />} />
          <Route path="/student/leaderboard"        element={<Navigate to="/student/leaderboard/all" replace />} />
          <Route path="/student/leaderboard/:examId" element={<StudentLeaderboard />} />
          <Route path="/student/problems"           element={<ProblemList />} />
          <Route path="/student/problems/:id"       element={<ProblemSolving />} />
        </Route>

        {/* Default redirect & 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}