import { describe, expect, it } from 'vitest'
import { bookingReducer, createInitialState } from '../domain/bookingReducer'
import { calculateTotal, getPrice, getTicketKind } from '../domain/pricing'
import type { BookingDraft, Participant } from '../domain/types'
import { hasAdultCompanion, validateOrder } from '../domain/validation'
import { createMockBookingGateway } from '../services/mockBookingGateway'

function person(age: number, id = 'p1'): Participant {
  return { id, name: 'Тестовый участник', age: String(age), selectedTicket: getTicketKind(age) }
}

function draft(ages: number[]): BookingDraft {
  return { participants: ages.map((age, index) => person(age, `p${index}`)), contactEmail: 'demo@example.com' }
}

describe('Доменный golden-контракт', () => {
  it.each([[13, 1000], [14, 2000], [17, 2000], [18, 2000]])('G01: %i лет → %i ₽', (age, price) => {
    expect(getPrice(age)).toBe(price)
    expect(hasAdultCompanion([age])).toBe(age >= 18)
  })

  it.each([
    [[13, 18], true], [[17, 18], true], [[17], false], [[13, 17], false],
  ] as const)('G02: сопровождение %j → %s', (ages, valid) => {
    expect(validateOrder(draft([...ages])).valid).toBe(valid)
  })

  it.each([[0, false], [1, true], [4, true], [5, false]])('G03: %i участников → %s', (count, valid) => {
    expect(validateOrder(draft(Array.from({ length: count }, () => 18))).valid).toBe(valid)
  })

  it('G04: фактический возраст определяет сумму, правка 10 → 14 пересчитывает цену', () => {
    expect(calculateTotal([{ age: 10 }, { age: 18 }, { age: 14 }])).toBe(5000)
    expect(calculateTotal([{ age: 14 }, { age: 18 }, { age: 14 }])).toBe(6000)
  })

  it.each(['', ' ', '-1', '1.5', '121', 'abc'])('G05: недопустимый возраст «%s» блокирует заказ', age => {
    const order = draft([18])
    order.participants[0] = { ...person(18), age }
    expect(validateOrder(order).valid).toBe(false)
  })

  it('G05: пустое имя и некорректный либо множественный email блокируют заказ', () => {
    const order = draft([18])
    order.participants[0] = { ...person(18), name: '  ' }
    expect(validateOrder(order).valid).toBe(false)
    for (const email of ['', 'wrong', 'a@b', 'a@b.ru,c@d.ru', 'a@b.ru c@d.ru']) {
      expect(validateOrder({ ...draft([18]), contactEmail: email }).valid).toBe(false)
    }
    expect(validateOrder({ ...draft([0, 18]), contactEmail: ' demo@example.com ' }).valid).toBe(true)
  })

  it('G06: несовместимый тариф отклоняется без изменения черновика', () => {
    const order = draft([14, 18])
    order.participants[0] = { ...person(14), selectedTicket: 'child' }
    expect(validateOrder(order)).toMatchObject({ valid: false, errors: { participants: { p1: { selectedTicket: expect.any(String) } } } })
    expect(order.participants[0].selectedTicket).toBe('child')
  })

  it('счётчики ограничены четырьмя; удаление и восстановление сохраняют ID и ввод', () => {
    let state = createInitialState()
    state = bookingReducer(state, { type: 'adjustTicket', kind: 'adult', delta: 1 })
    state = bookingReducer(state, { type: 'updateParticipant', id: 'participant-1', changes: { name: 'Демо', age: '18' } })
    state = bookingReducer(state, { type: 'adjustTicket', kind: 'adult', delta: -1 })
    state = bookingReducer(state, { type: 'adjustTicket', kind: 'adult', delta: 1 })
    expect(state.draft.participants[0]).toMatchObject({ id: 'participant-1', name: 'Демо', age: '18' })
    for (let index = 0; index < 5; index += 1) state = bookingReducer(state, { type: 'adjustTicket', kind: 'child', delta: 1 })
    expect(state.draft.participants).toHaveLength(4)
  })

  it('нельзя попасть в проверку и подтвердить невалидный заказ', () => {
    const state = createInitialState()
    expect(bookingReducer(state, { type: 'go', step: 'review' })).toBe(state)
    expect(bookingReducer(state, { type: 'submit' })).toBe(state)
  })

  it('G07: async sold_out не выдаёт номер заказа', async () => {
    const validation = validateOrder(draft([18, 10]))
    if (!validation.valid) throw new Error('Невалидная фикстура')
    const result = await createMockBookingGateway(1).submit(validation.order, 'sold_out')
    expect(result).toEqual({ status: 'sold_out' })
    expect(result).not.toHaveProperty('orderId')
  })

  it('mock API отклоняет подменённую сумму', async () => {
    const validation = validateOrder(draft([18]))
    if (!validation.valid) throw new Error('Невалидная фикстура')
    await expect(createMockBookingGateway(1).submit({ ...validation.order, total: 1 }, 'success')).rejects.toThrow()
  })
})
