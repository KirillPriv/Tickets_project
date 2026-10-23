import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ResultStep } from '../features/booking/ResultStep'

it.each([[1, '1 билет'], [2, '2 билета'], [3, '3 билета'], [4, '4 билета']])('результат для %i участников: %s', (count, text) => {
  render(<ResultStep result={{ status: 'success', orderId: 'EF-DEMO-0001' }} order={{ contactEmail: 'demo@example.com', total: count * 2000, participants: Array.from({ length: count }, (_, index) => ({ id: String(index), name: 'аа', age: 18, selectedTicket: 'adult' })) }} onEdit={() => {}} onReset={() => {}} />)
  expect(screen.getByText(`${text} · Итого`)).toBeInTheDocument()
})
