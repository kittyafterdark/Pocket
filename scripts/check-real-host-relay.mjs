import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const explicit = process.argv.find((entry) => entry.startsWith('--state='))?.slice('--state='.length)

async function stateFiles() {
  if (explicit) return [resolve(explicit)]
  const usersRoot = resolve(root, 'data', 'users')
  const users = await readdir(usersRoot, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const user of users) {
    if (!user.isDirectory()) continue
    const phoneRoot = resolve(usersRoot, user.name, 'extensions', 'lumiphone', 'phones')
    const entries = await readdir(phoneRoot, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) if (entry.isFile() && entry.name.endsWith('.json')) files.push(resolve(phoneRoot, entry.name))
  }
  return files
}

const candidates = []
for (const path of await stateFiles()) {
  const state = JSON.parse(await readFile(path, 'utf8'))
  for (const relay of Array.isArray(state.relays) ? state.relays : []) {
    if (relay?.continuation?.invokedAt) candidates.push({ path, state, relay })
  }
}
candidates.sort((a, b) => Date.parse(b.relay.continuation.invokedAt) - Date.parse(a.relay.continuation.invokedAt))
const selectedId = process.argv.find((entry) => entry.startsWith('--relay='))?.slice('--relay='.length)
const candidate = selectedId ? candidates.find((entry) => entry.relay.id === selectedId) : candidates[0]
assert.ok(candidate, 'No instrumented Pocket relay was found. Perform one real handoff, then run this check again.')

const { state, relay, path } = candidate
const continuation = relay.continuation
assert.ok(relay.burstId, 'The relay does not retain its creating decision burst.')
assert.equal(continuation.method, 'spindle.chat.appendMessage(triggerGeneration)')
assert.deepEqual(continuation.permissions, { chatMutation: true, generation: true })
assert.ok(continuation.hostAcceptedAt, 'The host did not accept the generation request.')
assert.ok(continuation.generationId, 'The accepted host call did not return a generation ID.')
assert.ok(continuation.generationStartedAt, 'No matching GENERATION_STARTED event followed the host request.')
const timeline = (state.events || []).find((entry) => entry.id === relay.timelineEventId)
assert.equal(timeline?.completed, true, 'The occurred Timeline handoff is not completed.')
console.log(`Real-host Pocket relay passed: ${relay.id} → ${continuation.generationId}`)
console.log(path)
