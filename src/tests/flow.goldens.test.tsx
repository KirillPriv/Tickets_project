import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import type { BookingResult } from '../domain/types'
import type { BookingGateway } from '../services/bookingGateway'
import { createMockBookingGateway } from '../services/mockBookingGateway'

async function fillOrder() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Добавить: Полный билет' }))
  await user.click(screen.getByRole('button', { name: 'Добавить: Детский билет' }))
  await user.click(screen.getByRole('button', { name: 'Продолжить' }))
  const adult = within(screen.getByRole('group', { name: 'Участник 1' }))
  const child = within(screen.getByRole('group', { name: 'Участник 2' }))
  await user.type(adult.getByLabelText('Имя'), 'Демо Взрослый')
  await user.type(adult.getByLabelText('Возраст'), '18')
  await user.type(child.getByLabelText('Имя'), 'Демо Ребёнок')
  await user.type(child.getByLabelText('Возраст'), '10')
  await user.type(screen.getByLabelText('Контактный email'), 'demo@example.com')
  await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
  return user
}

describe('Сквозной React golden-контракт', () => {
  it('успех только после async ответа; 3000 ₽; G08 двойной клик вызывает API один раз', async () => {
    let resolve!: (result: BookingResult) => void
    const submit = vi.fn<BookingGateway['submit']>(() => new Promise(r => { resolve = r }))
    render(<App bookingGateway={{ submit }} />)
    await fillOrder()
    expect(within(screen.getByLabelText('Итог заказа')).getByText(/3\s000 ₽/)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Подтвердить заказ' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Проверяем места…' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('heading', { name: 'Ваш вечер — в планах!' })).not.toBeInTheDocument()
    await act(async () => resolve({ status: 'success', orderId: 'EF-DEMO-0001' }))
    expect(screen.getByRole('heading', { name: 'Ваш вечер — в планах!' })).toBeInTheDocument()
    expect(screen.getByText('EF-DEMO-0001')).toBeInTheDocument()
    expect(screen.getByText(/не отправлялось/)).toBeInTheDocument()
  })

  it('G07: переключатель сам не даёт результат; sold_out сохраняет все поля; повтор возможен', async () => {
    const gateway = createMockBookingGateway(1)
    const submit = vi.spyOn(gateway, 'submit')
    render(<App bookingGateway={gateway} />)
    const user = await fillOrder()
    await user.click(screen.getByLabelText('Мест нет'))
    expect(submit).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Мест больше нет' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Подтвердить заказ' }))
    expect(await screen.findByRole('heading', { name: 'Мест больше нет' })).toBeInTheDocument()
    expect(screen.queryByText(/EF-DEMO-/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Вернуться к участникам' }))
    expect(screen.getByDisplayValue('Демо Взрослый')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Демо Ребёнок')).toBeInTheDocument()
    expect(screen.getByDisplayValue('18')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('demo@example.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    await user.click(screen.getByLabelText('Успешное оформление'))
    await user.click(screen.getByRole('button', { name: 'Подтвердить заказ' }))
    expect(await screen.findByRole('heading', { name: 'Ваш вечер — в планах!' })).toBeInTheDocument()
    expect(submit).toHaveBeenCalledTimes(2)
  })

  it('редактирование из review обновляет цену; несовместимый тариф блокирует переход', async () => {
    render(<App bookingGateway={createMockBookingGateway(1)} />)
    const user = await fillOrder()
    await user.click(screen.getByRole('button', { name: /^Изменить$/ }))
    const child = within(screen.getByRole('group', { name: 'Участник 2' }))
    await user.clear(child.getByLabelText('Возраст'))
    await user.type(child.getByLabelText('Возраст'), '14')
    expect(within(screen.getByLabelText('Итог заказа')).getByText(/4\s000 ₽/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(screen.getByText('С 14 лет нужен полный билет. Измените тариф или возраст.')).toBeInTheDocument()
    expect(child.getByLabelText('Тариф')).toHaveValue('child')
    await user.selectOptions(child.getByLabelText('Тариф'), 'adult')
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(screen.getByRole('heading', { name: 'Проверьте ваш заказ' })).toBeInTheDocument()
    expect(screen.getByText('Демо Взрослый')).toBeInTheDocument()
    expect(screen.getByText('Демо Ребёнок')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Итог заказа')).getByText(/4\s000 ₽/)).toBeInTheDocument()
  })

  it('невалидная форма не доходит до API; серверная ошибка сохраняет черновик', async () => {
    const gateway = { submit: vi.fn<BookingGateway['submit']>().mockRejectedValue(new Error('Нет ответа')) }
    render(<App bookingGateway={gateway} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Добавить: Полный билет' }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Проверьте выделенные поля')
    expect(gateway.submit).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('Имя'), 'Демо')
    await user.type(screen.getByLabelText('Возраст'), '18')
    await user.type(screen.getByLabelText('Контактный email'), 'demo@example.com')
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    await user.click(screen.getByRole('button', { name: 'Подтвердить заказ' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не удалось подтвердить заказ'))
    await user.click(screen.getByRole('button', { name: /^Изменить$/ }))
    expect(screen.getByDisplayValue('Демо')).toBeInTheDocument()
    expect(screen.getByDisplayValue('demo@example.com')).toBeInTheDocument()
  })
})
