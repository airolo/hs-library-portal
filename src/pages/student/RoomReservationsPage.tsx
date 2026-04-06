import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { feedbackService } from '../../services/libraryService'
import type { FeedbackReport } from '../../types/domain'

export const FeedbackReportsPage = () => {
  const [reports, setReports] = useState<FeedbackReport[]>([])
  const [category, setCategory] = useState<FeedbackReport['category']>('general_feedback')
  const [priority, setPriority] = useState<FeedbackReport['priority']>('medium')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const loadData = async () => {
    const feedbackData = await feedbackService.listForCurrentUser()
    setReports(feedbackData)
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const feedbackData = await feedbackService.listForCurrentUser()

      if (!mounted) {
        return
      }

      setReports(feedbackData)
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [])

  const createReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)
    setIsSubmitting(true)

    try {
      await feedbackService.create({ category, description, priority })
      setDescription('')
      setPriority('medium')
      setCategory('general_feedback')
      setSubmitSuccess(true)
      await loadData()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : (typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Failed to submit feedback report.')
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryLabel = (value: FeedbackReport['category']) => {
    switch (value) {
      case 'book_request':
        return 'Book Request'
      case 'journal_access':
        return 'Resources Problem'
      case 'repository_issue':
        return 'Research Repository Issue'
      case 'general_feedback':
        return 'General Feedback'
      case 'bug_report':
        return 'System Bug Report'
      default:
        return value
    }
  }

  const getPriorityLabel = (value: FeedbackReport['priority']) => {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  const getStatusLabel = (value: FeedbackReport['status']) => {
    switch (value) {
      case 'in_review':
        return 'In Review'
      case 'resolved':
        return 'Resolved'
      case 'closed':
        return 'Closed'
      case 'new':
        return 'New'
      default:
        return value
    }
  }

  return (
    <div className="page-grid">
      <header>
        <h2>Feedback and Issue Reports</h2>
        <p>Submit concerns and suggestions related to books, journals, and the research repository.</p>
      </header>

      <Card title="My Reports">
        <DataTable
          headers={['Date', 'Category', 'Priority', 'Status', 'Admin Response']}
          rows={reports.map((report) => [
            new Date(report.created_at).toLocaleDateString(),
            getCategoryLabel(report.category),
            getPriorityLabel(report.priority),
            getStatusLabel(report.status),
            report.admin_response || '-',
          ])}
        />
      </Card>

      <Card title="Submit Feedback or Issue">
        <form onSubmit={createReport} className="form-grid">
          {submitError ? <p className="error-text">{submitError}</p> : null}
          {submitSuccess ? <p className="success-text">Report submitted successfully.</p> : null}
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value as FeedbackReport['category'])}>
              <option value="book_request">Book Request</option>
              <option value="journal_access">Resources Problem</option>
              <option value="repository_issue">Research Repository Issue</option>
              <option value="general_feedback">General Feedback</option>
              <option value="bug_report">System Bug Report</option>
            </select>
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as FeedbackReport['priority'])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Description
            <textarea required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </Card>
    </div>
  )
}
