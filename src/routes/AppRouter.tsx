import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AttendanceManagementPage } from '../pages/admin/AttendanceManagementPage'
import { ResearchManagementPage } from '../pages/admin/ResearchManagementPage'
import { RequestManagementPage } from '../pages/admin/RequestManagementPage'
import { AnnouncementManagementPage } from '../pages/admin/AnnouncementManagementPage'
import { RoomManagementPage } from '../pages/admin/RoomManagementPage'
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage'
import { AttendancePage } from '../pages/student/AttendancePage'
import { BrowseResourcesPage } from '../pages/student/BrowseResourcesPage'
import { ResearchRepositoryPage } from '../pages/student/ResearchRepositoryPage'
import { ResourceRequestsPage } from '../pages/student/ResourceRequestsPage'
import { AnnouncementsPage } from '../pages/student/AnnouncementsPage'
import { RoomReservationsPage } from '../pages/student/RoomReservationsPage'
import { AddResourcesPage } from '../pages/admin/AddResourcesPage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute roles={['student']}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/resources"
          element={
            <ProtectedRoute roles={['student']}>
              <BrowseResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/research"
          element={
            <ProtectedRoute roles={['student']}>
              <ResearchRepositoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/requests"
          element={
            <ProtectedRoute roles={['student']}>
              <ResourceRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <ProtectedRoute roles={['student']}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/rooms"
          element={
            <ProtectedRoute roles={['student']}>
              <RoomReservationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute roles={['admin']}>
              <AttendanceManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/resources"
          element={
            <ProtectedRoute roles={['admin']}>
              <AddResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/research"
          element={
            <ProtectedRoute roles={['admin']}>
              <ResearchManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute roles={['admin']}>
              <RequestManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute roles={['admin']}>
              <AnnouncementManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute roles={['admin']}>
              <RoomManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
