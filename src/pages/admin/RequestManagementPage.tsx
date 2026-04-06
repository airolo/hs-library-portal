import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { requestService } from '../../services/libraryService'
import type { ResourceRequest } from '../../types/domain'

interface RequestRow extends ResourceRequest {
  profiles: { full_name: string; program: string | null }
}

export const RequestManagementPage = () => {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [actionItem, setActionItem] = useState<RequestRow | null>(null)
  const [actionStatus, setActionStatus] = useState<ResourceRequest['status'] | null>(null)
  const [actionAdminNote, setActionAdminNote] = useState('')
  const [actionIsLoading, setActionIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<RequestRow | null>(null)
  const [editStatus, setEditStatus] = useState<ResourceRequest['status']>('approved')
  const [editAdminNote, setEditAdminNote] = useState('')
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [deletingItem, setDeletingItem] = useState<RequestRow | null>(null)
  const [deleteIsLoading, setDeleteIsLoading] = useState(false)

  const load = async () => {
    const data = await requestService.listAll()
    setRequests(data as RequestRow[])
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await requestService.listAll()
      if (mounted) {
        setRequests(data as RequestRow[])
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const openActionModal = (item: RequestRow, status: ResourceRequest['status']) => {
    setActionItem(item)
    setActionStatus(status)
    setActionAdminNote(item.admin_notes || '')
  }

  const closeActionModal = () => {
    if (actionIsLoading) {
      return
    }

    setActionItem(null)
    setActionStatus(null)
    setActionAdminNote('')
  }

  const saveAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!actionItem || !actionStatus) {
      return
    }

    setActionIsLoading(true)

    const trimmedNote = actionAdminNote.trim()
    const fallbackNote = actionStatus === 'approved' ? 'Request approved by admin.' : 'Request rejected by admin.'
    const adminNote = trimmedNote || fallbackNote

    await requestService.updateStatus(actionItem.id, actionStatus, adminNote)
    setActionItem(null)
    setActionStatus(null)
    setActionAdminNote('')
    setActionIsLoading(false)
    await load()
  }

  const openEditModal = (item: RequestRow) => {
    setEditingItem(item)
    setEditStatus(item.status)
    setEditAdminNote(item.admin_notes || '')
  }

  const closeEditModal = () => {
    if (editIsLoading) {
      return
    }
    setEditingItem(null)
    setEditStatus('approved')
    setEditAdminNote('')
  }

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingItem) {
      return
    }

    setEditIsLoading(true)

    const trimmedNote = editAdminNote.trim()
    const fallbackNote = editStatus === 'approved' ? 'Request approved by admin.' : 'Request rejected by admin.'

    await requestService.updateStatus(editingItem.id, editStatus, trimmedNote || fallbackNote)
    setEditingItem(null)
    setEditStatus('approved')
    setEditAdminNote('')
    setEditIsLoading(false)
    await load()
  }

  const openDeleteModal = (item: RequestRow) => {
    setDeletingItem(item)
  }

  const closeDeleteModal = () => {
    if (deleteIsLoading) {
      return
    }
    setDeletingItem(null)
  }

  const confirmDelete = async () => {
    if (!deletingItem) {
      return
    }

    setDeleteIsLoading(true)
    await requestService.remove(deletingItem.id)
    setDeletingItem(null)
    setDeleteIsLoading(false)
    await load()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Book/Resource Request Management</h2>
        <p>Approve or reject submitted requests and monitor resource demand.</p>
      </header>

      <Card title="All Requests">
        <DataTable
          headers={['Student', 'Program', 'Title', 'Type', 'Status', 'Admin Notes', 'Actions']}
          rows={requests.map((item) => [
            item.profiles?.full_name || '-',
            item.profiles?.program || '-',
            item.title,
            item.resource_type,
            item.status,
            item.admin_notes || '-',
            <div className="actions actions-nowrap" key={item.id}>
              {item.status === 'pending' ? (
                <>
                  <ActionIconButton
                    icon="approve"
                    label="Approve"
                    onClick={() => openActionModal(item, 'approved')}
                  />
                  <ActionIconButton
                    icon="reject"
                    label="Reject"
                    variant="outline"
                    onClick={() => openActionModal(item, 'rejected')}
                  />
                </>
              ) : (
                <>
                  <ActionIconButton icon="edit" label="Edit" onClick={() => openEditModal(item)} />
                  <ActionIconButton
                    icon="delete"
                    label="Delete"
                    variant="danger"
                    onClick={() => openDeleteModal(item)}
                  />
                </>
              )}
            </div>,
          ])}
        />
      </Card>

      <Modal
        isOpen={!!actionItem && !!actionStatus}
        title={actionStatus === 'approved' ? 'Approve Request' : 'Reject Request'}
        onClose={closeActionModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn outline"
              onClick={closeActionModal}
              disabled={actionIsLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                const form = e.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={actionIsLoading}
            >
              {actionIsLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {actionItem && actionStatus && (
          <form onSubmit={saveAction} className="form-grid">
            <p>
              <strong>Request:</strong> {actionItem.title}
            </p>
            <p>
              <strong>Action:</strong> {actionStatus === 'approved' ? 'Approve' : 'Reject'}
            </p>
            <label>
              Admin Notes
              <textarea
                rows={4}
                value={actionAdminNote}
                onChange={(event) => setActionAdminNote(event.target.value)}
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!editingItem}
        title="Edit Request"
        onClose={closeEditModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn outline"
              onClick={closeEditModal}
              disabled={editIsLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                const form = e.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
              disabled={editIsLoading}
            >
              {editIsLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editingItem && (
          <form onSubmit={saveEdit} className="form-grid">
            <label>
              Status
              <select
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value as ResourceRequest['status'])}
              >
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label>
              Admin Notes
              <textarea
                rows={4}
                value={editAdminNote}
                onChange={(event) => setEditAdminNote(event.target.value)}
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingItem}
        title="Delete Request"
        onClose={closeDeleteModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn outline"
              onClick={closeDeleteModal}
              disabled={deleteIsLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={confirmDelete}
              disabled={deleteIsLoading}
            >
              {deleteIsLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete this request? <strong>{deletingItem?.title || 'this request'}</strong>?
        </p>
      </Modal>
    </div>
  )
}
