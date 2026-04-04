import React from 'react'
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
import ManageProblems from '@/pages/admin/ManageProblems'
import ProblemEditor from '@/pages/admin/ProblemEditor'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentTestList from '@/pages/student/TestList'
import StudentTestAttempt from '@/pages/student/TestAttempt'
import StudentResults from '@/pages/student/Results'
import StudentProfile from '@/pages/student/Profile'
import StudentLeaderboard from '@/pages/student/Leaderboard'
import ProblemList from '@/pages/student/ProblemList'
import ProblemSolving from '@/pages/student/ProblemSolving'

// Static pages
import HelpCenter from '@/pages/static/HelpCenter'
import StudentGuide from '@/pages/static/StudentGuide'
import PrivacyPolicy from '@/pages/static/PrivacyPolicy'
import TermsConditions from '@/pages/static/Terms'
import NotFound from '@/pages/NotFound'

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
      {/* Public Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} /> : <Register />} />
      </Route>

      {/* Public Info routes (inside StudentLayout for Navbar/Footer but without RequireAuth) */}
      <Route element={<StudentLayout />}>
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
        <Route path="/student/leaderboard/:examId" element={<StudentLeaderboard />} />
        <Route path="/student/problems"           element={<ProblemList />} />
        <Route path="/student/problems/:id"       element={<ProblemSolving />} />
      </Route>

      {/* Default redirect & 404 */}
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} />
          : <Navigate to="/login" />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
