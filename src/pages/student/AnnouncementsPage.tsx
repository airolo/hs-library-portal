import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { announcementService } from '../../services/libraryService'
import type { Announcement } from '../../types/domain'
import { formatDate } from '../../utils/format'

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    announcementService.list().then(setAnnouncements)
  }, [])

  return (
    <div className="page-grid">
      <header>
        <h2>Announcements and Events</h2>
        <p>Stay informed about library advisories, activities, and schedules.</p>
      </header>

      <Card title="All Announcements and Events">
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
    </div>
  )
}
