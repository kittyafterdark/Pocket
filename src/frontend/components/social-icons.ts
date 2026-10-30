// Local presentation icons; all interactive names belong to their native buttons.
const SOCIAL_ICON_PATHS = {
  settings: '<path d="m10 3 4 0 .8 3 2.3 1.3 3-.8 2 3.5-2.2 2.2v2.6L22 17l-2 3.5-3-.8-2.3 1.3-.7 3h-4l-.7-3L7 19.7l-3 .8L2 17l2.2-2.2v-2.6L2 10l2-3.5 3 .8L9.3 6Z" transform="translate(0 -1) scale(1 .95)"/><circle cx="12" cy="12" r="3.2"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 13 3M18 18A8 8 0 0 1 5 15"/>',
  home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 6 6"/>',
  activity: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M8 9h.01M16 9h.01"/>',
  compose: '<path d="m15 4 5 5M4 20l5-1 12-12-5-5L4 14Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  reply: '<path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.5-4A8.5 8.5 0 1 1 20.5 11.5Z"/>',
  reblog: '<path d="m4 8 4-4 4 4M8 4v12a3 3 0 0 0 3 3h1M20 16l-4 4-4-4M16 20V8a3 3 0 0 0-3-3h-1"/>',
  quote: '<path d="M4 4h7v7H7v4H4Zm10 0h7v7h-4v4h-3Z"/>',
  thread: '<path d="M4 5h16M4 12h16M4 19h10"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  camera: '<rect x="3" y="6" width="18" height="15" rx="3"/><path d="m7 6 2-3h6l2 3"/><circle cx="12" cy="13" r="4"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 8 3 3v3H7v-3l3-3Z" transform="rotate(30 12 12)"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  channels: '<path d="M5 7h14M4 17h14M10 3 7 21M18 3l-3 18"/>',
  bird: '<path fill="currentColor" stroke="none" d="M22 5a8 8 0 0 1-2 .6A4 4 0 0 0 21.6 3a8 8 0 0 1-2.5 1 4 4 0 0 0-6.8 3.6A11 11 0 0 1 4 3.5a4 4 0 0 0 1.2 5.3A4 4 0 0 1 3.4 8v.1a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 17a11.3 11.3 0 0 0 17.4-9.5V7A8 8 0 0 0 22 5Z"/>',
} as const
export type SocialIconName = keyof typeof SOCIAL_ICON_PATHS
export function socialIcon(name: SocialIconName): HTMLSpanElement {
  const node = document.createElement('span'); node.className = 'lp-social-glyph'; node.setAttribute('aria-hidden', 'true')
  node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">${SOCIAL_ICON_PATHS[name]}</svg>`
  return node
}
