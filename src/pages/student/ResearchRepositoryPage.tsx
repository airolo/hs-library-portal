import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { researchService } from '../../services/libraryService'
import type { ResearchItem } from '../../types/domain'

const renderAuthorVertical = (author: string) => {
  const commaSeparatedAuthors = author
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const lines =
    commaSeparatedAuthors.length > 1
      ? commaSeparatedAuthors
      : (() => {
          const words = author.trim().split(/\s+/).filter(Boolean)
          if (words.length <= 2) return [author]
          const splitAt = Math.ceil(words.length / 2)
          return [words.slice(0, splitAt).join(' '), words.slice(splitAt).join(' ')]
        })()

  return (
    <span className="author-wrap">
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>{line}</span>
      ))}
    </span>
  )
}

export const ResearchRepositoryPage = () => {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [query, setQuery] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)

  const loadItems = async () => {
    const data = await researchService.list({
      query: query || undefined,
      year: year || undefined,
      status: 'approved',
    })
    setItems(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await researchService.list({ status: 'approved' })
      if (mounted) {
        setItems(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="page-grid">
      <header>
        <h2>Research Repository</h2>
        <p>Search and filter approved research outputs by title, author, and year.</p>
      </header>

      <Card title="Filters">
        <div className="filters-grid">
          <label>
            Search 
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label>
            Year
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(event) => setYear(event.target.value ? Number(event.target.value) : '')}
            />
          </label>
          <button className="btn" type="button" onClick={loadItems}>
            Apply Filters
          </button>
        </div>
      </Card>

      <Card title="Repository Entries">
        <div className="table-scroll-y">
          <DataTable
            headers={['Title', 'Author/s', 'Year']}
            rows={items.map((item) => [
              item.title,
              renderAuthorVertical(item.author),
              item.year,
             
            ])}
          />
        </div>
      </Card>

      <Modal
        isOpen={!!selectedItem}
        title={selectedItem?.title ?? ''}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Author/s:</strong> {selectedItem.author}
            </div>
            <div>
              <strong>Year:</strong> {selectedItem.year}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
