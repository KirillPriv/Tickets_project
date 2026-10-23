import { ArrowRight, CalendarDays, Clock3, MapPin, Music2, ShieldCheck } from 'lucide-react'
import hero from '../../../assets/images/festival-hero.webp'
import mobileHero from '../../../assets/images/festival-mobile.webp'
import { TicketCounter } from '../../components/TicketCounter'
import { mockEvent } from '../../data/mockEvent'
import { estimateTotal, formatMoney, MAX_PARTICIPANTS } from '../../domain/pricing'
import type { BookingDraft, TicketKind } from '../../domain/types'

interface Props {
  draft: BookingDraft
  onAdjust: (kind: TicketKind, delta: 1 | -1) => void
  onContinue: () => void
}

export function EventStep({ draft, onAdjust, onContinue }: Props) {
  const count = draft.participants.length
  return <>
    <section className="event-hero" aria-labelledby="step-heading">
      <picture><source media="(max-width: 600px)" srcSet={mobileHero} /><img src={hero} alt="" fetchPriority="high" /></picture>
      <div className="hero-content">
        <span className="event-category"><Music2 size={14} /> Музыкальный фестиваль <span aria-hidden="true">/</span> 2026</span>
        <h1 id="step-heading" tabIndex={-1}>Ночь<br />большого <span>звука.</span></h1>
        <p>{mockEvent.description}</p>
        <div className="event-meta">
          <div><CalendarDays size={18} /><span><strong>{mockEvent.date}</strong><small>Суббота · {mockEvent.time}</small></span></div>
          <div><MapPin size={18} /><span><strong>Пространство «Волна»</strong><small>Москва · {mockEvent.address}</small></span></div>
        </div>
      </div>
      <span className="hero-caption"><span /> Встретимся на одной волне</span>
    </section>
    <section className="ticket-section" aria-labelledby="ticket-heading">
      <div className="ticket-main">
        <div className="section-heading"><div><span className="eyebrow">Начнём с главного</span><h2 id="ticket-heading">Выберите свои билеты</h2></div><span className="selection-limit">{count} / 4 участника</span></div>
        <div className="ticket-options">{(['adult', 'child'] as const).map(kind => <TicketCounter key={kind} kind={kind} count={draft.participants.filter(p => p.selectedTicket === kind).length} atLimit={count >= MAX_PARTICIPANTS} onChange={delta => onAdjust(kind, delta)} />)}</div>
        <p className="age-rule"><ShieldCheck size={17} /> Всем младше 18 лет нужен сопровождающий от 18 лет в том же заказе.</p>
      </div>
      <aside className="selection-summary panel" aria-label="Выбранные билеты">
        <div className="flex items-center justify-between gap-3"><span className="muted">Ваш заказ</span><span className="small">От 1 до 4 билетов</span></div>
        <div className="selection-total"><strong aria-live="polite">{formatMoney(estimateTotal(draft))}</strong><span>Без сервисного сбора</span></div>
        <button type="button" className="button primary" disabled={count === 0} onClick={onContinue}>Продолжить <ArrowRight size={18} /></button>
        <p className="selection-hint">{count === 0 ? 'Добавьте хотя бы один билет' : count === 4 ? 'Вы выбрали максимум — 4 билета' : 'Дальше — данные вашей компании'}</p>
        <p className="small muted demo-inline"><Clock3 size={14} /> Всего несколько простых шагов</p>
      </aside>
    </section>
  </>
}
