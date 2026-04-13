import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { resourceService } from '../../services/libraryService'
import type { LibraryResource } from '../../types/domain'

const renderAuthorCell = (author: string) => {
  const words = author.trim().split(/\s+/)

  if (words.length <= 3) {
    return <span className="author-wrap">{author || '-'}</span>
  }

  const splitAt = Math.ceil(words.length / 2)
  const lineOne = words.slice(0, splitAt).join(' ')
  const lineTwo = words.slice(splitAt).join(' ')

  return (
    <span className="author-wrap">
      <span>{lineOne}</span>
      <span>{lineTwo}</span>
    </span>
  )
}

export const BrowseResourcesPage = () => {
  const [resources, setResources] = useState<LibraryResource[]>([])
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null)
  const [search, setSearch] = useState('')
  const [resourceType, setResourceType] = useState<'' | 'book' | 'journal'>('')
  const [category, setCategory] = useState<'' | 'Dentistry' | 'Nursing' | 'Medicine'>('')

  const load = async () => {
    const resourceData = await resourceService.list({
      query: search || undefined,
      resourceType,
      category,
    })
    setResources(resourceData)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const resourceData = await resourceService.list()

      if (!mounted) {
        return
      }

      setResources(resourceData)
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="page-grid">
      <header>
        <h2>Browse Resources</h2>
        <p>View books and journals available in OPAC and newly uploaded collections.</p>
      </header>

      <Card title="Catalog Filters">
        <div className="filters-grid">
          <label>
            Search 
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
          <label>
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as '' | 'Dentistry' | 'Nursing' | 'Medicine')
              }
            >
              <option value="">All</option>
              <option value="Dentistry">Dentistry</option>
              <option value="Nursing">Nursing</option>
              <option value="Medicine">Medicine</option>
            </select>
          </label>
          <button className="btn" type="button" onClick={load}>
            Apply Filters
          </button>
        </div>
      </Card>

      <Card title="Available Catalog">
        <div className="table-scroll-y">
          <DataTable
            headers={[
              'Title',
              'Type',
              'Author',
              'Call Number',
              'Category',
              'Copies',
              
            ]}
            rows={resources.map((item) => [
              item.title,
              item.resource_type,
              renderAuthorCell(item.author),
              item.call_number || '-',
              item.category || '-',
              `${item.available_copies}/${item.total_copies}`,
             
            ])}
          />
        </div>
      </Card>

      <Modal
        isOpen={!!selectedResource}
        title={selectedResource?.title ?? ''}
        onClose={() => setSelectedResource(null)}
      >
        {selectedResource && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Type:</strong> {selectedResource.resource_type}
            </div>
            <div>
              <strong>Author:</strong> {selectedResource.author}
            </div>
            <div>
              <strong>Call Number:</strong> {selectedResource.call_number || '-'}
            </div>
            <div>
              <strong>Category:</strong> {selectedResource.category || '-'}
            </div>
            <div>
              <strong>Copies:</strong> {selectedResource.available_copies}/{selectedResource.total_copies}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
