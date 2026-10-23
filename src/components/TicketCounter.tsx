import { Minus, Plus, Ticket, Users } from 'lucide-react'
import { formatMoney, TICKET_LABELS, TICKET_PRICES } from '../domain/pricing'
import type { TicketKind } from '../domain/types'

interface Props {
  kind: TicketKind
  count: number
  atLimit: boolean
  onChange: (delta: 1 | -1) => void
}

export function TicketCounter({ kind, count, atLimit, onChange }: Props) {
  const Icon = kind === 'adult' ? Ticket : Users
  return <article className={`ticket-option ${count > 0 ? 'selected' : ''}`} aria-label={TICKET_LABELS[kind]}>
    <div className="flex items-center justify-between gap-3">
      <span className="ticket-icon"><Icon size={21} /></span>
      <span className="age-tag">{kind === 'adult' ? 'С 14 лет' : 'До 14 лет'}</span>
    </div>
    <h3>{TICKET_LABELS[kind]}</h3>
    <p className="ticket-description">{kind === 'adult' ? 'Весь вечер. Все впечатления.' : 'Большая музыка для маленьких.'}</p>
    <div className="ticket-option-bottom">
      <strong>{formatMoney(TICKET_PRICES[kind])}</strong>
      <div className="counter">
        <button type="button" aria-label={`Убрать: ${TICKET_LABELS[kind]}`} disabled={count === 0} onClick={() => onChange(-1)}><Minus size={17} /></button>
        <output aria-label={`Количество: ${TICKET_LABELS[kind]}`} aria-live="polite">{count}</output>
        <button type="button" aria-label={`Добавить: ${TICKET_LABELS[kind]}`} disabled={atLimit} onClick={() => onChange(1)}><Plus size={17} /></button>
      </div>
    </div>
  </article>
}
