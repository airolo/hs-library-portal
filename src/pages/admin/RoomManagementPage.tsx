import { useEffect, useState } from 'react'
import { ActionIconButton } from '../../components/ui/ActionIconButton'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { roomService } from '../../services/libraryService'
import type { RoomReservation } from '../../types/domain'

export const RoomManagementPage = () => {
  const [reservations, setReservations] = useState<RoomReservation[]>([])

  const load = async () => {
    const data = await roomService.listAllReservations()
    setReservations(data)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const data = await roomService.listAllReservations()
      if (mounted) {
        setReservations(data)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const setStatus = async (id: string, status: RoomReservation['status']) => {
    await roomService.updateStatus(id, status)
    await load()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Discussion Room Reservation Management</h2>
        <p>Review room schedules and approve/manage booking requests.</p>
      </header>

      <Card title="Reservation Schedule">
        <DataTable
          headers={['Student', 'Program', 'Room', 'Date', 'Time', 'Purpose', 'Status', 'Actions']}
          rows={reservations.map((item) => [
            item.profiles?.full_name || '-',
            item.profiles?.program || '-',
            item.discussion_rooms?.name || '-',
            item.reservation_date,
            `${item.start_time} - ${item.end_time}`,
            item.purpose,
            item.status,
            <div className="actions actions-nowrap" key={item.id}>
              <ActionIconButton
                icon="approve"
                label="Approve"
                onClick={() => setStatus(item.id, 'approved')}
              />
              <ActionIconButton
                icon="reject"
                label="Reject"
                variant="outline"
                onClick={() => setStatus(item.id, 'rejected')}
              />
            </div>,
          ])}
        />
      </Card>
    </div>
  )
}
