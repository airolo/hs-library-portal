import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { resourceService } from '../../services/libraryService'
import type { LibraryResource, ResourceBorrowTransaction } from '../../types/domain'
import { formatDate } from '../../utils/format'

export const BrowseResourcesPage = () => {
  const [resources, setResources] = useState<LibraryResource[]>([])
  const [myBorrows, setMyBorrows] = useState<ResourceBorrowTransaction[]>([])
  const [search, setSearch] = useState('')
  const [resourceType, setResourceType] = useState<'' | 'book' | 'journal'>('')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const [resourceData, borrowData] = await Promise.all([
      resourceService.list({ query: search || undefined, resourceType }),
      resourceService.listBorrowsForCurrentUser(),
    ])

    setResources(resourceData)
    setMyBorrows(borrowData)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const [resourceData, borrowData] = await Promise.all([
        resourceService.list(),
        resourceService.listBorrowsForCurrentUser(),
      ])

      if (!mounted) {
        return
      }

      setResources(resourceData)
      setMyBorrows(borrowData)
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const borrowResource = async (resourceId: string) => {
    setError(null)

    try {
      await resourceService.borrow(resourceId)
      await load()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Borrowing failed.'
      setError(message)
    }
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Browse Resources</h2>
        <p>Browse books and journals currently available for borrowing.</p>
      </header>

      <Card title="Catalog Filters">
        <div className="filters-grid">
          <label>
            Search title/author/category
            <input value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label>
            Resource Type
            <select
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value as '' | 'book' | 'journal')}
            >
              <option value="">All</option>
              <option value="book">Book</option>
              <option value="journal">Journal</option>
            </select>
          </label>
          <button className="btn" type="button" onClick={load}>
            Apply Filters
          </button>
        </div>
      </Card>

      <Card title="Available Catalog">
        {error ? <p className="error-text">{error}</p> : null}
        <DataTable
          headers={[
            'Title',
            'Type',
            'Author',
            'Category',
            'Copies (Available/Total)',
            'Action',
          ]}
          rows={resources.map((item) => [
            item.title,
            item.resource_type,
            item.author,
            item.category || '-',
            `${item.available_copies}/${item.total_copies}`,
            <button
              key={item.id}
              type="button"
              className="btn xs"
              disabled={item.available_copies <= 0}
              onClick={() => borrowResource(item.id)}
            >
              {item.available_copies <= 0 ? 'Unavailable' : 'Borrow'}
            </button>,
          ])}
        />
      </Card>

      <Card title="My Borrowed Resources">
        <DataTable
          headers={['Title', 'Type', 'Author', 'Borrowed Date', 'Due Date', 'Status']}
          rows={myBorrows.map((item) => [
            item.library_resources?.title || '-',
            item.library_resources?.resource_type || '-',
            item.library_resources?.author || '-',
            formatDate(item.borrowed_at),
            formatDate(item.due_at),
            item.status,
          ])}
        />
      </Card>
    </div>
  )
}
