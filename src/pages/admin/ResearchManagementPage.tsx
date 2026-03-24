import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { researchService } from '../../services/libraryService'
import type { ResearchItem } from '../../types/domain'

export const ResearchManagementPage = () => {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [abstract, setAbstract] = useState('')
  const [keywords, setKeywords] = useState('')

  const load = async () => {
    const data = await researchService.list()
    setItems(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await researchService.list()
      if (mounted) {
        setItems(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await researchService.create({
      title,
      author,
      program,
      year,
      abstract,
      keywords: keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
      status: 'pending',
      file_url: null,
    })
    setTitle('')
    setAuthor('')
    setProgram('')
    setAbstract('')
    setKeywords('')
    await load()
  }

  const setStatus = async (id: string, status: ResearchItem['status']) => {
    await researchService.updateStatus(id, status)
    await load()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Research Repository Management</h2>
        <p>Upload, review, and approve repository submissions.</p>
      </header>

      <Card title="Upload Research Entry">
        <form onSubmit={submit} className="form-grid">
          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Author
            <input required value={author} onChange={(event) => setAuthor(event.target.value)} />
          </label>
          <label>
            Program
            <input required value={program} onChange={(event) => setProgram(event.target.value)} />
          </label>
          <label>
            Year
            <input type="number" required value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <label>
            Abstract
            <textarea required rows={3} value={abstract} onChange={(event) => setAbstract(event.target.value)} />
          </label>
          <label>
            Keywords (comma-separated)
            <input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
          </label>
          <button className="btn" type="submit">
            Save Entry
          </button>
        </form>
      </Card>

      <Card title="Submission Queue">
        <DataTable
          headers={['Title', 'Author', 'Program', 'Year', 'Status', 'Actions']}
          rows={items.map((item) => [
            item.title,
            item.author,
            item.program,
            item.year,
            item.status,
            <div className="actions" key={item.id}>
              <button type="button" className="btn xs" onClick={() => setStatus(item.id, 'approved')}>
                Approve
              </button>
              <button type="button" className="btn xs outline" onClick={() => setStatus(item.id, 'rejected')}>
                Reject
              </button>
            </div>,
          ])}
        />
      </Card>
    </div>
  )
}
