import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { researchService } from '../../services/libraryService'
import type { ResearchItem } from '../../types/domain'

export const ResearchManagementPage = () => {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [location, setLocation] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [abstract, setAbstract] = useState('')
  const [keywords, setKeywords] = useState('')
  const [editingItem, setEditingItem] = useState<ResearchItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editProgram, setEditProgram] = useState('')
  const [editYear, setEditYear] = useState(0)
  const [editAbstract, setEditAbstract] = useState('')
  const [editKeywords, setEditKeywords] = useState('')
  const [queueSearch, setQueueSearch] = useState('')
  const [queueProgram, setQueueProgram] = useState('')

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
    setErrorMessage('')

    try {
      await researchService.create({
        title,
        author,
        location,
        program,
        year,
        abstract,
        keywords: keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
        status: 'pending',
        file_url: null,
      })
      setTitle('')
      setAuthor('')
      setLocation('')
      setProgram('')
      setAbstract('')
      setKeywords('')
      await load()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save research entry.')
    }
  }

  const handleEdit = (item: ResearchItem) => {
    setErrorMessage('')
    setEditingItem(item)
    setEditTitle(item.title)
    setEditAuthor(item.author)
    setEditLocation(item.location)
    setEditProgram(item.program)
    setEditYear(item.year)
    setEditAbstract(item.abstract)
    setEditKeywords(item.keywords.join(', '))
  }

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingItem) return

    setErrorMessage('')

    try {
      await researchService.update(editingItem.id, {
        title: editTitle,
        author: editAuthor,
        location: editLocation,
        program: editProgram,
        year: editYear,
        abstract: editAbstract,
        keywords: editKeywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
      })
      setEditingItem(null)
      await load()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update research entry.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this research entry?')) {
      return
    }
    await researchService.remove(id)
    await load()
  }

  const programOptions = Array.from(new Set(items.map((item) => item.program))).sort((a, b) =>
    a.localeCompare(b),
  )

  const filteredItems = items.filter((item) => {
    const normalizedSearch = queueSearch.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.author.toLowerCase().includes(normalizedSearch) ||
      item.location.toLowerCase().includes(normalizedSearch)

    const matchesProgram = !queueProgram || item.program === queueProgram

    return matchesSearch && matchesProgram
  })

  return (
    <div className="page-grid">
      <header>
        <h2>Research Repository Management</h2>
        <p>Upload and manage repository submissions.</p>
      </header>

      <Card title="Upload Research Entry">
        <form onSubmit={submit} className="form-grid compact-admin-form">
          {errorMessage && <p className="error-text full-row">{errorMessage}</p>}
          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Author
            <input required value={author} onChange={(event) => setAuthor(event.target.value)} />
          </label>
          <label>
            Location (Research Collection Shelf)
            <input
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g., Shelf B2 - Thesis Section"
            />
          </label>
          <label>
            Program
            <input required value={program} onChange={(event) => setProgram(event.target.value)} />
          </label>
          <label>
            Year
            <input type="number" required value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <label className="full-row">
            Abstract
            <textarea required rows={3} value={abstract} onChange={(event) => setAbstract(event.target.value)} />
          </label>
          <label className="full-row">
            Keywords (comma-separated)
            <input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
          </label>
          <div className="actions full-row">
            <button className="btn" type="submit">
              Save Entry
            </button>
          </div>
        </form>
      </Card>

      <Card title="Submission Queue">
        <div className="filters-grid" style={{ marginBottom: '0.75rem' }}>
          <label>
            Search
            <input
              value={queueSearch}
              onChange={(event) => setQueueSearch(event.target.value)}
              placeholder="Search title, author, location"
            />
          </label>
          <label>
            Program
            <select value={queueProgram} onChange={(event) => setQueueProgram(event.target.value)}>
              <option value="">All</option>
              {programOptions.map((programOption) => (
                <option key={programOption} value={programOption}>
                  {programOption}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DataTable
          headers={['Title', 'Author', 'Location', 'Program', 'Year', 'Actions']}
          rows={filteredItems.map((item) => [
            item.title,
            item.author,
            item.location,
            item.program,
            item.year,
            <div className="actions actions-nowrap" key={item.id}>
              <ActionIconButton icon="edit" label="Edit" onClick={() => handleEdit(item)} />
              <ActionIconButton
                icon="delete"
                label="Delete"
                variant="danger"
                onClick={() => handleDelete(item.id)}
              />
            </div>,
          ])}
        />
      </Card>

      <Modal
        isOpen={!!editingItem}
        title="Edit Research Entry"
        onClose={() => setEditingItem(null)}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn outline"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                const form = e.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
            >
              Save Changes
            </button>
          </div>
        }
      >
        {editingItem && (
          <form onSubmit={handleSaveEdit} className="form-grid">
            <label>
              Title
              <input required value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label>
              Author
              <input required value={editAuthor} onChange={(event) => setEditAuthor(event.target.value)} />
            </label>
            <label>
              Location (Research Collection Shelf)
              <input
                required
                value={editLocation}
                onChange={(event) => setEditLocation(event.target.value)}
                placeholder="e.g., Shelf B2 - Thesis Section"
              />
            </label>
            <label>
              Program
              <input required value={editProgram} onChange={(event) => setEditProgram(event.target.value)} />
            </label>
            <label>
              Year
              <input type="number" required value={editYear} onChange={(event) => setEditYear(Number(event.target.value))} />
            </label>
            <label>
              Abstract
              <textarea required rows={3} value={editAbstract} onChange={(event) => setEditAbstract(event.target.value)} />
            </label>
            <label>
              Keywords (comma-separated)
              <input value={editKeywords} onChange={(event) => setEditKeywords(event.target.value)} />
            </label>
          </form>
        )}
      </Modal>
    </div>
  )
}
