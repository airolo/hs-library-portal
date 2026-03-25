import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { attendanceService } from '../../services/libraryService'
import type { AttendanceLog } from '../../types/domain'
import { formatDateTime } from '../../utils/format'

export const AttendancePage = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(false)

  const loadLogs = async () => {
    const data = await attendanceService.listForCurrentUser()
    setLogs(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await attendanceService.listForCurrentUser()
      if (mounted) {
        setLogs(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const handleTimeIn = async () => {
    setLoading(true)
    await attendanceService.timeIn()
    await loadLogs()
    setLoading(false)
  }

  const handleTimeOut = async () => {
    setLoading(true)
    await attendanceService.timeOut()
    await loadLogs()
    setLoading(false)
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Attendance Logging</h2>
        <p>Use this page to log Time In and Time Out when QR scanning is unavailable.</p>
      </header>

      <Card title="Manual Attendance">
        <p className="notice">
          Notice: If QR code scanning for check-in/check-out is unavailable, you can manually log
          attendance through this page.
        </p>
        <div className="actions">
          <button type="button" className="btn" onClick={handleTimeIn} disabled={loading}>
            Time In
          </button>
          <button type="button" className="btn outline" onClick={handleTimeOut} disabled={loading}>
            Time Out
          </button>
        </div>
      </Card>

      <Card title="Attendance History">
        <p className="notice">
          Notice: Don't forget to log out (Time Out) after your visit to ensure accurate attendance records.
        </p>
        <DataTable
          headers={['Date', 'Time In', 'Time Out', 'Source']}
          rows={logs.map((log) => [
            log.date,
            formatDateTime(log.time_in),
            formatDateTime(log.time_out),
            log.source,
          ])}
        />
      </Card>
    </div>
  )
}
