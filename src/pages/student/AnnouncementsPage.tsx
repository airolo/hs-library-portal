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
        {announcements.length > 0 ? (
          <ul className="list announcements-list">
            {announcements.map((item) => (
              <li key={item.id} className="announcement-item">
                <div className="announcement-meta">{formatDate(item.event_date || item.created_at)}</div>
                <strong className="announcement-title">{item.title}</strong>
                <p className="announcement-content">{item.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="announcements-empty-state">No announcements available yet.</p>
        )}
      </Card>
    </div>
  )
}
