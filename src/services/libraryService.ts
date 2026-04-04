import { supabase } from '../lib/supabase'
import type {
  Announcement,
  AttendanceLog,
  LibraryResource,
  ResearchItem,
  ResourceBorrowTransaction,
  ResourceRequest,
  RoomReservation,
} from '../types/domain'

export const announcementService = {
  async list() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Announcement[]
  },
  async listRecent(limit = 5) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Announcement[]
  },
  async create(payload: Pick<Announcement, 'title' | 'content' | 'event_date'>) {
    const { error } = await supabase.from('announcements').insert(payload)
    if (error) throw error
  },
  async update(id: string, payload: Pick<Announcement, 'title' | 'content' | 'event_date'>) {
    const { error } = await supabase.from('announcements').update(payload).eq('id', id)
    if (error) throw error
  },
  async remove(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw error
  },
}

export const attendanceService = {
  async listForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('student_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error
    return data as AttendanceLog[]
  },
  async listAll() {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*, profiles(full_name, program)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (AttendanceLog & { profiles: { full_name: string; program: string | null } })[]
  },
  async countForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 0

    const { count, error } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)

    if (error) throw error
    return count ?? 0
  },
  async timeIn() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const today = new Date().toISOString().slice(0, 10)

    const { error } = await supabase.from('attendance_logs').upsert(
      {
        student_id: user.id,
        date: today,
        time_in: new Date().toISOString(),
        source: 'manual',
      },
      { onConflict: 'student_id,date' },
    )

    if (error) throw error
  },
  async timeOut() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const today = new Date().toISOString().slice(0, 10)

    const { error } = await supabase
      .from('attendance_logs')
      .update({ time_out: new Date().toISOString() })
      .eq('student_id', user.id)
      .eq('date', today)

    if (error) throw error
  },
}

export const researchService = {
  async list(filters?: { program?: string; year?: number; query?: string; status?: string }) {
    let query = supabase.from('research_repository').select('*').order('created_at', { ascending: false })

    if (filters?.program) {
      query = query.eq('program', filters.program)
    }
    if (filters?.year) {
      query = query.eq('year', filters.year)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.query) {
      query = query.or(`title.ilike.%${filters.query}%,abstract.ilike.%${filters.query}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as ResearchItem[]
  },
  async create(payload: Omit<ResearchItem, 'id' | 'created_at'>) {
    const { error } = await supabase.from('research_repository').insert(payload)
    if (error) throw error
  },
  async update(id: string, payload: Partial<Omit<ResearchItem, 'id' | 'created_at'>>) {
    const { error } = await supabase.from('research_repository').update(payload).eq('id', id)
    if (error) throw error
  },
  async updateStatus(id: string, status: ResearchItem['status']) {
    const { error } = await supabase.from('research_repository').update({ status }).eq('id', id)
    if (error) throw error
  },
  async remove(id: string) {
    const { error } = await supabase.from('research_repository').delete().eq('id', id)
    if (error) throw error
  },
}

export const requestService = {
  async listForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('resource_requests')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ResourceRequest[]
  },
  async listAll() {
    const { data, error } = await supabase
      .from('resource_requests')
      .select('*, profiles(full_name, program)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as (ResourceRequest & { profiles: { full_name: string; program: string | null } })[]
  },
  async countForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 0

    const { count, error } = await supabase
      .from('resource_requests')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)

    if (error) throw error
    return count ?? 0
  },
  async create(payload: Pick<ResourceRequest, 'title' | 'resource_type' | 'details'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('resource_requests').insert({
      ...payload,
      student_id: user.id,
      status: 'pending',
    })

    if (error) throw error
  },
  async updateStatus(id: string, status: ResourceRequest['status'], adminNotes?: string) {
    const { error } = await supabase
      .from('resource_requests')
      .update({ status, admin_notes: adminNotes ?? null })
      .eq('id', id)

    if (error) throw error
  },
  async listActiveRequestsForCurrentUser(limit = 5) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('resource_requests')
      .select('*')
      .eq('student_id', user.id)
      .in('status', ['pending', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ResourceRequest[]
  },
}

export const resourceService = {
  async list(filters?: {
    query?: string
    resourceType?: 'book' | 'journal' | ''
    category?: '' | 'Dentistry' | 'Nursing' | 'Medicine'
  }) {
    let query = supabase
      .from('library_resources')
      .select('*')
      .order('title', { ascending: true })

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.query) {
      query = query.or(
        `title.ilike.%${filters.query}%,author.ilike.%${filters.query}%,category.ilike.%${filters.query}%,call_number.ilike.%${filters.query}%`,
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data as LibraryResource[]
  },
  async create(payload: Omit<LibraryResource, 'id' | 'created_at'>) {
    const { error } = await supabase.from('library_resources').insert(payload)
    if (error) throw error
  },
  async update(id: string, payload: Partial<Omit<LibraryResource, 'id' | 'created_at'>>) {
    const { error } = await supabase.from('library_resources').update(payload).eq('id', id)
    if (error) throw error
  },
  async remove(id: string) {
    const { error } = await supabase.from('library_resources').delete().eq('id', id)
    if (error) throw error
  },
  async borrow(resourceId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data: resource, error: getResourceError } = await supabase
      .from('library_resources')
      .select('*')
      .eq('id', resourceId)
      .single<LibraryResource>()

    if (getResourceError) throw getResourceError

    if (resource.available_copies <= 0) {
      throw new Error('No available copies left for this resource.')
    }

    const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertBorrowError } = await supabase.from('resource_borrow_transactions').insert({
      resource_id: resourceId,
      student_id: user.id,
      borrowed_at: new Date().toISOString(),
      due_at: dueAt,
      status: 'borrowed',
    })

    if (insertBorrowError) throw insertBorrowError

    const { error: updateCopiesError } = await supabase
      .from('library_resources')
      .update({ available_copies: resource.available_copies - 1 })
      .eq('id', resourceId)

    if (updateCopiesError) throw updateCopiesError
  },
  async listBorrowsForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('resource_borrow_transactions')
      .select('*, library_resources(title, resource_type, author)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ResourceBorrowTransaction[]
  },
}

export const roomService = {
  async listReservationsForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from('room_reservations')
      .select('*, discussion_rooms(*)')
      .eq('student_id', user.id)
      .order('reservation_date', { ascending: false })

    if (error) throw error
    return data as RoomReservation[]
  },
  async listAllReservations() {
    const { data, error } = await supabase
      .from('room_reservations')
      .select('*, discussion_rooms(*), profiles(full_name, program)')
      .order('reservation_date', { ascending: false })

    if (error) throw error
    return data as RoomReservation[]
  },
  async countReservationsForCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 0

    const { count, error } = await supabase
      .from('room_reservations')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)

    if (error) throw error
    return count ?? 0
  },
  async listRooms() {
    const { data, error } = await supabase
      .from('discussion_rooms')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },
  async createReservation(payload: {
    room_id: string
    reservation_date: string
    start_time: string
    end_time: string
    purpose: string
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('room_reservations').insert({
      ...payload,
      student_id: user.id,
      status: 'pending',
    })

    if (error) throw error
  },
  async updateStatus(id: string, status: RoomReservation['status']) {
    const { error } = await supabase.from('room_reservations').update({ status }).eq('id', id)
    if (error) throw error
  },
  async listUpcomingReservationsForCurrentUser(limit = 5) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('room_reservations')
      .select('*, discussion_rooms(*)')
      .eq('student_id', user.id)
      .gte('reservation_date', today)
      .order('reservation_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data as RoomReservation[]
  },
}
