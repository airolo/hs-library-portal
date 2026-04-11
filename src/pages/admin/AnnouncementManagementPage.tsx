import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { announcementService } from '../../services/libraryService'
import type { Announcement } from '../../types/domain'
import { formatDate } from '../../utils/format'

export const AnnouncementManagementPage = () => {
  const [entries, setEntries] = useState<Announcement[]>([])
  const [editingEntry, setEditingEntry] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [deleteEntry, setDeleteEntry] = useState<Announcement | null>(null)
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [deleteIsLoading, setDeleteIsLoading] = useState(false)

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

  const edit = (entry: Announcement) => {
    setEditingEntry(entry)
    setTitle(entry.title)
    setContent(entry.content)
    setEventDate(entry.event_date ? entry.event_date.slice(0, 10) : '')
  }

  const closeEditModal = () => {
    if (editIsLoading) {
      return
    }

    setEditingEntry(null)
    setTitle('')
    setContent('')
    setEventDate('')
  }

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingEntry) {
      return
    }

    setEditIsLoading(true)

    try {
      await announcementService.update(editingEntry.id, {
        title,
        content,
        event_date: eventDate || null,
      })
      closeEditModal()
      await load()
    } finally {
      setEditIsLoading(false)
    }
  }

  const openDeleteModal = (entry: Announcement) => {
    setDeleteEntry(entry)
  }

  const closeDeleteModal = () => {
    if (deleteIsLoading) {
      return
    }

    setDeleteEntry(null)
  }

  const confirmDelete = async () => {
    if (!deleteEntry) {
      return
    }

    setDeleteIsLoading(true)

    try {
      await announcementService.remove(deleteEntry.id)
      setDeleteEntry(null)
      await load()
    } finally {
      setDeleteIsLoading(false)
    }
  }

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await announcementService.create({
      title,
      content,
      event_date: eventDate || null,
    })

    setEditingEntry(null)
    setTitle('')
    setContent('')
    setEventDate('')
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
                onClick={() => openDeleteModal(entry)}
              />
            </div>,
          ])}
        />
      </Card>
      <Card title="Create Announcement/Event">
        <form className="form-grid" onSubmit={submitCreate}>
          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
             Date
            <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          </label>
          <label>
            Content
            <textarea required rows={4} value={content} onChange={(event) => setContent(event.target.value)} />
          </label>
          <div className="actions">
            <button className="btn" type="submit">
              Publish
            </button>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={!!editingEntry}
        title="Edit Announcement/Event"
        onClose={closeEditModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn outline" onClick={closeEditModal} disabled={editIsLoading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={editIsLoading}
              onClick={(event) => {
                const form = event.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
            >
              {editIsLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editingEntry && (
          <form className="form-grid" onSubmit={saveEdit}>
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
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteEntry}
        title="Delete Announcement/Event"
        onClose={closeDeleteModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn outline" onClick={closeDeleteModal} disabled={deleteIsLoading}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={confirmDelete} disabled={deleteIsLoading}>
              {deleteIsLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deleteEntry?.title || 'this announcement'}</strong>?
        </p>
      </Modal>

    </div>
  )
}
