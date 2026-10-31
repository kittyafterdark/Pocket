import type { DatingUI } from './apps/lumistry.js';

// Only ephemeral UI positions are remembered. Never persist these to phone state.
function detailKeys(view: HTMLElement): Array<[HTMLDetailsElement, string]> {
    const counts = new Map<string, number>();
    return [...view.querySelectorAll<HTMLDetailsElement>('details')].map(detail => {
        const ancestors: string[] = [];
        for (let node: HTMLElement | null = detail; node && node !== view; node = node.parentElement) {
            if (node.tagName === 'DETAILS') ancestors.unshift(node.dataset.lumistryDetail||node.querySelector(':scope > summary')?.textContent || '');
        }
        const label = ancestors.join('/'), occurrence = counts.get(label) || 0;
        counts.set(label, occurrence + 1);
        return [detail, `${label}:${occurrence}`];
    });
}
export function rememberDatingView(view: HTMLElement, ui: DatingUI): void {
    const key = view.dataset.lumistryView;
    if (!key) return;
    const views = ui.views ||= {};
    const element=view.querySelector<HTMLElement>('[data-lumistry-scroll-anchor]');
    let anchor:{key:string;offset:number}|undefined;
    // Avoid forcing layout for every Me/settings/chat refresh or a view already at the top.
    if(element&&view.scrollTop>0&&view.clientHeight>0){const rect=view.getBoundingClientRect(),elementRect=element.getBoundingClientRect();if(elementRect.top<=rect.bottom)anchor={key:element.dataset.lumistryScrollAnchor!,offset:elementRect.top-rect.top};}
    // Menus intentionally close on navigation; preference/editor accordions retain their state.
    views[key] = { anchor,scroll: view.scrollTop, details: detailKeys(view).filter(([d]) => d.open && !d.classList.contains('lumistry-context-menu') && !d.classList.contains('lumistry-options')).map(([, key]) => key) };
    if (Object.keys(views).length > 120) delete views[Object.keys(views)[0]];
}
export function restoreDatingView(view: HTMLElement, ui: DatingUI): void {
    const saved = ui.views?.[view.dataset.lumistryView || ''];
    if (!saved){view.scrollTop=0;return;}
    const open = new Set(saved.details);
    const restored=new Set<HTMLDetailsElement>();
    // Opening a catalog materializes its children synchronously before restoring nested panels/scroll.
    for(let pass=0;pass<12;pass++){
        const pending=detailKeys(view).filter(([detail])=>!restored.has(detail));if(!pending.length)break;
        for(const [detail,key] of pending){restored.add(detail);if(!detail.hasAttribute('data-force-open'))detail.open=open.has(key);if(detail.open)detail.dispatchEvent(new (detail.ownerDocument.defaultView!.Event)('lumistry:materialize'));}
    }
    // Expanded content must exist before a real browser clamps the scroll offset.
    view.scrollTop = saved.scroll;
    if(saved.anchor){const element=[...view.querySelectorAll<HTMLElement>('[data-lumistry-scroll-anchor]')].find(e=>e.dataset.lumistryScrollAnchor===saved.anchor!.key);if(element&&view.clientHeight>0)view.scrollTop+=element.getBoundingClientRect().top-view.getBoundingClientRect().top-saved.anchor.offset;}
}
