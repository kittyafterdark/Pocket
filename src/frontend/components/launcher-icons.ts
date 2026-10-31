import type { LauncherApp } from '../../domain/launcher.js'

// Local launcher artwork. App interiors retain their existing action icons.
const paths: Record<LauncherApp, string> = {
  bank:'<rect x="3" y="5" width="18" height="15" rx="4"/><path d="M3 10h18m-5 5h2"/>',
  birthdays:'<path d="M4 13h16v8H4zM3 13c0-4 3-4 5-2 2-2 6-2 8 0 2-2 5-2 5 2M8 8V5m4 3V3m4 5V5"/>',
  browser:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 5-6 13 0 18 6-5 6-13 0-18"/>',
  maps:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
  twitch:'<path d="M4 3h17v12l-5 5h-5l-4 3v-3H3V7zm5 5v6m6-6v6"/>',
  stickers:'<path d="M13 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6zM13 21v-5a3 3 0 0 1 3-3h5M8 8v1m7-1v1m-7 4c2 2 4 2 6 0"/>',
  dating:'<path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M9 15h6m-3-3v6"/>',
  spotify:'<circle cx="12" cy="12" r="10"/><path d="M6 9c4-2 8-1 12 1M7 13c3-2 7-1 10 1M8 17c3-1 5-1 8 0"/>',
  sharing:'<rect x="7" y="7" width="14" height="14" rx="3"/><path d="M4 16H3V3h13v1M12 12h4v4m-4 0 4-4"/>',
  twitter: '<path fill="currentColor" stroke="none" d="M22 5a8 8 0 0 1-2 .6A4 4 0 0 0 21.6 3a8 8 0 0 1-2.5 1 4 4 0 0 0-6.8 3.6A11 11 0 0 1 4 3.5a4 4 0 0 0 1.2 5.3A4 4 0 0 1 3.4 8v.1a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 17a11.3 11.3 0 0 0 17.4-9.5V7A8 8 0 0 0 22 5Z"/>',
  discord: '<path d="M7 5 4 6 2 17l5 2 1-2h8l1 2 5-2-2-11-3-1-1 2H8Z"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M8 16c3 1 5 1 8 0"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="6"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  tumblr: '<path fill="currentColor" stroke="none" d="M10 2h4v5h5v4h-5v6c0 3 3 3 5 1v4c-6 3-10 0-10-5v-6H6V8c3-1 4-3 4-6Z"/>',
  appstore: '<rect x="3" y="6" width="18" height="16" rx="4"/><path d="M8 7V6a4 4 0 0 1 8 0v1M8 15h8M12 11v8"/>',
  messages: '<path fill="currentColor" stroke="none" d="M5 3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-6 3V6a3 3 0 0 1 2-3Z"/><path stroke="#329e6b" d="M7 9h10M7 13h7"/>',
  camera: '<rect x="2" y="6" width="20" height="15" rx="4" fill="currentColor" stroke="none"/><path fill="currentColor" stroke="none" d="M7 7V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3Z"/><circle cx="12" cy="13" r="4.5" fill="#455162" stroke="none"/><circle cx="12" cy="13" r="2.5" fill="#9bb9ce" stroke="none"/>',
  gallery: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><path d="m4 17 5-5 4 4 3-3 4 4"/>',
  notes: '<rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" stroke="none"/><path stroke="#b89b52" d="M8 8h8M8 12h8M8 16h5"/>',
  weather: '<circle cx="9" cy="8" r="4" fill="#ffe3a2" stroke="none"/><path d="M9 1v1M2 8H1M3.3 2.3l1 1M15 2l-1 1" stroke="#ffe3a2"/><path fill="currentColor" stroke="none" d="M6 20a4 4 0 0 1-1-8 6 6 0 0 1 11-3 5.5 5.5 0 1 1 2 11Z"/>',
  contacts: '<rect x="4" y="2" width="16" height="20" rx="4"/><circle cx="12" cy="9" r="3" fill="currentColor" stroke="none"/><path fill="currentColor" stroke="none" d="M6 19a6 6 0 0 1 12 0Z"/><path d="M2 7h3M2 12h3M2 17h3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="4" fill="currentColor" stroke="none"/><path d="M7 2v5M17 2v5"/><path stroke="#c96d7c" d="M7 11h10M8 15h2M14 15h2M8 18h2"/>',
  trackers: '<path d="M3 5h18M3 12h18M3 19h18" opacity=".6"/><circle cx="8" cy="5" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="10" cy="19" r="3" fill="currentColor" stroke="none"/>',
  settings: '<path d="m10 2 4 0 .7 3 2.3 1.3 3-.8 2 3.5-2.2 2.2v2.6L22 16l-2 3.5-3-.8-2.3 1.3-.7 3h-4l-.7-3L7 18.7l-3 .8L2 16l2.2-2.2v-2.6L2 9l2-3.5 3 .8L9.3 5Z"/><circle cx="12" cy="12.5" r="4"/>',
}
export function launcherIcon(app: LauncherApp): HTMLSpanElement {
  const node = document.createElement('span')
  node.setAttribute('aria-hidden', 'true')
  node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths[app]}</svg>`
  return node
}
