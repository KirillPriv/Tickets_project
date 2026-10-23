import type { BookingDraft, TicketKind } from './types'

export const TICKET_PRICES: Record<TicketKind, number> = { adult: 2000, child: 1000 }
export const TICKET_LABELS: Record<TicketKind, string> = { adult: 'Полный билет', child: 'Детский билет' }
export const MAX_PARTICIPANTS = 4

export function parseAge(value: string): number | null {
  if (value.trim() === '') return null
  const age = Number(value)
  return Number.isInteger(age) && age >= 0 && age <= 120 ? age : null
}

export function getTicketKind(age: number): TicketKind {
  return age < 14 ? 'child' : 'adult'
}

export function getPrice(age: number): number {
  return TICKET_PRICES[getTicketKind(age)]
}

export function calculateTotal(participants: readonly { age: number }[]): number {
  return participants.reduce((sum, participant) => sum + getPrice(participant.age), 0)
}

export function estimateTotal(draft: BookingDraft): number {
  return draft.participants.reduce((sum, participant) => {
    const age = parseAge(participant.age)
    return sum + (age === null ? TICKET_PRICES[participant.selectedTicket] : getPrice(age))
  }, 0)
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
}

export function formatAge(age: number): string {
  const lastTwo = age % 100
  const last = age % 10
  const suffix = lastTwo >= 11 && lastTwo <= 14 ? 'лет' : last === 1 ? 'год' : last >= 2 && last <= 4 ? 'года' : 'лет'
  return `${age} ${suffix}`
}
