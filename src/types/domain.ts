export type UserRole = 'student' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  program: string | null
  year_level: number | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  event_date: string | null
  created_at: string
}

export interface AttendanceLog {
  id: string
  student_id: string
  date: string
  time_in: string | null
  time_out: string | null
  source: 'manual' | 'qr'
  created_at: string
}

export interface ResearchItem {
  id: string
  title: string
  abstract: string
  location: string
  program: string
  year: number
  keywords: string[]
  author: string
  status: 'pending' | 'approved' | 'rejected'
  file_url: string | null
  created_at: string
}

export interface ResourceRequest {
  id: string
  student_id: string
  title: string
  resource_type: string
  details: string | null
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  admin_notes: string | null
  created_at: string
}

export interface LibraryResource {
  id: string
  title: string
  resource_type: 'book' | 'journal'
  author: string
  call_number: string | null
  category: string | null
  description: string | null
  total_copies: number
  available_copies: number
  created_at: string
}

export interface ResourceBorrowTransaction {
  id: string
  resource_id: string
  student_id: string
  borrowed_at: string
  due_at: string | null
  returned_at: string | null
  status: 'borrowed' | 'returned' | 'overdue'
  created_at: string
  library_resources?: Pick<LibraryResource, 'title' | 'resource_type' | 'author'>
  profiles?: Pick<Profile, 'full_name' | 'program'>
}

export interface FeedbackReport {
  id: string
  student_id: string
  category: 'book_request' | 'journal_access' | 'repository_issue' | 'general_feedback' | 'bug_report'
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'new' | 'in_review' | 'resolved' | 'closed'
  admin_response: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'program'>
}
