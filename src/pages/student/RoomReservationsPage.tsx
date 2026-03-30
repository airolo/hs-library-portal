import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { roomService } from '../../services/libraryService'
import type { DiscussionRoom, RoomReservation } from '../../types/domain'

export const RoomReservationsPage = () => {
  const [rooms, setRooms] = useState<DiscussionRoom[]>([])
  const [reservations, setReservations] = useState<RoomReservation[]>([])
  const [roomId, setRoomId] = useState('')
  const [reservationDate, setReservationDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [purpose, setPurpose] = useState('')

  const loadData = async () => {
    const [roomData, reservationData] = await Promise.all([
      roomService.listRooms(),
      roomService.listReservationsForCurrentUser(),
    ])

    setRooms(roomData as DiscussionRoom[])
    setReservations(reservationData)

    if (!roomId && roomData.length > 0) {
      setRoomId(roomData[0].id)
    }
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const [roomData, reservationData] = await Promise.all([
        roomService.listRooms(),
        roomService.listReservationsForCurrentUser(),
      ])

      if (!mounted) {
        return
      }

      const typedRooms = roomData as DiscussionRoom[]
      setRooms(typedRooms)
      setReservations(reservationData)

      if (typedRooms.length > 0) {
        setRoomId((previousRoomId) => previousRoomId || typedRooms[0].id)
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const createReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await roomService.createReservation({ room_id: roomId, reservation_date: reservationDate, start_time: startTime, end_time: endTime, purpose })
    setPurpose('')
    await loadData()
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Discussion Room Reservation</h2>
        <p>Book available discussion room slots for study and collaboration.</p>
      </header>

      <Card title="My Reservations">
        <DataTable
          headers={['Date', 'Room', 'Schedule', 'Status', 'Purpose']}
          rows={reservations.map((reservation) => [
            reservation.reservation_date,
            reservation.discussion_rooms?.name || '-',
            `${reservation.start_time} - ${reservation.end_time}`,
            reservation.status,
            reservation.purpose,
          ])}
        />
      </Card>
       <Card title="Book a Time Slot">
        <form onSubmit={createReservation} className="form-grid">
          <label>
            Room
            <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.location})
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" required value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} />
          </label>
          <label>
            Start Time
            <input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </label>
          <label>
            End Time
            <input type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>
          <label>
            Purpose
            <textarea required rows={2} value={purpose} onChange={(event) => setPurpose(event.target.value)} />
          </label>
          <button className="btn" type="submit">
            Submit Reservation
          </button>
        </form>
      </Card>
    </div>
  )
}
