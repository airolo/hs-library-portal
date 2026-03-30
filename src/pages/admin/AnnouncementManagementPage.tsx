import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { announcementService } from '../../services/libraryService'
import type { Announcement } from '../../types/domain'
import { formatDate } from '../../utils/format'

export const AnnouncementManagementPage = () => {
  const [entries, setEntries] = useState<Announcement[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [eventDate, setEventDate] = useState('')

  const load = async () => {
    const data = await announcementService.list()
    setEntries(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await announcementService.list()
      if (mounted) {
        setEntries(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setEventDate('')
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = { title, content, event_date: eventDate || null }
    if (editingId) {
      await announcementService.update(editingId, payload)
    } else {
      await announcementService.create(payload)
    }

    resetForm()
    await load()
  }

  const edit = (entry: Announcement) => {
    setEditingId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
    setEventDate(entry.event_date ? entry.event_date.slice(0, 10) : '')
  }

  const remove = async (id: string) => {
    await announcementService.remove(id)
    await load()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Announcements and Events Management</h2>
        <p>Create, update, and delete announcement and event entries.</p>
      </header>
<Card title="Published Entries">
        <DataTable
          headers={['Title', 'Date', 'Content', 'Actions']}
          rows={entries.map((entry) => [
            entry.title,
            formatDate(entry.event_date || entry.created_at),
            entry.content,
            <div className="actions" key={entry.id}>
              <ActionIconButton icon="edit" label="Edit" onClick={() => edit(entry)} />
              <ActionIconButton
                icon="delete"
                label="Delete"
                variant="danger"
                onClick={() => remove(entry.id)}
              />
            </div>,
          ])}
        />
      </Card>
      <Card title={editingId ? 'Update Announcement/Event' : 'Create Announcement/Event'}>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Event Date
            <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          </label>
          <label>
            Content
            <textarea required rows={4} value={content} onChange={(event) => setContent(event.target.value)} />
          </label>
          <div className="actions">
            <button className="btn" type="submit">
              {editingId ? 'Update' : 'Publish'}
            </button>
            {editingId ? (
              <button className="btn outline" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </Card>

    </div>
  )
}
