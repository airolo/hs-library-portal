import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { attendanceService } from '../../services/libraryService'

type AttendanceWithProfile = {
  created_at: string
  time_in: string | null
  time_out: string | null
  profiles: { full_name: string; program: string | null }
}

export const AdminDashboardPage = () => {
  const [logs, setLogs] = useState<AttendanceWithProfile[]>([])

  useEffect(() => {
    attendanceService.listAll().then((data) => setLogs(data as AttendanceWithProfile[]))
  }, [])

  const analytics = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentMonth = now.toISOString().slice(0, 7)

    const dailyVisits = logs.filter((item) => item.created_at.startsWith(today)).length
    const monthlyVisits = logs.filter((item) => item.created_at.startsWith(currentMonth)).length

    const programCount = logs.reduce<Record<string, number>>((acc, item) => {
      const program = item.profiles?.program || 'Unspecified'
      acc[program] = (acc[program] || 0) + 1
      return acc
    }, {})

    const mostActiveProgram = Object.entries(programCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    const durations = logs
      .filter((item) => item.time_in && item.time_out)
      .map((item) => {
        const start = new Date(item.time_in as string).getTime()
        const end = new Date(item.time_out as string).getTime()
        return Math.max(0, end - start) / (1000 * 60)
      })

    const avgDuration = durations.length
      ? `${Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)} mins`
      : '-'

    return { dailyVisits, monthlyVisits, mostActiveProgram, avgDuration }
  }, [logs])

  return (
    <div className="page-grid">
      <header>
        <h2>Admin Dashboard</h2>
        <p>Monitor usage metrics and academic engagement in real time.</p>
      </header>

      <section className="stats-grid">
        <StatCard label="Daily Visits" value={analytics.dailyVisits} />
        <StatCard label="Monthly Visits" value={analytics.monthlyVisits} />
        <StatCard label="Most Active Program" value={analytics.mostActiveProgram} />
        <StatCard label="Average Duration of Stay" value={analytics.avgDuration} />
      </section>

      <Card title="Analytics Notes">
        <p>
          Metrics are computed from attendance logs. Daily and monthly visits count the number of check-ins for the current day and month,
        </p>
      </Card>
    </div>
  )
}
