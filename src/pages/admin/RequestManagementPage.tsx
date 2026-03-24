import { useEffect, useState } from 'react'
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
    await requestService.updateStatus(id, status)
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
          headers={['Student', 'Program', 'Title', 'Type', 'Status', 'Actions']}
          rows={requests.map((item) => [
            item.profiles?.full_name || '-',
            item.profiles?.program || '-',
            item.title,
            item.resource_type,
            item.status,
            <div className="actions" key={item.id}>
              <button className="btn xs" type="button" onClick={() => updateStatus(item.id, 'approved')}>
                Approve
              </button>
              <button className="btn xs outline" type="button" onClick={() => updateStatus(item.id, 'rejected')}>
                Reject
              </button>
            </div>,
          ])}
        />
      </Card>
    </div>
  )
}
