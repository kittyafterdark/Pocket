import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const repoDir = dirname(dirname(fileURLToPath(import.meta.url)))
const lumiverseDir = join(repoDir, '..', '..', '..', '..')
const manifest = JSON.parse(readFileSync(join(repoDir, 'spindle.json'), 'utf8'))
const dbPath = join(lumiverseDir, 'data', 'lumiverse.db')
const storagePath = join(lumiverseDir, 'data', 'extensions', manifest.identifier, 'storage')
const shouldEnable = process.argv.includes('--enable')

mkdirSync(storagePath, { recursive: true })
const db = new DatabaseSync(dbPath)
const existing = db.prepare('SELECT id, enabled FROM extensions WHERE identifier = ?').get(manifest.identifier)

db.exec('BEGIN IMMEDIATE')
try {
  if (existing) {
    db.prepare(`
      UPDATE extensions
      SET name = ?, version = ?, author = ?, description = ?, github = ?, homepage = ?,
          permissions = ?, updated_at = unixepoch()
      WHERE identifier = ?
    `).run(
      manifest.name,
      manifest.version,
      manifest.author,
      manifest.description || '',
      manifest.github || '',
      manifest.homepage || '',
      JSON.stringify(manifest.permissions || []),
      manifest.identifier,
    )
    if (shouldEnable && !existing.enabled) {
      db.prepare('UPDATE extensions SET enabled = 1, updated_at = unixepoch() WHERE identifier = ?').run(manifest.identifier)
    }
  } else {
    db.prepare(`
      INSERT INTO extensions (
        id, identifier, name, version, author, description, github, homepage,
        permissions, enabled, metadata, install_scope, installed_by_user_id, branch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', 'operator', NULL, NULL)
    `).run(
      randomUUID(),
      manifest.identifier,
      manifest.name,
      manifest.version,
      manifest.author,
      manifest.description || '',
      manifest.github || '',
      manifest.homepage || '',
      JSON.stringify(manifest.permissions || []),
      shouldEnable ? 1 : 0,
    )
  }
  db.exec('COMMIT')
} catch (error) {
  db.exec('ROLLBACK')
  throw error
} finally {
  db.close()
}

console.log(`${manifest.name} ${manifest.version} is registered locally${shouldEnable ? ' and enabled' : ''}.`)
console.log('Requested permissions were not auto-granted; approve them in Lumiverse before testing gated apps.')

