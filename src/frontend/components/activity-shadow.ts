import { PHONE_STYLES } from '../../styles.js'

// A shared sheet keeps the isolated renderers cheap even in a long roleplay thread.
const sheets = new WeakMap<Document, CSSStyleSheet>()
const ISOLATED_STYLES = `
:host {
  all: initial !important;
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
  color-scheme: dark;
}
:host::before, :host::after { content: none !important; display: none !important; }
${PHONE_STYLES}
`

export function isolatedActivity(content: HTMLElement): HTMLElement {
  const island = document.createElement('pocket-inline-ui')
  island.dataset.pocketShadow = 'true'
  const root = island.attachShadow({ mode: 'open' })
  const doc = island.ownerDocument
  const Sheet = doc.defaultView?.CSSStyleSheet
  if (Sheet && 'replaceSync' in Sheet.prototype && 'adoptedStyleSheets' in root) {
    let sheet = sheets.get(doc)
    if (!sheet) { sheet = new Sheet(); sheet.replaceSync(ISOLATED_STYLES); sheets.set(doc, sheet) }
    root.adoptedStyleSheets = [sheet]
  } else {
    // DOM mocks and older hosts still receive local styles; never fall back to light DOM.
    const style = doc.createElement('style')
    style.textContent = ISOLATED_STYLES
    root.append(style)
  }
  root.append(content)
  return island
}
