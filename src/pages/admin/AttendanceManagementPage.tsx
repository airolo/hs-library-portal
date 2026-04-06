import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { attendanceService } from '../../services/libraryService'
import { formatDate } from '../../utils/format'

import type { Profile } from '../../types/domain'

const generateTemporaryPassword = (length = 8) => {
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const numbers = '23456789'
  const allChars = `${lowercase}${uppercase}${numbers}`

  const pick = (source: string) => source[Math.floor(Math.random() * source.length)]

  const required = [pick(lowercase), pick(uppercase), pick(numbers)]
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => pick(allChars))
  const combined = [...required, ...rest]

  for (let index = combined.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = combined[index]
    combined[index] = combined[swapIndex]
    combined[swapIndex] = temp
  }

  return combined.join('')
}

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
  const [passwordStudent, setPasswordStudent] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null)
  const [passwordIsLoading, setPasswordIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const openPasswordModal = (student: Profile) => {
    setPasswordStudent(student)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordInfo(null)
    setShowPassword(false)
  }

  const closePasswordModal = () => {
    if (passwordIsLoading) {
      return
    }

    setPasswordStudent(null)
  }

  const generateAndFillPassword = () => {
    const temporaryPassword = generateTemporaryPassword(8)
    setNewPassword(temporaryPassword)
    setConfirmPassword(temporaryPassword)
    setPasswordError(null)
    setPasswordInfo('Temporary password generated. You can copy and share it with the student.')
  }

  const copyPassword = async () => {
    if (!newPassword) {
      setPasswordError('Generate or enter a password first.')
      return
    }

    try {
      await navigator.clipboard.writeText(newPassword)
      setPasswordError(null)
      setPasswordInfo('Password copied to clipboard.')
    } catch {
      setPasswordError('Unable to copy password. Please copy it manually.')
    }
  }

  const savePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!passwordStudent) {
      return
    }

    const normalizedPassword = newPassword.trim()

    if (normalizedPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }

    if (normalizedPassword !== confirmPassword.trim()) {
      setPasswordError('Password confirmation does not match.')
      return
    }

    setPasswordError(null)
    setPasswordInfo(null)
    setPasswordIsLoading(true)

    try {
      await attendanceService.resetRegisteredStudentPassword(passwordStudent.id, normalizedPassword)
      setPasswordStudent(null)
      setNewPassword('')
      setConfirmPassword('')
      setPasswordInfo(null)
      setShowPassword(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password.'
      setPasswordError(message)
    } finally {
      setPasswordIsLoading(false)
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
                icon="password"
                label="Reset Password"
                variant="outline"
                onClick={() => openPasswordModal(row)}
              />
              <ActionIconButton
                icon="delete"
                label="Delete"
                variant="danger"
                onClick={() => openDeleteModal(row)}
              />
            </div>,
          ])}
        />
      </Card>

      <Modal
        isOpen={!!editingStudent}
        title="Edit Registered Student"
        onClose={closeEditModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        isOpen={!!passwordStudent}
        title="Reset Student Password"
        onClose={closePasswordModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn outline" onClick={closePasswordModal} disabled={passwordIsLoading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              disabled={passwordIsLoading}
              onClick={(event) => {
                const form = event.currentTarget.closest('.modal-content')?.querySelector('form') as HTMLFormElement
                if (form) form.requestSubmit()
              }}
            >
              {passwordIsLoading ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        }
      >
        {passwordStudent && (
          <form className="form-grid" onSubmit={savePasswordReset}>
            <p style={{ margin: 0 }}>
              Set a new password for <strong>{passwordStudent.full_name}</strong>.
            </p>
            <label>
              New Password
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn outline"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3.3 4.7a1 1 0 0 0 1.4 1.4l2 2A11.5 11.5 0 0 0 1.1 12c2 3.6 5.8 6 10.9 6 2 0 3.8-.4 5.4-1.2l2 2a1 1 0 1 0 1.4-1.4l-16-16zM9.6 11l3.4 3.4A2.5 2.5 0 0 1 9.6 11zm5.8 5.8A9.8 9.8 0 0 1 12 17c-4.2 0-7.2-1.8-9-5 .8-1.4 1.9-2.5 3.3-3.3l1.9 1.9a4.5 4.5 0 0 0 5.2 5.2l2 2zM12 7c4.2 0 7.2 1.8 9 5-.6 1.1-1.5 2.1-2.5 2.8a1 1 0 1 0 1.1 1.7c1.4-1 2.5-2.3 3.3-3.8-2-3.6-5.8-6-10.9-6-.9 0-1.8.1-2.7.3a1 1 0 0 0 .5 1.9c.7-.2 1.4-.2 2.2-.2zm0 2.5a2.5 2.5 0 0 1 2.5 2.5c0 .4-.1.8-.3 1.1l1.5 1.5c.5-.8.8-1.7.8-2.7A4.5 4.5 0 0 0 12 7.5c-1 0-2 .3-2.7.8l1.5 1.5c.3-.2.7-.3 1.2-.3z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 5c-5.1 0-8.9 2.4-10.9 6 2 3.6 5.8 6 10.9 6s8.9-2.4 10.9-6c-2-3.6-5.8-6-10.9-6zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <label>
              Confirm Password
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn outline"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3.3 4.7a1 1 0 0 0 1.4 1.4l2 2A11.5 11.5 0 0 0 1.1 12c2 3.6 5.8 6 10.9 6 2 0 3.8-.4 5.4-1.2l2 2a1 1 0 1 0 1.4-1.4l-16-16zM9.6 11l3.4 3.4A2.5 2.5 0 0 1 9.6 11zm5.8 5.8A9.8 9.8 0 0 1 12 17c-4.2 0-7.2-1.8-9-5 .8-1.4 1.9-2.5 3.3-3.3l1.9 1.9a4.5 4.5 0 0 0 5.2 5.2l2 2zM12 7c4.2 0 7.2 1.8 9 5-.6 1.1-1.5 2.1-2.5 2.8a1 1 0 1 0 1.1 1.7c1.4-1 2.5-2.3 3.3-3.8-2-3.6-5.8-6-10.9-6-.9 0-1.8.1-2.7.3a1 1 0 0 0 .5 1.9c.7-.2 1.4-.2 2.2-.2zm0 2.5a2.5 2.5 0 0 1 2.5 2.5c0 .4-.1.8-.3 1.1l1.5 1.5c.5-.8.8-1.7.8-2.7A4.5 4.5 0 0 0 12 7.5c-1 0-2 .3-2.7.8l1.5 1.5c.3-.2.7-.3 1.2-.3z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 5c-5.1 0-8.9 2.4-10.9 6 2 3.6 5.8 6 10.9 6s8.9-2.4 10.9-6c-2-3.6-5.8-6-10.9-6zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn outline"
                disabled={passwordIsLoading}
                onClick={generateAndFillPassword}
              >
                Generate Temporary Password
              </button>
              <button
                type="button"
                className="btn outline"
                disabled={passwordIsLoading || !newPassword}
                onClick={() => void copyPassword()}
              >
                Copy Password
              </button>
            </div>
            {passwordError ? <p className="error-text">{passwordError}</p> : null}
            {passwordInfo ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>{passwordInfo}</p> : null}
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteStudent}
        title="Delete Registered Student"
        onClose={closeDeleteModal}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
