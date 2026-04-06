import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/domain'

interface NavItem {
  label: string
  to: string
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', to: '/student' },
  { label: 'Browse Resources', to: '/student/resources' },
  { label: 'Research', to: '/student/research' },
  { label: 'Resource Requests', to: '/student/requests' },
  { label: 'Announcements', to: '/student/announcements' },
  { label: 'Feedback & Issues', to: '/student/feedback' },
]

const adminNav: NavItem[] = [
  { label: 'Admin Dashboard', to: '/admin' },
  { label: 'Registered Students', to: '/admin/attendance' },
  { label: 'Add Resources', to: '/admin/resources' },
  { label: 'Research Management', to: '/admin/research' },
  { label: 'Request Management', to: '/admin/requests' },
  { label: 'Announcements & Events', to: '/admin/announcements' },
  { label: 'Feedback Management', to: '/admin/feedback' },
]

const navByRole: Record<UserRole, NavItem[]> = {
  student: studentNav,
  admin: adminNav,
}

export const AppShell = () => {
  const { profile, signOut } = useAuth()
  const navItems = profile ? navByRole[profile.role] : []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Health Sciences Library</h1>
        <p className="sidebar-meta">Management and Engagement Portal</p>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith('/student') || item.to.endsWith('/admin')}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{profile?.full_name}</strong>
            <p>{profile?.email}</p>
            <p className="role-badge">{profile?.role?.toUpperCase()}</p>
          </div>
          <button type="button" className="btn outline" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
