import { runOpenJev } from '../src/backend/jev.js'
import { OPEN_JEV_ENDPOINT } from '../src/domain/jev.js'

// Synthetic context only; this diagnostic never reads Pocket or Lumi chat data.
const result = await runOpenJev(async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120_000) })
  return { status: response.status, body: await response.text() }
}, process.argv[2] || OPEN_JEV_ENDPOINT,
  'Alice and Morgan are close friends. Alice says she trusts Morgan completely and offers them the key to her home.',
  [{ type: 'score', question: 'How much does Alice trust Morgan?', options: ['Distrusts Morgan', 'Unsure whether to trust Morgan', 'Trusts Morgan completely'] }])
console.log(JSON.stringify(result, null, 2))
