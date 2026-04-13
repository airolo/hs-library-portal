import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { requestService } from '../../services/libraryService'
import type { ResourceRequest } from '../../types/domain'
import { formatDateTime } from '../../utils/format'

export const ResourceRequestsPage = () => {
  const [requests, setRequests] = useState<ResourceRequest[]>([])
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState('Book')
  const [details, setDetails] = useState('')

  const loadData = async () => {
    const data = await requestService.listForCurrentUser()
    setRequests(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await requestService.listForCurrentUser()
      if (mounted) {
        setRequests(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await requestService.create({ title, resource_type: resourceType, details })
    setTitle('')
    setDetails('')
    await loadData()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Book and Resource Requests</h2>
        <p>Submit requests and track approval status updates.</p>
      </header>

      <Card title="Create Request">
        <form onSubmit={submitRequest} className="form-grid">
          <label>
            Resource title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Resource type
            <select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
              <option>Book</option>
              <option>Journal</option>
            </select>
          </label>
          <label>
            Details
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} />
          </label>
          <button type="submit" className="btn">
            Submit Request
          </button>
        </form>
      </Card>
      <Card title="Request Tracking">
        <div className="table-scroll-y">
          <DataTable
            headers={['Date', 'Title', 'Type', 'Status', 'Admin Notes']}
            rows={requests.map((item) => [
              formatDateTime(item.created_at),
              item.title,
              item.resource_type,
              item.status,
              item.admin_notes || '-',
            ])}
          />
        </div>
      </Card>
    </div>
  )
}
