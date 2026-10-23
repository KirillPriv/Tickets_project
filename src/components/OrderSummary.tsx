import { CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
import poster from '../../assets/images/festival-poster.webp'
import { mockEvent } from '../data/mockEvent'
import { estimateTotal, formatMoney, TICKET_LABELS } from '../domain/pricing'
import type { BookingDraft } from '../domain/types'

export function OrderSummary({ draft }: { draft: BookingDraft }) {
  return <aside className="order-summary panel" aria-label="Итог заказа">
    <div className="summary-event">
      <img src={poster} alt="" className="summary-poster" />
      <div><span className="eyebrow">Ваш вечер</span><h2>{mockEvent.title}</h2><p><CalendarDays size={14} /> {mockEvent.date}</p></div>
    </div>
    <p className="summary-place"><MapPin size={15} /> {mockEvent.venue}</p>
    <div className="summary-lines">
      {(['adult', 'child'] as const).map(kind => {
        const count = draft.participants.filter(p => p.selectedTicket === kind).length
        return count > 0 ? <div key={kind}><span>{TICKET_LABELS[kind]}</span><span>× {count}</span></div> : null
      })}
      <div className="muted"><span>Сервисный сбор</span><span>0 ₽</span></div>
    </div>
    <div className="summary-total"><span>Итого</span><strong aria-live="polite">{formatMoney(estimateTotal(draft))}</strong></div>
    <p className="small muted">Цена по возрасту. При незаполненном возрасте — по выбранному тарифу.</p>
    <div className="demo-notice"><ShieldCheck size={19} /><p>Демо-оформление.<br />Деньги не списываются.</p></div>
  </aside>
}
