import { UserRound } from 'lucide-react'
import { formatMoney, getPrice, parseAge, TICKET_LABELS, TICKET_PRICES } from '../domain/pricing'
import type { FieldErrors, Participant } from '../domain/types'

interface Props {
  participant: Participant
  index: number
  errors?: FieldErrors
  onChange: (changes: Partial<Pick<Participant, 'name' | 'age' | 'selectedTicket'>>) => void
}

export function ParticipantCard({ participant: p, index, errors, onChange }: Props) {
  const age = parseAge(p.age)
  return <fieldset className="participant-card panel">
    <legend className="sr-only">Участник {index + 1}</legend>
    <div className="participant-header"><span className="flex items-center gap-3"><span className="participant-icon"><UserRound size={18} /></span><strong>Участник {String(index + 1).padStart(2, '0')}</strong></span><span className="small muted">{TICKET_LABELS[p.selectedTicket]}</span></div>
    <div className="participant-fields">
      <div className="field">
        <label htmlFor={`${p.id}-name`}>Имя</label>
        <input id={`${p.id}-name`} autoComplete="off" value={p.name} placeholder="Как вас зовут?" aria-invalid={!!errors?.name} aria-describedby={errors?.name ? `${p.id}-name-error` : undefined} onChange={e => onChange({ name: e.target.value })} />
        {errors?.name && <p className="field-error" id={`${p.id}-name-error`}>{errors.name}</p>}
      </div>
      <div className="field">
        <label htmlFor={`${p.id}-age`}>Возраст</label>
        <input id={`${p.id}-age`} type="number" inputMode="numeric" min="0" max="120" step="1" value={p.age} placeholder="Лет" aria-invalid={!!errors?.age} aria-describedby={errors?.age ? `${p.id}-age-error` : undefined} onChange={e => onChange({ age: e.target.value })} />
        {errors?.age && <p className="field-error" id={`${p.id}-age-error`}>{errors.age}</p>}
      </div>
    </div>
    <div className="participant-tariff">
      <div className="field">
        <label htmlFor={`${p.id}-ticket`}>Тариф</label>
        <select id={`${p.id}-ticket`} value={p.selectedTicket} aria-invalid={!!errors?.selectedTicket} aria-describedby={errors?.selectedTicket ? `${p.id}-ticket-error` : undefined} onChange={e => onChange({ selectedTicket: e.target.value === 'child' ? 'child' : 'adult' })}>
          <option value="adult">Полный · с 14 лет</option><option value="child">Детский · до 14 лет</option>
        </select>
      </div>
      <p className="participant-price"><span>{age === null ? 'По тарифу' : 'По возрасту'}</span><strong>{formatMoney(age === null ? TICKET_PRICES[p.selectedTicket] : getPrice(age))}</strong></p>
    </div>
    {errors?.selectedTicket && <p className="field-error" id={`${p.id}-ticket-error`}>{errors.selectedTicket}</p>}
  </fieldset>
}
