import { expect, test } from '@playwright/test'

test('S02: все этапы, длинные значения, ошибки и крупный текст без горизонтального скролла', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  async function checkLayout() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const buttons = page.getByRole('button').filter({ visible: true })
    for (const button of await buttons.all()) {
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1)
      }
    }
  }
  await page.goto('/')
  await checkLayout()
  await page.getByRole('button', { name: 'Добавить: Полный билет', exact: true }).click()
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  const name = page.getByLabel('Имя', { exact: true })
  const age = page.getByLabel('Возраст', { exact: true })
  await name.fill('А'.repeat(81))
  await age.fill('+18')
  await page.getByLabel('Контактный email', { exact: true }).fill(`${'long'.repeat(15)}@example.com`)
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await expect(page.getByText('Имя должно содержать от 2 до 80 символов.', { exact: true })).toBeVisible()
  await expect(page.getByText('Укажите целый возраст от 0 до 120 лет.', { exact: true })).toBeVisible()
  expect(await page.locator('.field-error').first().evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14)
  await checkLayout()
  if (testInfo.project.name === 'mobile-390') {
    const path = process.env.EVENTFLOW_EVIDENCE_DIR ?? '../_artifacts/evidence/S02'
    await page.screenshot({ path: `${path}/mobile-390-errors.png`, fullPage: true })
  }
  await name.fill('А'.repeat(80))
  await age.fill('18')
  await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Проверьте ваш заказ', exact: true })).toBeVisible()
  await checkLayout()
  await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ваш вечер — в планах!', exact: true })).toBeVisible()
  await checkLayout()
  expect(errors).toEqual([])
})
