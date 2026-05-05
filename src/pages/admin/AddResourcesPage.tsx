import { useEffect, useRef, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { resourceService } from '../../services/libraryService'
import type { LibraryResource } from '../../types/domain'
import { getExcelNumber, getExcelText, readExcelRows } from '../../utils/excelImport'

export const AddResourcesPage = () => {
  const [resources, setResources] = useState<LibraryResource[]>([])
  const importInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState<'book' | 'journal'>('book')
  const [author, setAuthor] = useState('')
  const [callNumber, setCallNumber] = useState('')
  const [copyright, setCopyright] = useState('')
  const [totalCopies, setTotalCopies] = useState(1)
  const [availableCopies, setAvailableCopies] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editingItem, setEditingItem] = useState<LibraryResource | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editResourceType, setEditResourceType] = useState<'book' | 'journal'>('book')
  const [editAuthor, setEditAuthor] = useState('')
  const [editCallNumber, setEditCallNumber] = useState('')
  const [editCopyright, setEditCopyright] = useState('')
  const [editTotalCopies, setEditTotalCopies] = useState(1)
  const [editAvailableCopies, setEditAvailableCopies] = useState(1)
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryType, setInventoryType] = useState<'' | 'book' | 'journal'>('')
  const [importIsLoading, setImportIsLoading] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const load = async () => {
    const data = await resourceService.list()
    setResources(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await resourceService.list()
      if (mounted) {
        setResources(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const resetForm = () => {
    setTitle('')
    setResourceType('book')
    setAuthor('')
    setCallNumber('')
    setCopyright('')
    setTotalCopies(1)
    setAvailableCopies(1)
    setError(null)
    setSuccess(false)
  }

  const openImportDialog = () => {
    importInputRef.current?.click()
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
          const resourceTitle = getExcelText(row, ['title'])
          if (!resourceTitle) {
            throw new Error('Title is required.')
          }

          const typeValue = getExcelText(row, ['type', 'resource type', 'resource_type'])
          const importedType: 'book' | 'journal' = typeValue.toLowerCase().includes('journal') ? 'journal' : 'book'
          const importedTotalCopies = getExcelNumber(row, ['total copies', 'total_copies', 'copies']) ?? 1
          const normalizedTotalCopies = importedTotalCopies > 0 ? importedTotalCopies : 1
          const importedAvailableCopies = getExcelNumber(row, ['available copies', 'available_copies']) ?? normalizedTotalCopies

          await resourceService.create({
            title: resourceTitle,
            resource_type: importedType,
            author: getExcelText(row, ['author']) || '',
            call_number: getExcelText(row, ['call number', 'call_number']) || null,
            copyright: getExcelText(row, ['copyright']) || null,
            description: null,
            total_copies: normalizedTotalCopies,
            available_copies: Math.min(Math.max(importedAvailableCopies, 0), normalizedTotalCopies),
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

      const suffix = importedCount === 1 ? 'resource' : 'resources'
      const skippedMessage = skippedRows.length > 0 ? ` ${skippedRows.length} row(s) were skipped.` : ''
      setImportFeedback({
        type: 'success',
        message: `Imported ${importedCount} ${suffix}.${skippedMessage}`,
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

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const payload = {
        title,
        resource_type: resourceType,
        author: author.trim() || '',
        call_number: callNumber || null,
        copyright: copyright.trim() || null,
        description: null,
        total_copies: totalCopies,
        available_copies: Math.min(availableCopies, totalCopies),
      }

      await resourceService.create(payload)

      setSuccess(true)
      resetForm()
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save resource'
      setError(message)
      console.error('Error saving resource:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (item: LibraryResource) => {
    setEditError(null)
    setEditingItem(item)
    setEditTitle(item.title)
    setEditResourceType(item.resource_type)
    setEditAuthor(item.author)
    setEditCallNumber(item.call_number || '')
    setEditCopyright(item.copyright || '')
    setEditTotalCopies(item.total_copies)
    setEditAvailableCopies(item.available_copies)
  }

  const closeEditModal = () => {
    if (editIsLoading) {
      return
    }
    setEditingItem(null)
    setEditError(null)
  }

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingItem) {
      return
    }

    setEditError(null)
    setEditIsLoading(true)

    try {
      const payload = {
        title: editTitle,
        resource_type: editResourceType,
        author: editAuthor.trim() || '',
        call_number: editCallNumber || null,
        copyright: editCopyright.trim() || null,
        total_copies: editTotalCopies,
        available_copies: Math.min(editAvailableCopies, editTotalCopies),
      }

      await resourceService.update(editingItem.id, payload)
      setEditingItem(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update resource'
      setEditError(message)
    } finally {
      setEditIsLoading(false)
    }
  }

  const remove = async (id: string) => {
    await resourceService.remove(id)
    await load()
  }

  const filteredResources = resources.filter((item) => {
    const normalizedSearch = inventorySearch.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.author.toLowerCase().includes(normalizedSearch) ||
      (item.copyright || '').toLowerCase().includes(normalizedSearch) ||
      (item.call_number || '').toLowerCase().includes(normalizedSearch)

    const matchesType = !inventoryType || item.resource_type === inventoryType

    return matchesSearch && matchesType
  })

  return (
    <div className="page-grid">
      <header>
        <h2>Add Books/Journals</h2>
        <p>Add and manage books or journals for the library catalog.</p>
      </header>

      <Card
        title="Add New Resource"
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
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Resource saved successfully!</div>}
        <form className="form-grid compact-admin-form" onSubmit={submit}>
          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Type
            <select
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value as 'book' | 'journal')}
            >
              <option value="book">Book</option>
              <option value="journal">Journal</option>
            </select>
          </label>
          <label>
            Author
            <input value={author} onChange={(event) => setAuthor(event.target.value)} />
          </label>
          <label>
            Call Number
            <input value={callNumber} onChange={(event) => setCallNumber(event.target.value)} />
          </label>
          <label>
            Copyright
            <input value={copyright} onChange={(event) => setCopyright(event.target.value)} />
          </label>
          <label>
            Total Copies
            <input
              type="number"
              min={1}
              required
              value={totalCopies}
              onChange={(event) => setTotalCopies(Number(event.target.value) || 1)}
            />
          </label>
          <label>
            Available Copies
            <input
              type="number"
              min={0}
              required
              value={availableCopies}
              onChange={(event) => setAvailableCopies(Number(event.target.value) || 0)}
            />
          </label>
          <div className="actions full-row">
            <button className="btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Catalog Inventory">
        <div className="filters-grid" style={{ marginBottom: '0.75rem' }}>
          <label>
            Search
            <input
              value={inventorySearch}
              onChange={(event) => setInventorySearch(event.target.value)}
              placeholder="Search title, author, copyright, call number"
            />
          </label>
          <label>
            Type
            <select
              value={inventoryType}
              onChange={(event) => setInventoryType(event.target.value as '' | 'book' | 'journal')}
            >
              <option value="">All</option>
              <option value="book">Book</option>
              <option value="journal">Journal</option>
            </select>
          </label>
        </div>
        <div className="table-scroll-y">
          <DataTable
            headers={['Title', 'Type', 'Author', 'Call Number', 'Copyright', 'Copies', 'Actions']}
            rows={filteredResources.map((item) => [
              item.title,
              item.resource_type,
              item.author,
              item.call_number || '-',
              item.copyright || '-',
              `${item.available_copies}/${item.total_copies}`,
              <div className="table-actions actions-nowrap" key={item.id}>
                <ActionIconButton icon="edit" label="Edit" onClick={() => openEditModal(item)} />
                <ActionIconButton
                  icon="delete"
                  label="Delete"
                  variant="danger"
                  onClick={() => remove(item.id)}
                />
              </div>,
            ])}
          />
        </div>
      </Card>

      <Modal
        isOpen={!!editingItem}
        title="Edit Resource"
        onClose={closeEditModal}
        footer={
          <div className="modal-actions">
            <button
              type="button"
              className="btn outline"
              onClick={closeEditModal}
              disabled={editIsLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={editIsLoading}
              onClick={(e) => {
                const form = e.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
            >
              {editIsLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editingItem && (
          <form className="form-grid" onSubmit={saveEdit}>
            {editError ? <p className="error-text">{editError}</p> : null}
            <label>
              Title
              <input required value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label>
              Resource Type
              <select
                value={editResourceType}
                onChange={(event) => setEditResourceType(event.target.value as 'book' | 'journal')}
              >
                <option value="book">Book</option>
                <option value="journal">Journal</option>
              </select>
            </label>
            <label>
              Author
              <input value={editAuthor} onChange={(event) => setEditAuthor(event.target.value)} />
            </label>
            <label>
              Call Number
              <input
                value={editCallNumber}
                onChange={(event) => setEditCallNumber(event.target.value)}
              />
            </label>
            <label>
              Copyright
              <input
                value={editCopyright}
                onChange={(event) => setEditCopyright(event.target.value)}
              />
            </label>
            <label>
              Total Copies
              <input
                type="number"
                min={1}
                required
                value={editTotalCopies}
                onChange={(event) => setEditTotalCopies(Number(event.target.value) || 1)}
              />
            </label>
            <label>
              Available Copies
              <input
                type="number"
                min={0}
                required
                value={editAvailableCopies}
                onChange={(event) => setEditAvailableCopies(Number(event.target.value) || 0)}
              />
            </label>
          </form>
        )}
      </Modal>
    </div>
  )
}
