import fs from 'node:fs/promises'

export default async function globalSetup() {
  const directory = process.env.EVENTFLOW_EVIDENCE_DIR
  if (!directory) throw new Error('Evidence directory must be configured')
  await fs.mkdir(directory, { recursive: true })
}
