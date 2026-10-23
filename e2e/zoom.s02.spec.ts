import { chromium, expect, test, type BrowserContext } from '@playwright/test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

test('S02: нативный zoom Chromium 200%, клавиатура и полный checkout', async ({ baseURL }, testInfo) => {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'eventflow-zoom-'))
  if (path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) || !path.basename(profile).startsWith('eventflow-zoom-')) {
    throw new Error('Unexpected temporary profile path')
  }
  await fs.mkdir(path.join(profile, 'Default'))
  // Chromium stores browser zoom as log(scale) / log(1.2), separate from pinch/DPR scaling.
  // The default storage partition has an empty relative path, encoded by Chromium as "x".
  await fs.writeFile(path.join(profile, 'Default', 'Preferences'), JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }))
  let context: BrowserContext | undefined
  try {
    context = await chromium.launchPersistentContext(profile, {
      headless: true,
      viewport: { width: 1440, height: 1000 },
      executablePath: process.env.EVENTFLOW_CHROMIUM_PATH,
      args: ['--window-size=1440,1000'],
      locale: 'ru-RU',
    })
    const page = context.pages()[0] ?? await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(baseURL ?? 'http://127.0.0.1:4173')
    const metrics = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio, scale: visualViewport?.scale }))
    expect(metrics.width).toBe(720)
    expect(metrics.dpr).toBe(2)
    expect(metrics.scale).toBe(1)
    const checkOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await checkOverflow()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'К оформлению билетов', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Добавить: Полный билет', exact: true }).click()
    await page.getByRole('button', { name: 'Добавить: Детский билет', exact: true }).click()
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
    const adult = page.getByRole('group', { name: 'Участник 1', exact: true })
    const child = page.getByRole('group', { name: 'Участник 2', exact: true })
    await adult.getByLabel('Имя', { exact: true }).fill('Маша123')
    await adult.getByLabel('Возраст', { exact: true }).fill('1e2')
    await page.getByRole('button', { name: 'Проверить заказ', exact: true }).click()
    await expect(adult.getByLabel('Имя', { exact: true })).toBeFocused()
    await expect(adult.getByLabel('Возраст', { exact: true })).toHaveAccessibleDescription(/Укажите целый возраст от 0 до 120 лет/)
    await checkOverflow()
    await adult.getByLabel('Имя', { exact: true }).fill("Анна O'Connor")
    await adult.getByLabel('Возраст', { exact: true }).fill('18')
    await child.getByLabel('Имя', { exact: true }).fill('Ёлка')
    await child.getByLabel('Возраст', { exact: true }).fill('13')
    await page.getByLabel('Контактный email', { exact: true }).fill('demo@example.com')
    await checkOverflow()
    await page.getByRole('button', { name: 'Проверить заказ', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Итог заказа', { exact: true })).toContainText(/3\s000 ₽/)
    await checkOverflow()
    const evidence = process.env.EVENTFLOW_EVIDENCE_DIR ?? '../_artifacts/evidence/S02'
    const session = await context.newCDPSession(page)
    const layout = await session.send('Page.getLayoutMetrics')
    // CDP's physical content dimensions avoid cropping a native-zoom full-page screenshot.
    const capture = await session.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: layout.contentSize.width, height: layout.contentSize.height, scale: 1 },
    })
    await fs.writeFile(`${evidence}/zoom-200-review.png`, Buffer.from(capture.data, 'base64'))
    const zoomEvidence = JSON.stringify({ ...metrics, cssContentWidth: layout.cssContentSize.width, physicalContentWidth: layout.contentSize.width }, null, 2)
    await fs.writeFile(`${evidence}/zoom-metrics.json`, zoomEvidence)
    await testInfo.attach('native-zoom-metrics', { body: zoomEvidence, contentType: 'application/json' })
    await page.getByRole('button', { name: 'Подтвердить заказ', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Ваш вечер — в планах!', exact: true })).toBeVisible()
    await checkOverflow()
    expect(errors).toEqual([])
  } finally {
    await context?.close()
    await fs.rm(profile, { recursive: true, force: true })
  }
})
