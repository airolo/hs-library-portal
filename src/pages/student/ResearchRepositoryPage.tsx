import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { researchService } from '../../services/libraryService'
import type { ResearchItem } from '../../types/domain'

export const ResearchRepositoryPage = () => {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [query, setQuery] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState<number | ''>('')
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)

  const loadItems = async () => {
    const data = await researchService.list({
      query: query || undefined,
      program: program || undefined,
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
        <p>Search and filter approved research outputs by program, year, and keyword.</p>
      </header>

      <Card title="Filters">
        <div className="filters-grid">
          <label>
            Search keyword
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label>
            Program
            <select value={program} onChange={(event) => setProgram(event.target.value)}>
              <option value="">All</option>
              <option value="Nursing">Nursing</option>
              <option value="Dentistry">Dentistry</option>
              <option value="Medicine">Medicine</option>
            </select>
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
        <DataTable
          headers={['Title', 'Author/s', 'Program', 'Year', 'Location', 'Keywords', 'Actions']}
          rows={items.map((item) => [
            item.title,
            item.author,
            item.program,
            item.year,
            item.location,
            item.keywords.join(', '),
            <div className="actions" key={item.id}>
              <button
                type="button"
                className="btn xs"
                onClick={() => setSelectedItem(item)}
              >
                View
              </button>
            </div>,
          ])}
        />
      </Card>

      <Modal
        isOpen={!!selectedItem}
        title={selectedItem?.title ?? ''}
        onClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Author:</strong> {selectedItem.author}
            </div>
            <div>
              <strong>Program:</strong> {selectedItem.program}
            </div>
            <div>
              <strong>Year:</strong> {selectedItem.year}
            </div>
            <div>
              <strong>Location:</strong> {selectedItem.location}
            </div>
            <div>
              <strong>Keywords:</strong> {selectedItem.keywords.join(', ')}
            </div>
            <div>
              <strong>Abstract:</strong>
              <p style={{ marginTop: '0.5rem' }}>{selectedItem.abstract}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
