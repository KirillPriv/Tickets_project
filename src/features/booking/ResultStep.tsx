import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleAlert, MapPin, Ticket } from 'lucide-react'
import poster from '../../../assets/images/festival-poster.webp'
import { mockEvent } from '../../data/mockEvent'
import { formatMoney, formatTicketCount } from '../../domain/pricing'
import type { BookingResult, ValidatedOrder } from '../../domain/types'

export function ResultStep({ result, order, onEdit, onReset }: { result: BookingResult; order: ValidatedOrder; onEdit: () => void; onReset: () => void }) {
  const success = result.status === 'success'
  return <section className={`result-page ${success ? 'success' : 'sold-out'}`}>
    <div className="result-symbol">{success ? <Check size={35} /> : <CircleAlert size={35} />}</div>
    <span className="eyebrow">Шаг 04 / {success ? 'До встречи на музыке' : 'Бывает и так'}</span>
    <h1 id="step-heading" tabIndex={-1}>{success ? 'Ваш вечер — в планах!' : 'Мест больше нет'}</h1>
    <p className="result-description">{success ? 'Демонстрационный заказ оформлен. Осталось настроиться на большую музыку.' : 'Пока вы оформляли заказ, доступные места закончились. Заказ не создан, ваши данные сохранены.'}</p>
    {success ? <>
      <article className="result-ticket panel" aria-label="Демонстрационный заказ"><img src={poster} alt="" /><div className="result-ticket-content"><span className="ticket-status"><Ticket size={14} /> Демо-заказ подтверждён</span><h2>{mockEvent.title}</h2><p><CalendarDays size={15} /> {mockEvent.date} · 18:00</p><p><MapPin size={15} /> {mockEvent.venue}</p><div className="result-ticket-meta"><div><span>Номер заказа</span><strong>{result.orderId}</strong></div><div><span>{formatTicketCount(order.participants.length)} · Итого</span><strong>{formatMoney(order.total)}</strong></div></div></div></article>
      <p className="result-footnote">Это демонстрация, а не входной билет. Деньги не списаны.<br />Письмо на <span>{order.contactEmail}</span> не отправлялось.</p>
      <button type="button" className="button primary" onClick={onReset}>Оформить ещё один заказ <ArrowRight size={17} /></button>
    </> : <><div className="soldout-saved panel"><Check size={19} /><p>Имена, возраст, тарифы и email сохранены.<br />Вы можете вернуться и изменить заказ.</p></div><button type="button" className="button primary" onClick={onEdit}><ArrowLeft size={17} /> Вернуться к участникам</button><p className="small muted">Демо-сценарий можно изменить на шаге проверки заказа.</p></>}
  </section>
}
