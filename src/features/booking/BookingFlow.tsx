import { useEffect, useReducer, useRef } from 'react'
import { StepIndicator } from '../../components/StepIndicator'
import { bookingReducer, createInitialState } from '../../domain/bookingReducer'
import { validateOrder } from '../../domain/validation'
import type { BookingGateway } from '../../services/bookingGateway'
import { EventStep } from './EventStep'
import { ParticipantsStep } from './ParticipantsStep'
import { ResultStep } from './ResultStep'
import { ReviewStep } from './ReviewStep'

export function BookingFlow({ gateway }: { gateway: BookingGateway }) {
  const [state, dispatch] = useReducer(bookingReducer, undefined, createInitialState)
  const inFlight = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const previousStep = useRef(state.step)
  const validation = validateOrder(state.draft)
  const busy = state.outcome.status === 'submitting'

  useEffect(() => {
    if (previousStep.current !== state.step) rootRef.current?.querySelector<HTMLElement>('#step-heading')?.focus()
    previousStep.current = state.step
  }, [state.step])

  async function submit() {
    if (inFlight.current || busy || state.step !== 'review' || !validation.valid) return
    inFlight.current = true
    dispatch({ type: 'submit' })
    try {
      const result = await gateway.submit(validation.order, state.scenario)
      dispatch({ type: 'result', result })
    } catch {
      dispatch({ type: 'error', message: 'Не удалось подтвердить заказ. Ваши данные сохранены — попробуйте ещё раз.' })
    } finally {
      inFlight.current = false
    }
  }

  return <div ref={rootRef}>
    <StepIndicator current={state.step} />
    {state.step === 'event' && <EventStep draft={state.draft} onAdjust={(kind, delta) => dispatch({ type: 'adjustTicket', kind, delta })} onContinue={() => dispatch({ type: 'go', step: 'participants' })} />}
    {state.step === 'participants' && <ParticipantsStep draft={state.draft} dispatch={dispatch} />}
    {state.step === 'review' && validation.valid && <ReviewStep draft={state.draft} order={validation.order} scenario={state.scenario} busy={busy} error={state.outcome.status === 'error' ? state.outcome.message : undefined} onEdit={() => dispatch({ type: 'go', step: 'participants' })} onSubmit={() => void submit()} onScenario={scenario => dispatch({ type: 'scenario', scenario })} />}
    {state.step === 'result' && validation.valid && (state.outcome.status === 'success' || state.outcome.status === 'sold_out') && <ResultStep result={state.outcome} order={validation.order} onEdit={() => dispatch({ type: 'go', step: 'participants' })} onReset={() => dispatch({ type: 'reset' })} />}
  </div>
}
