import { UserRound } from 'lucide-react'
import { formatMoney, getPrice, parseAge, TICKET_LABELS, TICKET_PRICES } from '../domain/pricing'
import type { FieldErrors, Participant } from '../domain/types'
import { AGE_HINT, NAME_HINT, normalizeName, validateParticipant } from '../domain/validation'

interface Props {
  participant: Participant
  index: number
  errors?: FieldErrors
  onChange: (changes: Partial<Pick<Participant, 'name' | 'age' | 'selectedTicket'>>) => void
}

export function ParticipantCard({ participant: p, index, errors, onChange }: Props) {
  const age = parseAge(p.age)
  const selectedTicketError = errors?.selectedTicket ?? validateParticipant(p).selectedTicket
  return <fieldset className="participant-card panel">
    <legend className="sr-only">Участник {index + 1}</legend>
    <div className="participant-header"><span className="flex items-center gap-3"><span className="participant-icon"><UserRound size={18} /></span><strong>Участник {String(index + 1).padStart(2, '0')}</strong></span><span className="small muted">{TICKET_LABELS[p.selectedTicket]}</span></div>
    <div className="participant-fields">
      <div className="field">
        <label htmlFor={`${p.id}-name`}>Имя</label>
        <input id={`${p.id}-name`} autoComplete="off" value={p.name} placeholder="Как вас зовут?" aria-invalid={!!errors?.name} aria-describedby={`${p.id}-name-hint${errors?.name ? ` ${p.id}-name-error` : ''}`} onChange={e => onChange({ name: e.target.value })} onBlur={e => onChange({ name: normalizeName(e.currentTarget.value) })} />
        <p className="small muted" id={`${p.id}-name-hint`}>{NAME_HINT}</p>
        {errors?.name && <p className="field-error" id={`${p.id}-name-error`}>{errors.name}</p>}
      </div>
      <div className="field">
        <label htmlFor={`${p.id}-age`}>Возраст</label>
        <input id={`${p.id}-age`} type="text" inputMode="numeric" autoComplete="off" value={p.age} placeholder="Лет" aria-invalid={!!errors?.age} aria-describedby={`${p.id}-age-hint${errors?.age ? ` ${p.id}-age-error` : ''}`} onChange={e => onChange({ age: e.target.value })} />
        <p className="small muted" id={`${p.id}-age-hint`}>{AGE_HINT}</p>
        {errors?.age && <p className="field-error" id={`${p.id}-age-error`}>{errors.age}</p>}
      </div>
    </div>
    <div className="participant-tariff">
      <div className="field">
        <label htmlFor={`${p.id}-ticket`}>Тариф</label>
        <select id={`${p.id}-ticket`} value={p.selectedTicket} aria-invalid={!!selectedTicketError} aria-describedby={selectedTicketError ? `${p.id}-ticket-error` : undefined} onChange={e => onChange({ selectedTicket: e.target.value === 'child' ? 'child' : 'adult' })}>
          <option value="adult">Полный · с 14 лет</option><option value="child">Детский · до 14 лет</option>
        </select>
      </div>
      <p className="participant-price"><span>{age === null ? 'По тарифу' : 'По возрасту'}</span><strong>{formatMoney(age === null ? TICKET_PRICES[p.selectedTicket] : getPrice(age))}</strong></p>
    </div>
    {selectedTicketError && <div className="tariff-warning" role="status"><p>Сумма рассчитана по возрасту. Выбранный тариф нужно исправить вручную.</p><p className="field-error" id={`${p.id}-ticket-error`}>{selectedTicketError}</p></div>}
  </fieldset>
}
