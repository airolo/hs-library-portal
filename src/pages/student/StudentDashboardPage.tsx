import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { announcementService, attendanceService, requestService, roomService } from '../../services/libraryService'
import type { Announcement } from '../../types/domain'
import { formatDate } from '../../utils/format'

export const StudentDashboardPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const [reservationCount, setReservationCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [announcementData, attendanceData, requestData, reservationData] = await Promise.all([
        announcementService.list(),
        attendanceService.listForCurrentUser(),
        requestService.listForCurrentUser(),
        roomService.listReservationsForCurrentUser(),
      ])

      setAnnouncements(announcementData.slice(0, 5))
      setAttendanceCount(attendanceData.length)
      setRequestCount(requestData.length)
      setReservationCount(reservationData.length)
    }

    load()
  }, [])

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

      <Card title="Quick Access">
        <div className="quick-links">
          <a href="/student/attendance">Log Attendance</a>
          <a href="/student/resources">Browse Resources</a>
          <a href="/student/research">Search Research Repository</a>
          <a href="/student/requests">Submit Resource Request</a>
          <a href="/student/rooms">Reserve Discussion Room</a>
        </div>
      </Card>
    </div>
  )
}
