import { MAX_PARTICIPANTS } from './pricing'
import { validateOrder } from './validation'
import type { BookingDraft, BookingOutcome, BookingResult, BookingStep, DemoScenario, Participant, TicketKind } from './types'

export interface BookingState {
  draft: BookingDraft
  removed: Participant[]
  nextId: number
  step: BookingStep
  scenario: DemoScenario
  outcome: BookingOutcome
}

export function createInitialState(): BookingState {
  return {
    draft: { participants: [], contactEmail: '' },
    removed: [], nextId: 1, step: 'event', scenario: 'success', outcome: { status: 'idle' },
  }
}

export type BookingAction =
  | { type: 'adjustTicket'; kind: TicketKind; delta: 1 | -1 }
  | { type: 'updateParticipant'; id: string; changes: Partial<Pick<Participant, 'name' | 'age' | 'selectedTicket'>> }
  | { type: 'updateEmail'; value: string }
  | { type: 'go'; step: 'event' | 'participants' | 'review' }
  | { type: 'scenario'; scenario: DemoScenario }
  | { type: 'submit' }
  | { type: 'result'; result: BookingResult }
  | { type: 'error'; message: string }
  | { type: 'reset' }

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  if (action.type === 'reset') return state.outcome.status === 'submitting' ? state : createInitialState()
  if (state.outcome.status === 'submitting' && action.type !== 'result' && action.type !== 'error') return state
  if (state.outcome.status === 'success') return state
  switch (action.type) {
    case 'adjustTicket': {
      const participants = state.draft.participants
      if (action.delta === 1) {
        if (participants.length >= MAX_PARTICIPANTS) return state
        const saved = state.removed.findLast(p => p.selectedTicket === action.kind)
        const participant: Participant = saved ?? { id: `participant-${state.nextId}`, name: '', age: '', selectedTicket: action.kind }
        return {
          ...state, nextId: saved ? state.nextId : state.nextId + 1,
          draft: { ...state.draft, participants: [...participants, participant] },
          removed: state.removed.filter(p => p.id !== participant.id), outcome: { status: 'idle' },
        }
      }
      const participant = participants.findLast(p => p.selectedTicket === action.kind)
      if (!participant) return state
      return { ...state, draft: { ...state.draft, participants: participants.filter(p => p.id !== participant.id) }, removed: [...state.removed, participant], outcome: { status: 'idle' } }
    }
    case 'updateParticipant':
      return { ...state, draft: { ...state.draft, participants: state.draft.participants.map(p => p.id === action.id ? { ...p, ...action.changes } : p) }, outcome: { status: 'idle' } }
    case 'updateEmail':
      return { ...state, draft: { ...state.draft, contactEmail: action.value }, outcome: { status: 'idle' } }
    case 'go':
      if (action.step === 'participants' && state.draft.participants.length === 0) return state
      if (action.step === 'review' && !validateOrder(state.draft).valid) return state
      return { ...state, step: action.step, outcome: { status: 'idle' } }
    case 'scenario':
      return { ...state, scenario: action.scenario }
    case 'submit':
      return state.step === 'review' && validateOrder(state.draft).valid ? { ...state, outcome: { status: 'submitting' } } : state
    case 'result':
      return state.outcome.status === 'submitting' ? { ...state, step: 'result', outcome: action.result } : state
    case 'error':
      return state.outcome.status === 'submitting' ? { ...state, outcome: { status: 'error', message: action.message } } : state
  }
}
