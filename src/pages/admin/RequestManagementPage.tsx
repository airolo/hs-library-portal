import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { requestService } from '../../services/libraryService'
import type { ResourceRequest } from '../../types/domain'

interface RequestRow extends ResourceRequest {
  profiles: { full_name: string; program: string | null }
}

export const RequestManagementPage = () => {
  const [requests, setRequests] = useState<RequestRow[]>([])

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

  const updateStatus = async (id: string, status: ResourceRequest['status']) => {
    const actionLabel = status === 'approved' ? 'approve' : 'reject'
    const promptMessage = `Enter a note to ${actionLabel} this request (optional):`
    const noteInput = window.prompt(promptMessage)

    if (noteInput === null) {
      return
    }

    const trimmedNote = noteInput.trim()
    const fallbackNote = status === 'approved' ? 'Request approved by admin.' : 'Request rejected by admin.'
    const adminNote = trimmedNote || fallbackNote

    await requestService.updateStatus(id, status, adminNote)
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
            <div className="actions" key={item.id}>
              <ActionIconButton
                icon="approve"
                label="Approve"
                onClick={() => updateStatus(item.id, 'approved')}
              />
              <ActionIconButton
                icon="reject"
                label="Reject"
                variant="outline"
                onClick={() => updateStatus(item.id, 'rejected')}
              />
            </div>,
          ])}
        />
      </Card>
    </div>
  )
}
