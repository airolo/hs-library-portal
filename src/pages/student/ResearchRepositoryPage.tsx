import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { researchService } from '../../services/libraryService'
import type { ResearchItem } from '../../types/domain'

export const ResearchRepositoryPage = () => {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [query, setQuery] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState<number | ''>('')

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
            <input value={program} onChange={(event) => setProgram(event.target.value)} />
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
          headers={['Title', 'Author', 'Program', 'Year', 'Keywords']}
          rows={items.map((item) => [
            item.title,
            item.author,
            item.program,
            item.year,
            item.keywords.join(', '),
          ])}
        />
      </Card>
    </div>
  )
}
