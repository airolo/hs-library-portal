import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { attendanceService } from '../../services/libraryService'
import { formatDate } from '../../utils/format'

import type { Profile } from '../../types/domain'

export const AttendanceManagementPage = () => {
  const [rows, setRows] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [yearLevelFilter, setYearLevelFilter] = useState('')
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editProgram, setEditProgram] = useState('')
  const [editYearLevel, setEditYearLevel] = useState<number | ''>('')
  const [editRole, setEditRole] = useState<Profile['role']>('student')
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [deleteStudent, setDeleteStudent] = useState<Profile | null>(null)
  const [deleteIsLoading, setDeleteIsLoading] = useState(false)

  const load = async () => {
    const data = await attendanceService.listRegisteredStudents()
    setRows(data)
  }

  useEffect(() => {
    void load()
  }, [])

  const openEditModal = (student: Profile) => {
    setEditingStudent(student)
    setEditFullName(student.full_name)
    setEditProgram(student.program || '')
    setEditYearLevel(student.year_level ?? '')
    setEditRole(student.role)
  }

  const closeEditModal = () => {
    if (editIsLoading) {
      return
    }

    setEditingStudent(null)
  }

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingStudent) {
      return
    }

    setEditIsLoading(true)

    try {
      await attendanceService.updateRegisteredStudent(editingStudent.id, {
        full_name: editFullName,
        program: editProgram || null,
        year_level: editYearLevel === '' ? null : Number(editYearLevel),
        role: editRole,
      })
      setEditingStudent(null)
      await load()
    } finally {
      setEditIsLoading(false)
    }
  }

  const openDeleteModal = (student: Profile) => {
    setDeleteStudent(student)
  }

  const closeDeleteModal = () => {
    if (deleteIsLoading) {
      return
    }

    setDeleteStudent(null)
  }

  const confirmDelete = async () => {
    if (!deleteStudent) {
      return
    }

    setDeleteIsLoading(true)

    try {
      await attendanceService.removeRegisteredStudent(deleteStudent.id)
      setDeleteStudent(null)
      await load()
    } finally {
      setDeleteIsLoading(false)
    }
  }

  const programOptions = Array.from(new Set(rows.map((row) => row.program).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b),
  )

  const filteredRows = rows.filter((row) => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      row.full_name.toLowerCase().includes(normalizedSearch) ||
      row.email.toLowerCase().includes(normalizedSearch)

    const matchesProgram = !programFilter || (row.program || '') === programFilter

    const matchesYearLevel = !yearLevelFilter || String(row.year_level || '') === yearLevelFilter

    return matchesSearch && matchesProgram && matchesYearLevel
  })

  return (
    <div className="page-grid">
      <header>
        <h2>Registered Students</h2>
        <p>View student account details for all registered users in the portal.</p>
      </header>

      <Card title="Registered Accounts">
        <div className="filters-grid" style={{ marginBottom: '0.75rem' }}>
          <label>
            Search
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search student name or email"
            />
          </label>
          <label>
            Program
            <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
              <option value="">All</option>
              {programOptions.map((programOption) => (
                <option key={programOption} value={programOption}>
                  {programOption}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year Level
            <select value={yearLevelFilter} onChange={(event) => setYearLevelFilter(event.target.value)}>
              <option value="">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
        </div>
        <div className="table-scroll-y">
          <DataTable
            headers={['Student', 'Email', 'Program', 'Year Level', 'Role', 'Registered On', 'Actions']}
            rows={filteredRows.map((row) => [
              row.full_name,
              row.email,
              row.program || '-',
              row.year_level ?? '-',
              row.role,
              formatDate(row.created_at),
              <div className="actions actions-nowrap" key={row.id}>
                <ActionIconButton icon="edit" label="Edit" onClick={() => openEditModal(row)} />
                <ActionIconButton
                  icon="delete"
                  label="Delete"
                  variant="danger"
                  onClick={() => openDeleteModal(row)}
                />
              </div>,
            ])}
          />
        </div>
      </Card>

      <Modal
        isOpen={!!editingStudent}
        title="Edit Registered Student"
        onClose={closeEditModal}
        footer={
          <div className="modal-actions">
            <button type="button" className="btn outline" onClick={closeEditModal} disabled={editIsLoading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={editIsLoading}
              onClick={(event) => {
                const form = event.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
            >
              {editIsLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editingStudent && (
          <form className="form-grid" onSubmit={saveEdit}>
            <label>
              Full Name
              <input required value={editFullName} onChange={(event) => setEditFullName(event.target.value)} />
            </label>
            <label>
              Program
              <input value={editProgram} onChange={(event) => setEditProgram(event.target.value)} />
            </label>
            <label>
              Year Level
              <input
                type="number"
                min={1}
                max={10}
                value={editYearLevel}
                onChange={(event) => setEditYearLevel(event.target.value ? Number(event.target.value) : '')}
              />
            </label>
            <label>
              Role
              <select value={editRole} onChange={(event) => setEditRole(event.target.value as Profile['role'])}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteStudent}
        title="Delete Registered Student"
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
          Are you sure you want to delete <strong>{deleteStudent?.full_name || 'this student'}</strong>?
        </p>
      </Modal>
    </div>
  )
}
