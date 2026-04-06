import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { feedbackService } from '../../services/libraryService'
import type { FeedbackReport } from '../../types/domain'

export const FeedbackManagementPage = () => {
  const [reports, setReports] = useState<FeedbackReport[]>([])
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null)
  const [targetStatus, setTargetStatus] = useState<FeedbackReport['status'] | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingReport, setDeletingReport] = useState<FeedbackReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getCategoryLabel = (category: FeedbackReport['category']) => {
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

  const getPriorityLabel = (value: FeedbackReport['priority']) => {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  const getStatusLabel = (value: FeedbackReport['status']) => {
    switch (value) {
      case 'new':
        return 'New'
      case 'in_review':
        return 'In Review'
      case 'resolved':
        return 'Resolved'
      case 'closed':
        return 'Closed'
      default:
        return value
    }
  }

  const load = async () => {
    const data = await feedbackService.listAll()
    setReports(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await feedbackService.listAll()
      if (mounted) {
        setReports(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const openActionModal = (report: FeedbackReport, status: FeedbackReport['status']) => {
    setSelectedReport(report)
    setTargetStatus(status)
    setAdminResponse(report.admin_response || '')
    setActionError(null)
  }

  const openDeleteModal = (report: FeedbackReport) => {
    setDeletingReport(report)
    setActionError(null)
  }

  const closeActionModal = () => {
    if (isSaving) {
      return
    }

    setSelectedReport(null)
    setTargetStatus(null)
    setAdminResponse('')
    setActionError(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) {
      return
    }

    setDeletingReport(null)
    setActionError(null)
  }

  const saveAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedReport || !targetStatus) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    try {
      const trimmedResponse = adminResponse.trim()
      const nextStatus = trimmedResponse ? 'resolved' : targetStatus
      const fallbackResponse =
        nextStatus === 'in_review'
          ? 'Request is currently under review.'
          : 'Request has been resolved by the admin.'

      await feedbackService.updateStatus(selectedReport.id, nextStatus, trimmedResponse || fallbackResponse)
      setSelectedReport(null)
      setTargetStatus(null)
      setAdminResponse('')
      await load()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update feedback report.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteReport = async () => {
    if (!deletingReport) {
      return
    }

    setIsDeleting(true)
    setActionError(null)

    try {
      await feedbackService.remove(deletingReport.id)
      setDeletingReport(null)
      await load()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete feedback report.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Feedback and Issue Management</h2>
        <p>Review student reports and track resolution of library and repository concerns.</p>
      </header>

      <Card title="Submitted Reports">
        <DataTable
          headers={['Student', 'Program', 'Category', 'Priority', 'Description', 'Status', 'Admin Response', 'Actions']}
          rows={reports.map((item) => [
            item.profiles?.full_name || '-',
            item.profiles?.program || '-',
            getCategoryLabel(item.category),
            getPriorityLabel(item.priority),
            item.description,
            getStatusLabel(item.status),
            item.admin_response || '-',
            <div className="actions actions-nowrap" key={item.id}>
              {item.status === 'resolved' ? (
                <>
                  <ActionIconButton
                    icon="edit"
                    label="Edit"
                    onClick={() => openActionModal(item, 'resolved')}
                  />
                  <ActionIconButton
                    icon="delete"
                    label="Delete"
                    variant="danger"
                    onClick={() => openDeleteModal(item)}
                  />
                </>
              ) : (
                <ActionIconButton
                  icon="approve"
                  label="Resolve"
                  onClick={() => openActionModal(item, 'resolved')}
                />
              )}
            </div>,
          ])}
        />
      </Card>

      <Modal
        isOpen={!!selectedReport && !!targetStatus}
        title={selectedReport?.status === 'resolved' ? 'Edit Response' : 'Resolve Report'}
        onClose={closeActionModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn outline" onClick={closeActionModal} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={isSaving}
              onClick={(event) => {
                const form = event.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {selectedReport && targetStatus && (
          <form className="form-grid" onSubmit={saveAction}>
            {actionError ? <p className="error-text">{actionError}</p> : null}
            <p>
              <strong>Student:</strong> {selectedReport.profiles?.full_name || '-'}
            </p>
            <p>
              <strong>Category:</strong> {getCategoryLabel(selectedReport.category)}
            </p>
            <label>
              Admin Response
              <textarea
                rows={4}
                value={adminResponse}
                onChange={(event) => setAdminResponse(event.target.value)}
                placeholder={
                  targetStatus === 'in_review'
                    ? 'Add a note for the student while the report is being reviewed.'
                    : 'Add a final response for the student.'
                }
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingReport}
        title="Delete Feedback Report"
        onClose={closeDeleteModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn outline" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={deleteReport} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deletingReport?.category ? getCategoryLabel(deletingReport.category) : 'this report'}</strong>?
        </p>
      </Modal>
    </div>
  )
}
