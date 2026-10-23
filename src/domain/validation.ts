import { calculateTotal, getTicketKind, MAX_PARTICIPANTS, parseAge } from './pricing'
import type { BookingDraft, FieldErrors, OrderErrors, Participant, ValidatedOrder, ValidatedParticipant } from './types'

export const COMPANION_ERROR = 'Участнику младше 18 лет нужен сопровождающий от 18 лет в этом же заказе.'
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 80
export const NAME_HINT = 'От 2 до 80 символов: русские или латинские буквы, пробелы, дефисы и апострофы.'
export const AGE_HINT = 'Только цифры, от 0 до 120 лет.'

// A separator joins letter groups; punctuation alone and repeated separators are invalid.
// The letter-category check excludes non-letter Latin-script symbols (e.g. Roman numerals).
const NAME_PATTERN = /^(?:(?=\p{L})[\p{Script=Latin}А-Яа-яЁё])+(?:[- '’](?:(?=\p{L})[\p{Script=Latin}А-Яа-яЁё])+)*$/u

export function normalizeName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

export function validateName(value: string): string | undefined {
  const name = normalizeName(value)
  if (!name) return 'Введите имя участника.'
  if (!NAME_PATTERN.test(name)) {
    return 'Используйте русские или латинские буквы. Между частями имени допустимы пробел, дефис или апостроф.'
  }
  const length = Array.from(name).length
  if (length < NAME_MIN_LENGTH || length > NAME_MAX_LENGTH) {
    return 'Имя должно содержать от 2 до 80 символов.'
  }
  return undefined
}

export function hasAdultCompanion(ages: readonly number[]): boolean {
  return !ages.some(age => age < 18) || ages.some(age => age >= 18)
}

export function validateParticipant(participant: Participant): FieldErrors {
  const errors: FieldErrors = {}
  const nameError = validateName(participant.name)
  if (nameError) errors.name = nameError
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
    if (age !== null) parsed.push({ ...participant, name: normalizeName(participant.name), age })
  }
  if (parsed.length === draft.participants.length && !hasAdultCompanion(parsed.map(p => p.age))) {
    errors.order = COMPANION_ERROR
  }
  if (errors.order || errors.contactEmail || Object.keys(errors.participants).length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, order: { participants: parsed, contactEmail: email, total: calculateTotal(parsed) } }
}
