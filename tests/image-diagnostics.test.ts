import { expect, test } from 'bun:test'
import { clearImageDiagnostics, listImageDiagnostics, recordImageDiagnostic, sanitizeImageDiagnosticValue } from '../src/backend/image-diagnostics.js'

test('image diagnostics redact secrets and collapse huge image payloads', () => {
  const sanitized = sanitizeImageDiagnosticValue({
    apiKey: 'do-not-print',
    Authorization: 'Bearer nope',
    nested: { access_token: 'nope-again', prompt: 'keep this' },
    imageDataUrl: `data:image/png;base64,${'A'.repeat(4000)}`,
  }) as any
  expect(sanitized.apiKey).toBe('<redacted>')
  expect(sanitized.Authorization).toBe('<redacted>')
  expect(sanitized.nested.access_token).toBe('<redacted>')
  expect(sanitized.nested.prompt).toBe('keep this')
  expect(sanitized.imageDataUrl).toContain('<image payload:')
})

test('image diagnostics are per-user, newest first and bounded', () => {
  clearImageDiagnostics('diag-a'); clearImageDiagnostics('diag-b')
  for (let index = 0; index < 45; index++) recordImageDiagnostic('diag-a', {
    requestId: `job-${index}`, source: 'test', stage: 'provider_request', status: 'info', message: `request ${index}`, payload: { index },
  })
  recordImageDiagnostic('diag-b', { requestId: 'other', source: 'test', stage: 'provider_error', status: 'error', message: 'other user' })
  const logs = listImageDiagnostics('diag-a')
  expect(logs).toHaveLength(40)
  expect(logs[0].requestId).toBe('job-44')
  expect(logs.at(-1)?.requestId).toBe('job-5')
  expect(listImageDiagnostics('diag-b')).toHaveLength(1)
})

test('wide nested diagnostics share one budget and listing cannot mutate the log', () => {
  const user = 'diag-nested-budget'
  const fields = Object.fromEntries(Array.from({ length: 240 }, (_, index) => [`field-${index}`, 'x'.repeat(24_000)]))
  try {
    recordImageDiagnostic(user, {
      requestId: 'wide', source: 'test', stage: 'provider_request', status: 'info', message: 'budget',
      payload: { nested: { apiKey: 'secret', ...fields }, subsequent: fields },
    })
    const [first] = listImageDiagnostics(user)
    expect(JSON.stringify(first.payload).length).toBeLessThan(25_000)
    expect((first.payload as any).nested.apiKey).toBe('<redacted>')
    ;(first.payload as any).nested.apiKey = 'modified by reader'
    expect((listImageDiagnostics(user)[0].payload as any).nested.apiKey).toBe('<redacted>')
  } finally { clearImageDiagnostics(user) }
})
