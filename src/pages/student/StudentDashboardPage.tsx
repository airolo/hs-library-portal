import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { announcementService, attendanceService, requestService, roomService } from '../../services/libraryService'
import type { Announcement, ResourceRequest } from '../../types/domain'
import { formatDate } from '../../utils/format'
import '../student/ActivitySummary.css'

export const StudentDashboardPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const [reservationCount, setReservationCount] = useState(0)
  const [activeRequests, setActiveRequests] = useState<ResourceRequest[]>([])

  useEffect(() => {
    const load = async () => {
      const [
        announcementData,
        attendanceTotal,
        requestTotal,
        reservationTotal,
        requests,
      ] = await Promise.all([
        announcementService.listRecent(5),
        attendanceService.countForCurrentUser(),
        requestService.countForCurrentUser(),
        roomService.countReservationsForCurrentUser(),
        requestService.listActiveRequestsForCurrentUser(5),
      ])

      setAnnouncements(announcementData)
      setAttendanceCount(attendanceTotal)
      setRequestCount(requestTotal)
      setReservationCount(reservationTotal)
      setActiveRequests(requests.filter((item) => item.status !== 'approved'))
    }

    load()
  }, [])

  const getStatusBadgeClass = (status: ResourceRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'status-pending'
      case 'approved':
        return 'status-approved'
      case 'rejected':
        return 'status-rejected'
      default:
        return ''
    }
  }

  const formatStatusLabel = (status: string) => {
    if (status === 'rejected') {
      return 'Reject'
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Student Dashboard</h2>
        <p>Access core library services and updates.</p>
      </header>

      <section className="stats-grid">
        <StatCard label="Attendance Entries" value={attendanceCount} />
        <StatCard label="Resource Requests" value={requestCount} />
        <StatCard label="Room Reservations" value={reservationCount} />
      </section>

      <Card title="Latest Announcements">
        <ul className="list">
          {announcements.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.content}</p>
              <small>{formatDate(item.event_date || item.created_at)}</small>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Activity Summary">
        <div className="activity-summary">
          <div className="activity-section">
            <h3>Pending Resource Requests</h3>
            {activeRequests.length > 0 ? (
              <ul className="activity-list">
                {activeRequests.map((request) => (
                  <li key={request.id} className="activity-item">
                    <div className="activity-item-header">
                      <strong>{request.title}</strong>
                      <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                        {formatStatusLabel(request.status)}
                      </span>
                    </div>
                    <div className="activity-item-details">
                      <small>{formatDate(request.created_at)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No active requests</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
