import {wishlistChoices,setWishlistChoice} from '../src/domain/lumistry-wishlist.js';
import {makeSetupDraft} from '../src/domain/lumistry-setup.js';
import { rememberDatingView, restoreDatingView } from '../src/frontend/lumistry-view-state.js'
import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { acknowledgeSetupSettings,backDating, newDatingUI, renderLumistry } from '../src/frontend/apps/lumistry.js'
import { DATING_FIELDS, normalizeDating, normalizeDatingProfile } from '../src/domain/lumistry.js'
import type { PhoneState } from '../src/types.js'

function fixture(tab: string) {
  const profiles = ['Willow', 'Sage', 'Rowan'].map((alias, i) => normalizeDatingProfile({ id: alias, contactId: 'contact' + i, alias, age: 25 + i,
    distanceKm: 4, bio: 'A public bio', fields: { occupation: i === 0 ? 'PRIVATE OCCUPATION' : 'Artist', interests: 'music' },
    hiddenFields: i === 0 ? ['occupation'] : [], privateFields: { behavior: 'PRIVATE REAL NAME' },
    photoPlan: [{ prompt: 'PRIVATE DIFFUSION', description: 'A public photo description', caption: 'An ordinary afternoon' },
      { prompt: 'PRIVATE DIFFUSION', description: 'A second public description', caption: 'Outside' }],
  })!)
  const conversations = profiles.slice(0, 2).map((p, i) => ({ id: 'chat' + i, channel: 'dating', datingOwnerId: 'owner', kind: 'direct',
    participantActorIds: [p.contactId], participantContactIds: [p.contactId], includesPocketPersona: true,
    messages: [{ id: 'message' + i, sender: 'contact', senderActorId: p.contactId, recipientActorIds: ['owner'], text: i ? 'Newest hello' : 'Older hello', createdAt: `2026-10-10T1${i}:00:00Z`, read: false }],
    updatedAt: `2026-10-10T1${i}:00:00Z`, availability: { state: 'remote' }, unread: 1,
  }))
  const state = { pocketPersonaActorId: 'owner', pocketPersona: { displayName: 'Persona' }, contacts: [], conversations,
    lumistry: { owner: normalizeDating({ self: { alias: 'Moon', age: 30 }, profiles, decisions: profiles.map((p, i) => ({ profileId: p.id, action: 'like', status: i < 2 ? 'matched' : 'pending', conversationId: i < 2 ? 'chat' + i : undefined })) }) },
  } as unknown as PhoneState
  const actions: any[] = [], opened: string[] = [], ui = { ...newDatingUI(), tab }
  const host = { state, owner: 'owner', ui, generation: true, images: false, backgroundEnabled: true, automaticReplies: true,
    action: (...args: any[]) => actions.push(args), openConversation: (id: string) => opened.push(id), render: () => {}, back: () => {}, gallery: () => {} }
  return { host, profiles, actions, opened, render: () => renderLumistry(host) }
}

