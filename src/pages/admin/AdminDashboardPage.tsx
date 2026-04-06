import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import {
  announcementService,
  attendanceService,
  feedbackService,
  requestService,
} from '../../services/libraryService'
import { formatDateTime } from '../../utils/format'
import type { FeedbackReport, Profile, ResourceRequest } from '../../types/domain'

type ResourceRequestWithProfile = ResourceRequest & {
  profiles?: { full_name: string; program: string | null }
}

type FeedbackWithProfile = FeedbackReport & {
  profiles?: { full_name: string; program: string | null }
}

type ActivityItem = {
  id: string
  created_at: string
  title: string
  subtitle: string
}

const formatStatusLabel = (status: string) =>
  status
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')

export const AdminDashboardPage = () => {
  const [students, setStudents] = useState<Profile[]>([])
  const [requests, setRequests] = useState<ResourceRequestWithProfile[]>([])
  const [feedback, setFeedback] = useState<FeedbackWithProfile[]>([])
  const [announcements, setAnnouncements] = useState<{ id: string; created_at: string }[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [studentRows, requestRows, feedbackRows, announcementRows] = await Promise.all([
          attendanceService.listRegisteredStudents(),
          requestService.listAll(),
          feedbackService.listAll(),
          announcementService.list(),
        ])

        setStudents(studentRows)
        setRequests(requestRows as ResourceRequestWithProfile[])
        setFeedback(feedbackRows as FeedbackWithProfile[])
        setAnnouncements(announcementRows.map((item) => ({ id: item.id, created_at: item.created_at })))
        setLoadError(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load admin dashboard data.'
        setLoadError(message)
      }
    }

    void load()
  }, [])

  const analytics = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoIso = sevenDaysAgo.toISOString()

    const pendingRequests = requests.filter((item) => item.status === 'pending')
    const actionableFeedback = feedback.filter((item) => ['new', 'in_review'].includes(item.status))

    const recentAnnouncements = announcements.filter((item) => item.created_at >= sevenDaysAgoIso)

    const pendingToday = pendingRequests.filter((item) => item.created_at.startsWith(today)).length
    const newFeedbackToday = feedback.filter((item) => item.created_at.startsWith(today)).length
    const newRegistrationsToday = students.filter((item) => item.created_at.startsWith(today)).length

    const latestRequests: ActivityItem[] = requests.map((item) => ({
      id: `request-${item.id}`,
      created_at: item.created_at,
      title: `Request: ${item.title}`,
      subtitle: `${item.profiles?.full_name || 'Student'} • ${formatStatusLabel(item.status)}`,
    }))

    const latestFeedback: ActivityItem[] = feedback.map((item) => ({
      id: `feedback-${item.id}`,
      created_at: item.created_at,
      title: `Feedback: ${formatStatusLabel(item.category)}`,
      subtitle: `${item.profiles?.full_name || 'Student'} • ${formatStatusLabel(item.status)}`,
    }))

    const latestRegistrations: ActivityItem[] = students.map((item) => ({
      id: `student-${item.id}`,
      created_at: item.created_at,
      title: `New Student: ${item.full_name}`,
      subtitle: `${item.program || 'Unspecified Program'} • Year ${item.year_level ?? '-'}`,
    }))

    const latestActivity = [...latestRequests, ...latestFeedback, ...latestRegistrations]
      .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
      .slice(0, 8)

    return {
      registeredStudents: students.length,
      pendingRequests: pendingRequests.length,
      actionableFeedback: actionableFeedback.length,
      recentAnnouncements: recentAnnouncements.length,
      pendingToday,
      newFeedbackToday,
      newRegistrationsToday,
      latestActivity,
    }
  }, [announcements, feedback, requests, students])

  return (
    <div className="page-grid">
      <header>
        <h2>Admin Dashboard</h2>
        <p>Track daily operations for student accounts, requests, feedback, and announcements.</p>
      </header>

      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="stats-grid">
        <StatCard label="Registered Students" value={analytics.registeredStudents} />
        <StatCard label="Pending Requests" value={analytics.pendingRequests} />
        <StatCard label="Feedback Needing Action" value={analytics.actionableFeedback} />
        <StatCard label="Announcements (Last 7 Days)" value={analytics.recentAnnouncements} />
      </section>

      <Card title="Quick Actions">
        <div className="quick-links">
           <Link to="/admin/resources">Add Resources</Link>
            <Link to="/admin/research">Research Repository</Link>
          <Link to="/admin/attendance">Registered Students</Link>
          <Link to="/admin/requests">Request Management</Link>
          <Link to="/admin/feedback">Feedback Management</Link>
          <Link to="/admin/announcements">Announcement Management</Link>
        </div>
      </Card>

      <Card title="Latest Activity">
        {analytics.latestActivity.length > 0 ? (
          <ul className="list latest-activity-list">
            {analytics.latestActivity.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <small>{formatDateTime(item.created_at)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent activity yet.</p>
        )}
      </Card>

 
    </div>
  )
}
