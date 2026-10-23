export type TicketKind = 'adult' | 'child'
export type BookingStep = 'event' | 'participants' | 'review' | 'result'
export type DemoScenario = 'success' | 'sold_out'

export interface Participant {
  id: string
  name: string
  // Keep the raw input so empty, fractional and invalid values remain editable.
  age: string
  selectedTicket: TicketKind
}

export interface BookingDraft {
  participants: Participant[]
  contactEmail: string
}

export interface ValidatedParticipant {
  id: string
  name: string
  age: number
  selectedTicket: TicketKind
}

export interface ValidatedOrder {
  participants: ValidatedParticipant[]
  contactEmail: string
  total: number
}

export type BookingResult =
  | { status: 'success'; orderId: string }
  | { status: 'sold_out' }

export type BookingOutcome =
  | { status: 'idle' }
  | { status: 'submitting' }
  | BookingResult
  | { status: 'error'; message: string }

export interface FieldErrors {
  name?: string
  age?: string
  selectedTicket?: string
}

export interface OrderErrors {
  participants: Record<string, FieldErrors>
  contactEmail?: string
  order?: string
}
