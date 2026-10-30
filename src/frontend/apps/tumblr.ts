import type { SocialAccount, SocialPost } from '../../domain/social.js'
import { el, button, requestId } from '../shared.js'
import { socialIcon } from '../components/social-icons.js'

export interface TumblrSession {
  tumblrView?: 'search' | 'activity'
  tumblrSearch?: string
  tumblrHubTab?: 'activity' | 'messages'
  focusTumblrSearch?: boolean
}

export function tumblrHub(selected: 'activity' | 'messages', body: HTMLElement, change: (tab: 'activity' | 'messages') => void): HTMLElement {
  const hub = el('section', 'lp-tumblr-hub'), tabs = el('div', 'lp-tumblr-hub-tabs')
  hub.setAttribute('aria-label', 'Tumblr activity and messages'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Tumblr inbox')
  const controls: HTMLButtonElement[] = []
  for (const [value, label] of [['activity', 'Activity'], ['messages', 'Messages']] as const) {
    const tab = button(label, 'lp-tumblr-hub-pill'), panel = el('section', 'lp-tumblr-hub-panel')
    tab.id = requestId('tumblr_tab'); panel.id = requestId('tumblr_panel')
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(value === selected)); tab.setAttribute('aria-controls', panel.id); tab.tabIndex = value === selected ? 0 : -1
    tab.dataset.socialFocus = `Tumblr ${label} tab`
    panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id); panel.hidden = value !== selected
    if (value === selected) panel.append(body)
    tab.onclick = () => {
      const mount = hub.closest('.lp-social-page')?.parentElement || hub.ownerDocument.body; change(value)
      mount?.querySelector<HTMLElement>(`[data-social-focus="Tumblr ${label} tab"]`)?.focus({ preventScroll: true })
    }
    tab.onkeydown = event => {
      const index = controls.indexOf(tab), next = event.key === 'ArrowRight' || event.key === 'ArrowLeft' ? (index + 1) % 2 : event.key === 'Home' ? 0 : event.key === 'End' ? 1 : -1
      if (next >= 0) { event.preventDefault(); controls[next].click() }
    }
    controls.push(tab); tabs.append(tab); hub.append(panel)
  }
  hub.prepend(tabs); return hub
}

export function tumblrActivity(options: {
  posts: readonly SocialPost[]; owner: string; followed: readonly string[]
  avatar(account: SocialAccount): HTMLElement; time(post: SocialPost): string; open(post: SocialPost, focus?: string): void; resolveAccount?(id: string): SocialAccount | undefined
}): HTMLElement {
  const { posts, owner, followed } = options, list = el('section', 'lp-tumblr-activity')
  list.setAttribute('aria-label', 'Tumblr activity'); list.append(el('h2', '', 'All activity'))
  const byId = new Map(posts.map(post => [post.id, post])), owned = (post?: SocialPost) => Boolean(post && (post.authoredBy === owner || post.account.actorId === owner))
  const relatedToOwner = (post: SocialPost) => {
    let parent = byId.get(post.replyTo || post.reblogOf || '')
    for (let count = 0; parent && count < 40; count++) { if (owned(parent)) return true; parent = byId.get(parent.replyTo || parent.reblogOf || '') }
    return false
  }
  const add = (post: SocialPost, actor: SocialAccount, verb: string, quote: string) => {
    const row = button('', 'lp-tumblr-activity-row'), copy = el('span', 'lp-tumblr-activity-copy'), time = el('time', '', options.time(post))
    row.dataset.socialFocus = `Tumblr activity ${post.id} ${actor.id}`; row.onclick = () => options.open(post, row.dataset.socialFocus)
    time.dateTime = post.createdAt
    copy.append(el('strong', '', actor.handle), el('span', '', verb), el('p', '', quote.slice(0, 170)), time)
    const preview = el('span', 'lp-tumblr-activity-preview')
    if (post.imageUrl) { const image = el('img'); image.src = post.imageUrl; image.alt = ''; image.loading = 'lazy'; preview.append(image) }
    else preview.append(el('span', '', post.reblogOf ? '↻' : 'Aa'))
    row.append(options.avatar(actor), copy, preview); list.append(row)
  }
  for (const post of [...posts].reverse().slice(0, 200)) {
    if (!owned(post) && relatedToOwner(post)) add(post, post.account, post.reblogOf ? 'Reblogged your post' : 'Replied to your post', post.text || post.tags.map(tag => '#' + tag).join(' '))
    else if (!owned(post) && !post.replyTo && followed.includes(post.account.id)) add(post, post.account, 'Made a new post', post.text || post.title || post.photo || '')
    if (owned(post)) for (const actorId of post.likedBy.filter(id => id !== owner).slice(-20)) {
      const actor = posts.find(item => item.account.id === actorId || item.account.actorId === actorId)?.account || options.resolveAccount?.(actorId)
      if (actor) add(post, actor, 'Liked your post', post.text || post.title || post.photo || '')
    }
  }
  if (list.children.length === 1) list.append(el('p', 'lp-tumblr-view-empty', 'Replies, reblogs, likes, and new posts from blogs you follow will appear here.'))
  return list
}

