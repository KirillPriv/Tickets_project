import { ArrowLeft, ArrowRight, FlaskConical, LoaderCircle, Mail, Pencil, UserRound } from 'lucide-react'
import { OrderSummary } from '../../components/OrderSummary'
import { formatAge, formatMoney, getPrice, TICKET_LABELS } from '../../domain/pricing'
import type { BookingDraft, DemoScenario, ValidatedOrder } from '../../domain/types'

interface Props {
  draft: BookingDraft
  order: ValidatedOrder
  scenario: DemoScenario
  busy: boolean
  error?: string
  onEdit: () => void
  onSubmit: () => void
  onScenario: (scenario: DemoScenario) => void
}

export function ReviewStep({ draft, order, scenario, busy, error, onEdit, onSubmit, onScenario }: Props) {
  return <>
    <div className="page-heading"><span className="eyebrow">Шаг 03 / Всё на своих местах</span><h1 id="step-heading" tabIndex={-1}>Проверьте ваш заказ</h1><p>Осталось убедиться, что всё верно, и подтвердить оформление.</p></div>
    <div className="checkout-layout">
      <div>
        <section className="panel review-participants" aria-labelledby="review-heading"><div className="flex items-center justify-between gap-3"><h2 id="review-heading">Ваши участники</h2><button type="button" className="text-button" disabled={busy} onClick={onEdit}><Pencil size={14} /> Изменить</button></div><ul>{order.participants.map(p => <li key={p.id}><span className="participant-icon"><UserRound size={19} /></span><div className="review-person"><strong>{p.name}</strong><span>{formatAge(p.age)} · {TICKET_LABELS[p.selectedTicket]}</span></div><strong className="review-price">{formatMoney(getPrice(p.age))}</strong></li>)}</ul></section>
        <section className="panel review-contact"><Mail size={20} /><div><h2>Контактный email</h2><p>{order.contactEmail}</p></div></section>
        <fieldset className="demo-controls" disabled={busy}><legend><FlaskConical size={16} /> Демонстрационный сценарий</legend><label><input type="radio" name="scenario" value="success" checked={scenario === 'success'} onChange={() => onScenario('success')} /> Успешное оформление</label><label><input type="radio" name="scenario" value="sold_out" checked={scenario === 'sold_out'} onChange={() => onScenario('sold_out')} /> Мест нет</label><p>Сценарий проверяется при подтверждении. Реальные деньги не списываются.</p></fieldset>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={onEdit}><ArrowLeft size={17} /> Назад</button><button type="button" className="button primary" disabled={busy} aria-busy={busy} onClick={onSubmit}>{busy ? <><LoaderCircle size={18} className="spin" /> Проверяем места…</> : <>Подтвердить заказ <ArrowRight size={17} /></>}</button></div>
        <p className="confirmation-caption" role="status">{busy ? 'Пожалуйста, подождите ответа. Ваши данные сохранены.' : 'Демо-оформление. Деньги не списываются.'}</p>
      </div>
      <OrderSummary draft={draft} />
    </div>
  </>
}
