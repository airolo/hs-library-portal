import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { attendanceService } from '../../services/libraryService'
import { formatDateTime } from '../../utils/format'

interface AttendanceRow {
  date: string
  source: string
  time_in: string | null
  time_out: string | null
  profiles: { full_name: string; program: string | null }
}

export const AttendanceManagementPage = () => {
  const [rows, setRows] = useState<AttendanceRow[]>([])

  useEffect(() => {
    attendanceService.listAll().then((data) => setRows(data as AttendanceRow[]))
  }, [])

  return (
    <div className="page-grid">
      <header>
        <h2>Attendance Management</h2>
        <p>View and monitor student check-in/check-out logs.</p>
      </header>

      <Card title="Attendance Logs">
        <DataTable
          headers={['Student', 'Program', 'Date', 'Time In', 'Time Out', 'Source']}
          rows={rows.map((row) => [
            row.profiles?.full_name || '-',
            row.profiles?.program || '-',
            row.date,
            formatDateTime(row.time_in),
            formatDateTime(row.time_out),
            row.source,
          ])}
        />
      </Card>
    </div>
  )
}
