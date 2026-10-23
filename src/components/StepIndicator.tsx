import { Check } from 'lucide-react'
import type { BookingStep } from '../domain/types'

const steps: { step: BookingStep; label: string }[] = [
  { step: 'event', label: 'Билеты' },
  { step: 'participants', label: 'Участники' },
  { step: 'review', label: 'Проверка' },
  { step: 'result', label: 'Результат' },
]

export function StepIndicator({ current }: { current: BookingStep }) {
  const index = steps.findIndex(item => item.step === current)
  return <nav aria-label="Этапы оформления" className="stepper">
    <ol>{steps.map((item, i) => <li key={item.step} aria-current={i === index ? 'step' : undefined} className={i === index ? 'current' : i < index ? 'complete' : ''}>
      <span className="step-number" aria-hidden="true">{i < index ? <Check size={16} /> : `0${i + 1}`}</span>
      <span>{item.label}</span>
    </li>)}</ol>
  </nav>
}
