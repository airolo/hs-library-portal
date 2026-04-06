import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { announcementService, feedbackService, requestService } from '../../services/libraryService'
import type { Announcement, FeedbackReport, ResourceRequest } from '../../types/domain'
import { formatDate } from '../../utils/format'
import '../student/ActivitySummary.css'

export const StudentDashboardPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [requestCount, setRequestCount] = useState(0)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const [requestNotifications, setRequestNotifications] = useState<ResourceRequest[]>([])
  const [feedbackNotifications, setFeedbackNotifications] = useState<FeedbackReport[]>([])
  const [dismissedRequestNotificationIds, setDismissedRequestNotificationIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const saved = window.localStorage.getItem('dismissedRequestNotificationIds')
    if (!saved) {
      return []
    }

    try {
      return JSON.parse(saved) as string[]
    } catch {
      return []
    }
  })
  const [dismissedFeedbackNotificationIds, setDismissedFeedbackNotificationIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const saved = window.localStorage.getItem('dismissedFeedbackNotificationIds')
    if (!saved) {
      return []
    }

    try {
      return JSON.parse(saved) as string[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    const load = async () => {
      const [
        announcementData,
        requestTotal,
        feedbackTotal,
        requests,
        feedbackReports,
      ] = await Promise.all([
        announcementService.listRecent(5),
        requestService.countForCurrentUser(),
        feedbackService.countForCurrentUser(),
        requestService.listForCurrentUser(),
        feedbackService.listForCurrentUser(),
      ])

      const now = Date.now()
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
      const newAnnouncements = announcementData.filter((item) => {
        const createdAt = new Date(item.created_at).getTime()
        return now - createdAt <= sevenDaysInMs
      })

      setAnnouncements(newAnnouncements)
      setRequestCount(requestTotal)
      setFeedbackCount(feedbackTotal)
      setRequestNotifications(
        requests
          .filter((item) => item.status === 'approved' || item.status === 'rejected')
          .slice(0, 5),
      )
      setFeedbackNotifications(
        feedbackReports
          .filter((item) => Boolean(item.admin_response?.trim()))
          .slice(0, 5),
      )
    }

    load()
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      'dismissedRequestNotificationIds',
      JSON.stringify(dismissedRequestNotificationIds),
    )
  }, [dismissedRequestNotificationIds])

  useEffect(() => {
    window.localStorage.setItem(
      'dismissedFeedbackNotificationIds',
      JSON.stringify(dismissedFeedbackNotificationIds),
    )
  }, [dismissedFeedbackNotificationIds])

  const getRequestStatusBadgeClass = (status: ResourceRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'status-approved'
      case 'rejected':
        return 'status-rejected'
      default:
        return ''
    }
  }

  const getRequestStatusLabel = (status: ResourceRequest['status']) => {
    if (status === 'rejected') {
      return 'Rejected'
    }
    if (status === 'approved') {
      return 'Approved'
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getFeedbackCategoryLabel = (category: FeedbackReport['category']) => {
    switch (category) {
      case 'book_request':
        return 'Book Request'
      case 'journal_access':
        return 'Resources Problem'
      case 'repository_issue':
        return 'Research Repository Issue'
      case 'general_feedback':
        return 'General Feedback'
      case 'bug_report':
        return 'System Bug Report'
      default:
        return category
    }
  }

  const getFeedbackStatusBadgeClass = (status: FeedbackReport['status']) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'status-approved'
      case 'new':
      case 'in_review':
        return 'status-pending'
      default:
        return ''
    }
  }

  const getFeedbackStatusLabel = (status: FeedbackReport['status']) => {
    switch (status) {
      case 'new':
        return 'New'
      case 'in_review':
        return 'In Review'
      case 'resolved':
        return 'Resolved'
      case 'closed':
        return 'Closed'
      default:
        return status
    }
  }

  const truncateText = (value: string, maxLength = 140) => {
    if (value.length <= maxLength) {
      return value
    }
    return `${value.slice(0, maxLength)}...`
  }

  const dismissRequestNotification = (id: string) => {
    setDismissedRequestNotificationIds((current) => [...current, id])
  }

  const dismissFeedbackNotification = (id: string) => {
    setDismissedFeedbackNotificationIds((current) => [...current, id])
  }

  const visibleRequestNotifications = requestNotifications.filter(
    (item) => !dismissedRequestNotificationIds.includes(item.id),
  )

  const visibleFeedbackNotifications = feedbackNotifications.filter(
    (item) => !dismissedFeedbackNotificationIds.includes(item.id),
  )

  return (
    <div className="page-grid">
      <header>
        <h2>Student Dashboard</h2>
        <p>Access core library services and updates.</p>
      </header>

      <section className="stats-grid">
        <StatCard label="Resource Requests" value={requestCount} />
        <StatCard label="Feedback Reports" value={feedbackCount} />
      </section>

      <Card title="Latest Announcements">
        {announcements.length > 0 ? (
          <ul className="list">
            {announcements.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.content}</p>
                <small>{formatDate(item.event_date || item.created_at)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No new announcements in the last 7 days.</p>
        )}
      </Card>

      <Card title="Notifications">
        <div className="activity-summary">
          <div className="activity-section">
            <h3>Approved/Rejected Requests</h3>
            {visibleRequestNotifications.length > 0 ? (
              <ul className="activity-list">
                {visibleRequestNotifications.map((request) => (
                  <li key={request.id} className="activity-item">
                    <div className="activity-item-header">
                      <strong>{request.title}</strong>
                      <div className="activity-item-actions">
                        <span className={`status-badge ${getRequestStatusBadgeClass(request.status)}`}>
                          {getRequestStatusLabel(request.status)}
                        </span>
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => dismissRequestNotification(request.id)}
                          aria-label="Dismiss request notification"
                          title="Dismiss"
                        >
                          X
                        </button>
                      </div>
                    </div>
                    <div className="activity-item-details">
                      <small>{formatDate(request.created_at)}</small>
                      <p>{request.admin_notes || 'Your request status has been updated.'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No new request notifications</p>
            )}
          </div>

          <div className="activity-section">
            <h3>Feedback Issues with Admin Response</h3>
            {visibleFeedbackNotifications.length > 0 ? (
              <ul className="activity-list">
                {visibleFeedbackNotifications.map((report) => (
                  <li key={report.id} className="activity-item">
                    <div className="activity-item-header">
                      <strong>{getFeedbackCategoryLabel(report.category)}</strong>
                      <div className="activity-item-actions">
                        <span className={`status-badge ${getFeedbackStatusBadgeClass(report.status)}`}>
                          {getFeedbackStatusLabel(report.status)}
                        </span>
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => dismissFeedbackNotification(report.id)}
                          aria-label="Dismiss feedback notification"
                          title="Dismiss"
                        >
                          X
                        </button>
                      </div>
                    </div>
                    <div className="activity-item-details">
                      <small>{formatDate(report.updated_at || report.created_at)}</small>
                      <p>{truncateText(report.admin_response || '')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No new feedback responses</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
