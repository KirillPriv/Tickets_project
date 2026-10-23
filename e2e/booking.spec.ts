import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const evidenceDirectory = process.env.EVENTFLOW_EVIDENCE_DIR ?? path.resolve('../_artifacts/evidence/S01')
const browserErrors = new WeakMap<Page, string[]>()

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

async function saveScreenshot(page: Page, name: string) {
  await fs.mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: path.join(evidenceDirectory, name), fullPage: true })
}

async function selectTickets(page: Page) {
  await page.getByRole('button', { name: 'Добавить: Полный билет', exact: true }).click()
  await page.getByRole('button', { name: 'Добавить: Детский билет', exact: true }).click()
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
}

async function enterParticipants(page: Page) {
  const adult = page.getByRole('group', { name: 'Участник 1', exact: true })
  const child = page.getByRole('group', { name: 'Участник 2', exact: true })
  await adult.getByLabel('Имя', { exact: true }).fill('Демо Взрослый')
  await adult.getByLabel('Возраст', { exact: true }).fill('18')
  await child.getByLabel('Имя', { exact: true }).fill('Демо Ребёнок')
  await child.getByLabel('Возраст', { exact: true }).fill('10')
  await page.getByLabel('Контактный email', { exact: true }).fill('demo@example.com')
}

test.beforeEach(async ({ page }) => {
  const failures: string[] = []
  browserErrors.set(page, failures)
  page.on('pageerror', error => failures.push(error.message))
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('большого')
})

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([])
})

test('B01 / B02: выбор → участники → 3000 ₽ → async success', async ({ page }, testInfo) => {
  await noOverflow(page)
  expect(await page.locator('html').getAttribute('lang')).toBe('ru')
  const image = page.locator('.event-hero img')
  expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  if (testInfo.project.name === 'desktop') await saveScreenshot(page, 'desktop-event.png')
  await expect(page.getByRole('button', { name: 'Продолжить', exact: true })).toBeDisabled()
  await selectTickets(page)
  await enterParticipants(page)
  await noOverflow(page)
  if (testInfo.project.name === 'mobile-360') await saveScreenshot(page, 'mobile-360-form.png')
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Проверьте ваш заказ')
  await expect(page.getByLabel('Итог заказа', { exact: true })).toContainText(/3\s000 ₽/)
  await noOverflow(page)
  if (testInfo.project.name === 'desktop') await saveScreenshot(page, 'desktop-review.png')
  await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Проверяем места…' })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Ваш вечер — в планах!', exact: true })).toBeVisible()
  await expect(page.getByText('EF-DEMO-0001', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Демонстрационный заказ', { exact: true })).toContainText(/3\s000 ₽/)
  await noOverflow(page)
})

test('B03: sold-out определяется при подтверждении, все поля сохраняются', async ({ page }, testInfo) => {
  await selectTickets(page)
  await enterParticipants(page)
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await page.getByLabel('Мест нет', { exact: true }).check()
  await expect(page.getByRole('heading', { name: 'Мест больше нет', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Мест больше нет', exact: true })).toBeVisible()
  await expect(page.getByText(/EF-DEMO-/)).toHaveCount(0)
  await noOverflow(page)
  if (testInfo.project.name === 'mobile-360') await saveScreenshot(page, 'mobile-360-soldout.png')
  await page.getByRole('button', { name: 'Вернуться к участникам', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Участник 1', exact: true }).getByLabel('Имя', { exact: true })).toHaveValue('Демо Взрослый')
  await expect(page.getByRole('group', { name: 'Участник 2', exact: true }).getByLabel('Имя', { exact: true })).toHaveValue('Демо Ребёнок')
  await expect(page.getByRole('group', { name: 'Участник 1', exact: true }).getByLabel('Возраст', { exact: true })).toHaveValue('18')
  await expect(page.getByRole('group', { name: 'Участник 2', exact: true }).getByLabel('Возраст', { exact: true })).toHaveValue('10')
  await expect(page.getByLabel('Контактный email', { exact: true })).toHaveValue('demo@example.com')
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await page.getByLabel('Успешное оформление', { exact: true }).check()
  await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ваш вечер — в планах!', exact: true })).toBeVisible()
})

test('B04: редактирование, локальные ошибки, клавиатура и пересчёт', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'К оформлению билетов', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await selectTickets(page)
  await enterParticipants(page)
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await page.getByRole('button', { name: 'Изменить', exact: true }).click()
  const child = page.getByRole('group', { name: 'Участник 2', exact: true })
  await child.getByLabel('Возраст', { exact: true }).fill('14')
  await child.getByLabel('Имя', { exact: true }).fill('ДемонстрационныйУчастникСОченьДлиннымИменем')
  await page.getByLabel('Контактный email', { exact: true }).fill('very.long.demonstration.address@example.com')
  await expect(page.getByLabel('Итог заказа', { exact: true })).toContainText(/4\s000 ₽/)
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await expect(page.getByText('С 14 лет нужен полный билет. Измените тариф или возраст.', { exact: true })).toBeVisible()
  await expect(child.getByLabel('Тариф', { exact: true })).toHaveValue('child')
  await expect(child.getByLabel('Тариф', { exact: true })).toBeFocused()
  await noOverflow(page)
  await child.getByLabel('Тариф', { exact: true }).selectOption('adult')
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Проверьте ваш заказ', exact: true })).toBeVisible()
  await expect(page.getByText('Демо Взрослый', { exact: true })).toBeVisible()
  await expect(page.getByText('ДемонстрационныйУчастникСОченьДлиннымИменем', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Итог заказа', { exact: true })).toContainText(/4\s000 ₽/)
  await noOverflow(page)
})
