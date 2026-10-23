import { Headphones, ShieldCheck } from 'lucide-react'
import mark from '../../assets/brand/eventflow-mark.svg'
import { BookingFlow } from '../features/booking/BookingFlow'
import type { BookingGateway } from '../services/bookingGateway'
import { createMockBookingGateway } from '../services/mockBookingGateway'

const gateway = createMockBookingGateway()

export default function App({ bookingGateway = gateway }: { bookingGateway?: BookingGateway }) {
  return <div className="app-shell">
    <a className="skip-link" href="#main">К оформлению билетов</a>
    <header className="site-header"><div className="brand" aria-label="EVENTFLOW — билеты на впечатления"><img src={mark} alt="" /><span>EVENT<span>FLOW</span><small>Билеты на впечатления</small></span></div><span className="header-note"><Headphones size={16} /> Музыка объединяет</span><span className="demo-badge"><span /> Демо-версия</span></header>
    <main id="main" tabIndex={-1}><BookingFlow gateway={bookingGateway} /></main>
    <footer className="site-footer"><p>© 2026 EVENTFLOW <span>·</span> Ближе к музыке.</p><p><ShieldCheck size={14} /> Учебный проект. Все события вымышлены.</p></footer>
  </div>
}
