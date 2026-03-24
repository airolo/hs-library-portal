import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/domain'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: UserRole[]
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="center-message">Loading account...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <div className="center-message">Preparing your account profile...</div>
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/student'} replace />
  }

  return <>{children}</>
}
