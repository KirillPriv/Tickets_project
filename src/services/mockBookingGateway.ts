import { validateOrder } from '../domain/validation'
import type { BookingGateway } from './bookingGateway'

export function createMockBookingGateway(delayMs = 900): BookingGateway {
  let sequence = 0
  return {
    async submit(order, scenario) {
      const checked = validateOrder({
        contactEmail: order.contactEmail,
        participants: order.participants.map(p => ({ ...p, age: String(p.age) })),
      })
      if (!checked.valid || checked.order.total !== order.total) throw new Error('Некорректный заказ.')
      await new Promise<void>(resolve => setTimeout(resolve, delayMs))
      if (scenario === 'sold_out') return { status: 'sold_out' }
      sequence += 1
      return { status: 'success', orderId: `EF-DEMO-${String(sequence).padStart(4, '0')}` }
    },
  }
}
