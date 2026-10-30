import { el, requestId } from '../shared.js'

export type StoreBannerKind = 'camera' | 'weather' | 'trackers' | 'social'

// Original, bundled vector artwork. No screenshots, remote images, or user data.
const STORE_BANNER_SCENES: Record<StoreBannerKind, string> = {
  camera: `
    <defs><linearGradient id="$id-bg" x2="1" y2="1"><stop stop-color="#f8c9b3"/><stop offset="1" stop-color="#c5b5f0"/></linearGradient><linearGradient id="$id-photo" x2="0" y2="1"><stop stop-color="#859cca"/><stop offset="1" stop-color="#e2a9b9"/></linearGradient></defs>
    <path fill="url(#$id-bg)" d="M0 0h480v300H0z"/>
    <circle cx="414" cy="34" r="122" fill="#fff" opacity=".16"/><circle cx="38" cy="308" r="152" fill="#995b99" opacity=".13"/>
    <g transform="translate(102 31) rotate(-9 110 120)"><rect x="6" y="10" width="220" height="244" rx="18" fill="#654d79" opacity=".16"/><rect width="220" height="244" rx="18" fill="#fff8ef"/><rect x="13" y="13" width="194" height="185" rx="10" fill="url(#$id-photo)"/><circle cx="156" cy="56" r="24" fill="#fff0c9"/><path d="m13 166 66-73 74 79 54-44v70H13Z" fill="#7e79a4"/><path d="m13 189 87-64 107 58v15H13Z" fill="#424f78"/><path d="M28 219h83" stroke="#d4c8c5" stroke-width="7" stroke-linecap="round"/></g>
    <g transform="translate(295 151) rotate(12)"><rect width="118" height="95" rx="24" fill="#354166"/><rect x="11" y="11" width="96" height="73" rx="17" fill="#515d82"/><circle cx="59" cy="47" r="28" fill="#222c4a"/><circle cx="59" cy="47" r="18" fill="#9caec8"/><circle cx="54" cy="42" r="8" fill="#f8e6dd"/><circle cx="93" cy="23" r="5" fill="#f4c6a5"/></g>
    <path d="M365 66v22m-11-11h22M65 72v14m-7-7h14" stroke="#fff8ef" stroke-width="4" stroke-linecap="round"/>`,
  weather: `
    <defs><linearGradient id="$id-bg" x2="0" y2="1"><stop stop-color="#91c5f4"/><stop offset="1" stop-color="#d8e8e5"/></linearGradient></defs>
    <path fill="url(#$id-bg)" d="M0 0h480v300H0z"/><circle cx="331" cy="86" r="53" fill="#fff0ab"/><circle cx="331" cy="86" r="72" fill="#fff4bf" opacity=".2"/>
    <path d="M0 232q98-66 207-3t273-22v93H0Z" fill="#7bb4a5"/><path d="M0 273q134-94 271-8t209-5v40H0Z" fill="#488d8c"/>
    <g fill="#fff" opacity=".93"><rect x="95" y="99" width="227" height="64" rx="32"/><circle cx="177" cy="103" r="48"/><circle cx="243" cy="115" r="39"/></g>
    <g transform="translate(69 206)"><rect width="102" height="67" rx="18" fill="#f5fbff" opacity=".9"/><circle cx="30" cy="30" r="13" fill="#e9bd63"/><path d="M54 25h27m-27 12h19" stroke="#7d9bb1" stroke-width="5" stroke-linecap="round"/></g>
    <g transform="translate(189 206)"><rect width="102" height="67" rx="18" fill="#f5fbff" opacity=".9"/><path d="M19 38h29M22 29h23" stroke="#9ab7cb" stroke-width="8" stroke-linecap="round"/><path d="M61 25h22m-22 12h15" stroke="#7d9bb1" stroke-width="5" stroke-linecap="round"/></g>
    <path d="M387 165v18m-9-9h18M60 72v14m-7-7h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  trackers: `
    <defs><linearGradient id="$id-bg" x2="1" y2="1"><stop stop-color="#383158"/><stop offset="1" stop-color="#7472ab"/></linearGradient></defs>
    <path fill="url(#$id-bg)" d="M0 0h480v300H0z"/><circle cx="432" cy="4" r="172" fill="#b5acff" opacity=".13"/>
    <g transform="translate(59 49) rotate(-7 120 90)"><rect x="4" y="8" width="245" height="184" rx="26" fill="#211e3a" opacity=".25"/><rect width="245" height="184" rx="26" fill="#f3eefb"/><path d="M23 29h76m-76 15h45" stroke="#aaa1be" stroke-width="6" stroke-linecap="round"/><circle cx="74" cy="111" r="39" fill="none" stroke="#dfd7ed" stroke-width="13"/><path d="M74 72a39 39 0 1 1-35 56" fill="none" stroke="#8a75d2" stroke-width="13" stroke-linecap="round"/><path d="M141 90h62m-62 22h42m-42 22h54" stroke="#bdb3cf" stroke-width="8" stroke-linecap="round"/></g>
    <g transform="translate(278 117) rotate(8)"><rect width="147" height="120" rx="23" fill="#252642"/><path d="M23 30h57" stroke="#9c9fc1" stroke-width="6" stroke-linecap="round"/><path d="m21 87 21-17 19 9 24-32 20 15 21-26" fill="none" stroke="#8ed3c6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
    <path d="M349 54v20m-10-10h20M42 240v14m-7-7h14" stroke="#e2ddfb" stroke-width="3" stroke-linecap="round"/>`,
  social: `
    <defs><linearGradient id="$id-bg" x2="1" y2="1"><stop stop-color="#c5b9ec"/><stop offset="1" stop-color="#f0b8c4"/></linearGradient></defs>
    <path fill="url(#$id-bg)" d="M0 0h480v300H0z"/><circle cx="45" cy="36" r="121" fill="#fff" opacity=".17"/>
    <g transform="translate(67 47) rotate(-6)"><rect width="239" height="121" rx="29" fill="#fff8f7"/><path d="m48 111-9 30 46-26" fill="#fff8f7"/><circle cx="42" cy="43" r="16" fill="#c0a9d7"/><path d="M76 37h123M76 54h83M29 83h170" stroke="#d1bfda" stroke-width="8" stroke-linecap="round"/></g>
    <g transform="translate(209 159) rotate(6)"><rect width="199" height="88" rx="26" fill="#74618f"/><path d="m142 81 28 27-2-30" fill="#74618f"/><path d="M28 29h136M28 49h93" stroke="#f3dce7" stroke-width="8" stroke-linecap="round"/></g>
    <path d="M378 72v25m-12-12h24M99 220v17m-8-8h16" stroke="#fff8f7" stroke-width="4" stroke-linecap="round"/>`,
}

export function storeBanner(kind: StoreBannerKind): HTMLElement {
  const node = el('div', 'lp-store-banner'), id = requestId('store_art').replace(/[^a-zA-Z0-9_-]/g, '_')
  node.setAttribute('aria-hidden', 'true')
  node.innerHTML = `<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">${STORE_BANNER_SCENES[kind].replaceAll('$id', id)}</svg>`
  return node
}
