import { expect, test } from '@playwright/test'

test('S03: production assets и favicon возвращают настоящие изображения HTTP 200', async ({ page, request }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto('/')
  const urls = await page.locator('picture source, picture img, .brand img, link[rel="icon"]').evaluateAll(elements => elements.map(e => e.getAttribute('srcset') ?? e.getAttribute('src') ?? e.getAttribute('href')).filter((value): value is string => !!value))
  await page.getByRole('button', { name: 'Добавить: Полный билет', exact: true }).click()
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  urls.push(await page.locator('.summary-poster').getAttribute('src') ?? '')
  for (const url of urls) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(200)
    expect(response.headers()['content-type'], url).toMatch(/^image\//)
  }
  expect(errors).toEqual([])
})

test('S03: 1–4 билета, сохранённые форматные имена и двойной клик', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  for (const count of [1, 2, 3, 4]) {
    await page.goto('/')
    for (let i = 0; i < count; i += 1) await page.getByRole('button', { name: 'Добавить: Полный билет', exact: true }).click()
    if (count === 4) await expect(page.getByRole('button', { name: 'Добавить: Полный билет', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
    for (let i = 1; i <= count; i += 1) {
      const person = page.getByRole('group', { name: `Участник ${i}`, exact: true })
      await person.getByLabel('Имя', { exact: true }).fill(i === 1 ? 'аа' : 'ттт')
      await person.getByLabel('Возраст', { exact: true }).fill('18')
    }
    await page.getByLabel('Контактный email', { exact: true }).fill('demo@example.com')
    await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
    await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).dblclick()
    await expect(page.getByText(`${count} ${count === 1 ? 'билет' : 'билета'} · Итого`, { exact: true })).toBeVisible()
    await expect(page.getByText('EF-DEMO-0001', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  expect(errors).toEqual([])
})
