import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { resourceService } from '../../services/libraryService'
import type { LibraryResource } from '../../types/domain'

export const AddResourcesPage = () => {
  const [resources, setResources] = useState<LibraryResource[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState<'book' | 'journal'>('book')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publicationYear, setPublicationYear] = useState<number | ''>('')
  const [identifierCode, setIdentifierCode] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [totalCopies, setTotalCopies] = useState(1)
  const [availableCopies, setAvailableCopies] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    setEditingId(null)
    setTitle('')
    setResourceType('book')
    setAuthor('')
    setPublisher('')
    setPublicationYear('')
    setIdentifierCode('')
    setCategory('')
    setDescription('')
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
        author,
        publisher: publisher || null,
        publication_year: publicationYear || null,
        identifier_code: identifierCode || null,
        category: category || null,
        description: description || null,
        total_copies: totalCopies,
        available_copies: Math.min(availableCopies, totalCopies),
      }

      if (editingId) {
        await resourceService.update(editingId, payload)
      } else {
        await resourceService.create(payload)
      }

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

  const edit = (item: LibraryResource) => {
    setEditingId(item.id)
    setTitle(item.title)
    setResourceType(item.resource_type)
    setAuthor(item.author)
    setPublisher(item.publisher || '')
    setPublicationYear(item.publication_year || '')
    setIdentifierCode(item.identifier_code || '')
    setCategory(item.category || '')
    setDescription(item.description || '')
    setTotalCopies(item.total_copies)
    setAvailableCopies(item.available_copies)
  }

  const remove = async (id: string) => {
    await resourceService.remove(id)
    await load()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Add Resources</h2>
        <p>Add and manage books or journals, including copy availability for borrowing.</p>
      </header>

      <Card title={editingId ? 'Edit Resource' : 'Add New Resource'}>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Resource saved successfully!</div>}
        <form className="form-grid" onSubmit={submit}>
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
            <input required value={author} onChange={(event) => setAuthor(event.target.value)} />
          </label>
          <label>
            Publisher
            <input value={publisher} onChange={(event) => setPublisher(event.target.value)} />
          </label>
          <label>
            Publication Year
            <input
              type="number"
              min={1900}
              max={2100}
              value={publicationYear}
              onChange={(event) =>
                setPublicationYear(event.target.value ? Number(event.target.value) : '')
              }
            />
          </label>
          <label>
            ISBN / ISSN
            <input
              value={identifierCode}
              onChange={(event) => setIdentifierCode(event.target.value)}
            />
          </label>
          <label>
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
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
          <div className="actions">
            <button className="btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingId ? 'Update Resource' : 'Add Resource'}
            </button>
            {editingId ? (
              <button className="btn outline" type="button" onClick={resetForm} disabled={isLoading}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Catalog Inventory">
        <DataTable
          headers={['Title', 'Type', 'Author', 'Category', 'Copies (Available/Total)', 'Actions']}
          rows={resources.map((item) => [
            item.title,
            item.resource_type,
            item.author,
            item.category || '-',
            `${item.available_copies}/${item.total_copies}`,
            <div className="actions" key={item.id}>
              <button className="btn xs" type="button" onClick={() => edit(item)}>
                Edit
              </button>
              <button className="btn xs outline" type="button" onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>,
          ])}
        />
      </Card>
    </div>
  )
}
