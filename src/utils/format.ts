import { format } from 'date-fns'

export const formatDate = (value: string | null) => {
  if (!value) {
    return '-'
  }

  return format(new Date(value), 'MMM dd, yyyy')
}

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-'
  }

  return format(new Date(value), 'MMM dd, yyyy hh:mm a')
}
