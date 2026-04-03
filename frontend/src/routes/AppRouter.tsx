import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

// Layouts
import AuthLayout from '@/layouts/AuthLayout'
import AdminLayout from '@/layouts/AdminLayout'
import StudentLayout from '@/layouts/StudentLayout'

// Auth pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminTests from '@/pages/admin/Tests'
import AdminCreateTest from '@/pages/admin/CreateTest'
import AdminQuestions from '@/pages/admin/Questions'
import AdminUsers from '@/pages/admin/Users'
import AdminResults from '@/pages/admin/Results'
import AdminAnnouncements from '@/pages/admin/Announcements'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentTestList from '@/pages/student/TestList'
import StudentTestAttempt from '@/pages/student/TestAttempt'
import StudentResults from '@/pages/student/Results'
import StudentLeaderboard from '@/pages/student/Leaderboard'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'ADMIN' | 'STUDENT' }) {
  const { isAuthenticated, role: userRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to={userRole === 'ADMIN' ? '/admin' : '/student'} replace />
  return <>{children}</>
}

export default function AppRouter() {
  const { isAuthenticated, role } = useAuthStore()

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Register />} />
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
      </Route>

      {/* Student routes */}
      <Route element={<RequireAuth role="STUDENT"><StudentLayout /></RequireAuth>}>
        <Route path="/student"                    element={<StudentDashboard />} />
        <Route path="/student/tests"              element={<StudentTestList />} />
        <Route path="/student/tests/:id/attempt"  element={<StudentTestAttempt />} />
        <Route path="/student/results"            element={<StudentResults />} />
        <Route path="/student/leaderboard/:examId" element={<StudentLeaderboard />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} />
          : <Navigate to="/login" />
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