export function tumblrSearch(options: {
  posts: readonly SocialPost[]; ui: TumblrSession; open(post: SocialPost, focus?: string): void; renderPost(post: SocialPost): HTMLElement
}): HTMLElement {
  const { posts, ui } = options, screen = el('section', 'lp-tumblr-explore'), hero = el('header', 'lp-tumblr-explore-hero')
  screen.setAttribute('aria-label', 'Explore Tumblr'); hero.append(el('h2', '', 'Explore'))
  const form = el('form', 'lp-tumblr-search-form'), label = el('label'), input = el('input'), submit = button('Search', 'lp-tumblr-search-submit')
  form.setAttribute('role', 'search'); form.setAttribute('aria-label', 'Search Tumblr posts')
  input.type = 'search'; input.placeholder = 'Search Tumblr'; input.value = ui.tumblrSearch || ''; input.maxLength = 180; input.autocomplete = 'off'; input.dataset.socialFocus = 'Tumblr search'
  label.append(el('span', 'lp-social-visually-hidden', 'Search Tumblr posts'), socialIcon('search'), input); submit.type = 'submit'; form.append(label, submit); hero.append(form); screen.append(hero)
  const results = el('section', 'lp-tumblr-search-results'); results.id = requestId('tumblr_search_results'); input.setAttribute('aria-controls', results.id); screen.append(results)
  const roots = new Map(posts.map(post => [post.id, post]))
  const root = (post: SocialPost) => { for (let count = 0; post.replyTo && count < 40; count++) { const parent = roots.get(post.replyTo); if (!parent) break; post = parent }; return post }
  const thumbnail = (post: SocialPost, context = 'feed') => {
    const node = button('', 'lp-tumblr-explore-tile'); node.dataset.socialFocus = `Tumblr explore ${encodeURIComponent(context)} ${post.id}`; node.setAttribute('aria-label', `Open post by ${post.account.handle}: ${(post.title || post.text || post.photo || 'Photo post').slice(0, 70)}${context === 'feed' ? '' : ` in #${context}`}`); node.onclick = () => options.open(post, node.dataset.socialFocus)
    if (post.imageUrl) { const image = el('img'); image.src = post.imageUrl; image.alt = ''; image.loading = 'lazy'; node.append(image) }
    else node.append(el('span', 'lp-tumblr-tile-text', post.text.slice(0, 110) || post.photo?.slice(0, 110) || post.title || 'A little post'))
    node.append(el('small', '', post.account.handle)); return node
  }
  const update = () => {
    ui.tumblrSearch = input.value; results.replaceChildren()
    const query = input.value.trim().toLocaleLowerCase().replace(/^#/, '')
    if (query) {
      const matching = new Map<string, SocialPost>()
      for (const post of [...posts].reverse()) if ([post.text, post.title, post.photo, post.account.name, post.account.handle, ...post.tags].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)) { const parent = root(post); matching.set(parent.id, parent) }
      results.append(el('h3', 'lp-tumblr-search-heading', `${matching.size} ${matching.size === 1 ? 'post' : 'posts'} found`))
      for (const post of matching.values()) results.append(options.renderPost(post))
      if (!matching.size) results.append(el('p', 'lp-tumblr-view-empty', 'No posts match this search yet.'))
    } else {
      results.append(el('h3', 'lp-tumblr-search-heading', 'Trending in your feed'))
      const tags = new Map<string, SocialPost[]>()
      for (const post of [...posts].reverse()) for (const tag of post.tags) { const entries = tags.get(tag) || []; if (!entries.some(entry => entry.id === root(post).id)) entries.push(root(post)); tags.set(tag, entries) }
      for (const [index, [tag, entries]] of [...tags].sort((a, b) => b[1].length - a[1].length).slice(0, 8).entries()) {
        const section = el('section', 'lp-tumblr-trending-tag'), choose = button('', 'lp-tumblr-tag-link'), rail = el('div', 'lp-tumblr-explore-rail')
        choose.append(el('span', 'lp-tumblr-trend-number', String(index + 1)), el('strong', '', '#' + tag)); choose.setAttribute('aria-label', `Search #${tag}`)
        choose.onclick = () => { input.value = '#' + tag; update(); input.focus({ preventScroll: true }) }; section.append(choose)
        for (const post of entries.slice(0, 8)) rail.append(thumbnail(post, tag))
        section.append(rail); results.append(section)
      }
      if (!tags.size) {
        const rail = el('div', 'lp-tumblr-explore-rail')
        for (const post of [...posts].reverse().filter(post => !post.replyTo).slice(0, 8)) rail.append(thumbnail(post))
        results.append(rail)
        if (!posts.length) results.append(el('p', 'lp-tumblr-view-empty', 'Your generated posts and tags will show up here.'))
      }
    }
  }
  input.oninput = update; form.onsubmit = event => { event.preventDefault(); update() }; update(); return screen
}
