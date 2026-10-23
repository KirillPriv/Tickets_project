import { describe, expect, it } from 'vitest'
import { parseAge } from '../domain/pricing'
import { normalizeName, validateName, validateOrder } from '../domain/validation'
import type { BookingDraft, ValidatedOrder } from '../domain/types'
import { createMockBookingGateway } from '../services/mockBookingGateway'

function draft(name = 'Демо Участник', age = '18'): BookingDraft {
  return { participants: [{ id: 'p1', name, age, selectedTicket: 'adult' }], contactEmail: 'demo@example.com' }
}

describe('S02: имена и строгая десятичная запись возраста', () => {
  it.each(['Маша', 'Ёлка', 'ёлка', 'Анна-Мария', 'Анна Мария', "O'Connor", 'D’Arcy', 'Mary Jane', 'José', 'Ли', 'Al', 'А'.repeat(80)])('принимает имя «%s»', name => {
    expect(validateName(name)).toBeUndefined()
    expect(validateOrder(draft(name)).valid).toBe(true)
  })

  it.each(['234222', '!!!', 'Маша123', '😀', 'Маша 😀', 'А', 'А'.repeat(81), '-Маша', 'Маша-', "'Маша", 'Маша--Анна', "Маша''Анна", 'Маша_Анна', 'Ⅳ', '李明'])('отклоняет имя «%s»', name => {
    expect(validateName(name)).toEqual(expect.any(String))
    expect(validateOrder(draft(name))).toMatchObject({ valid: false, errors: { participants: { p1: { name: expect.any(String) } } } })
  })

  it('нормализует пробелы и Unicode перед формированием заказа, не меняя черновик', () => {
    const order = draft('  Анна\t  Мария\u00a0  Ёлкина  ')
    expect(normalizeName(' Jose\u0301 ')).toBe('José')
    const checked = validateOrder(order)
    expect(checked).toMatchObject({ valid: true, order: { participants: [{ name: 'Анна Мария Ёлкина' }] } })
    expect(order.participants[0]?.name).toBe('  Анна\t  Мария\u00a0  Ёлкина  ')
  })

  it.each(['1e2', '1E2', '0x12', '0X12', '+18', '-0', '-18', '18.0', '18,0', ' 18', '18 ', '1 8', '１２', 'NaN', 'Infinity', '121', '9'.repeat(100)])('отклоняет возраст «%s»', age => {
    expect(parseAge(age)).toBeNull()
    expect(validateOrder(draft('Демо Участник', age))).toMatchObject({ valid: false, errors: { participants: { p1: { age: expect.any(String) } } } })
  })

  it.each([['0', 0], ['13', 13], ['14', 14], ['17', 17], ['18', 18], ['120', 120], ['018', 18]])('принимает десятичный возраст «%s»', (raw, expected) => {
    expect(parseAge(raw)).toBe(expected)
  })

  it.each(['234222', '!!!', 'Маша123', '😀', 'А'.repeat(81)])('mock API повторно отклоняет имя «%s» при обходе UI', async name => {
    const gateway = createMockBookingGateway(1)
    const checked = validateOrder(draft())
    if (!checked.valid) throw new Error('Невалидная фикстура')
    const order = { ...checked.order, participants: checked.order.participants.map(p => ({ ...p, name })) }
    await expect(gateway.submit(order, 'success')).rejects.toThrow('Некорректный заказ.')
    const result = await gateway.submit(checked.order, 'success')
    expect(result).toEqual({ status: 'success', orderId: 'EF-DEMO-0001' })
  })

  it.each(['1e2', '0x12', '+18'])('mock API отклоняет строковый возраст «%s» при обходе TS-контракта', async age => {
    const checked = validateOrder(draft())
    if (!checked.valid) throw new Error('Невалидная фикстура')
    const malformedOrder = { ...checked.order, participants: checked.order.participants.map(p => ({ ...p, age })) } as unknown as ValidatedOrder
    await expect(createMockBookingGateway(1).submit(malformedOrder, 'success')).rejects.toThrow('Некорректный заказ.')
  })
})
