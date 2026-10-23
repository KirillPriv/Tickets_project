import { expect, test } from '@playwright/test'

test('S02: невалидные имена/возраст, inline-ошибки, исправление и нормализация', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Добавить: Полный билет', exact: true }).click()
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  const name = page.getByLabel('Имя', { exact: true })
  const age = page.getByLabel('Возраст', { exact: true })
  const continueButton = page.getByRole('button', { name: 'Проверить заказ', exact: true })
  await age.fill('18')
  await page.getByLabel('Контактный email', { exact: true }).fill('demo@example.com')

  for (const invalidName of ['234222', '!!!', 'Маша123', '😀', 'А'.repeat(81)]) {
    await name.fill(invalidName)
    await continueButton.click()
    await expect(name).toHaveValue(invalidName)
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toBeFocused()
    await expect(page.getByRole('button', { name: 'Подтвердить заказ', exact: true })).toHaveCount(0)
    await expect(page.getByRole('alert')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }

  await name.fill('  Анна-Мария   O’Connor  ')
  await age.focus()
  await expect(name).toHaveValue('Анна-Мария O’Connor')
  for (const invalidAge of ['1e2', '0x12', '+18', '18.0']) {
    await age.fill(invalidAge)
    await continueButton.click()
    await expect(age).toHaveValue(invalidAge)
    await expect(age).toHaveAttribute('aria-invalid', 'true')
    await expect(age).toBeFocused()
    await expect(age).toHaveAccessibleDescription(/Укажите целый возраст от 0 до 120 лет/)
    await expect(page.getByRole('button', { name: 'Подтвердить заказ', exact: true })).toHaveCount(0)
  }
  await age.fill('18')
  await continueButton.click()
  await expect(page.getByText('Анна-Мария O’Connor', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ваш вечер — в планах!', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
