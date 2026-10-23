import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import type { BookingGateway } from '../services/bookingGateway'

async function openForm() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Добавить: Полный билет' }))
  await user.click(screen.getByRole('button', { name: 'Продолжить' }))
  fireEvent.change(screen.getByLabelText('Возраст'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Контактный email'), { target: { value: 'demo@example.com' } })
  return user
}

describe('S02: ошибки формы и граница mock API', () => {
  it.each(['234222', '!!!', 'Маша123', '😀'])('имя «%s» остаётся видимым, блокирует переход и API', async name => {
    const submit = vi.fn<BookingGateway['submit']>()
    render(<App bookingGateway={{ submit }} />)
    const user = await openForm()
    await user.type(screen.getByLabelText('Имя'), name)
    expect(screen.getByLabelText('Имя')).toHaveValue(name)
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    const input = screen.getByLabelText('Имя')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Используйте русские или латинские буквы/)
    expect(screen.getByRole('heading', { name: 'Кто идёт с вами?' })).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  it.each(['1e2', '0x12', '+18'])('сырой возраст «%s» сохраняется, показывает ошибку и не вызывает API', async age => {
    const submit = vi.fn<BookingGateway['submit']>()
    render(<App bookingGateway={{ submit }} />)
    const user = await openForm()
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Маша' } })
    const input = screen.getByLabelText('Возраст')
    await user.clear(input)
    await user.type(input, age)
    expect(input).toHaveValue(age)
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Укажите целый возраст от 0 до 120 лет/)
    expect(submit).not.toHaveBeenCalled()
  })

  it('нормализация не мешает набору; review и API получают одинаковое нормализованное имя', async () => {
    const submit = vi.fn<BookingGateway['submit']>().mockResolvedValue({ status: 'success', orderId: 'EF-DEMO-0001' })
    render(<App bookingGateway={{ submit }} />)
    const user = await openForm()
    const name = screen.getByLabelText('Имя')
    await user.type(name, "  Anne  O'Connor  ")
    expect(name).toHaveValue("  Anne  O'Connor  ")
    await user.tab()
    expect(name).toHaveValue("Anne O'Connor")
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(screen.getByText("Anne O'Connor")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Подтвердить заказ' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ participants: [expect.objectContaining({ name: "Anne O'Connor", age: 18 })] }), 'success')
    expect(await screen.findByRole('heading', { name: 'Ваш вечер — в планах!' })).toBeInTheDocument()
  })

  it('расхождение тарифа объяснено сразу; исправление вручную снимает ошибку', async () => {
    const submit = vi.fn<BookingGateway['submit']>()
    render(<App bookingGateway={{ submit }} />)
    const user = await openForm()
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Демо Взрослый' } })
    await user.click(screen.getByRole('button', { name: 'Назад' }))
    await user.click(screen.getByRole('button', { name: 'Добавить: Детский билет' }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    const child = within(screen.getByRole('group', { name: 'Участник 2' }))
    fireEvent.change(child.getByLabelText('Имя'), { target: { value: 'Маша' } })
    fireEvent.change(child.getByLabelText('Возраст'), { target: { value: '14' } })
    expect(child.getByRole('status')).toHaveTextContent('Сумма рассчитана по возрасту. Выбранный тариф нужно исправить вручную.')
    expect(child.getByLabelText('Тариф')).toHaveValue('child')
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(submit).not.toHaveBeenCalled()
    await user.selectOptions(child.getByLabelText('Тариф'), 'adult')
    expect(child.queryByRole('status')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Проверить заказ' }))
    expect(screen.getByRole('heading', { name: 'Проверьте ваш заказ' })).toBeInTheDocument()
  })
})
