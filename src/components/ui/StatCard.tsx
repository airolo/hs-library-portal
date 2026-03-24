import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  helper?: string
}

export const StatCard = ({ label, value, helper }: StatCardProps) => (
  <Card className="stat-card">
    <p className="stat-label">{label}</p>
    <h2>{value}</h2>
    {helper ? <p className="stat-helper">{helper}</p> : null}
  </Card>
)
