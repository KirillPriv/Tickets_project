import { calculateTotal, getTicketKind, MAX_PARTICIPANTS, parseAge } from './pricing'
import type { BookingDraft, FieldErrors, OrderErrors, Participant, ValidatedOrder, ValidatedParticipant } from './types'

export const COMPANION_ERROR = 'Участнику младше 18 лет нужен сопровождающий от 18 лет в этом же заказе.'

export function hasAdultCompanion(ages: readonly number[]): boolean {
  return !ages.some(age => age < 18) || ages.some(age => age >= 18)
}

export function validateParticipant(participant: Participant): FieldErrors {
  const errors: FieldErrors = {}
  if (!participant.name.trim()) errors.name = 'Введите имя участника.'
  const age = parseAge(participant.age)
  if (age === null) errors.age = 'Укажите целый возраст от 0 до 120 лет.'
  else if (getTicketKind(age) !== participant.selectedTicket) {
    errors.selectedTicket = age < 14
      ? 'До 14 лет нужен детский билет. Измените тариф или возраст.'
      : 'С 14 лет нужен полный билет. Измените тариф или возраст.'
  }
  return errors
}

export type ValidationResult =
  | { valid: true; order: ValidatedOrder }
  | { valid: false; errors: OrderErrors }

export function validateOrder(draft: BookingDraft): ValidationResult {
  const errors: OrderErrors = { participants: {} }
  if (draft.participants.length < 1 || draft.participants.length > MAX_PARTICIPANTS) {
    errors.order = 'В одном заказе может быть от 1 до 4 участников.'
  }
  const email = draft.contactEmail.trim()
  if (!/^[^\s@,;]+@[^\s@,;.]+(?:\.[^\s@,;.]+)+$/.test(email)) {
    errors.contactEmail = 'Укажите один корректный email, например name@example.com.'
  }
  const parsed: ValidatedParticipant[] = []
  for (const participant of draft.participants) {
    const fieldErrors = validateParticipant(participant)
    if (Object.keys(fieldErrors).length > 0) errors.participants[participant.id] = fieldErrors
    const age = parseAge(participant.age)
    if (age !== null) parsed.push({ ...participant, name: participant.name.trim(), age })
  }
  if (parsed.length === draft.participants.length && !hasAdultCompanion(parsed.map(p => p.age))) {
    errors.order = COMPANION_ERROR
  }
  if (errors.order || errors.contactEmail || Object.keys(errors.participants).length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, order: { participants: parsed, contactEmail: email, total: calculateTotal(parsed) } }
}
