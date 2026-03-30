type ActionIcon = 'edit' | 'delete' | 'approve' | 'reject'

type ActionIconButtonProps = {
  icon: ActionIcon
  label: string
  onClick: () => void
  variant?: 'primary' | 'outline' | 'danger'
  disabled?: boolean
}

const Icon = ({ icon }: { icon: ActionIcon }) => {
  if (icon === 'edit') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25z" />
        <path d="M14.06 4.94l3.75 3.75 1.65-1.65a1 1 0 0 0 0-1.42l-2.33-2.33a1 1 0 0 0-1.42 0l-1.65 1.65z" />
      </svg>
    )
  }

  if (icon === 'delete') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 7h12l-1 14H7L6 7z" />
        <path d="M9 4h6l1 2H8l1-2z" />
      </svg>
    )
  }

  if (icon === 'approve') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.29 5.71a1 1 0 0 0-1.42 0L9 15.59l-3.88-3.88a1 1 0 1 0-1.41 1.41l4.59 4.59a1 1 0 0 0 1.41 0l10.58-10.58a1 1 0 0 0 0-1.42z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z" />
    </svg>
  )
}

export const ActionIconButton = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}: ActionIconButtonProps) => {
  return (
    <button
      type="button"
      className={`icon-btn ${variant}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
    >
      <Icon icon={icon} />
    </button>
  )
}
