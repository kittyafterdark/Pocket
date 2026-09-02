import type { AmbientMessageFrequency, PocketContact } from '../types.js'

export function ambientEligibleContacts(contacts: PocketContact[]): PocketContact[] {
  return contacts.filter((contact) => contact.messagingPolicy.remoteEligible && (!contact.presence.inScene || contact.messagingPolicy.allowAmbientInScene))
}

export function contactCooldownReady(contact: PocketContact, frequency: Exclude<AmbientMessageFrequency, 'off'>, roleplayNow: string, wallNow = Date.now()): boolean {
  const wallCooldown = frequency === 'sparse' ? 60 * 60_000 : 15 * 60_000
  const roleplayCooldown = frequency === 'sparse' ? 6 * 60 * 60_000 : 2 * 60 * 60_000
  const lastWall = Date.parse(contact.messagingPolicy.lastInitiatedMessageAt)
  if (Number.isFinite(lastWall) && wallNow - lastWall < wallCooldown) return false
  const currentRoleplay = Date.parse(roleplayNow)
  const lastRoleplay = Date.parse(contact.messagingPolicy.lastInitiatedRoleplayAt)
  if (Number.isFinite(currentRoleplay) && Number.isFinite(lastRoleplay) && currentRoleplay >= lastRoleplay && currentRoleplay - lastRoleplay < roleplayCooldown) return false
  return true
}

export function shouldTakeAmbientOpportunity(frequency: AmbientMessageFrequency, random = Math.random()): boolean {
  if (frequency === 'off') return false
  return random < (frequency === 'sparse' ? 0.18 : 0.42)
}
