import { useState, type Dispatch, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Info, Mail } from 'lucide-react'
import { OrderSummary } from '../../components/OrderSummary'
import { ParticipantCard } from '../../components/ParticipantCard'
import type { BookingAction } from '../../domain/bookingReducer'
import type { BookingDraft } from '../../domain/types'
import { validateOrder } from '../../domain/validation'

export function ParticipantsStep({ draft, dispatch }: { draft: BookingDraft; dispatch: Dispatch<BookingAction> }) {
  const [attempted, setAttempted] = useState(false)
  const result = validateOrder(draft)
  const errors = attempted && !result.valid ? result.errors : undefined
  function continueBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    if (result.valid) dispatch({ type: 'go', step: 'review' })
    else {
      const form = event.currentTarget
      // Wait for inline messages/aria-invalid to render, then focus the first error.
      requestAnimationFrame(() => {
        const target = form.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form.querySelector<HTMLElement>('[data-order-error]')
        target?.focus()
      })
    }
  }
  return <>
    <div className="page-heading"><span className="eyebrow">Шаг 02 / Ваша компания</span><h1 id="step-heading" tabIndex={-1}>Кто идёт с вами?</h1><p>Укажите данные каждого участника. Билеты будут именными.</p></div>
    <div className="checkout-layout">
      <form onSubmit={continueBooking} noValidate className="participants-form">
        <div className="flex items-center justify-between gap-3 form-section-heading"><h2>Участники</h2><button type="button" className="text-button" onClick={() => dispatch({ type: 'go', step: 'event' })}>Изменить количество</button></div>
        {draft.participants.map((participant, index) => <ParticipantCard key={participant.id} participant={participant} index={index} errors={errors?.participants[participant.id]} onChange={changes => dispatch({ type: 'updateParticipant', id: participant.id, changes })} />)}
        <div className="companion-note"><Info size={19} /><p>Участникам младше 18 лет нужен взрослый от 18 лет в этом же заказе. В возрасте 14–17 лет действует полный тариф.</p></div>
        <section className="contact-card panel" aria-labelledby="contact-heading"><div className="flex items-center gap-3"><Mail size={20} /><h2 id="contact-heading">Контакт для заказа</h2></div><div className="field"><label htmlFor="contact-email">Контактный email</label><input id="contact-email" type="email" inputMode="email" autoComplete="off" value={draft.contactEmail} placeholder="name@example.com" onChange={e => dispatch({ type: 'updateEmail', value: e.target.value })} aria-invalid={!!errors?.contactEmail} aria-describedby={errors?.contactEmail ? 'email-error' : 'email-hint'} />{errors?.contactEmail ? <p className="field-error" id="email-error">{errors.contactEmail}</p> : <p id="email-hint" className="small muted">Один email на весь заказ. В демоверсии письма не отправляются.</p>}</div></section>
        {errors && <div className="error-banner" role="alert" tabIndex={-1} data-order-error>{errors.order ?? 'Проверьте выделенные поля, чтобы продолжить.'}</div>}
        <div className="form-actions"><button type="button" className="button secondary" onClick={() => dispatch({ type: 'go', step: 'event' })}><ArrowLeft size={17} /> Назад</button><button type="submit" className="button primary">Проверить заказ <ArrowRight size={17} /></button></div>
      </form>
      <OrderSummary draft={draft} />
    </div>
  </>
}