function expandedFilters(page:HTMLElement):HTMLElement {return page;}
function wishlistPicker(h:ReturnType<typeof fixture>,key:string){let page=h.render();const add=page.querySelector<HTMLSelectElement>('[aria-label="Add a preference"]')!;add.value=key;add.dispatchEvent(new document.defaultView!.Event('change'));return h.render();}
function wishlistCore(h:ReturnType<typeof fixture>,key:string){const page=h.render();page.querySelector<HTMLButtonElement>(`[data-wishlist-key="${key}"]`)!.click();return h.render();}
function saveWishlist(h:ReturnType<typeof fixture>){const page=h.render();[...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Save wishlist')!.click();return page;}


function domTest(fn: () => void) {
  const dom = new JSDOM('<!doctype html><body></body>'), previous = { document: globalThis.document, HTMLInputElement: globalThis.HTMLInputElement }
  globalThis.document = dom.window.document; globalThis.HTMLInputElement = dom.window.HTMLInputElement
  try { fn() } finally { globalThis.document = previous.document; globalThis.HTMLInputElement = previous.HTMLInputElement; dom.window.close() }
}

test('inbox uses recent-first compact rows with native unread counts and direct conversation routing', () => domTest(() => {
  const h = fixture('inbox'), page = h.render(), rows = page.querySelectorAll<HTMLButtonElement>('.lumistry-inbox-row')
  expect(rows).toHaveLength(2)
  expect(rows[0].textContent).toContain('Sage')
  expect(rows[0].textContent).toContain('Newest hello')
  expect(rows[0].querySelector('.lp-unread')?.textContent).toBe('1')
  expect(page.querySelector('.lumistry-profile')).toBeNull()
  expect(page.textContent).not.toMatch(/PRIVATE|Unmatch|Exchange contact/)
  rows[0].click(); expect(h.opened).toEqual(['chat1']); expect(h.actions).toHaveLength(0)
  h.host.state.conversations[1].archived = true
  expect(h.render().querySelectorAll('.lumistry-inbox-row')).toHaveLength(1)
  h.host.state.conversations[0].datingOwnerId = 'other'
  expect(h.render().querySelectorAll('.lumistry-inbox-row')).toHaveLength(0)
}))

test('match tiles open details without generation, keep hidden fields private, and gate ordinary contact exchange', () => domTest(() => {
  const h = fixture('matches'), page = h.render(), tiles = page.querySelectorAll<HTMLButtonElement>('.lumistry-match-card')
  expect(tiles).toHaveLength(3)
  expect(page.querySelectorAll('.lumistry-match-section')).toHaveLength(2)
  expect(page.textContent).not.toMatch(/PRIVATE|An ordinary afternoon/)
  tiles[0].click(); expect(h.host.ui.selectedProfileId).toBe('Willow'); expect(h.actions).toHaveLength(0)
  const detail = h.render()
  expect(detail.querySelector('.lumistry-profile')).not.toBeNull()
  expect(detail.textContent).not.toMatch(/PRIVATE OCCUPATION|PRIVATE REAL NAME|PRIVATE DIFFUSION/)
  const ordinary = [...detail.querySelectorAll('button')].find(b => b.textContent === 'Open ordinary Messages')!
  expect(ordinary.disabled).toBe(true)
  const check = detail.querySelector<HTMLInputElement>('.lumistry-connection-actions input[type=checkbox]')!
  check.checked = true; check.dispatchEvent(new document.defaultView!.Event('change'))
  expect(ordinary.disabled).toBe(false)
  ordinary.click(); expect(h.actions).toEqual([['exchange', { profileId: 'Willow', confirmed: true }]])
  const back = [...detail.querySelectorAll('button')].find(b => b.textContent === 'Back to matches')!
  back.click(); expect(h.host.ui.selectedProfileId).toBeUndefined()
}))

test('discovery controls follow the whole card, preserve local like/pass actions and allow photo navigation', () => domTest(() => {
  const h = fixture('discover'); h.host.state.lumistry!.owner.decisions = []
  let page = h.render(), hero = page.querySelector('.lumistry-hero')!
  expect(page.querySelector('.lumistry-profile')?.nextElementSibling?.classList.contains('lumistry-swipe')).toBe(true)
  expect(page.querySelector('.lumistry-profile-tools')?.hasAttribute('open')).toBe(false)
  expect(hero.textContent).not.toContain('PRIVATE OCCUPATION')
  const next = page.querySelector<HTMLButtonElement>('.lumistry-photo-next')!
  next.click(); expect(h.host.ui.photoIndex.Willow).toBe(1); expect(h.actions).toHaveLength(0)
  page = h.render()
  expect(page.querySelector('.lumistry-photo-description')?.textContent).toBe('A second public description')
  const pass = [...page.querySelectorAll<HTMLButtonElement>('.lumistry-swipe button')].find(b => b.textContent === 'Pass')!
  pass.click(); expect(h.actions).toEqual([['pass', { profileId: 'Willow' }]])
}))


test('theme settings save appearance while Discover uses public overlap instead of fit meters', () => domTest(() => {
  const h = fixture('settings')
  h.host.ui.settingsPage='app';let page = h.render()
  expect(page.dataset.lumistryTheme).toBe('sticker')
  const select = page.querySelector<HTMLSelectElement>('select')!
  expect([...select.options].map(o => o.text)).toEqual(['Sticker Lab', 'Distillery', 'Modern'])
  select.value = 'distillery'; select.dispatchEvent(new document.defaultView!.Event('change'))
  expect(h.actions).toEqual([]);[...page.querySelectorAll('button')].find(b=>b.textContent==='Save app & integrations')!.click();expect(h.actions.at(-1)[0]).toBe('setup_direct');expect(h.actions.at(-1)[1].value.theme).toBe('distillery')
  const d = h.host.state.lumistry!.owner
  d.theme = 'distillery'; d.decisions = []; h.host.ui.tab = 'discover'
  d.filters.fields = { occupation: { mode: 'preferred', value: 'PRIVATE OCCUPATION' }, interests: { mode: 'preferred', value: 'music, travel' } }
  page = h.render()
  expect(page.dataset.lumistryTheme).toBe('distillery')
  expect(page.querySelector('.lumistry-meter')).toBeNull()
  d.self!.fields.interests='music';page=h.render();expect(page.querySelector('.lumistry-shared-hints')?.textContent).toContain('Both list music')
  expect(page.querySelector('.lumistry-profile')?.textContent).not.toContain('PRIVATE OCCUPATION')
  expect(page.querySelector('.lumistry-filter-chips')?.textContent).toContain('PRIVATE OCCUPATION')
  expect(page.querySelector('.lumistry-meter-fill')).toBeNull()
  d.filters.fields = {}; expect(h.render().querySelector('.lumistry-meter')).toBeNull()
  d.theme = 'modern'; d.filters.fields = { interests: { mode: 'preferred', value: 'music' } };
  expect(h.render().dataset.lumistryTheme).toBe('modern'); expect(h.render().querySelector('.lumistry-meter')).toBeNull();
  d.theme = 'sticker'; expect(h.render().querySelector('.lumistry-meter')).toBeNull()
}))

test('Me navigation protects an unfinished Character Studio edit until explicit discard', () => domTest(() => {
  const h=fixture('self');let page=h.render();[...page.querySelectorAll('button')].find(b=>b.textContent?.startsWith('My profile'))!.click();page=h.render();
  const name=[...page.querySelectorAll<HTMLInputElement>('input')].find(i=>i.closest('label')?.textContent?.includes('Display name'))!;name.value='Unfinished alias';name.dispatchEvent(new document.defaultView!.Event('input'));
  [...page.querySelectorAll('button')].find(b=>b.textContent==='Back to Me')!.click();page=h.render();expect(page.querySelector('[role=alertdialog]')).not.toBeNull();expect(h.host.state.lumistry!.owner.self!.alias).toBe('Moon');
  [...page.querySelectorAll('button')].find(b=>b.textContent==='Keep editing')!.click();page=h.render();expect(h.host.ui.editor!.alias).toBe('Unfinished alias');expect(page.querySelector('.lumistry-editor')).not.toBeNull();
  [...page.querySelectorAll('button')].find(b=>b.textContent==='Back to Me')!.click();page=h.render();[...page.querySelectorAll('button')].find(b=>b.textContent==='Discard changes and leave')!.click();page=h.render();expect(h.host.ui.editor).toBeUndefined();expect(h.actions).toHaveLength(0);
}))

test('Filters groups every category and separates Bank controls into settings without enabling them',()=>domTest(()=>{
const h=fixture('filters'),page=h.render();expect(page.querySelector('.lumistry-wishlist')).not.toBeNull();expect(page.querySelectorAll('[data-wishlist-core]')).toHaveLength(5);expect(page.querySelectorAll('.lumistry-filter-group')).toHaveLength(0);expect(page.textContent).not.toContain('Profile assessment chance:');h.host.ui.tab='settings';h.host.ui.settingsPage='app';expect(h.render().textContent).toContain('Enable NPC Bank dating');expect(h.host.state.lumistry!.owner.bankDating.enabled).toBe(false);expect(h.actions).toEqual([]);
}));

test('Photo navigation patches in place, preserves open sections and targets the displayed photo', () => domTest(() => {
  const h = fixture('discover'); h.host.state.lumistry!.owner.decisions = []
  const p = h.host.state.lumistry!.owner.profiles[0]
  p.photos = p.photoPlan.map((_, planIndex) => ({ planIndex, url: `https://example.test/${planIndex}.png`, source: { kind: 'gallery', imageId: 'photo' + planIndex }, caption: '', prompt: '' }))
  let renders = 0; h.host.render = () => { renders++ }
  const page = h.render(); document.body.append(page)
  const card = page.querySelector('.lumistry-profile')!, tools = page.querySelector<HTMLDetailsElement>('.lumistry-profile-tools')!
  tools.open = true; page.scrollTop = 250
  page.querySelector<HTMLButtonElement>('.lumistry-photo-next')!.click()
  expect(page.querySelector('.lumistry-profile')).toBe(card)
  expect(page.querySelector('.lumistry-hero img')?.getAttribute('src')).toBe('https://example.test/1.png')
  expect(tools.open).toBe(true); expect(page.scrollTop).toBe(250); expect(renders).toBe(0)
  expect(document.activeElement?.getAttribute('aria-label')).toBe('Next photo')
  ;[...page.querySelectorAll('button')].find(b => b.textContent === 'Reroll this photo')!.click()
  expect(h.actions).toEqual([['photo', { profileId: p.id, index: 1 }]])
}))

test('Internal Back unwinds panels and editors before leaving Lumistry', () => {
  const ui = newDatingUI(); ui.tab = 'settings'; ui.panelHistory = ['discover', 'filters']
  expect(backDating(ui)).toBe(true); expect(ui.tab).toBe('filters')
  expect(backDating(ui)).toBe(true); expect(ui.tab).toBe('discover')
  ui.selectedProfileId = 'person'; ui.photoTarget = 'person'
  expect(backDating(ui)).toBe(true); expect(ui.selectedProfileId).toBe('person'); expect(ui.photoTarget).toBeUndefined()
  expect(backDating(ui)).toBe(true); expect(ui.selectedProfileId).toBeUndefined()
  ui.selfEditing = true; expect(backDating(ui)).toBe(true); expect(ui.selfEditing).toBe(false)
  expect(backDating(ui)).toBe(false)
})

test('Background refresh restores scroll and accordions per screen while contextual menus close',()=>domTest(()=>{
const h=fixture('filters'),first=h.render();first.scrollTop=330;first.querySelector<HTMLDetailsElement>('.lumistry-wishlist-reality')!.open=true;rememberDatingView(first,h.host.ui);const refreshed=h.render();restoreDatingView(refreshed,h.host.ui);expect(refreshed.scrollTop).toBe(330);expect(refreshed.querySelector<HTMLDetailsElement>('.lumistry-wishlist-reality')!.open).toBe(true);h.host.ui.tab='self';h.host.ui.selfPage='profile';const profile=h.render();restoreDatingView(profile,h.host.ui);expect(profile.scrollTop).toBe(0);profile.querySelector<HTMLDetailsElement>('.lumistry-context-menu')!.open=true;rememberDatingView(profile,h.host.ui);const next=h.render();restoreDatingView(next,h.host.ui);expect(next.querySelector<HTMLDetailsElement>('.lumistry-context-menu')!.open).toBe(false);
}));

test('one front question and expandable remaining answers preserve text while rollout toggles remain independent', () => domTest(() => {
  const h = fixture('discover'); h.host.state.lumistry!.owner.decisions = [];
  const profile = h.host.state.lumistry!.owner.profiles[0];
  profile.person = { version: 1, prompts: Array.from({ length: 5 }, (_, i) => ({ question: `Question ${i}`, answer: `my own answer ${i}` })) } as any;
  const page = h.render(), answers = page.querySelectorAll('.lumistry-profile-answer'); expect(answers).toHaveLength(5);
  expect([...answers].filter(x => !x.closest('details'))).toHaveLength(1);
  h.host.ui.tab = 'settings';h.host.ui.settingsPage='experience'; const settings = h.render(), section = [...settings.querySelectorAll('section')].find(x=>x.querySelector(':scope > h2')?.textContent==='Profile development')!;
  const toggles = section.querySelectorAll<HTMLInputElement>('input[type=checkbox]'); expect(toggles).toHaveLength(3);
  toggles[0].checked = false; toggles[0].dispatchEvent(new document.defaultView!.Event('change'));
  [...settings.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === 'Save experience')!.click();
  expect(h.actions.at(-1)[0]).toBe('setup_direct');expect(h.actions.at(-1)[1].value.pipeline).toEqual({enrichment:false,events:true,rpBridge:true});
}));

test('camera doodle generates the displayed plan, replaces its photo and respects image permissions in all three themes', () => domTest(() => {
  for (const theme of ['sticker', 'distillery', 'modern']) {
    const h = fixture('matches'); h.host.images = true;
    h.host.state.lumistry!.owner.theme = theme as any;
    h.host.ui.selectedProfileId = 'Willow';
    h.profiles[0].photos.push({ source: { kind: 'gallery', imageId: 'existing' }, url: '', caption: '', prompt: 'same shot', planIndex: 1 });
    // The fixture's saved normalization owns separate profiles.
    h.host.state.lumistry!.owner.profiles[0].photos = h.profiles[0].photos;
    const page = h.render();
    page.querySelector<HTMLButtonElement>('[aria-label="Next photo"]')!.click();
    const camera = page.querySelector<HTMLButtonElement>('.lumistry-photo-camera')!;
    expect(camera.querySelector('.lumistry-doodle')).not.toBeNull(); camera.click();
    expect(h.actions.at(-1)).toEqual(['photo', { profileId: 'Willow', planIndex: 1, index: 0 }]);
    h.host.images = false; expect(h.render().querySelector<HTMLButtonElement>('.lumistry-photo-camera')!.disabled).toBe(true);
  }
}));

test('Persona review checks extracted catalog options and exposes private life and intimate detail editors', () => domTest(() => {
    const h = fixture('self'); h.host.ui.selfEditing = true;
    h.host.ui.editor = normalizeDatingProfile({ id: 'self', alias: 'Moon', age: 32, fields: { occupation: 'law', sexualRole: 'submissive', kinks: 'bondage, praise' }, privateFields: { kinks: 'bondage, praise', commitments: 'No exclusivity agreements' }, hiddenFields: ['sexualRole', 'kinks'], phoneProfile: { appearance: 'silver curls and brown eyes' }, person: { version: 1, life: { career: 'Environmental attorney' }, intimacy: { kinks: 'Only negotiated rope bondage with an agreed stop word', boundaries: 'No choking' } } })!;
    h.host.ui.characterSection='public';const page = h.render();
    for (const [category, expected] of [['Occupation', ['law']], ['Sexual Role', ['submissive']], ['Kinks', ['bondage', 'praise']]] as const) {
        const choice = [...page.querySelectorAll('.lumistry-choice')].find(x => x.querySelector('summary')?.textContent?.startsWith(category + ':'))!;
        const checked = [...choice.querySelectorAll<HTMLLabelElement>('.lumistry-choice-list label')].filter(x => x.querySelector<HTMLInputElement>('input')?.checked).map(x => x.textContent);
        expect(checked).toEqual([...expected]);
    }
    h.host.ui.characterSection='private';const privatePage=h.render();
    const dossier = [...privatePage.querySelectorAll('details')].find(x => x.querySelector('summary')?.textContent === 'Persona life, intimacy & voice · private')!;
    expect(dossier).not.toBeUndefined();
    expect([...dossier.querySelectorAll<HTMLTextAreaElement>('textarea')].map(x => x.value)).toContain('Only negotiated rope bondage with an agreed stop word');
    expect([...dossier.querySelectorAll<HTMLTextAreaElement>('textarea')].map(x => x.value)).toContain('Environmental attorney');
    expect(privatePage.querySelectorAll('.lumistry-editor textarea').length).toBeGreaterThan(5);
}));

test('profile height slider switches units without changing facts and saves moved imperial values as cm', () => domTest(() => {
  const h = fixture('self');h.host.ui.characterSection='public'; h.host.ui.selfEditing = true;
  h.host.ui.editor = normalizeDatingProfile({ id: 'self', alias: 'Moon', age: 30, fields: { height: '178 cm' } })!;
  const page = h.render(), control = page.querySelector('.lumistry-height-control')!;
  expect(control.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  const slider = control.querySelector<HTMLInputElement>('input[type="range"]')!;
  expect(slider.value).toBe('178');
  [...control.querySelectorAll('button')].find(b => b.textContent === 'Imperial (ft/in)')!.click();
  expect(control.querySelector('output')!.textContent).toContain('5′ 10″');
  expect(h.host.ui.editor.fields.height).toBe('178 cm');
  expect(h.actions).toEqual([['height_units', { unit: 'imperial' }]]);
  slider.value = '72'; slider.dispatchEvent(new document.defaultView!.Event('input'));
  expect(h.host.ui.editor.fields.height).toBe('183 cm');
  [...control.querySelectorAll('button')].find(b => b.textContent === 'Metric (cm)')!.click();
  expect(slider.value).toBe('183');
  [...control.querySelectorAll('button')].find(b => b.textContent === 'Clear height')!.click();
  expect(h.host.ui.editor.fields.height).toBe('');
  expect(control.querySelector('output')!.textContent).toContain('Not set');
}));

test('height preference sliders preserve legacy disjoint choices until edited and publish a compact range',()=>domTest(()=>{
const h=fixture('filters');h.host.state.lumistry!.owner.filters.fields.height={mode:'preferred',value:'160 cm, 180 cm'};const page=wishlistPicker(h,'height'),control=page.querySelector('.lumistry-height-control')!;expect(control).not.toBeNull();expect(wishlistChoices(h.host.ui.filterDraft!,'height').map(c=>c.value)).toEqual(['160 cm','180 cm']);expect(h.host.state.lumistry!.owner.filters.fields.height.value).toBe('160 cm, 180 cm');expect(h.actions).toEqual([]);
}));

test('V2 experience scopes disable only their own inactive controls and save independently',()=>domTest(()=>{
  const h=fixture('settings');h.host.ui.settingsPage='experience';let page=h.render();
  [...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Conversations only')!.click();page=h.render();
  expect(page.querySelector<HTMLInputElement>('input[aria-label="Profile trope frequency"]')!.disabled).toBe(true);
  expect(page.querySelector<HTMLInputElement>('input[aria-label="Social opportunity lift"]')!.disabled).toBe(false);
  [...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Chaotic')!.click();page=h.render();
  [...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Save experience')!.click();
  const saved=h.actions.at(-1);expect(saved[0]).toBe('setup_direct');expect(saved[1].value.experience).toMatchObject({scope:'B',tone:'chaotic',tropeRate:60,socialLift:55,parody:false});
  expect(h.host.state.lumistry!.owner.generationSettings.experience?.scope).toBe('A');
}));
test('measurement archive control is available with zero usage and uses the native action',()=>domTest(()=>{
 const h=fixture('settings');h.host.ui.settingsPage='technical';const page=h.render(),button=[...page.querySelectorAll('button')].find(b=>b.textContent==='Archive and clear measurements');expect(button).toBeDefined();document.body.append(page);button!.click();expect(h.actions).toEqual([]);[...page.querySelectorAll('button')].find(b=>b.textContent==='Confirm Archive and clear measurements')!.click();expect(h.actions).toEqual([['archive_measurements',undefined]]);
}));
test('Like and Pass keep the feed position across candidate changes and live status updates',()=>domTest(()=>{
 const h=fixture('discover');h.host.state.lumistry!.owner.decisions=[];h.host.ui.profileStatus='Writing profiles';
 const first=h.render();first.scrollTop=640;const status=first.querySelector<HTMLDetailsElement>('[data-lumistry-detail="profile-progress"]')!;status.open=true;rememberDatingView(first,h.host.ui);
 const firstId=first.dataset.lumistryCandidate;h.host.state.lumistry!.owner.decisions.push({profileId:firstId!,action:'pass',status:'declined'} as any);h.host.ui.profileStatus='One more profile ready';
 const next=h.render();let assignedBeforeOpen=false,offset=0;Object.defineProperty(next,'scrollTop',{get:()=>offset,set:(value:number)=>{assignedBeforeOpen=!next.querySelector<HTMLDetailsElement>('[data-lumistry-detail="profile-progress"]')!.open;offset=value}});
 restoreDatingView(next,h.host.ui);expect(next.dataset.lumistryCandidate).not.toBe(firstId);expect(next.dataset.lumistryView).toBe(first.dataset.lumistryView);expect(offset).toBe(640);expect(assignedBeforeOpen).toBe(false);expect(next.querySelector<HTMLDetailsElement>('[data-lumistry-detail="profile-progress"]')!.open).toBe(true);
}));
test('Discover keeps the profile anchored when diagnostic panels above it grow',()=>domTest(()=>{
 const h=fixture('discover');h.host.state.lumistry!.owner.decisions=[];const first=h.render();first.scrollTop=640;
 Object.defineProperty(first,'clientHeight',{value:600});first.getBoundingClientRect=()=>({top:0,bottom:600} as DOMRect);first.querySelector<HTMLElement>('[data-lumistry-scroll-anchor]')!.getBoundingClientRect=()=>({top:-120} as DOMRect);rememberDatingView(first,h.host.ui);
 const next=h.render();Object.defineProperty(next,'clientHeight',{value:600});next.getBoundingClientRect=()=>({top:0,bottom:600} as DOMRect);const profile=next.querySelector<HTMLElement>('[data-lumistry-scroll-anchor]')!;profile.getBoundingClientRect=()=>({top:700-next.scrollTop} as DOMRect);
 restoreDatingView(next,h.host.ui);expect(next.scrollTop).toBe(820);expect(profile.getBoundingClientRect().top).toBe(-120);
}));

test('one-file diagnostics is direct in Advanced settings and absent from daily screens',()=>domTest(()=>{
 for(const tab of ['discover','self','matches','inbox'])expect(fixture(tab).render().textContent).not.toContain('Export all Lumistry diagnostics');
 const f=fixture('settings'),page=f.render();const button=[...page.querySelectorAll('button')].find(b=>b.textContent==='Export all Lumistry diagnostics')!;expect(button.closest('details')).toBeNull();button.click();expect(f.actions.at(-1)?.[0]).toBe('export_diagnostics');
}));

test('profile options expose an explicit force match for pending profiles without generation permission',()=>domTest(()=>{
 const f=fixture('matches');f.host.ui.selectedProfileId=f.profiles[2].id;f.host.generation=false;const page=f.render();
 const force=[...page.querySelectorAll('button')].find(b=>b.textContent?.includes('Force match'))!;expect(force).toBeDefined();expect(force.disabled).toBe(false);force.click();expect(f.actions.at(-1)).toEqual(['force_match',{profileId:f.profiles[2].id}]);
}));

import {filterSignature,INTENTION_PRESETS} from '../src/domain/lumistry-filters.js';
import {filterScopeKey} from '../src/frontend/apps/lumistry-filters.js';
const clickLabel=(page:HTMLElement,label:string)=>{const b=[...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===label);expect(b).toBeDefined();b!.click();};
const changeNumber=(page:HTMLElement,label:string,value:string)=>{const input=page.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;input.value=value;input.dispatchEvent(new document.defaultView!.Event('input',{bubbles:true}));return input;};
test('simple filters save the requested example without dropping custom, private or world selections',()=>domTest(()=>{
const h=fixture('filters'),d=h.host.state.lumistry!.owner;d.filters.fields={sexualRole:{mode:'required',value:'switch'},oldCustom:{mode:'preferred',value:'Keep exact legacy words'},species:{mode:'required',value:'elf'}};const saved=JSON.stringify(d.filters);let page=h.render();clickLabel(page,'Women');page=wishlistCore(h,'age');changeNumber(page,'Minimum adult age','22');changeNumber(page,'Maximum adult age','38');page=saveWishlist(h);const [action,payload]=h.actions[0];expect(action).toBe('filters');expect(payload.filters.minAge).toBe(22);expect(payload.filters.maxAge).toBe(38);expect(payload.filters.fields.sexualRole.value).toBe('switch');expect(wishlistChoices(payload.filters,'oldCustom')[0].value).toBe('Keep exact legacy words');expect(payload.filters.fields.species.value).toBe('elf');expect(JSON.stringify(d.filters)).toBe(saved);expect(h.actions.some(([a])=>a==='discover')).toBe(false);
}));
test('primary identity and intention choices synchronize advanced values while preserving additional saved identities',()=>domTest(()=>{
const h=fixture('filters');h.host.state.lumistry!.owner.filters.fields.gender={mode:'required',value:'agender'};let page=h.render();clickLabel(page,'Women');expect(h.host.ui.filterDraft!.fields.gender.value).toContain('agender');page=wishlistCore(h,'intentions');clickLabel(page,'Long-term');page=h.render();clickLabel(page,'Sugar relationship');const values=wishlistChoices(h.host.ui.filterDraft!,'intentions').map(c=>c.value);expect(values).toContain('long-term relationship');expect(values).toContain('sugar relationship');expect(h.render().querySelector('.lumistry-wishlist-story')!.textContent).toContain('sugar relationship');expect(h.actions).toEqual([]);
}));
test('custom distances, extended ages and exact intentions survive opening and unrelated edits',()=>domTest(()=>{
const h=fixture('filters'),d=h.host.state.lumistry!.owner;d.filters.maxKm=0;d.filters.maxAge=1200;d.filters.fields.intentions={mode:'required',value:'friends with benefits, exploring'};const page=h.render();clickLabel(page,'Women');expect(h.host.ui.filterDraft!.maxKm).toBe(0);expect(h.host.ui.filterDraft!.maxAge).toBe(1200);expect(h.host.ui.filterDraft!.fields.intentions).toEqual(d.filters.fields.intentions);const age=wishlistCore(h,'age');expect(age.querySelector<HTMLInputElement>('[aria-label="Maximum adult age"]')!.max).toBe('9999');
}));
test('filter input retains focus, expanded preferences and scroll instead of rerendering the page',()=>domTest(()=>{
const h=fixture('filters'),page=wishlistCore(h,'age');let renders=0;h.host.render=()=>renders++;document.body.append(page);page.scrollTop=220;const input=page.querySelector<HTMLInputElement>('[aria-label="Minimum adult age"]')!;input.focus();input.value='25';input.dispatchEvent(new document.defaultView!.Event('input',{bubbles:true}));expect(document.activeElement).toBe(input);expect(page.scrollTop).toBe(220);expect(renders).toBe(0);expect(page.querySelector('.lumistry-wishlist-story')!.textContent).toContain('25–99');expect(h.actions).toEqual([]);
}));
test('dirty Back and tab navigation offer discard or continued editing without losing the draft',()=>domTest(()=>{
 const h=fixture('filters');let page=h.render();clickLabel(page,'Women');expect(backDating(h.host.ui)).toBe(true);expect(h.host.ui.tab).toBe('filters');page=h.render();expect(page.querySelector('[role=alertdialog]')).not.toBeNull();clickLabel(page,'Keep editing');expect(h.host.ui.filterDraft!.fields.gender.value).toBe('woman');
 page=h.render();clickLabel(page,'Matches');expect(h.host.ui.tab).toBe('filters');page=h.render();clickLabel(page,'Discard changes');expect(h.host.ui.tab).toBe('matches');expect(h.actions).toHaveLength(0);
}));
test('external filter changes disable stale saving and active generation requires a concrete warning',()=>domTest(()=>{
const h=fixture('filters');let page=h.render();clickLabel(page,'Women');h.host.state.lumistry!.owner.filters.maxKm=80;page=h.render();expect(page.textContent).toContain('changed elsewhere');expect([...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Save wishlist')!.disabled).toBe(true);clickLabel(page,'Use latest saved filters');h.host.ui.profileBusy=true;page=h.render();clickLabel(page,'Women');page=saveWishlist(h);expect(h.actions).toEqual([]);expect(page.textContent).toContain('may stop the current creation run');clickLabel(page,'Save changed filters');expect(h.actions[0][0]).toBe('filters');
}));
test('draft sessions remain isolated and resumable across chat and owner changes',()=>domTest(()=>{
 const h=fixture('filters');h.host.state.chatId='first';h.host.state.characterId='actor';let page=h.render();clickLabel(page,'Women');const first=h.host.ui.filterDraft!;
 h.host.state.chatId='second';page=h.render();expect(h.host.ui.filterDraft).not.toBe(first);expect(h.host.ui.filterDraft!.fields.gender).toBeUndefined();clickLabel(page,'Men');
 h.host.state.chatId='first';h.render();expect(h.host.ui.filterDraft).toBe(first);expect(h.host.ui.filterDraft!.fields.gender.value).toBe('woman');expect(Object.keys(h.host.ui.filterSessions!)).toHaveLength(2);
}));
test('Discover chip removal stages a change for Save while preserving other unsaved edits',()=>domTest(()=>{
 const h=fixture('filters'),d=h.host.state.lumistry!.owner;d.decisions=[];d.filters.fields.intentions={mode:'preferred',value:'sugar relationship'};let page=h.render();clickLabel(page,'Women');h.host.ui.tab='discover';page=h.render();const remove=page.querySelector<HTMLButtonElement>('[aria-label="Remove Exact intentions: sugar relationship · Preferred"]')!;remove.click();h.render();
 expect(h.host.ui.tab).toBe('filters');expect(h.host.ui.filterDraft!.fields.intentions.mode).toBe('any');expect(h.host.ui.filterDraft!.fields.gender.value).toBe('woman');expect(d.filters.fields.intentions.value).toBe('sugar relationship');expect(h.actions).toHaveLength(0);
}));

test('discovery rendering and navigation never generate; visible Find more dispatches exactly once',()=>domTest(()=>{
 const h=fixture('discover');h.host.state.lumistry!.owner.decisions=[];
 for(let i=0;i<3;i++)h.render();expect(h.actions).toEqual([]);
 const page=h.render(),find=page.querySelector<HTMLButtonElement>('.lumistry-pool-status button')!;expect(find.textContent).toBe('Find more');expect(find.closest('details')).toBeNull();find.click();expect(h.actions).toEqual([['discover',undefined]]);
 h.actions.length=0;h.host.state.lumistry!.owner.profiles=[];const empty=h.render();expect(h.actions).toEqual([]);expect([...empty.querySelectorAll('button')].filter(b=>b.textContent==='Find more')).toHaveLength(1);
}));

test('settings dashboard presents four destinations without the old long form and keeps diagnostics direct',()=>domTest(()=>{
 const h=fixture('settings'),page=h.render(),content=page.querySelector('.lumistry-settings')!;
 expect(content.querySelector('h1')?.textContent).toBe('Advanced settings');expect(content.querySelectorAll('.lumistry-settings-destination')).toHaveLength(4);expect(content.querySelectorAll('input,select,textarea')).toHaveLength(0);
 expect(content.textContent).toContain('Guided setup · optional');expect(content.textContent).toContain('Your everyday choices are in Me');const exportButton=[...content.querySelectorAll('button')].find(b=>b.textContent==='Export all Lumistry diagnostics')!;expect(exportButton.closest('details')).toBeNull();expect(h.actions).toEqual([]);
}));

test('nested generation edits stay private until Save and survive settings rerenders',()=>domTest(()=>{
 const h=fixture('settings'),saved=JSON.stringify(h.host.state.lumistry!.owner.generationSettings);h.host.ui.settingsPage='discovery';let page=h.render();
 const select=[...page.querySelectorAll('label')].find(l=>l.textContent?.startsWith('Profiles generated at once'))!.querySelector('select')!;select.value='2';select.dispatchEvent(new document.defaultView!.Event('change'));
 expect(JSON.stringify(h.host.state.lumistry!.owner.generationSettings)).toBe(saved);page=h.render();expect(h.host.ui.generationDraft!.creation!.workers).toBe(2);
 [...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Save discovery performance')!.click();expect(h.actions.at(-1)[1].value.creation.workers).toBe(2);expect(h.actions.some(([action])=>action==='discover')).toBe(false);
}));
test('development edits survive changing other settings without mutating saved flags',()=>domTest(()=>{
 const h=fixture('settings'),before=structuredClone(h.host.state.lumistry!.owner.pipeline);h.host.ui.settingsPage='experience';let page=h.render();
 const section=[...page.querySelectorAll('section')].find(d=>d.querySelector(':scope > h2')?.textContent==='Profile development')!;const input=section.querySelector<HTMLInputElement>('input')!;input.checked=false;input.dispatchEvent(new document.defaultView!.Event('change'));
 page=h.render();expect(h.host.state.lumistry!.owner.pipeline).toEqual(before);expect(h.host.ui.pipelineDraft!.enrichment).toBe(false);
 [...page.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Save experience')!.click();expect(h.actions.at(-1)[1].value.pipeline.enrichment).toBe(false);
}));

test('Release B distance changes stay in the draft and Anywhere requires a reviewed world',()=>domTest(()=>{
const h=fixture('filters'),before=JSON.stringify(h.host.state.lumistry!.owner.filters);const page=wishlistCore(h,'distance'),select=page.querySelector<HTMLSelectElement>('[aria-label="Distance"]')!;expect([...select.options].find(o=>o.value==='setting')!.disabled).toBe(true);select.value='custom';select.dispatchEvent(new document.defaultView!.Event('change'));const custom=h.render();changeNumber(custom,'Custom distance (km)','73');expect(h.host.ui.filterDraft!.maxKm).toBe(73);expect(JSON.stringify(h.host.state.lumistry!.owner.filters)).toBe(before);expect(h.actions).toEqual([]);
}));
test('Release B exclusions have an independent editor and save without changing positive preferences or generating',()=>domTest(()=>{
const h=fixture('filters'),before=JSON.stringify(h.host.state.lumistry!.owner.filters);let page=wishlistPicker(h,'smoking');[...page.querySelectorAll<HTMLButtonElement>('.lumistry-wishlist-options button')].find(b=>b.textContent==='regularly')!.click();page=h.render();clickLabel(page,'Avoid');page=h.render();const strict=page.querySelector<HTMLInputElement>('[aria-label="Make regularly essential"]')!;strict.checked=true;strict.dispatchEvent(new document.defaultView!.Event('change'));expect(h.host.ui.filterDraft!.excludedValues).toEqual({smoking:['regularly']});expect(JSON.stringify(h.host.state.lumistry!.owner.filters)).toBe(before);saveWishlist(h);expect(h.actions[0][1].filters.excludedValues).toEqual({smoking:['regularly']});expect(h.actions.some(([a])=>a==='discover')).toBe(false);
}));
test('Release B Restore defaults explicitly clears saved exclusions while keeping legacy category keys',()=>domTest(()=>{
const h=fixture('filters');h.host.state.lumistry!.owner.filters.excludedValues={smoking:['regularly'],oldCustom:['hidden choice']};h.host.state.lumistry!.owner.filters.fields.oldCustom={mode:'preferred',value:'kept'};let page=wishlistPicker(h,'smoking');clickLabel(page,'All are acceptable');clickLabel(page,'Confirm open to all');page=h.render();expect(h.host.ui.filterDraft!.excludedValues!.smoking).toBeUndefined();expect(h.host.ui.filterDraft!.excludedValues!.oldCustom).toEqual(['hidden choice']);expect(wishlistChoices(h.host.ui.filterDraft!,'oldCustom').some(c=>c.value==='kept')).toBe(true);expect(h.actions).toEqual([]);
}));
test('Release B legacy profile membership can be explicitly confirmed in an unsaved editor draft',()=>domTest(()=>{
 const h=fixture('discover');h.host.state.lumistry!.owner.worldContext='A reviewed modern town.';h.host.state.lumistry!.owner.worldReviewedAt='2026-10-16';h.host.ui.draft=structuredClone(h.profiles[0]);
 const page=h.render();clickLabel(page,'Confirm current setting');expect(h.host.ui.draft!.location?.settingKey).toMatch(/^setting_[a-f0-9]{16}$/);expect(h.host.state.lumistry!.owner.profiles[0].location).toBeUndefined();expect(h.actions).toEqual([]);
}));
test('Release B chip removal clears only its exclusion and retains positive and other unsaved choices',()=>domTest(()=>{
 const h=fixture('discover'),d=h.host.state.lumistry!.owner;d.decisions=[];d.filters.fields.smoking={mode:'preferred',value:'never'};d.filters.excludedValues={smoking:['regularly'],drinking:['regularly']};
 const scope=filterScopeKey(h.host.state.chatId,h.host.state.characterId,h.host.owner),draft=structuredClone(d.filters);draft.fields.interests={mode:'preferred',value:'books'};h.host.ui.filterSessions={[scope]:{baseline:structuredClone(d.filters),draft}};
 const page=h.render();page.querySelector<HTMLButtonElement>('[aria-label="Remove exclusion for Smoking"]')!.click();expect(h.host.ui.tab).toBe('filters');h.render();expect(h.host.ui.filterDraft!.excludedValues).toEqual({drinking:['regularly']});expect(h.host.ui.filterDraft!.fields.smoking).toEqual({mode:'preferred',value:'never'});expect(h.host.ui.filterDraft!.fields.interests.value).toBe('books');expect(d.filters.excludedValues.smoking).toEqual(['regularly']);expect(h.actions).toEqual([]);
}));

test('saved dating copies browse, load and delete explicitly without generation or changing the active profile',()=>domTest(()=>{
 const f=fixture('self'),before=structuredClone(f.host.state.lumistry!.owner.self);f.host.ui.selfPage='character';let page=f.render();
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Browse saved copies')!.click();expect(f.actions.at(-1)).toEqual(['saved_profile_list']);
 f.host.ui.savedProfiles=[{id:'copy',name:'Saved Moon',personaId:'native-persona',personaName:'Persona',revision:2,updatedAt:'2026-10-16'}];f.host.ui.savedProfileId='copy';page=f.render();
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Load for review')!.click();expect(f.actions.at(-1)).toEqual(['saved_profile_load',{profileId:'copy',revision:2}]);expect(f.host.state.lumistry!.owner.self).toEqual(before);
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Delete saved copy')!.click();expect(f.actions).toHaveLength(2);page=f.render();
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Confirm delete saved copy')!.click();expect(f.actions.at(-1)).toEqual(['saved_profile_delete',{profileId:'copy',revision:2}]);expect(f.actions.some(a=>a[0]==='discover'||a[0]==='self_generate')).toBe(false);
}));
test('saving reusable dating copies uses current unsaved editor and never applies or regenerates it',()=>domTest(()=>{
 const f=fixture('self');f.host.ui.selfEditing=true;f.host.ui.editor={...structuredClone(f.host.state.lumistry!.owner.self!),bio:'Unsaved bio'};f.host.ui.savedProfileName='Evening profile';
 const page=f.render();[...page.querySelectorAll('button')].find(b=>b.textContent==='Save as new copy')!.click();expect(f.actions.at(-1)).toEqual(['saved_profile_save',{name:'Evening profile',profile:f.host.ui.editor}]);expect(f.host.state.lumistry!.owner.self!.bio).not.toBe('Unsaved bio');
}));
import {presetWorld} from '../src/domain/lumistry-world-catalog.js';
import {worldSource,reviewWorldResult} from '../src/domain/lumistry-world-reading.js';
test('world presets remain staged and modern nonhuman species do not enable magic or rewrite profiles',()=>domTest(()=>{
 const f=fixture('settings'),before=structuredClone(f.host.state.lumistry!.owner);f.host.ui.settingsPage='world';let page=f.render();const preset=page.querySelector<HTMLSelectElement>('select[aria-label="Setting preset"]')!;preset.value='modern_multispecies';[...page.querySelectorAll('button')].find(b=>b.textContent==='Apply preset to draft')!.click();page=f.render();
 expect(f.host.ui.populationWorldDraft!.kind).toBe('modern');expect(f.host.ui.populationWorldDraft!.capabilities).not.toContain('fantasy_magic');expect(f.host.ui.worldGuideDraft!.species.some(s=>s.id==='elf')).toBe(true);expect(f.actions).toHaveLength(0);expect(f.host.state.lumistry!.owner).toEqual(before);
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Save world & people')!.click();expect(f.actions[0][1].value.worldGuide.species.some((s:any)=>s.id==='elf')).toBe(true);expect(typeof f.actions[0][1].baseline).toBe('string');
}));
test('genre compatibility choices appear only as optional vocabulary without creating personal preferences',()=>domTest(()=>{
const f=fixture('filters'),p=presetWorld('medieval_fantasy')!;p.guide.intimacyIds=['fantasy_restraints'];f.host.state.lumistry!.owner.worldGuide=p.guide;f.host.state.lumistry!.owner.populationWorld=p.world;const page=wishlistPicker(f,'kinks'),search=page.querySelector<HTMLInputElement>('input[type=search]')!;search.value='magical restraints';search.dispatchEvent(new document.defaultView!.Event('input'));expect(page.textContent).toContain('negotiated magical restraints');expect(f.host.state.lumistry!.owner.filters.fields).toEqual({});expect(f.actions).toEqual([]);
}));
test('world review shows coverage and supporting excerpts, preserves accepted choices, and refuses stale saves',()=>domTest(()=>{
 const f=fixture('settings'),d=f.host.state.lumistry!.owner;const bundle={sources:[worldSource('card','Character scenario','Adult elves live in a contemporary city.',1000)!],warnings:['Some lore was not available.']};f.host.ui.worldReview=reviewWorldResult({proposals:[{kind:'species',key:'elf',certainty:'supported',evidence:[{sourceId:'card',quote:'Adult elves live in a contemporary city.'}]}]},bundle,d);
 f.host.ui.settingsPage='world';let page=f.render();expect(page.textContent).toContain('What was read');expect(page.textContent).toContain('Some lore was not available.');expect(page.querySelector('blockquote')!.textContent).toContain('Character scenario');expect(page.textContent).toContain('characters read');
 d.worldContext='Changed elsewhere';[...page.querySelectorAll('button')].find(b=>b.textContent==='Accept selected suggestions')!.click();expect(f.actions).toHaveLength(0);expect(f.host.ui.error).toContain('changed');
}));


test('world overview keeps reading and review visible while manual catalogs stay collapsed',()=>domTest(()=>{
 const f=fixture('settings'),before=structuredClone(f.host.state.lumistry!.owner);f.host.ui.settingsPage='world';let page=f.render();
 const overview=page.querySelector('.lumistry-world-overview')!;
 const read=[...overview.querySelectorAll('button')].find(b=>b.textContent==='Read world & suggest filters')!;
 expect(read.closest('details')).toBeNull();expect(overview.querySelector('[data-lumistry-detail="world-manual"]')?.hasAttribute('open')).toBe(false);
 expect(page.textContent).not.toContain('Save app & integrations');
 expect(page.querySelector('[data-lumistry-detail="people-appearance"]')?.textContent).toContain('Skin tone');
 expect(f.host.state.lumistry!.owner).toEqual(before);expect(f.actions).toEqual([]);
 const review=reviewWorldResult({proposals:[{kind:'species',key:'elf',certainty:'supported',evidence:[{sourceId:'card',quote:'Adult elves live here.'}]}]},{sources:[worldSource('card','Scenario','Adult elves live here.',1000)!],warnings:[]},f.host.state.lumistry!.owner);
 f.host.ui.worldReview=review;page=f.render();expect(page.querySelector('.lumistry-world-review')?.closest('[data-lumistry-detail="world-manual"]')).toBeNull();
 expect([...page.querySelectorAll('button')].find(b=>b.textContent==='Accept selected suggestions')?.closest('details')).toBeNull();
}));

test('physical appearance edits use canonical traits and save without changing accepted state early',()=>domTest(()=>{
 const f=fixture('self');f.host.ui.selfEditing=true;f.host.ui.editor=normalizeDatingProfile({alias:'Moon',age:30,person:{version:1,appearance:{skin:'Warm brown skin',hair:'Black curls'},life:{career:'Carpenter'}}})!;
 f.host.ui.characterSection='appearance';const page=f.render(),looks=page.querySelector<HTMLDetailsElement>('[data-lumistry-detail="profile-appearance"]')!;
 expect(looks.open).toBe(true);expect(looks.querySelectorAll('textarea')).toHaveLength(8);
 const skin=[...looks.querySelectorAll('label')].find(l=>l.textContent?.startsWith('Skin, fur or scales'))!.querySelector('textarea')!;
 skin.value='Deep brown skin';skin.dispatchEvent(new document.defaultView!.Event('input'));
 expect(f.host.ui.editor!.person!.appearance.skin).toBe('Deep brown skin');expect(f.host.state.lumistry!.owner.self!.person).toBeUndefined();
 expect(page.querySelector('[data-preference-library]')).toBeNull();expect(page.textContent).not.toContain('Private life & voice');
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Save profile')!.click();expect(f.actions.at(-1)[1].profile.person.appearance.skin).toBe('Deep brown skin');expect(f.actions.some(a=>a[0]==='discover')).toBe(false);
}));

test('species browsing starts with selected entries, bounds library rows and retains staged changes across searches',()=>domTest(()=>{
 const f=fixture('settings'),preset=presetWorld('modern_multispecies')!;f.host.state.lumistry!.owner.worldGuide=preset.guide;f.host.state.lumistry!.owner.populationWorld=preset.world;
 f.host.ui.settingsPage='world';const page=f.render(),palette=page.querySelector<HTMLDetailsElement>('[data-lumistry-detail="species-palette"]')!;
 expect(palette.querySelectorAll('.lumistry-catalog-record')).toHaveLength(0);palette.open=true;palette.dispatchEvent(new document.defaultView!.Event('toggle'));expect(palette.querySelectorAll('.lumistry-catalog-record')).toHaveLength(preset.guide.species.length);
 const search=palette.querySelector<HTMLInputElement>('[aria-label="Search species templates"]')!;search.value='axolotl';search.dispatchEvent(new document.defaultView!.Event('input'));
 const row=[...palette.querySelectorAll('label')].find(l=>l.textContent==='Axolotlfolk')!,check=row.querySelector('input')!;check.checked=true;check.dispatchEvent(new document.defaultView!.Event('change'));
 expect(f.host.ui.worldGuideDraft!.species.some(s=>s.id==='axolotlfolk')).toBe(true);expect(preset.guide.species.some(s=>s.id==='axolotlfolk')).toBe(false);
 search.value='';search.dispatchEvent(new document.defaultView!.Event('input'));expect(palette.querySelectorAll('.lumistry-catalog-record')).toHaveLength(24);
 [...palette.querySelectorAll('button')].find(b=>b.textContent==='Show more species')!.click();expect(palette.querySelectorAll('.lumistry-catalog-record')).toHaveLength(48);
 expect(f.host.ui.worldGuideDraft!.species.some(s=>s.id==='axolotlfolk')).toBe(true);expect(f.actions).toEqual([]);
}));


test('routine profile and inbox screens omit generation accounting and technical exports',()=>domTest(()=>{
 for(const tab of ['self','matches','inbox']){const f=fixture(tab);f.host.state.lumistry!.owner.discoveryAccounting={calls:2,reported:2,input:100,output:40,reasoning:10,failures:0};const page=f.render();expect(page.textContent).not.toContain('Discovery accounting:');expect([...page.querySelectorAll('button')].find(b=>b.textContent==='Export all Lumistry diagnostics')).toBeUndefined();expect(f.actions).toEqual([]);}
 const f=fixture('discover');f.host.state.lumistry!.owner.discoveryAccounting={calls:2,reported:2,input:100,output:40,reasoning:10,failures:0};const page=f.render();expect(page.textContent).not.toContain('Discovery accounting:');expect(page.querySelector('.lumistry-pool-status')?.closest('details')).toBeNull();f.host.ui.tab='settings';f.host.ui.settingsPage='technical';expect(f.render().textContent).toContain('Discovery accounting:');
}));


test('world reading uses its own status, cancel and error labels and dismiss clears its context',()=>domTest(()=>{
 const f=fixture('settings');f.host.ui.profileAction='world';f.host.ui.profileBusy=true;let page=f.render(),status=page.querySelector<HTMLDetailsElement>('[data-lumistry-detail="profile-progress"]')!;
 expect(status.querySelector('summary')?.textContent).toBe('Reading world');expect(status.textContent).not.toContain('Creating profiles');[...status.querySelectorAll('button')].find(b=>b.textContent==='Cancel world reading')!.click();expect(f.actions.at(-1)).toEqual(['cancel_profiles',undefined]);
 f.host.ui.profileBusy=false;f.host.ui.profileError='No world suggestions. Your accepted world is unchanged.';page=f.render();status=page.querySelector<HTMLDetailsElement>('[data-lumistry-detail="profile-progress"]')!;expect(status.open).toBe(true);expect(status.querySelector('summary')?.textContent).toBe('World reading needs attention');expect(status.textContent).not.toContain('Profile generation');
 [...status.querySelectorAll('button')].find(b=>b.textContent==='Dismiss')!.click();expect(f.host.ui.profileAction).toBeUndefined();expect(f.host.ui.profileError).toBe('');
}));

test('guided setup has four questions per page and never infers tastes from Persona facts',()=>domTest(()=>{
 const f=fixture('settings');f.host.state.lumistry!.owner.self!.fields.gender='woman';f.host.state.pocketPersona.displayName='Persona Name';let page=f.render();[...page.querySelectorAll('button')].find(b=>b.textContent==='Guided setup · optional')!.click();page=f.render();
 expect(page.querySelectorAll('[data-setup-question]')).toHaveLength(4);expect(page.querySelector('.lumistry-setup-facts')?.textContent).toContain('Persona Name');expect(f.host.ui.setup!.answers.gender).toBe('everyone');expect(f.host.ui.setup!.answers.textLevel).toBeUndefined();expect(f.actions).toEqual([]);
 const choose=page.querySelector<HTMLSelectElement>('[data-setup-question="gender"] select')!;choose.value='man';choose.dispatchEvent(new document.defaultView!.Event('change'));expect(f.host.state.lumistry!.owner.filters.fields.gender).toBeUndefined();
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Save & next')!.click();expect(f.actions.at(-1)[0]).toBe('setup_save');expect(f.actions.at(-1)[1].draft.answers.gender).toBe('man');expect(f.host.ui.setup!.step).toBe(1);expect(f.actions.some(a=>['discover','self_generate','world'].includes(a[0]))).toBe(false);
}));
test('setup skip and section navigation preserve saved settings without locked controls',()=>domTest(()=>{
 const f=fixture('settings');f.host.ui.settingsPage='setup';const before=structuredClone(f.host.state.lumistry!.owner);let page=f.render();const q=page.querySelector('[data-setup-question="age"]')!;[...q.querySelectorAll('button')].find(b=>b.textContent==='Skip · keep current')!.click();expect(f.host.ui.setup!.answers.age).toBeUndefined();
 [...page.querySelectorAll('.lumistry-setup-steps button')].find(b=>b.textContent==='Adult themes')!.click();page=f.render();expect(f.host.ui.setup!.step).toBe(3);expect(page.querySelectorAll('[data-setup-question]')).toHaveLength(4);expect(page.textContent).toContain('Photo preferences (optional)');expect(page.textContent).toContain('You do not need to select 451 terms');expect(f.host.state.lumistry!.owner).toEqual(before);expect(f.actions).toEqual([]);
}));
test('review permits applying only chosen groups and presets stage answers rather than identities',()=>domTest(()=>{
 const f=fixture('settings');f.host.ui.settingsPage='setup';f.host.ui.setup=makeSetupDraft(f.host.state.lumistry!.owner,false);f.host.ui.setup.step=6;f.host.ui.setup.answers={tone:'chaotic',theme:'modern'};f.host.ui.setupGroups=['app'];let page=f.render();
 [...page.querySelectorAll('button')].find(b=>b.textContent==='Apply selected recommendations')!.click();expect(f.actions.at(-1)[0]).toBe('setup_apply');expect(f.actions.at(-1)[1].groups).toEqual(['app']);expect(f.host.state.lumistry!.owner.theme).toBe('sticker');expect(page.textContent).toContain('Before:');expect(page.textContent).toContain('Recommended:');
 f.host.ui.settingsPage='presets';f.host.ui.setupPresets=[{id:'p',name:'Experience',revision:1,updatedAt:'now',requestId:'r',answers:{tone:'grounded'}}];page=f.render();[...page.querySelectorAll('button')].find(b=>b.textContent==='Load for review')!.click();expect(f.actions.at(-1)).toEqual(['setup_preset_load',{presetId:'p',revision:1}]);expect(f.actions.some(a=>a[0]==='discover')).toBe(false);
}));
test('direct settings pages preserve independent drafts and have distinct scroll routes',()=>domTest(()=>{
 const f=fixture('settings');f.host.ui.settingsPage='experience';let page=f.render();const firstRoute=page.dataset.lumistryView;const content=f.host.ui.contentDraft!;content.text='explicit';f.host.ui.pipelineDraft!.enrichment=false;
 f.host.ui.settingsPage='discovery';page=f.render();expect(page.dataset.lumistryView).not.toBe(firstRoute);const select=[...page.querySelectorAll('label')].find(l=>l.textContent?.startsWith('Profiles generated at once'))!.querySelector('select')!;select.value='2';select.dispatchEvent(new document.defaultView!.Event('change'));
 acknowledgeSetupSettings(f.host.ui,f.host.state.lumistry!.owner,['experience']);expect(f.host.ui.generationDraft!.creation!.workers).toBe(2);expect(f.host.ui.contentDraft).toBeUndefined();expect(f.host.ui.pipelineDraft).toBeUndefined();expect(f.actions).toEqual([]);
}));

test('pending setup and section saves disable editing so acknowledgements cannot erase newer typing',()=>domTest(()=>{
 for(const section of ['setup','experience','world','discovery','app']){const f=fixture('settings');f.host.ui.settingsPage=section;f.host.ui.busy=true;const page=f.render(),view=page.querySelector('.lumistry-settings-dashboard,.lumistry-guided-setup')!;expect([...view.querySelectorAll<HTMLInputElement>('input,select,textarea,button')].every(control=>control.disabled)).toBe(true);expect(f.actions).toEqual([]);}
}));
test('skipping the adult section also skips its optional photo and boundary follow-ups',()=>domTest(()=>{
 const f=fixture('settings');f.host.ui.settingsPage='setup';f.host.ui.setup=makeSetupDraft(f.host.state.lumistry!.owner,false);Object.assign(f.host.ui.setup,{step:3,answers:{textLevel:'explicit',photoLevel:'explicit',boundaries:'Example boundary',photoBoundaries:'Photo boundary',vocabulary:'automatic'}});const page=f.render();[...page.querySelectorAll('button')].find(b=>b.textContent==='Skip section')!.click();expect(f.host.ui.setup!.answers).toEqual({});expect(f.actions.at(-1)[0]).toBe('setup_save');expect(f.host.state.lumistry!.owner.experiencePreferences).toBeUndefined();
}));


test('settings constructs only the selected editor and unopened catalogs stay unbuilt',()=>domTest(()=>{
 const f=fixture('settings');f.render();expect(f.host.ui.populationWorldDraft).toBeUndefined();expect(f.host.ui.worldGuideDraft).toBeUndefined();expect(f.host.ui.pipelineDraft).toBeUndefined();expect(f.host.ui.bankDraft).toBeUndefined();
 f.host.ui.settingsPage='discovery';f.render();expect(f.host.ui.worldGuideDraft).toBeUndefined();expect(f.host.ui.pipelineDraft).toBeUndefined();expect(f.host.ui.bankDraft).toBeUndefined();
 f.host.ui.settingsPage='world';const world=f.render(),vocabulary=world.querySelector<HTMLDetailsElement>('[data-lumistry-detail="world-vocabulary"]')!;
 expect(world.querySelector('[aria-label="World vocabulary availability"]')).toBeNull();vocabulary.open=true;vocabulary.dispatchEvent(new document.defaultView!.Event('toggle'));expect(world.querySelector('[aria-label="World vocabulary availability"]')).not.toBeNull();expect(f.actions).toHaveLength(0);
}));

test('restoring an open world catalog materializes nested anatomy before restoring scroll',()=>domTest(()=>{
 const f=fixture('settings'),preset=presetWorld('modern_multispecies')!;f.host.state.lumistry!.owner.worldGuide=preset.guide;f.host.state.lumistry!.owner.populationWorld=preset.world;f.host.ui.settingsPage='world';
 const first=f.render(),manual=first.querySelector<HTMLDetailsElement>('[data-lumistry-detail="world-manual"]')!,palette=first.querySelector<HTMLDetailsElement>('[data-lumistry-detail="species-palette"]')!;manual.open=true;palette.open=true;palette.dispatchEvent(new document.defaultView!.Event('toggle'));const anatomy=palette.querySelector<HTMLDetailsElement>('[data-lumistry-detail^="species-anatomy-"]')!;anatomy.open=true;const anatomyKey=anatomy.dataset.lumistryDetail;first.scrollTop=200;rememberDatingView(first,f.host.ui);
 const next=f.render();expect(next.querySelectorAll('.lumistry-catalog-record')).toHaveLength(0);let scroll=0;Object.defineProperty(next,'scrollTop',{get:()=>scroll,set:(v:number)=>{expect(next.querySelectorAll('.lumistry-catalog-record').length).toBeGreaterThan(0);scroll=v;}});restoreDatingView(next,f.host.ui);
 expect(next.querySelector<HTMLDetailsElement>(`[data-lumistry-detail="${anatomyKey}"]`)!.open).toBe(true);expect(scroll).toBe(200);expect(f.actions).toHaveLength(0);
}));
