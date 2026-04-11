import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { resourceService } from '../../services/libraryService'
import type { LibraryResource } from '../../types/domain'

export const AddResourcesPage = () => {
  const [resources, setResources] = useState<LibraryResource[]>([])
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState<'book' | 'journal'>('book')
  const [author, setAuthor] = useState('')
  const [callNumber, setCallNumber] = useState('')
  const [category, setCategory] = useState<'' | 'Dentistry' | 'Nursing' | 'Medicine'>('')
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
  const [editCategory, setEditCategory] = useState<'' | 'Dentistry' | 'Nursing' | 'Medicine'>('')
  const [editTotalCopies, setEditTotalCopies] = useState(1)
  const [editAvailableCopies, setEditAvailableCopies] = useState(1)
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryType, setInventoryType] = useState<'' | 'book' | 'journal'>('')
  const [inventoryCategory, setInventoryCategory] = useState<'' | 'Dentistry' | 'Nursing' | 'Medicine'>('')

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
    setCategory('')
    setTotalCopies(1)
    setAvailableCopies(1)
    setError(null)
    setSuccess(false)
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
        category: category || null,
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
    setEditCategory((item.category as '' | 'Dentistry' | 'Nursing' | 'Medicine') || '')
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
        category: editCategory || null,
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
      (item.category || '').toLowerCase().includes(normalizedSearch) ||
      (item.call_number || '').toLowerCase().includes(normalizedSearch)

    const matchesType = !inventoryType || item.resource_type === inventoryType
    const matchesCategory = !inventoryCategory || item.category === inventoryCategory

    return matchesSearch && matchesType && matchesCategory
  })

  return (
    <div className="page-grid">
      <header>
        <h2>Add Resources</h2>
        <p>Add and manage books or journals for the library catalog.</p>
      </header>

      <Card title="Add New Resource">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Resource saved successfully!</div>}
        <form className="form-grid compact-admin-form" onSubmit={submit}>
          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Resource Type
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
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as '' | 'Dentistry' | 'Nursing' | 'Medicine')
              }
            >
              <option value="">Select a category</option>
              <option value="Nursing">Nursing</option>
              <option value="Medicine">Medicine</option>
              <option value="Dentistry">Dentistry</option>
            </select>
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
              placeholder="Search title, author, category, call number"
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
          <label>
            Category
            <select
              value={inventoryCategory}
              onChange={(event) =>
                setInventoryCategory(event.target.value as '' | 'Dentistry' | 'Nursing' | 'Medicine')
              }
            >
              <option value="">All</option>
              <option value="Dentistry">Dentistry</option>
              <option value="Nursing">Nursing</option>
              <option value="Medicine">Medicine</option>
            </select>
          </label>
        </div>
        <div className="table-scroll-y">
          <DataTable
            headers={['Title', 'Type', 'Author', 'Call Number', 'Category', 'Copies', 'Actions']}
            rows={filteredResources.map((item) => [
              item.title,
              item.resource_type,
              item.author,
              item.call_number || '-',
              item.category || '-',
              `${item.available_copies}/${item.total_copies}`,
              <div className="actions actions-nowrap" key={item.id}>
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              Category
              <select
                value={editCategory}
                onChange={(event) =>
                  setEditCategory(event.target.value as '' | 'Dentistry' | 'Nursing' | 'Medicine')
                }
              >
                <option value="">Select category</option>
                <option value="Nursing">Nursing</option>
                <option value="Medicine">Medicine</option>
                <option value="Dentistry">Dentistry</option>
              </select>
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
