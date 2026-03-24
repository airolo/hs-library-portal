import type { PropsWithChildren } from 'react'
import clsx from 'clsx'

interface CardProps extends PropsWithChildren {
  title?: string
  subtitle?: string
  className?: string
  actions?: React.ReactNode
}

export const Card = ({ title, subtitle, className, actions, children }: CardProps) => {
  return (
    <section className={clsx('card', className)}>
      {(title || subtitle || actions) && (
        <header className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
