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
