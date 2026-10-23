import type { BookingResult, DemoScenario, ValidatedOrder } from '../domain/types'

export interface BookingGateway {
  submit(order: ValidatedOrder, scenario: DemoScenario): Promise<BookingResult>
}
