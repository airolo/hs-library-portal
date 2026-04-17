import { useState } from 'react'
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const navItems = profile ? navByRole[profile.role] : []

  const toggleMobileNav = () => {
    setIsMobileNavOpen((prev) => !prev)
  }

  const closeMobileNav = () => {
    setIsMobileNavOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <div>
          <strong>Health Sciences Library</strong>
          <p className="mobile-topbar-meta">Portal</p>
        </div>
        <button
          type="button"
          className="btn outline mobile-menu-btn"
          onClick={toggleMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-controls="portal-sidebar-nav"
          aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isMobileNavOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {isMobileNavOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={closeMobileNav}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        id="portal-sidebar-nav"
        className={`sidebar ${isMobileNavOpen ? 'open' : ''}`}
      >
        <h1>Health Sciences Library</h1>
        <p className="sidebar-meta">Management and Engagement Portal</p>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith('/student') || item.to.endsWith('/admin')}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileNav}
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
