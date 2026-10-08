import { runTypeSafeJev } from '../src/backend/jev.js'

// Synthetic context only; this diagnostic never reads Pocket or Lumi chat data.
const apiKey = process.env.TYPESAFE_API_KEY || ''
if (!apiKey) throw new Error('Set TYPESAFE_API_KEY to run this authenticated diagnostic.')
const result = await runTypeSafeJev(async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) })
  return { status: response.status, body: await response.text() }
}, apiKey, process.argv[2] || 'jev-latest',
  'Alice and Morgan are close friends. Alice says she trusts Morgan completely and offers them the key to her home.',
  [{ type: 'score', question: 'How much does Alice trust Morgan?', options: ['Distrusts Morgan', 'Unsure whether to trust Morgan', 'Trusts Morgan completely'] }])
console.log(JSON.stringify(result, null, 2))
