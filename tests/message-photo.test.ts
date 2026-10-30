import { expect, test } from 'bun:test'
import { characterPhotoInstruction, normalizeMessagePhoto, validChatPhotoUpload } from '../src/domain/message-photo.js'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { effectiveImageRequest } from '../src/backend/image-jobs.js'
import type { SwarmVisualProfile } from '../src/types.js'

test('character pictures are opt-in and photo job state is bounded', () => {
  expect(defaultPreferences().characterPictures).toBe(false)
  expect(normalizePreferences({ characterPictures: true }).characterPictures).toBe(true)
  expect(normalizeMessagePhoto({ prompt: ' ', jobId: 'job' })).toBeUndefined()
  expect(normalizeMessagePhoto({ prompt: 'a'.repeat(5000), jobId: 'photo', status: 'bad', error: 'b'.repeat(500) })).toMatchObject({ status: 'pending', jobId: 'photo' })
  expect(normalizeMessagePhoto({ prompt: 'a'.repeat(5000), jobId: 'photo' })!.prompt.length).toBe(4000)
  expect(characterPhotoInstruction(false)).toContain('disabled')
  expect(characterPhotoInstruction(true)).toContain('imagePrompt')
})

test('chat photos preserve scene descriptions instead of forcing a contact portrait', () => {
  const request = effectiveImageRequest('A bowl of ramen on a kitchen table', 'message', '', '4:3', {} as SwarmVisualProfile, defaultPreferences())
  expect(request.prompt).toBe('A bowl of ramen on a kitchen table')
  expect(request.prompt).not.toContain('portrait')
  expect(request.parameters.width).toBeGreaterThan(request.parameters.height as number)
})

test('uploads reject non-images, malformed base64, and files larger than the advertised limit', () => {
  expect(validChatPhotoUpload('data:image/png;base64,AAAA')).toBe(true)
  expect(validChatPhotoUpload('data:text/html;base64,AAAA')).toBe(false)
  expect(validChatPhotoUpload('data:image/png;base64,AAA')).toBe(false)
  expect(validChatPhotoUpload('data:image/png;base64,' + 'AAAA'.repeat(3_000_000))).toBe(false)
})
