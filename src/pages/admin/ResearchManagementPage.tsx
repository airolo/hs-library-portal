import { useEffect, useRef, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { researchService } from '../../services/libraryService'
import type { ResearchItem } from '../../types/domain'
import { getExcelNumber, getExcelText, readExcelRows } from '../../utils/excelImport'

const DEFAULT_PROGRAM = 'Nursing'
const DEFAULT_LOCATION = 'Unassigned shelf'
const DEFAULT_ABSTRACT = 'No abstract provided.'
const DEFAULT_THESIS_CATEGORY: ResearchItem['thesis_category'] = 'Undergraduate Nursing Thesis'

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

export const ResearchManagementPage = () => {
  const [items, setItems] = useState<ResearchItem[]>([])
  const importInputRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [thesisCategory, setThesisCategory] = useState<ResearchItem['thesis_category']>(DEFAULT_THESIS_CATEGORY)
  const [year, setYear] = useState(new Date().getFullYear())
  const [editingItem, setEditingItem] = useState<ResearchItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editThesisCategory, setEditThesisCategory] = useState<ResearchItem['thesis_category']>(DEFAULT_THESIS_CATEGORY)
  const [editYear, setEditYear] = useState(0)
  const [deletingItem, setDeletingItem] = useState<ResearchItem | null>(null)
  const [deleteIsLoading, setDeleteIsLoading] = useState(false)
  const [queueSearch, setQueueSearch] = useState('')
  const [importIsLoading, setImportIsLoading] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const load = async () => {
    const data = await researchService.list()
    const sorted = [...data].sort((a, b) => a.title.localeCompare(b.title))
    setItems(sorted)
  }

  const openImportDialog = () => {
    importInputRef.current?.click()
  }

  const resolveThesisCategory = (value: string) => {
    const normalizedValue = value.trim().toLowerCase()

    if (normalizedValue.includes('master')) {
      return 'Master of Arts in Nursing Thesis' as const
    }

    return 'Undergraduate Nursing Thesis' as const
  }

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setImportFeedback(null)
    setImportIsLoading(true)

    try {
      const rows = await readExcelRows(file)

      if (rows.length === 0) {
        throw new Error('The selected workbook does not contain any rows to import.')
      }

      let importedCount = 0
      const skippedRows: string[] = []

      for (const [index, row] of rows.entries()) {
        try {
          const importedTitle = getExcelText(row, ['title'])
          const importedAuthor = getExcelText(row, ['author', 'author/s', 'authors'])
          const importedYear = getExcelNumber(row, ['year'])

          if (!importedTitle) {
            throw new Error('Title is required.')
          }

          if (!importedAuthor) {
            throw new Error('Author is required.')
          }

          if (!importedYear) {
            throw new Error('Year is required.')
          }

          const categoryText = getExcelText(row, ['thesis category', 'thesis_category', 'category'])
          const importedStatus = getExcelText(row, ['status']).toLowerCase()
          const importedKeywords = getExcelText(row, ['keywords'])
            .split(/[,;|]/)
            .map((keyword) => keyword.trim())
            .filter(Boolean)

          await researchService.create({
            title: importedTitle,
            author: importedAuthor,
            thesis_category: categoryText ? resolveThesisCategory(categoryText) : DEFAULT_THESIS_CATEGORY,
            location: getExcelText(row, ['location']) || DEFAULT_LOCATION,
            program: getExcelText(row, ['program']) || DEFAULT_PROGRAM,
            year: importedYear,
            abstract: getExcelText(row, ['abstract']) || DEFAULT_ABSTRACT,
            keywords: importedKeywords,
            status: importedStatus === 'pending' || importedStatus === 'rejected' ? importedStatus : 'approved',
            file_url: getExcelText(row, ['file url', 'file_url']) || null,
          })

          importedCount += 1
        } catch (rowError) {
          skippedRows.push(
            `Row ${index + 2}: ${rowError instanceof Error ? rowError.message : 'Invalid row data.'}`,
          )
        }
      }

      await load()

      if (importedCount === 0) {
        throw new Error(skippedRows[0] || 'No rows could be imported from the workbook.')
      }

      const suffix = importedCount === 1 ? 'entry' : 'entries'
      const skippedMessage = skippedRows.length > 0 ? ` ${skippedRows.length} row(s) were skipped.` : ''
      setImportFeedback({
        type: 'success',
        message: `Imported ${importedCount} thesis ${suffix}.${skippedMessage}`,
      })
    } catch (error) {
      setImportFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import the Excel file.',
      })
    } finally {
      setImportIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await researchService.list()
      if (mounted) {
        const sorted = [...data].sort((a, b) => a.title.localeCompare(b.title))
        setItems(sorted)
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
        thesis_category: thesisCategory,
        location: DEFAULT_LOCATION,
        program: DEFAULT_PROGRAM,
        year,
        abstract: DEFAULT_ABSTRACT,
        keywords: [],
        status: 'approved',
        file_url: null,
      })
      setTitle('')
      setAuthor('')
      setThesisCategory(DEFAULT_THESIS_CATEGORY)
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
    setEditThesisCategory(item.thesis_category)
    setEditYear(item.year)
  }

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingItem) return

    setErrorMessage('')

    try {
      await researchService.update(editingItem.id, {
        title: editTitle,
        author: editAuthor,
        thesis_category: editThesisCategory,
        year: editYear,
      })
      setEditingItem(null)
      await load()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update research entry.')
    }
  }

  const openDeleteModal = (item: ResearchItem) => {
    setDeletingItem(item)
  }

  const closeDeleteModal = () => {
    if (deleteIsLoading) {
      return
    }

    setDeletingItem(null)
  }

  const confirmDelete = async () => {
    if (!deletingItem) {
      return
    }

    setDeleteIsLoading(true)

    try {
      await researchService.remove(deletingItem.id)
      setDeletingItem(null)
      await load()
    } finally {
      setDeleteIsLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const normalizedSearch = queueSearch.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.author.toLowerCase().includes(normalizedSearch) ||
      String(item.year).includes(normalizedSearch)

    return matchesSearch
  })

  return (
    <div className="page-grid">
      <header>
        <h2>Thesis Management</h2>
        <p>Upload and manage repository submissions.</p>
      </header>

      <Card
        title="Upload Research Entry"
        actions={
          <button type="button" className="btn xs" onClick={openImportDialog} disabled={importIsLoading}>
            {importIsLoading ? 'Importing...' : 'Import Excel'}
          </button>
        }
      >
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelImport}
          style={{ display: 'none' }}
        />
        {importFeedback ? (
          <div className={importFeedback.type === 'error' ? 'error-message' : 'success-message'}>
            {importFeedback.message}
          </div>
        ) : null}
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
            Category
            <select
              value={thesisCategory}
              onChange={(event) => setThesisCategory(event.target.value as ResearchItem['thesis_category'])}
            >
              <option value="Undergraduate Nursing Thesis">Undergraduate Nursing Thesis</option>
              <option value="Master of Arts in Nursing Thesis">Master of Arts in Nursing Thesis</option>
            </select>
          </label>
          <label>
            Year
            <input type="number" required value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <div className="actions full-row">
            <button className="btn" type="submit">
              Add Research
            </button>
          </div>
        </form>
      </Card>

      <Card title="Research Catalog">
        <div className="filters-grid" style={{ marginBottom: '0.75rem' }}>
          <label>
            Search
            <input
              value={queueSearch}
              onChange={(event) => setQueueSearch(event.target.value)}
              placeholder="Search title, author, year"
            />
          </label>
        </div>
        <div className="table-scroll-y">
          <DataTable
            headers={['Title', 'Category', 'Author/s', 'Year', 'Actions']}
            rows={filteredItems.map((item) => [
              item.title,
              item.thesis_category,
              renderAuthorVertical(item.author),
              item.year,
              <div className="table-actions" key={item.id}>
                <ActionIconButton icon="edit" label="Edit" onClick={() => handleEdit(item)} />
                <ActionIconButton
                  icon="delete"
                  label="Delete"
                  variant="danger"
                  onClick={() => openDeleteModal(item)}
                />
              </div>,
            ])}
          />
        </div>
      </Card>

      <Modal
        isOpen={!!editingItem}
        title="Edit Research Entry"
        onClose={() => setEditingItem(null)}
        footer={
          <div className="modal-actions">
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
              Author/s
              <input required value={editAuthor} onChange={(event) => setEditAuthor(event.target.value)} />
            </label>
            <label>
              Category
              <select
                value={editThesisCategory}
                onChange={(event) => setEditThesisCategory(event.target.value as ResearchItem['thesis_category'])}
              >
                <option value="Undergraduate Nursing Thesis">Undergraduate Nursing Thesis</option>
                <option value="Master of Arts in Nursing Thesis">Master of Arts in Nursing Thesis</option>
              </select>
            </label>
            <label>
              Year
              <input type="number" required value={editYear} onChange={(event) => setEditYear(Number(event.target.value))} />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deletingItem}
        title="Delete Research Entry"
        onClose={closeDeleteModal}
        footer={
          <div className="modal-actions">
            <button type="button" className="btn outline" onClick={closeDeleteModal} disabled={deleteIsLoading}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={confirmDelete} disabled={deleteIsLoading}>
              {deleteIsLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deletingItem?.title || 'this research entry'}</strong>?
        </p>
      </Modal>
    </div>
  )
}
