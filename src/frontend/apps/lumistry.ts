import {renderMyInterests} from './lumistry-interests.js';
import {acknowledgeSetupSettings} from './lumistry-settings-state.js';
import {renderLoveMeter} from '../components/lumistry-love.js';
import type {LovePreferences} from '../../domain/lumistry-love.js';
import {polishLumistry,waitingSkeleton,attachDiscoveryGesture,profileEditorDirty,clearProfileEditor,type VisualMemory} from '../lumistry-visual-polish.js';
import {publicProfileDiff} from '../../domain/lumistry-experience-tools.js';
import {browsingTools,profileEvidenceTools,qualityTools,sampleProfile} from './lumistry-browsing-tools.js';
import {hasPriorLike,discoverProfiles,sharedInterestHints,frontQuestion,type MatchNotice} from '../../domain/lumistry-discovery-view.js';
import {renderAgreedDateSummaries} from '../components/lumistry-next-steps.js';
import {renderSimplePlay} from './lumistry-simple-play.js';
import {renderPreferenceLibrary} from './lumistry-preference-library.js';
import {makePreferenceDraft,preferenceDraftDirty,type PreferenceDraft} from '../../domain/lumistry-preference-draft.js';
import {profileEditSignature} from '../../domain/lumistry-profile-edit.js';
import {frontendPerformance,performanceNow} from '../../domain/performance.js';
import {settingsSectionState} from '../../domain/lumistry-setup.js';
import {renderSettingsDashboard} from './lumistry-setup.js';
import type {SetupDraft,SetupPreset,ApplyGroup} from '../../domain/lumistry-setup.js';
import type {ExperiencePreferences} from '../../domain/lumistry-experience-preferences.js';
import {adultPreferencesEditor} from './lumistry-adult-preferences.js';
import {worldGuideEditor,worldReviewEditor} from './lumistry-world.js';
import {extraWorldOptions,worldGenreValues,type WorldGuide} from '../../domain/lumistry-world-catalog.js';
import {worldBaseline,type WorldReview} from '../../domain/lumistry-world-reading.js';
import type {SavedDatingProfileSummary} from '../../domain/lumistry-saved-profiles.js';
import {datingLocationLabel,hasKnownDistance,reviewedSettingKey,profileSettingKey,nearbyEncounterPossible} from '../../domain/lumistry-location.js';
import {renderSimpleFilters,filterChips,emptyFilterExplanation,leaveFilters,filtersDirty,type FilterSession} from './lumistry-filters.js';
import {measurementTelemetry,subtractUsage} from '../../domain/lumistry-measurements.js';
import {emptyCreationTelemetry} from '../../domain/lumistry-creation-telemetry.js';
import {creationSummary} from '../../domain/lumistry-creation-telemetry.js';
import {WORLD_CAPABILITIES,normalizePopulationWorld,worldDefaults,type PopulationWorld} from '../../domain/lumistry-world-core.js';
import { normalizeExperience, EXPERIENCE_PRESETS } from '../../domain/lumistry-experience.js';
import { heightCm, heightRange, displayHeight, formatHeight, type HeightUnit } from '../../domain/lumistry-height.js';
import { discoveryQualitySummary, discoveryUsageSummary } from '../../domain/lumistry-pipeline.js';
import { DATING_TROPES, MAIN_DATING_TROPES } from '../../domain/lumistry-tropes.js';
import { conversationUnreadForDevice } from '../../domain/device.js';
import type { PhoneState } from '../../types.js';
import { DATING_FIELDS, datingFor, normalizeDatingProfile, publicDatingProfile, type DatingProfile, type DatingDecision } from '../../domain/lumistry.js';
import { DATING_OPTIONS } from '../../domain/lumistry-options.js';
import { button, el, formatTime } from '../shared.js';
export interface DatingUI {
    loveDraft?:LovePreferences;visualMemory?:VisualMemory;editorSource?:DatingProfile;editorInitial?:string;editorLeave?:()=>void;libraryView?:Record<string,{search:string;category:string}>;
    supportExport?:unknown;
    worldSources?:import('../../domain/lumistry-world-reading.js').WorldSourceChoice[];worldSourceIds?:string[];worldSourceSearch?:string;worldSourcePage?:number;worldSourceWarnings?:string[];
    worldEvidenceDraft?:string;worldContextDraft?:string;worldGuideDraft?:WorldGuide;worldReview?:WorldReview;worldSettingsBaseline?:string;worldFieldsDraft?:Array<{key:string;label:string;options:string[]}>;
    savedProfiles?:SavedDatingProfileSummary[];
    savedProfileId?:string;
    savedProfileName?:string;
    savedProfileDeleteId?:string;
    populationWorldDraft?:PopulationWorld;
    authoringArchive?:unknown;
    heightUnit?: HeightUnit;
    profileDiffPending?:ReturnType<typeof publicProfileDiff>;
    savedProfileDiff?:ReturnType<typeof publicProfileDiff>;
    matchNoticeKey?:string;
    discoverCollection?:'all'|'liked'|'saved';discoverPick?:string;setupQuick?:boolean;moodReview?:{tone:'grounded'|'balanced'|'chaotic';baseline:string};
    tab: string;
    draft?: DatingProfile;
    editor?: DatingProfile;
    editingNpc?: boolean;
    selectedProfileId?: string;
    worldContext?: string;
    world?: ReturnType<typeof datingFor>['worldFields'];
    description: string;
    contactId: string;
    busy: boolean;
    profileBusy?: boolean;
    profileStatus?: string;
    profileError?: string;
    profileAction?: string;
    settingsPage?:string;setup?:SetupDraft;setupGroups?:ApplyGroup[];setupPresets?:SetupPreset[];setupName?:string;setupDeleteId?:string;contentDraft?:ExperiencePreferences;contentEdited?:boolean;directBaseline?:{group:ApplyGroup;signature:string};settingsBaselines?:Partial<Record<ApplyGroup,string>>;appThemeDraft?:string;
    pendingProfile?: DatingProfile;
    pendingProfileKind?: string;
    status: string;
    error: string;
    photoIndex: Record<string, number>;
    photoTarget?: string;
    photoBrief?: string;
    filterSessions?:Record<string,FilterSession>;
    filterScope?:string;
    filterLeave?:()=>void;
    filterDraft?: ReturnType<typeof datingFor>['filters'];
    generationDraft?: ReturnType<typeof datingFor>['generationSettings'];
    pipelineDraft?: ReturnType<typeof datingFor>['pipeline'];
    bankDraft?: {
        enabled: boolean;
        chance: number;
    };
    photoPlanIndex?: number;
    selfEditing?: boolean;
    selfPage?:string;characterSection?:string;selfBaseline?:string;preferenceDraft?:PreferenceDraft;preferenceLeave?:()=>void;
    panelHistory?: string[];
    views?: Record<string, { scroll: number; details: string[]; anchor?:{key:string;offset:number} }>;
}
export const newDatingUI = (): DatingUI => ({ tab: 'discover', description: '', contactId: '', busy: false, status: '', error: '', photoIndex: {} });
export function backDating(ui: DatingUI): boolean {
    if(profileEditorDirty(ui)){ui.editorLeave=()=>{clearProfileEditor(ui);backDating(ui);};return true;}
    if(ui.preferenceDraft&&preferenceDraftDirty(ui.preferenceDraft)){ui.preferenceLeave||=()=>{ui.preferenceDraft=undefined;ui.selfPage=undefined;};return true;}
    if(ui.tab==='self'&&ui.selfPage){ui.selfPage=undefined;ui.selfEditing=false;ui.preferenceDraft=undefined;return true;}
    if(ui.tab==='settings'&&ui.settingsPage&&ui.settingsPage!=='home'){ui.settingsPage='home';ui.directBaseline=undefined;return true;}
    if(ui.tab==='filters'&&filtersDirty(ui)){ui.filterLeave=()=>{backDating(ui);};return true;}
    if (ui.photoTarget) ui.photoTarget = undefined;
    else if (ui.draft) { ui.draft = undefined; ui.editingNpc = false; }
    else if (ui.selfEditing) ui.selfEditing = false;
    else if (ui.selectedProfileId) ui.selectedProfileId = undefined;
    else if (['filters', 'settings', 'generate'].includes(ui.tab)) {
        ui.tab = ui.panelHistory?.pop() || 'discover';
    } else return false;
    return true;
}
function openPanel(h: DatingHost, tab: string, settingsPage='home'): void {
    if(profileEditorDirty(h.ui)){h.ui.editorLeave=()=>{clearProfileEditor(h.ui);openPanel(h,tab,settingsPage);};h.render();return;}
    if(h.ui.preferenceDraft&&preferenceDraftDirty(h.ui.preferenceDraft)){h.ui.preferenceLeave=()=>{h.ui.preferenceDraft=undefined;h.ui.selfPage=undefined;openPanel(h,tab,settingsPage);};h.render();return;}
    leaveFilters(h.ui,()=>{if(h.ui.tab!==tab){(h.ui.panelHistory||=[]).push(h.ui.tab);if(tab==='settings'){h.ui.settingsPage=settingsPage;h.ui.directBaseline=undefined;}}h.ui.tab=tab;});h.render();
}
export {acknowledgeSetupSettings} from './lumistry-settings-state.js';
export function acknowledgeWorldReview(ui:DatingUI,d:ReturnType<typeof datingFor>):void {
 const saved=ui.settingsBaselines?.world;if(!saved)return;
 // Accepting world suggestions owns world facts, not unsaved appearance/job choices.
 try{const old=JSON.parse(saved),current=settingsSectionState(d,'world');ui.settingsBaselines!.world=JSON.stringify({...current,appearanceDiversity:old.appearanceDiversity,adultJobs:old.adultJobs,allTropes:old.allTropes});}catch{/* Retain invalid/stale baselines so the server refuses an unsafe overwrite. */}
}
export interface DatingHost {
    visible?:boolean;
    openTimeline?(id:string):void;matchNotices?:MatchNotice[];dismissMatchNotices?():void;planDate?(conversationId:string):void;
    creationConfiguration?:unknown;
    connectionSettings?:import('../../domain/authoring-policy.js').AuthoringPolicy;
    connections?:Array<{id:string;name:string;model?:string;provider:string}>;
    saveConnectionSettings?(settings:import('../../domain/authoring-policy.js').AuthoringPolicy):void;
    state: PhoneState;
    owner: string;
    ui: DatingUI;
    generation: boolean;
    backgroundEnabled: boolean;
    automaticReplies: boolean;
    images: boolean;
    action(action: string, payload?: Record<string, unknown>): void;
    render(): void;
    back(): void;
    openConversation(id: string): void;
    gallery(profileId: string): void;
}
const ICONS: Record<string, string> = {
    flask: '<path d="M9 3h6M10 3v6.2L4.6 18.4A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.6L14 9.2V3"/><path d="M7.4 15h9.2"/><circle cx="11" cy="17.6" r=".6" fill="currentColor"/><circle cx="14" cy="12.6" r=".6" fill="currentColor"/>',
    molecule: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="7" r="3"/><circle cx="18" cy="18" r="2"/><path d="M8.2 14.8l7.6-5.6M8.9 17.4l7.2.4"/>',
    envelope: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5L12 13.5l8.5-6"/>',
    person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-3.8 3.4-5.8 7-5.8s6.4 2 7 5.8"/><path d="M19 3v3M17.5 4.5h3"/>',
    testChat:'<path d="M8 3h8M9 3v14a3 3 0 0 0 6 0V3M9 10h6M5 10H2v8h4l3 3"/><circle cx="12" cy="14" r=".7"/>',
    beakerPerson:'<path d="M6 3h12M7 3v17h10V3"/><circle cx="12" cy="9" r="2"/><path d="M9 16c0-4 6-4 6 0"/>',
    brand: '<path d="M9 3h6M10 3v5.4L5.2 17A2 2 0 0 0 6.9 20h10.2a2 2 0 0 0 1.7-3L14 8.4V3"/><path d="M12 17.4s-2.8-1.7-2.8-3.8a1.5 1.5 0 0 1 2.8-.7 1.5 1.5 0 0 1 2.8.7c0 2.1-2.8 3.8-2.8 3.8z" fill="currentColor" stroke="none"/>',
    heart: '<path d="M12 20.5S3.5 15.6 3.5 9.4A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.5 1.8c0 6.2-8.5 11.1-8.5 11.1z"/>',
    sparkle: '<path d="M11 3l1.9 6.1L19 11l-6.1 1.9L11 19l-1.9-6.1L3 11l6.1-1.9z"/><path d="M19 3v4M17 5h4"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5L16 16"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3 3-2.5 4 3.5"/>',
    chat: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/>',
    archive: '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v12h14V8M9 12h6"/>',
    edit: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.4v.1"/>'
};
function icon(name: string): SVGSVGElement {
    const t = document.createElement('template');
    t.innerHTML = `<svg class="lumistry-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
    return t.content.firstElementChild as SVGSVGElement;
}
const DOODLES: Record<string, string> = {
    camera: '<path class="p2 k" d="M12 26h14l6-10h18l6 10h12v40H12z" stroke-width="3.5" stroke-linejoin="round"/><circle class="w k" cx="40" cy="45" r="14" stroke-width="3.5"/><circle class="m2 k" cx="40" cy="45" r="8" stroke-width="2.5"/><path class="hl" d="M35 41q2-4 6-3" fill="none" stroke-width="3" stroke-linecap="round"/><circle class="y k" cx="60" cy="33" r="3" stroke-width="2"/>',
    star: '<path class="y k" d="M40 6l9.6 19.4 21.4 3.1-15.5 15.1 3.7 21.3L40 54.8 20.8 64.9l3.7-21.3L9 28.5l21.4-3.1z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle class="kdf" cx="33.0" cy="36" r="2.8"/><circle class="kdf" cx="47.0" cy="36" r="2.8"/><path class="kd" d="M35.0 43.0q5.0 5.0 10.0 0" fill="none" stroke-width="2.6" stroke-linecap="round"/><circle class="r" cx="28.0" cy="42.0" r="3.2" opacity=".85"/><circle class="r" cx="52.0" cy="42.0" r="3.2" opacity=".85"/>',
    heart: '<path class="r k" d="M40 70S10 52 10 30a15 15 0 0 1 30-5 15 15 0 0 1 30 5c0 22-30 40-30 40z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle class="kdf" cx="33.0" cy="38" r="2.8"/><circle class="kdf" cx="47.0" cy="38" r="2.8"/><path class="kd" d="M35.0 45.0q5.0 5.0 10.0 0" fill="none" stroke-width="2.6" stroke-linecap="round"/><circle class="r" cx="28.0" cy="44.0" r="3.2" opacity=".85"/><circle class="r" cx="52.0" cy="44.0" r="3.2" opacity=".85"/>',
    bubbles: '<circle class="m2 k" cx="28" cy="50" r="17" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="hl" d="M18 46a11 11 0 0 1 7-7" fill="none" stroke-width="3.5" stroke-linecap="round"/><circle class="p2 k" cx="54" cy="28" r="12" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="hl" d="M48 26a7 7 0 0 1 4-4" fill="none" stroke-width="3" stroke-linecap="round"/><circle class="l2 k" cx="57" cy="58" r="9" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>',
    tube: '<g transform="rotate(25 40 40)"><path class="w k" d="M30 12h20v46a10 10 0 0 1-20 0z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="l k" d="M30 40h20v18a10 10 0 0 1-20 0z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><rect class="y k" x="26" y="7" width="28" height="9" rx="4" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle class="hlf" cx="36" cy="50" r="2.5"/><circle class="hlf" cx="45" cy="45" r="2"/><circle class="kf" cx="38" cy="26" r="2.4"/><circle class="kf" cx="46" cy="26" r="2.4"/><path class="ks" d="M38 31q4 4 8 0" fill="none" stroke-width="2.4" stroke-linecap="round"/></g>',
    cloud: '<path class="w k" d="M24 58a14 14 0 0 1-1-28 17 17 0 0 1 32-3 14 14 0 0 1 5 31z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="hl2" d="M26 33a10 10 0 0 1 8-8" fill="none" stroke-width="3" stroke-linecap="round"/><circle class="kf" cx="35.05" cy="44" r="2.38"/><circle class="kf" cx="46.95" cy="44" r="2.38"/><path class="ks" d="M36.75 49.95q4.25 4.25 8.5 0" fill="none" stroke-width="2.21" stroke-linecap="round"/><circle class="r" cx="30.8" cy="49.1" r="2.72" opacity=".85"/><circle class="r" cx="51.2" cy="49.1" r="2.72" opacity=".85"/><path class="b" d="M20 68l-3 6M40 69l-3 7M60 68l-3 6" fill="none" stroke-width="3.5" stroke-linecap="round"/>',
    sprout: '<path class="k" d="M40 70V38" fill="none" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="g1 k" d="M40 44C22 44 12 32 12 18c16 0 28 10 28 26z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="g2 k" d="M40 34C54 34 66 26 68 12c-16-1-28 8-28 22z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="c k" d="M22 70h36l-4 -10H26z" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>',
    flask: '<path class="w k" d="M30 8h20M34 8v22L14 60a8 8 0 0 0 7 12h38a8 8 0 0 0 7-12L46 30V8" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path class="p" d="M20 50h40l8 12a8 8 0 0 1-7 10H21a8 8 0 0 1-7-10z"/><path class="k" d="M34 8v22L14 60a8 8 0 0 0 7 12h38a8 8 0 0 0 7-12L46 30V8M30 8h20" fill="none" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle class="kf" cx="32" cy="56" r="2.6"/><circle class="kf" cx="48" cy="56" r="2.6"/><path class="ks" d="M35 62q5 5 10 0" fill="none" stroke-width="2.6" stroke-linecap="round"/><circle class="r" cx="26" cy="62" r="3.4"/><circle class="r" cx="54" cy="62" r="3.4"/><circle class="ms" cx="52" cy="16" r="3" fill="none" stroke-width="2.5"/>'
};
function doodle(name: string): SVGSVGElement {
    const t = document.createElement('template');
    t.innerHTML = `<svg class="lumistry-doodle" viewBox="0 0 80 80" aria-hidden="true" focusable="false">${DOODLES[name] || DOODLES.flask}</svg>`;
    return t.content.firstElementChild as SVGSVGElement;
}
function bubbleField(): HTMLElement {
    const field = el('span', 'lumistry-bubbles');
    field.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 7; i++)
        field.append(el('i'));
    return field;
}
const EMPTY_DOODLES: Record<string, string> = { person: 'sprout', flask: 'flask', chat: 'cloud', heart: 'heart' };
function empty(ico: string, text: string): HTMLElement {
    const box = el('div', 'lp-card lumistry-empty');
    box.append(doodle(EMPTY_DOODLES[ico] || 'flask'), el('p', 'lp-copy', text));
    return box;
}
const title = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
function control(label: string, value: string, onChange: (s: string) => void, type = 'text'): HTMLElement {
    const wrapper = el('label', 'lp-label', label), input = el(type === 'textarea' ? 'textarea' : 'input', type === 'textarea' ? 'lp-textarea' : 'lp-input');
    if (input instanceof HTMLInputElement) {
        input.type = type;
        if (type === 'number' && label === 'Age') {
            input.min = '18';
            input.max = '9999';
            input.step = '1';
        }
    }
    input.value = value;
    input.addEventListener('input', () => onChange(input.value));
    wrapper.append(input);
    return wrapper;
}
function choices(label: string, value: string, options: string[] | undefined, change: (s: string) => void): HTMLElement {
    if (!options?.length)
        return control(label, value, change);
    const details = el('details', 'lumistry-choice'), summary = el('summary', '', label + (value ? ': ' + value : ''));
    const selected = new Set(value.split(',').map(x => x.trim()).filter(Boolean));
    const list = el('div', 'lumistry-choice-list');
    const publish = () => { const result = [...selected].join(', '); summary.textContent = label + (result ? ': ' + result : ''); change(result); };
    const search=el('input','lp-input'),more=act('Show more choices',()=>{limit+=20;refresh();});let limit=20;
    search.type='search';search.placeholder='Search '+label;search.setAttribute('aria-label','Search '+label+' choices');
    const refresh=()=>{list.replaceChildren();const matches=options.filter(v=>v.toLowerCase().includes(search.value.toLowerCase())).sort((a,b)=>Number(selected.has(b))-Number(selected.has(a)));const shown=options.length>20?matches.slice(0,limit):matches;
    for (const option of shown) {
        const label = el('label', 'lp-row'), check = el('input');
        check.type = 'checkbox';
        check.checked = selected.has(option);
        check.addEventListener('change', () => {
            if (check.checked)
                selected.add(option);
            else
                selected.delete(option);
            publish();
        });
        label.append(check, el('span', 'lp-copy', option));
        list.append(label);
    }
      more.hidden=matches.length<=limit;
    };
    if(options.length>20){search.addEventListener('input',()=>{limit=20;refresh();});details.append(search);}
    refresh();
    const custom = control('Other / your own words', [...selected].filter(x => !options.includes(x)).join(', '), value => {
        for (const item of [...selected])
            if (!options.includes(item))
                selected.delete(item);
        value.split(',').map(x => x.trim()).filter(Boolean).forEach(x => selected.add(x));
        publish();
    });
    details.prepend(summary);details.append(list,custom);if(options.length>20)details.append(more);
    return details;
}
function heightControl(h: DatingHost, initial: string, change: (value: string) => void, range = false): HTMLElement {
    const box = el('div', 'lp-stack lumistry-height-control');
    const output = el('output', 'lp-copy lumistry-range-label');
    let value = initial, unit = h.ui.heightUnit || datingFor(h.state, h.owner).heightUnit;
    const parsed = heightRange(value), existing = value.split(',').map(heightCm).filter((n): n is number => n !== undefined);
    let low = parsed?.[0] ?? (existing.length ? Math.min(...existing) : range ? 140 : 170);
    let high = parsed?.[1] ?? (existing.length ? Math.max(...existing) : 220);
    const floor = Math.min(100, low), ceiling = Math.max(250, high, low);
    const toggles = el('div', 'lp-row lumistry-height-units');
    toggles.setAttribute('role', 'group'); toggles.setAttribute('aria-label', 'Height units');
    const inputs: HTMLInputElement[] = [];
    const buttons: Array<[HTMLButtonElement, HeightUnit]> = [];
    const update = () => {
        output.textContent = 'Height: ' + (value ? displayHeight(value, unit) : range ? 'Any height' : 'Not set');
        for (const [button, choice] of buttons) button.setAttribute('aria-pressed', String(choice === unit));
        inputs.forEach((input, i) => {
            input.min = String(unit === 'metric' ? floor : Math.floor(floor / 2.54));
            input.max = String(unit === 'metric' ? ceiling : Math.ceil(ceiling / 2.54));
            input.value = String(unit === 'metric' ? i ? high : low : Math.round((i ? high : low) / 2.54));
            input.setAttribute('aria-valuetext', formatHeight(i ? high : low, unit));
        });
    };
    for (const [name, choice] of [['Metric (cm)', 'metric'], ['Imperial (ft/in)', 'imperial']] as const) {
        const button = act(name, () => { unit = choice; h.ui.heightUnit = choice; update(); h.action('height_units', { unit: choice }); });
        buttons.push([button, choice]); toggles.append(button);
    }
    for (let i = 0; i < (range ? 2 : 1); i++) {
        const name = range ? i ? 'Maximum height' : 'Minimum height' : 'Height';
        const label = el('label', 'lp-label', name), input = el('input', 'lumistry-height-slider');
        input.type = 'range'; input.step = '1'; input.setAttribute('aria-label', name);
        input.addEventListener('input', () => {
            const cm = unit === 'metric' ? Number(input.value) : Math.round(Number(input.value) * 2.54);
            if (i) high = Math.max(cm, low); else low = range ? Math.min(cm, high) : cm;
            value = range ? `${low}–${high} cm` : `${low} cm`;
            change(value); update();
        });
        inputs.push(input); label.append(input); box.append(label);
    }
    box.prepend(output, toggles);
    if (range && value && !parsed && existing.length > 1) box.append(el('p', 'lp-copy', 'Move a slider to replace your saved individual heights with a range.'));
    if (value && !parsed && !existing.length) box.append(el('p', 'lp-copy', 'Your saved height is kept until you move the slider.'));
    box.append(act(range ? 'Clear height preference' : 'Clear height', () => { value = ''; change(value); update(); }));
    update(); return box;
}
function ageRange(filters: {
    minAge: number;
    maxAge: number;
}): HTMLElement {
    const box = el('div', 'lp-stack'), label = el('span', 'lp-copy lumistry-range-label');
    const track = el('div', 'lumistry-age-range');
    const lower = el('input'), upper = el('input');
    const ceiling = Math.max(99, filters.maxAge);
    for (const input of [lower, upper]) {
        input.type = 'range';
        input.min = '18';
        input.max = String(ceiling);
        input.step = '1';
    }
    lower.value = String(filters.minAge);
    upper.value = String(filters.maxAge);
    lower.setAttribute('aria-label', 'Minimum age');
    upper.setAttribute('aria-label', 'Maximum age');
    const update = () => { label.textContent = `Age range: ${filters.minAge}–${filters.maxAge}`; lower.setAttribute('aria-valuetext', String(filters.minAge)); upper.setAttribute('aria-valuetext', String(filters.maxAge)); track.style.setProperty('--range-start', `${100 * (filters.minAge - 18) / (ceiling - 18)}%`); track.style.setProperty('--range-end', `${100 * (filters.maxAge - 18) / (ceiling - 18)}%`); lower.style.zIndex = filters.minAge >= ceiling - 1 ? '3' : '1'; };
    lower.addEventListener('input', () => { filters.minAge = Math.min(Number(lower.value), filters.maxAge); lower.value = String(filters.minAge); update(); });
    upper.addEventListener('input', () => { filters.maxAge = Math.max(Number(upper.value), filters.minAge); upper.value = String(filters.maxAge); update(); });
    update();
    track.append(lower, upper);
    box.append(label, track);
    return box;
}
function act(label: string, fn: () => void, primary = false, ico?: string, danger = false,confirmAction?:string): HTMLButtonElement {
    const b = button(label, 'lp-button' + (primary ? ' lp-button-primary' : '') + (danger ? ' lp-button-danger' : ''));
    if(confirmAction)b.dataset.confirmAction=confirmAction;
    b.addEventListener('click', fn);
    if (ico)
        b.prepend(ico.startsWith('doodle:') ? doodle(ico.slice(7)) : icon(ico));
    return b;
}
function editor(h: DatingHost, p: DatingProfile, self: boolean): HTMLElement {
    const card = el('form', 'lp-card lp-stack lumistry-editor');
    if(h.ui.editorSource!==p){h.ui.editorSource=p;h.ui.editorInitial=profileEditSignature(p);}
    card.addEventListener('submit', e => e.preventDefault());
    const section=h.ui.characterSection||'identity';
    if(self){const nav=el('nav','lumistry-library-actions');nav.setAttribute('aria-label','Character Studio sections');for(const [id,name] of [['identity','Basics'],['appearance','Appearance'],['details','More details']]){const b=act(name,()=>{h.ui.characterSection=id;h.render();});b.setAttribute('aria-current',section===id?'page':'false');nav.append(b);}card.append(nav);}
    if(!self||section==='identity'){card.append(el('h2', 'lp-title', self ? 'Your Lumistry profile' : 'Review profile draft'), control('Display name / alias', p.alias, v => p.alias = v), control('Age', String(p.age || ''), v => p.age = Number(v), 'number'), choices('Pronouns', p.pronouns, DATING_OPTIONS.pronouns, v => p.pronouns = v), control('About me', p.bio, v => p.bio = v, 'textarea'));
    const anon = el('label', 'lp-row'), check = el('input');
    check.type = 'checkbox';
    check.checked = p.anonymous;
    check.addEventListener('change', () => p.anonymous = check.checked);
    anon.append(check, el('span', 'lp-copy', 'Anonymous profile — use an alias and optional photos'));
    card.append(anon);}
    if(!self||section==='appearance'){
    const looks=el('details','lumistry-editor-appearance');looks.dataset.lumistryDetail='profile-appearance';looks.append(el('summary','','Physical appearance'),el('p','lp-copy','These details guide your photos. Public profile selections and private interests are edited separately.'));
    if(p.person){const labels:Record<string,string>={tags:'Species / overall appearance',skin:'Skin, fur or scales',face:'Face',eyes:'Eyes',hair:'Hair',build:'Build',height:'Height',distinctive:'Distinctive features',usualStyle:'Usual clothing & style'};for(const [key,label] of Object.entries(labels)){if(key==='height'&&!p.person.appearance.height)continue;looks.append(control(label,p.person.appearance[key as keyof typeof p.person.appearance]||'',v=>(p.person!.appearance as Record<string,string>)[key]=v,'textarea'));}}
    else looks.append(control('Appearance',p.phoneProfile.appearance,v=>p.phoneProfile.appearance=v,'textarea'));
    if(self){looks.open=true;looks.dataset.forceOpen='true';}
    card.append(looks);}
    if (!self)
        card.append(control('Distance (km)',hasKnownDistance(p)?String(p.distanceKm):'',v=>{p.distanceKm=v.trim()?Number(v):100001;if(v.trim())p.location={...p.location,mode:'radius'};},'number'));
    if(!self){const key=reviewedSettingKey(datingFor(h.state,h.owner));if(key&&profileSettingKey(p)!==key)card.append(el('p','lp-copy','Setting membership is unconfirmed. Confirm only if this person belongs in your reviewed world.'),act('Confirm current setting',()=>{p.location={mode:hasKnownDistance(p)?'radius':'setting',settingKey:key};h.render();},false,'check'));}
    if(!self||section==='public'||section==='details'){
    const details = el('details'), summary = el('summary', '', 'Profile details & visibility');
    details.append(summary);
    for (const key of [...DATING_FIELDS, ...new Set([...datingFor(h.state,h.owner).worldFields.map(w=>w.key),...(datingFor(h.state,h.owner).worldGuide?.species.length?['species']:[])])]) {
        details.append(key === 'height' ? heightControl(h, p.fields[key] || '', v => p.fields[key] = v) : choices(title(key), p.fields[key] || '', key==='kinks'?[...DATING_OPTIONS.kinks,...worldGenreValues(datingFor(h.state,h.owner).worldGuide,datingFor(h.state,h.owner).populationWorld!)]:extraWorldOptions(datingFor(h.state,h.owner))[key]||DATING_OPTIONS[key], v => p.fields[key] = v));
        const row = el('label', 'lp-row'), hidden = el('input');
        hidden.type = 'checkbox';
        hidden.checked = p.hiddenFields.includes(key);
        hidden.addEventListener('change', () => {
            p.hiddenFields = p.hiddenFields.filter(k => k !== key);
            if (hidden.checked)
                p.hiddenFields.push(key);
        });
        row.append(hidden, el('span', 'lp-copy', 'Hide from public profile'));
        details.append(row);
    }
    if(self&&section==='public'){details.open=true;details.dataset.forceOpen='true';}
    card.append(details);}

    if(!self||section==='private'||section==='details'){
    const privateSection = el('details');
    privateSection.append(el('summary', '', 'Private life & voice'));
    if(!self)privateSection.append(adultPreferencesEditor(p,datingFor(h.state,h.owner).populationWorld!));
    else {if(section==='private'){privateSection.open=true;privateSection.dataset.forceOpen='true';}privateSection.append(el('p','lp-copy','Edit your adult interests and species attraction from their dedicated libraries in Me. Relevant private life and voice details may enter model/provider context.'));}
    for (const key of Object.keys(p.privateFields))
        privateSection.append(choices(title(key), p.privateFields[key] || '', DATING_OPTIONS[key], v => p.privateFields[key] = v));
    privateSection.append(el('p', 'lp-muted', 'Hidden selections stay in Profile details. Private details below add information rather than copying those selections.'));
    for (const key of ['personality', 'textingStyle'] as Array<'personality' | 'textingStyle'>)
        privateSection.append(control(title(key), p.phoneProfile[key], v => p.phoneProfile[key] = v, 'textarea'));
    if (p.person) {
        const person = p.person;
        const dossier = el('details');
        dossier.append(el('summary', '', self ? 'Persona life, intimacy & voice · private' : 'NPC life, intimacy & voice · private editor'));
        for (const [group, values] of Object.entries({ life: person.life, intimacy: person.intimacy, presentation: person.presentation || {}, writingVoice: person.writingVoice || {} })) {
            const section = el('details');
            section.append(el('summary', '', title(group)));
            for (const key of Object.keys(values))
                section.append(control(group === 'intimacy' && ['kinks', 'role', 'boundaries', 'sexualInterests'].includes(key) ? 'Additional ' + title(key).toLowerCase() + ' details' : title(key), (values as Record<string, string>)[key], v => (values as Record<string, string>)[key] = v, 'textarea'));
            dossier.append(section);
        }
        const a = person.availability;
        if (!self) dossier.append(control('Daily routine', a.routine, v => a.routine = v, 'textarea'), control('App habits', a.appHabits, v => a.appHabits = v, 'textarea'), control('Typical reply minimum (seconds)', String(a.minReplySeconds), v => a.minReplySeconds = Number(v), 'number'), control('Typical reply maximum (seconds)', String(a.maxReplySeconds), v => a.maxReplySeconds = Number(v), 'number'));
        privateSection.append(dossier);
    }
    if (!self && p.photoPlan.length) {
        const plans = el('details');
        plans.append(el('summary', '', 'Individual photo descriptions'));
        p.photoPlan.forEach((plan, i) => {
            const row = el('div', 'lp-stack');
            row.append(el('h3', 'lp-title', `Photo ${i + 1}`), control('Caption', plan.caption, v => plan.caption = v), control('What the photo shows', plan.description, v => plan.description = v, 'textarea'), control(plan.visual ? 'Fallback prompt (editing switches to custom prompt)' : 'Image prompt', plan.prompt, v => { plan.prompt = v; plan.visual = undefined; }, 'textarea'));
            if (plan.visual) {
                const visual = plan.visual, fields = el('details');
                fields.append(el('summary', '', 'Structured generation plan'));
                for (const key of ['camera', 'interaction', 'spatial', 'environment', 'lighting'] as const)
                    fields.append(control(title(key), visual[key], v => visual[key] = v, 'textarea'));
                visual.subjects.forEach((subject, index) => {
                    const section = el('details');
                    section.append(el('summary', '', `Subject ${String.fromCharCode(65 + index)} · ${subject.id}`));
                    for (const key of ['position', 'clothing', 'expression', 'pose', 'action', 'gaze'] as const)
                        section.append(control(title(key), subject[key], v => subject[key] = v, 'textarea'));
                    fields.append(section);
                });
                row.append(fields);
            }
            plans.append(row);
        });
        card.append(plans);
    }
    card.append(privateSection);}
    card.append(el('p', 'lp-copy', 'Public fields are visible to matches. Private fields are in-character secrets; relevant facts can still be sent to your model/provider as private context. Comma-separate multiple values.'));
    const save = act(self ? 'Save profile' : 'Accept NPC', () => {if(self)h.ui.profileDiffPending=publicProfileDiff(datingFor(h.state,h.owner).self,p);h.action(self ? 'self' : h.ui.editingNpc ? 'edit' : 'accept', { profile: p, ...(self&&h.ui.selfBaseline!==undefined?{baseline:h.ui.selfBaseline}:{}) });}, true, 'check');
    save.disabled = h.ui.busy;
    const bar=el('div','lumistry-save-bar'),dirty=el('span','','Review your draft');dirty.setAttribute('role','status');
    const discard=act(self?'Discard character edits':'Discard draft',()=>{clearProfileEditor(h.ui);h.render();},false,'x');
    bar.append(dirty,save,discard);card.append(bar);
    const preview=el('aside','lumistry-editor-preview');preview.setAttribute('aria-label','Live dating card preview');
    const paint=()=>{dirty.textContent=profileEditorDirty(h.ui)?'Unsaved changes':'No unsaved edits';preview.replaceChildren(el('h2','lp-title','Preview dating card'),profileCard(h,p,false));};
    card.addEventListener('input',paint);card.addEventListener('change',paint);paint();
    const layout=el('div','lumistry-editor-layout');layout.append(card,preview);return layout;
}
function photoInventory(p: DatingProfile) {
    return [...p.photoPlan.map((plan, planIndex) => ({ plan, planIndex, photo: p.photos.find(x => x.planIndex === planIndex) })), ...p.photos.filter(x => x.planIndex === undefined || !p.photoPlan[x.planIndex]).map(photo => ({ plan: undefined, planIndex: undefined, photo }))];
}
function portrait(p: DatingProfile, photo?: DatingProfile['photos'][number], description = ''): HTMLElement {
    const frame = el('span', 'lumistry-portrait');
    let hash = 0;
    for (const char of p.alias) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    frame.style.setProperty('--portrait-hue', String(hash % 360));
    if (photo?.url) {
        const image = el('img');image.draggable=false; image.src = photo.url; image.alt = description || photo.caption || `${p.alias} profile photo`; image.loading = 'lazy';
        image.addEventListener('load',()=>frame.classList.add('lumistry-pixels-ready'));
        image.addEventListener('error', () => { image.remove(); frame.classList.add('lumistry-portrait-fallback'); });
        frame.append(image);
    } else frame.classList.add('lumistry-portrait-fallback');
    const fallback = el('span', 'lumistry-portrait-placeholder');
    const mascot = doodle('flask');
    mascot.classList.add('lumistry-mascot');
    fallback.append(bubbleField(), mascot, el('span', 'lumistry-photo-label', 'No photo yet'), el('span', 'lumistry-monogram', p.alias.slice(0, 1).toUpperCase()));
    frame.append(fallback);
    return frame;
}
function portraitIdentity(p: DatingProfile, compact = false): HTMLElement {
    const overlay = el(compact ? 'span' : 'div', 'lumistry-portrait-identity');
    const fields = publicDatingProfile(p).fields as Record<string, string>;
    overlay.append(el(compact ? 'strong' : 'h2', 'lumistry-portrait-name', `${p.alias}, ${p.age}`));
    if (fields.occupation) overlay.append(el(compact ? 'small' : 'p', '', fields.occupation));
    overlay.append(el(compact ? 'small' : 'p', 'lumistry-portrait-distance', datingLocationLabel(p)));
    return overlay;
}
function profileCard(h: DatingHost, p: DatingProfile, canManage = false): HTMLElement {
    const card = el('article', 'lp-card lumistry-profile');
    const inventory = photoInventory(p), body = el('div', 'lumistry-profile-body');
    const photoCopy = el('div', 'lumistry-photo-copy');
    let hero: HTMLElement;
    const showPhoto = (requested: number, focusLabel?: string) => {
        const index = Math.max(0, Math.min(requested, inventory.length - 1)), entry = inventory[index], photo = entry?.photo;
        h.ui.photoIndex[p.id] = index;
        const nextHero = portrait(p, photo, entry?.plan?.description);
        nextHero.classList.add('lumistry-hero');
        if (inventory.length > 1) {
            const pagination = el('div', 'lumistry-photo-pagination');
            pagination.setAttribute('aria-label', 'Profile photos');
            inventory.forEach((_, i) => {
                const dot = button('', 'lumistry-photo-segment'); dot.setAttribute('aria-label', `Photo ${i + 1} of ${inventory.length}`);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
                dot.addEventListener('click', () => showPhoto(i, `Photo ${i + 1} of ${inventory.length}`)); pagination.append(dot);
            });
            nextHero.append(pagination);
            for (const [label, offset, cls, ico] of [['Previous photo', -1, 'previous', 'chevronLeft'], ['Next photo', 1, 'next', 'chevronRight']] as const) {
                const arrow = act(label, () => showPhoto((index + offset + inventory.length) % inventory.length, label), false, ico);
                arrow.classList.add('lumistry-photo-arrow', 'lumistry-photo-' + cls);
                arrow.setAttribute('aria-label', label); nextHero.append(arrow);
            }
        }
        if(!photo?.url&&entry?.plan?.description){nextHero.classList.add('lumistry-described-photo');const description=el('div','lumistry-photo-description-card');description.tabIndex=0;description.setAttribute('aria-label','Saved photo description; image rendering is optional');description.append(el('strong','','Described photo'),el('p','lumistry-photo-description',entry.plan.description));nextHero.append(description);}
        nextHero.append(portraitIdentity(p));
        if (canManage) {
            const capture = act(photo ? 'Recreate this photo' : 'Create this photo', () => {
                const current = inventory[h.ui.photoIndex[p.id] || 0];
                h.action('photo', { profileId: p.id, ...(current?.planIndex !== undefined ? { planIndex: current.planIndex } : {}), ...(current?.photo ? { index: p.photos.indexOf(current.photo) } : {}) });
            }, false, 'doodle:camera');
            capture.classList.add('lumistry-photo-camera');
            capture.setAttribute('aria-label', photo ? 'Recreate this photo' : 'Create this photo');
            capture.title = photo ? 'Recreate the displayed photo' : 'Generate the displayed photo';
            capture.disabled = !h.images || h.ui.busy;
            nextHero.append(capture);
        }
        if (hero) hero.replaceWith(nextHero); else card.prepend(nextHero);
        hero = nextHero;
        if (focusLabel) [...hero.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === focusLabel)?.focus({ preventScroll: true });
        photoCopy.replaceChildren();
        if (entry?.plan?.caption || photo?.caption) photoCopy.append(el('p', 'lumistry-caption', entry?.plan?.caption || photo?.caption));

    };
    showPhoto(h.ui.photoIndex[p.id] || 0);
    if(h.ui.tab==='discover')card.dataset.first=datingFor(h.state,h.owner).tools?.presentation||'photo';
    body.append(photoCopy); card.append(body);
    if (p.pronouns) body.append(el('p', 'lp-copy', p.pronouns));
    const bio=p.bio?el('p','lumistry-bio',p.bio):undefined;
    const fields = (publicDatingProfile(p).fields || {}) as Record<string, string>, chips = el('div', 'lumistry-tags');
    const more = el('details', 'lumistry-profile-facts'); more.append(el('summary', '', 'More about them'));
    if(bio){if(h.ui.tab==='discover'&&p.bio.length>135){body.append(el('p','lumistry-bio lumistry-bio-preview',p.bio.slice(0,132).trimEnd()+'…'));more.append(bio);}else body.append(bio);}
    const front=h.ui.tab==='discover'?frontQuestion(p):undefined;
    const moreChips = el('div', 'lumistry-tags');
    for (const [k, v] of Object.entries(fields)) if (v) {
        const tag = el('span', 'lumistry-tag'); tag.append(el('strong', '', `${title(k)}: `), document.createTextNode(k === 'height' ? displayHeight(v, h.ui.heightUnit || datingFor(h.state, h.owner).heightUnit) : v));
        (['interests', 'intentions', 'monogamy'].includes(k)&&chips.childElementCount<2 ? chips : moreChips).append(tag);
    }
    if (chips.childElementCount) body.append(chips);
    for (const prompt of p.person?.prompts || []) {
        const answer = el('div', 'lumistry-profile-answer'); answer.append(el('h3', '', prompt.question), el('p', 'lumistry-bio', prompt.answer)); (h.ui.tab==='discover'&&prompt!==front?more:body).append(answer);
    }
    if (moreChips.childElementCount) more.append(moreChips);
    if (more.childElementCount > 1) body.append(more);
    if(canManage)body.append(profileEvidenceTools(h,datingFor(h.state,h.owner),p));
    if (canManage) {
        const tools = el('details', 'lumistry-profile-tools lumistry-context-menu');
        const menuLabel = el('summary', '', '⋯'); menuLabel.setAttribute('aria-label', 'Profile & photo options');
        tools.append(menuLabel);
        const actions = el('div', 'lumistry-actions');
        const generate = act('Generate photo', () => { h.ui.photoTarget = p.id; h.ui.photoBrief = ''; h.render(); }, false, 'camera');
        generate.disabled = !h.images || h.ui.busy;
        if (p.id !== 'self') {
            const develop = act(p.development?.error ? 'Retry background development' : 'Develop NPC profile', () => h.action('enrich', { profileId: p.id }), false, 'sparkle');
            develop.disabled = Boolean(h.ui.profileBusy) || !h.generation || (!!p.development && !datingFor(h.state, h.owner).pipeline.enrichment) || (!!p.development && !datingFor(h.state, h.owner).decisions.some(x => x.profileId === p.id && (x.status === 'matched' || x.exchanged)) && !h.state.contacts.find(c => c.id === p.contactId)?.presence.lastSceneAt);
            if (p.development) {
                const decision = datingFor(h.state, h.owner).decisions.find(x => x.profileId === p.id);
                const canPortray = decision?.exchanged || h.state.contacts.find(c => c.id === p.contactId)?.presence.lastSceneAt;
                if (!p.development.error && (canPortray ? p.development.portrayal : p.development.match)) { develop.textContent = 'Background developed'; develop.disabled = true; }
                develop.title = p.development.error || 'Background develops after a mutual match; further portrayal follows contact exchange or an established meeting.';
            }
            if(datingFor(h.state,h.owner).generationSettings.experience?.voiceLab){const lab=act('Practice talking · model request, not canon',()=>h.action('voice_lab',{profileId:p.id}),false,'sparkle');lab.disabled=h.ui.busy||!h.generation||!p.development||!datingFor(h.state,h.owner).decisions.some(x=>x.profileId===p.id&&x.status==='matched');actions.append(lab);}
            if(!datingFor(h.state,h.owner).decisions.some(x=>x.profileId===p.id&&x.status==='matched')){
                const force=act('Force match',()=>h.action('force_match',{profileId:p.id}),false,'doodle:heart');force.disabled=!!h.ui.busy||!datingFor(h.state,h.owner).self;actions.append(force);
            }
            actions.append(develop, act('Edit profile', () => { h.ui.draft = structuredClone(p); h.ui.editingNpc = true; h.render(); }, false, 'edit'));
            if (!datingFor(h.state, h.owner).decisions.some(x => x.profileId === p.id && x.conversationId))
                actions.append(act('Remove profile', () => h.action('remove', { profileId: p.id }), false, 'trash', true,'remove'));
        }
        const rewriting=el('details','lp-stack');rewriting.append(el('summary','','Rewrite one public item'));
        const item=el('select','lp-select');item.setAttribute('aria-label','Public item to rewrite');
        const addItem=(value:string,label:string)=>{const option=el('option','',label);option.value=value;item.append(option);};
        addItem('bio','Bio');p.person?.prompts.forEach((_q,i)=>addItem(`answer:${i}`,`Answer ${i+1}`));p.photoPlan.forEach((_plan,i)=>addItem(`caption:${i}`,`Caption ${i+1}`));
        const rewrite=act('Create rewrite draft',()=>{const [target,index]=item.value.split(':');h.action('rewrite_item',{profileId:p.id,target,...(index!==undefined?{index:Number(index)}:{})});},false,'sparkle');rewrite.disabled=!h.generation||!!h.ui.profileBusy;rewriting.append(item,rewrite);actions.append(rewriting);
        actions.append(generate, act('Choose from Gallery', () => h.gallery(p.id), false, 'image'));
        const currentPhoto = () => inventory[h.ui.photoIndex[p.id] || 0]?.photo;
        if (p.photos.length) {
            const reroll = act('Reroll this photo', () => { const photo = currentPhoto(); if (photo) h.action('photo', { profileId: p.id, index: p.photos.indexOf(photo) }); }, false, 'refresh');
            const remove = act('Remove this photo', () => { const photo = currentPhoto(); if (photo) h.action('photo_remove', { profileId: p.id, index: p.photos.indexOf(photo) }); }, false, 'trash', true);
            tools.addEventListener('toggle', () => { reroll.disabled = remove.disabled = !currentPhoto() || h.ui.busy; });
            actions.append(reroll, remove);
        }
        tools.append(actions);
        if(p.authoring){const inspector=el('details','lp-stack');inspector.append(el('summary','','Private authoring inspector'),el('p','lp-copy','Editor-only source material. This does not establish what your roleplay character or friends know.'));
            for(const [label,record] of [['Original dossier',p.authoring.dossier],['Extracted index',p.authoring.index],['Public authoring',p.authoring.public]] as const)if(record){const section=el('details');section.append(el('summary','',label),el('pre','lumistry-authoring-source',record.text));inspector.append(section);}
            for(const [i,record] of p.authoring.photos.entries()){const section=el('details');section.append(el('summary','',`Original photo authoring ${i+1}`),el('pre','lumistry-authoring-source',record.text));inspector.append(section);}
            const provenance=el('details');provenance.append(el('summary','','Extracted fact provenance'),el('pre','lumistry-authoring-source',JSON.stringify(p.authoring.provenance,null,2)));inspector.append(provenance);
            if(p.development?.voiceLab){const section=el('details');section.append(el('summary','','Diagnostic voice rehearsal — not an event'),el('pre','lumistry-authoring-source',p.development.voiceLab.text));inspector.append(section);}
            tools.append(inspector);
        }

        if (p.photoPlan.length) {
            const plans = el('details');
            plans.append(el('summary', '', 'Planned photos'));
            p.photoPlan.forEach((plan, planIndex) => {
                const row = el('div', 'lp-stack'), existing = p.photos.findIndex(x => x.planIndex === planIndex);
                row.append(el('p', 'lp-copy', `${planIndex + 1}. ${plan.caption || title(plan.kind)}`));
                const generate = act(existing >= 0 ? 'Reroll this planned photo' : 'Create this photo', () => h.action('photo', { profileId: p.id, planIndex, ...(existing >= 0 ? { index: existing } : {}) }), false, existing >= 0 ? 'refresh' : 'camera');
                generate.disabled = !h.images || h.ui.busy;
                row.append(el('p', 'lumistry-bio', plan.description), generate);
                plans.append(row);
            });
            tools.append(plans);
        }
        if (p.id !== 'self') {
            const encounter = el('details', 'lumistry-encounter');
            const canEncounter=nearbyEncounterPossible(p,datingFor(h.state,h.owner)),encounterButton=act(p.encounterAvailable?'Available for a possible encounter':'Make available for a nearby encounter',()=>h.action('encounter',{profileId:p.id}),false,p.encounterAvailable?'check':undefined);encounterButton.disabled=!canEncounter;
            encounter.append(el('summary','','Possible roleplay encounter'),el('p','lp-copy',canEncounter?'Make this person available for a possible nearby encounter. This does not establish a meeting or phone access.':'This location does not support a nearby encounter. Review the distance and setting first; Anywhere does not establish proximity.'),encounterButton);
            tools.append(encounter);
        }
        card.prepend(tools);
    }
    for (const [name, position] of [['star', 'tl'], ['bubbles', 'tr']]) {
        const sticker = doodle(name);
        sticker.classList.add('lumistry-sticker', 'lumistry-sticker-' + position);
        card.append(sticker);
    }
    return card;
}
function connectionActions(h: DatingHost, p: DatingProfile, x: DatingDecision): HTMLElement {
    const card = el('div', 'lumistry-connection-actions lp-stack');
    if (x.status === 'matched' && x.conversationId) {
        card.append(act('Open dating chat', () => h.openConversation(x.conversationId!), true, 'chat'));
        if(h.planDate)card.append(act('Plan a date',()=>h.planDate!(x.conversationId!)));
        card.append(renderAgreedDateSummaries(h.state,h.owner,x.conversationId,id=>h.openTimeline?.(id)));
        if (p.privateFields.photoOpener && !h.state.conversations.find(c => c.id === x.conversationId)?.messages.length) {
            const opener = act('Create incoming photo', () => h.action('photo', { profileId: p.id, incoming: true }), false, 'camera');
            opener.disabled = h.ui.busy || !h.images;
            card.append(opener);
        }
        const exchange = el('details');
        exchange.append(el('summary', '', x.exchanged ? 'Contact details exchanged' : 'Exchange contact details'));
        let agreed = Boolean(x.exchanged);
        const label = el('label', 'lp-row'), check = el('input');
        check.type = 'checkbox';
        check.checked = agreed;
        check.addEventListener('change', () => { agreed = check.checked; ordinary.disabled = !agreed || h.ui.busy; });
        label.append(check, el('span', 'lp-copy', 'Both characters have agreed to exchange contact details.'));
        const ordinary = act('Open ordinary Messages', () => {
            if (agreed)
                h.action('exchange', { profileId: p.id, confirmed: true });
        }, false, 'chat');
        ordinary.disabled = !agreed || h.ui.busy;
        exchange.append(label, ordinary);
        card.append(exchange, act('Unmatch', () => h.action('unmatch', { profileId: p.id }), false, 'x', true,'unmatch'));
    }
    if (x.status === 'unmatched' && x.conversationId)
        card.append(act('Read archived chat', () => h.openConversation(x.conversationId!), false, 'chat'));
    if (x.status === 'evaluating')
        card.append(act('Recover interrupted evaluation', () => h.action('recover'), false, 'refresh'));
    if (x.status === 'error')
        card.append(act('Remove failed like', () => h.action('clear_error', { profileId: p.id }), false, 'trash', true,'remove'));
    return card;
}
function connectionStatus(x: DatingDecision): string {
    return x.status === 'error' ? 'Needs attention' : x.status === 'evaluating' ? 'Checking interest' : x.status === 'pending' ? 'Pending' : x.status === 'matched' ? 'Matched' : title(x.status);
}
function matchTile(h: DatingHost, p: DatingProfile, x: DatingDecision): HTMLElement {
    const tile = button('', 'lumistry-match-card'); tile.setAttribute('aria-label', `${p.alias}, ${p.age} · ${connectionStatus(x)} · View profile`);
    const photo = p.photos.find(photo => photo.url), plan = photo ? (photo.planIndex !== undefined ? p.photoPlan[photo.planIndex] : undefined) : p.photoPlan[0];
    const frame = portrait(p, photo, plan?.description); frame.append(portraitIdentity(p, true), el('span', 'lumistry-match-status', connectionStatus(x))); tile.append(frame);
    tile.addEventListener('click', () => { h.ui.selectedProfileId = p.id; h.render(); });
    return tile;
}
function inboxRow(h: DatingHost, p: DatingProfile, x: DatingDecision, cachedConversation?: import('../../types.js').PocketConversation): HTMLButtonElement | null {
    const c = cachedConversation || h.state.conversations.find(c => c.id === x.conversationId);
    if (!c||c.channel!=='dating'||c.datingOwnerId!==h.owner||c.archived) return null;
    const row = button('', 'lumistry-inbox-row');
    const avatar = el('span', 'lp-avatar', p.alias.slice(0, 1).toUpperCase()), photo = p.photos.find(photo => photo.url);
    if (photo) { const image = el('img'); image.src = photo.url; image.alt = ''; image.loading = 'lazy'; image.addEventListener('error', () => image.remove()); avatar.append(image); }
    const copy = el('span', 'lumistry-inbox-copy'), top = el('span', 'lumistry-inbox-top');
    const latest = c.messages.filter(m => m.sender !== 'system').at(-1);
    top.append(el('strong', '', p.alias));
    if (latest) { const time = el('time', '', formatTime(latest.createdAt)); time.dateTime = latest.createdAt; top.append(time); }
    const preview = latest ? `${latest.sender === 'persona' ? 'You: ' : ''}${latest.text || (latest.datingPhoto || latest.imageId ? 'Photo' : 'Message')}` : 'You matched. Say hello.';
    copy.append(top, el('span', 'lumistry-inbox-preview', preview)); row.append(avatar, copy);
    const unread = conversationUnreadForDevice(h.state, c, h.owner);
    row.dataset.datingConversation=c.id;row.dataset.unreadCount=String(unread);
    if (unread) { row.classList.add('has-unread'); row.append(el('span', 'lp-unread', String(unread))); }
    row.setAttribute('aria-label', `${p.alias}${unread ? `, ${unread} unread` : ''}: ${preview}`);
    row.addEventListener('click', () => h.openConversation(c.id)); return row;
}
function sectionHeading(titleText: string, subtitle: string): HTMLElement {
    const heading = el('div', 'lumistry-section-heading'); heading.append(el('h1', '', titleText), el('p', 'lp-copy', subtitle)); return heading;
}

function savedProfileControls(h:DatingHost):HTMLElement {
 const box=el('details','lp-card lp-stack lumistry-saved-profiles');box.dataset.lumistryDetail='saved-profiles';
 box.append(el('summary','','Saved dating profiles'),el('p','lp-copy','Keep private reusable copies for your other chats. Load a copy to review it, then Save profile to apply. Matches and conversations stay in their original chat.'));
 const refresh=act(h.ui.savedProfiles?'Refresh saved copies':'Browse saved copies',()=>h.action('saved_profile_list'));refresh.disabled=h.ui.busy;box.append(refresh);
 const entries=h.ui.savedProfiles;
 if(entries){
  const select=el('select','lp-select');select.setAttribute('aria-label','Saved dating profile');const empty=el('option','','Choose a saved copy');empty.value='';select.append(empty);
  for(const entry of entries){const option=el('option','',entry.name+(entry.personaName?' · '+entry.personaName:''));option.value=entry.id;select.append(option);}
  select.value=h.ui.savedProfileId||'';select.disabled=h.ui.busy;select.addEventListener('change',()=>{h.ui.savedProfileId=select.value;h.ui.savedProfileDeleteId=undefined;h.render();});box.append(select);
  if(!entries.length)box.append(el('p','lp-copy','No reusable copies saved yet.'));
  const entry=entries.find(e=>e.id===h.ui.savedProfileId);
  if(entry){
   box.append(el('p','lp-copy','Saved '+entry.updatedAt+' · Loading replaces your current unsaved editor. Your active profile stays unchanged until you save.'));
   const load=act('Load for review',()=>h.action('saved_profile_load',{profileId:entry.id,revision:entry.revision}),true);load.disabled=h.ui.busy||!!h.ui.profileBusy;box.append(load);
   const remove=act('Delete saved copy',()=>{h.ui.savedProfileDeleteId=entry.id;h.render();},false,undefined,true);remove.disabled=h.ui.busy;box.append(remove);
   if(h.ui.savedProfileDeleteId===entry.id){const confirm=act('Confirm delete saved copy',()=>h.action('saved_profile_delete',{profileId:entry.id,revision:entry.revision}),false,undefined,true);confirm.disabled=h.ui.busy;box.append(el('p','lp-copy','Deletes only this reusable copy. Your active profile and chats stay saved.'),confirm,act('Keep saved copy',()=>{h.ui.savedProfileDeleteId=undefined;h.render();}));}
  }
 }
 const active=datingFor(h.state,h.owner).self,current=h.ui.selfEditing||!active?h.ui.editor:active;
 if(current){
  box.append(control('Saved copy name',h.ui.savedProfileName??current.alias,v=>h.ui.savedProfileName=v));
  const payload=()=>({name:h.ui.savedProfileName??current.alias,profile:current});
  const save=act('Save as new copy',()=>h.action('saved_profile_save',payload()));save.disabled=h.ui.busy||!!h.ui.profileBusy;box.append(save);
  const entry=entries?.find(e=>e.id===h.ui.savedProfileId);
  if(entry){const update=act('Update selected copy',()=>h.action('saved_profile_save',{...payload(),profileId:entry.id,revision:entry.revision}));update.disabled=save.disabled;box.append(update);}
  box.append(el('p','lp-copy','Saving a reusable copy does not change the active profile or generate anything. Appearance, answers, privacy choices and gallery references are included.'));
 }
 return box;
}

export function renderLumistry(h:DatingHost):HTMLDivElement {
    const start=performanceNow();try{return polishLumistry(renderLumistryContent(h),h);}finally{frontendPerformance.record('ui','lumistry.'+(h.ui.tab==='settings'?(h.ui.settingsPage||'home'):h.ui.tab),performanceNow()-start);}
}
function renderLumistryContent(h: DatingHost): HTMLDivElement {
    const page = el('div', 'lp-page lumistry');
    page.dataset.pocketApp = 'dating';
    page.dataset.lumistryScope = `${h.state.chatId}:${h.state.characterId}:${h.owner}`;
    page.dataset.lumistryView = h.ui.tab==='self'&&h.ui.selfPage ? 'self:'+h.ui.selfPage : h.ui.photoTarget ? `photo:${h.ui.photoTarget}` : h.ui.draft ? `draft:${h.ui.draft.id}` : h.ui.selfEditing ? 'self:edit' : h.ui.selectedProfileId ? `profile:${h.ui.selectedProfileId}` : h.ui.tab;
    if(h.ui.tab==='settings')page.dataset.lumistryView='settings:'+(h.ui.settingsPage||'home')+(h.ui.settingsPage==='setup'?':'+(h.ui.setup?.step||0):'');
    page.dataset.lumistryTheme = datingFor(h.state).theme;
    const nav = el('div', 'lp-nav');
    const brand = el('span', 'lumistry-brand');
    brand.setAttribute('aria-hidden', 'true');
    brand.append(icon('brand'));
    nav.append(act('Back', h.back, false, 'chevronLeft'), el('span', 'lp-nav-title', 'Lumistry'), brand);
    page.append(nav);
    if (h.owner !== h.state.pocketPersonaActorId) {
        const entries = Object.entries(h.state.lumistry || {}).filter(([owner, d]) => owner === h.owner || d.profiles.some(p => p.contactId === h.owner));
        const content = el('div', 'lp-content');
        content.append(el('p', 'lp-copy', 'This is an NPC\u2019s phone, so you can only look. Eligible Bank NPCs may explore dating only when you enable their participation. A match is not a date or a relationship.'));
        for (const [owner, d] of entries) {
            if (owner === h.owner && d.self)
                content.append(profileCard(h, d.self));
            for (const x of d.decisions) {
                const p = d.profiles.find(p => p.id === x.profileId);
                if (!p || (owner !== h.owner && p.contactId !== h.owner))
                    continue;
                const card = el('article', 'lp-card lp-stack');
                card.append(el('h2', 'lp-title', owner === h.owner ? p.alias : d.self?.alias || 'Match'), el('p', 'lp-copy', title(x.status)));
                if (x.connectionIntent)
                    card.append(el('p', 'lp-copy', `Exploring: ${x.connectionIntent}`));
                if (x.conversationId)
                    card.append(act(x.status === 'unmatched' ? 'Read archived chat' : 'Read dating chat', () => h.openConversation(x.conversationId!), false, 'chat'));
                content.append(card);
            }
        }
        if (!entries.length)
            content.append(empty('flask', 'No dating activity has been established for this NPC.'));
        page.append(content);
        return page;
    }
    const tabs = el('nav', 'lumistry-tabs');
    tabs.setAttribute('aria-label', 'Lumistry tabs');
    for (const [key, label, ico] of [['discover', 'Discover', 'flask'], ['matches', 'Matches', 'molecule'], ['inbox', 'Inbox', 'testChat'], ['self', 'Me', 'beakerPerson']]) {
        const b = act(label, () => {
            if(profileEditorDirty(h.ui)){h.ui.editorLeave=()=>{clearProfileEditor(h.ui);h.ui.tab=key;h.render();};h.render();return;}
            if(h.ui.preferenceDraft&&preferenceDraftDirty(h.ui.preferenceDraft)){h.ui.preferenceLeave=()=>{h.ui.preferenceDraft=undefined;h.ui.selfPage=undefined;h.ui.tab=key;h.render();};h.render();return;}
            h.ui.selfPage=undefined;h.ui.preferenceDraft=undefined;
            if(!leaveFilters(h.ui,()=>{h.ui.tab=key;})){h.render();return;}
            h.ui.selfEditing = false;
            h.ui.draft = undefined;
            h.ui.photoTarget = undefined;
            h.ui.panelHistory = [];
            h.ui.selectedProfileId = undefined;
            h.render();
        }, false, ico);
        b.setAttribute('aria-current', h.ui.tab === key ? 'page' : 'false');
        tabs.append(b);
    }
    page.append(tabs);
    const content = el('div', 'lp-content');
    const d = datingFor(h.state, h.owner);
    if(h.matchNotices?.length){const notices=h.matchNotices,notice=el('section','lumistry-match-notice');const key=JSON.stringify(notices.map(n=>[n.profileId,n.conversationId,n.forced])),fresh=h.ui.matchNoticeKey!==key;h.ui.matchNoticeKey=key;notice.dataset.new=String(fresh);notice.setAttribute('role',fresh?'status':'region');notice.setAttribute('aria-label','New matches');notice.setAttribute('aria-live',fresh?'polite':'off');notice.append(el('strong','',notices.length>1?`${notices.length} new matches`:notices[0].forced?'Match created':'You liked each other.'));for(const n of notices){const person=d.profiles.find(p=>p.id===n.profileId);notice.append(act(`Say hello${notices.length>1?' to '+(person?.alias||'your match'):''}`,()=>{h.dismissMatchNotices?.();h.openConversation(n.conversationId);}));}notice.append(act('Dismiss',()=>{h.dismissMatchNotices?.();h.render();}));content.append(notice);}

    page.append(content);
    const preferenceScope=JSON.stringify([h.state.chatId,h.state.characterId,h.owner]);
    if(h.ui.preferenceDraft&&h.ui.preferenceDraft.scope!==preferenceScope){h.ui.preferenceDraft=undefined;h.ui.preferenceLeave=undefined;h.ui.selfPage=undefined;}
    if(h.ui.editorLeave){const warning=el('section','lp-card lp-stack');warning.setAttribute('role','alertdialog');warning.setAttribute('aria-label','Unsaved profile changes');warning.append(el('h2','lp-title','Unsaved changes'),el('p','lp-copy','Keep editing or discard this draft. Your saved profile has not changed.'),act('Keep editing',()=>{h.ui.editorLeave=undefined;h.render();}),act('Discard changes and leave',()=>{const go=h.ui.editorLeave;clearProfileEditor(h.ui);go?.();h.render();},false,undefined,true));content.append(warning);return page;}
    if(h.ui.preferenceLeave){const warning=el('div','lp-card lp-stack');warning.dataset.draftWarning='true';warning.setAttribute('role','alertdialog');warning.setAttribute('aria-label','Unsaved preferences');warning.append(el('h2','lp-title','Unsaved preferences'),el('p','lp-copy','Keep editing or discard this draft before leaving. Saved preferences have not changed.'),act('Keep editing',()=>{h.ui.preferenceLeave=undefined;h.render();}),act('Discard changes and leave',()=>{const go=h.ui.preferenceLeave;h.ui.preferenceLeave=undefined;go?.();h.render();},false,undefined,true));content.append(warning);return page;}
    const settingsTools=h.ui.tab==='settings'?el('details','lp-card lumistry-settings-section'):undefined;
    const diagnostics=el('div','lp-stack');
    if(settingsTools)settingsTools.append(el('summary','','Troubleshooting & archives'),diagnostics,qualityTools(d));
    const exportDiagnostics=act('Export all Lumistry diagnostics',()=>h.action('export_diagnostics',{frontendPerformance:frontendPerformance.snapshot('ui')}),!!h.ui.busy,'download');

    diagnostics.append(el('p','lp-copy','One private file with settings, measurements, failures and all retained repair evidence.'));
    diagnostics.append(act('Preview redacted support export',()=>h.action('export_diagnostics',{redacted:true}),false,'eye'));
    if(h.ui.supportExport){const preview=el('details','lp-card');preview.open=true;preview.append(el('summary','','Redacted support file'),el('p','lp-copy','Technical counts only. Review before sharing; this is not guaranteed anonymous.'));const text=JSON.stringify(h.ui.supportExport,null,2),body=el('pre','',text);body.style.maxHeight='240px';body.style.overflow='auto';preview.append(body,act('Download support file',()=>{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumistry-support.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}),act('Dismiss preview',()=>{h.ui.supportExport=undefined;h.render();}));content.append(preview);}

    if (h.ui.tab === 'filters') {
        content.append(renderSimpleFilters(h,d,{ageRange,choices,height:(value,change)=>heightControl(h,value,change,true)}));
        const extras=el('details');extras.append(el('summary','','Your private interests · separate from filters'),act('My interests',()=>{h.ui.tab='self';h.ui.selfPage='interests';h.render();}),act('World and advanced settings',()=>openPanel(h,'settings')));content.append(extras);
        return page;
    }
    if (h.ui.tab === 'self' && (!d.self || h.ui.selfEditing)) page.dataset.lumistryView = 'self:edit';
    if (d.discoveryJob && d.discoveryJob.status !== 'complete' && !h.ui.profileBusy) {
        const progress=el('div','lp-copy');const parked=d.discoveryJob.slots.filter(slot=>slot.status==='failed').length;progress.textContent=parked?`${parked} saved draft${parked===1?'':'s'} need attention. Your ready profiles remain available; open saved authoring for details.`:d.discoveryJob.lastError||'Saved discovery progress is available. Find more continues the remaining candidates.';diagnostics.append(progress);
    }
    if(h.ui.tab==='settings'&&h.ui.settingsPage==='technical'){
    const periodUsage=subtractUsage(d.discoveryAccounting,d.measurementBaseline?.accounting),periodTelemetry=measurementTelemetry(d.creationTelemetry||emptyCreationTelemetry(),d.measurementBaseline);
    if(periodUsage.calls)diagnostics.append(el('p','lp-copy',`Discovery accounting: ${periodUsage.calls} calls in this measurement period; ${periodUsage.input.toLocaleString()} input + ${periodUsage.output.toLocaleString()} output tokens across ${periodUsage.reported} fully reported calls. Missing usage excluded.`));
    {
        const t=creationSummary(periodTelemetry),panel=el('details','lumistry-progress');panel.append(el('summary','','Creation measurements'),el('p','lp-copy',`${t.published} published · ${t.unfinished} unfinished · ${t.abandoned} abandoned candidates. ${t.usage.calls} calls; ${t.usage.reported}/${t.usage.calls} fully measured. ${t.usage.input.toLocaleString()} input + ${t.usage.output.toLocaleString()} output reported tokens, including ${t.usage.reasoning.toLocaleString()} reasoning tokens. Missing usage is excluded.`),el('p','lp-copy',`${t.photoRecords} accepted photo records across ${t.photoCalls} photo calls; ${t.interrupted} interrupted requests. First-pass checkpoints ${t.firstPassAccepted}/${t.firstPass}; repairs ${t.repairsAccepted}/${t.repairs}, spending ${t.repairUsage.input.toLocaleString()} input + ${t.repairUsage.output.toLocaleString()} output reported tokens. Cached-input coverage ${t.cachedReported}/${t.usage.calls}, ${t.cachedInput.toLocaleString()} reported cached input tokens.${t.callsPerPublished===undefined?'':` ${t.callsPerPublished.toFixed(2)} calls per published candidate, including its repairs.${t.tokensPerPublished===undefined?'':' '+Math.round(t.tokensPerPublished).toLocaleString()+' reported tokens per published candidate.'}`} Overall totals also retain unfinished and abandoned work; monetary cost is unknown.`));panel.append(el('p','lp-copy',`Error status recorded for ${t.validationReported}/${t.usage.calls} requests: ${t.validResponses} without errors, ${t.invalidResponses} with errors. Request-size sections recorded for ${t.sectionReported}/${t.usage.calls}; source bytes are not provider tokens.`));panel.append(act('Export creation measurements',()=>{const payload={version:1,exportedAt:new Date().toISOString(),settings:d.generationSettings.creation,configuration:h.creationConfiguration,publishedPlans:d.profiles.flatMap(p=>p.creationPlan?[{planId:p.creationPlan.id,contract:p.creationPlan.creationContract,work:{roleId:p.creationPlan.work.roleId,family:p.creationPlan.work.family,domain:p.creationPlan.work.domain},species:p.creationPlan.species?{id:p.creationPlan.species.id,family:p.creationPlan.species.family}:undefined,speciesPolicy:p.creationPlan.speciesPolicyVersion,speciesCatalog:p.creationPlan.speciesCatalogVersion,creativeSpecies:p.creationPlan.creativeSpecies?.status,appearance:p.creationPlan.appearance,aesthetic:p.creationPlan.aesthetic,experience:p.creationPlan.experience,photoCount:p.creationPlan.photoCount,questionCount:p.creationPlan.questionCount}]:[]),lifetime:d.discoveryAccounting,measurementStartedAt:d.measurementBaseline?.startedAt,cumulative:periodTelemetry,jobs:[d.discoveryJob,d.draftJob].filter(Boolean).map(j=>({id:j!.id,contract:j!.creationContract,scheduling:j!.scheduling,invocation:j!.invocation,spent:j!.spent,metrics:j!.metrics,plans:j!.slots.map(s=>({slot:s.id,planId:s.plan?.id,policy:s.plan?.policyVersion,catalog:s.plan?.catalogVersion,species:s.plan?.species?{id:s.plan.species.id,family:s.plan.species.family}:undefined,speciesPolicy:s.plan?.speciesPolicyVersion,speciesCatalog:s.plan?.speciesCatalogVersion,creativeSpecies:s.plan?.creativeSpecies?.status,appearance:s.plan?.appearance,aesthetic:s.plan?.aesthetic,status:s.status}))})),limits:'Reported token usage only; reasoning is included in output. Unknown monetary cost. Prompt documents provide current source instructions, not exact historical provider requests.'};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumistry-creation-measurements.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},false,'download'));const archiveButton=act('Archive and clear measurements',()=>h.action('archive_measurements'),false,'archive',true,'archive_measurements');archiveButton.disabled=!!(h.ui.profileBusy||h.ui.busy);panel.append(archiveButton,el('p','lp-copy',`Archives this period and clears visible counters and recent diagnostics. Profiles, drafts, lifetime accounting and spending limits stay saved.${d.measurementBaseline?' Current period started '+d.measurementBaseline.startedAt+'.':''} Candidates carried over from an earlier period do not receive a full-profile cost average.`));
        const saved=el('details');saved.append(el('summary','','Archived measurement periods'));
        for(const archive of d.measurementArchives||[])saved.append(act(`${archive.createdAt} · ${archive.calls} calls · ${(archive.input+archive.output).toLocaleString()} reported tokens`,()=>h.action('archive_read',{archiveId:archive.id}),false,'eye'));
        if(!d.measurementArchives?.length)saved.append(el('p','lp-copy','No archived periods yet.'));panel.append(saved);
        if((h.ui.authoringArchive as any)?.kind==='measurements')panel.append(el('pre','lumistry-authoring-source',JSON.stringify(h.ui.authoringArchive,null,2)),act('Download archived measurements',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(h.ui.authoringArchive,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='lumistry-archived-measurements.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},false,'download'),act('Close archive',()=>{h.ui.authoringArchive=undefined;h.render()},false,'x'));
        diagnostics.append(panel);
    }
    }
    const authoringJobs=[['Discovery',d.discoveryJob],['Manual draft',d.draftJob]] as const;
    if(h.ui.tab==='discover')for(const [label,job] of authoringJobs)for(const slot of job?.slots||[]){const proposal=slot.progress?.draft.speciesProposal;
        if(slot.plan?.creativeSpecies?.status!=='reserved'||!proposal)continue;
        const review=el('section','lumistry-progress lp-stack');review.append(el('strong','','Review provisional species · '+proposal.name),el('p','lp-copy','Accept for this character only. It does not establish a new world population. Review the anatomy and setting fit before continuing.'));
        for(const key of ['bodyPlan','limbs','surface','face','currentForm','compatibility','minAdultAge','requires'])review.append(el('p','lp-copy',key+': '+(Array.isArray(proposal[key])?proposal[key].join(', '):String(proposal[key]))));
        const payload={slotId:slot.id,jobId:job!.id,planRevision:slot.plan.revision,manual:label==='Manual draft',proposalSnapshot:JSON.stringify(proposal)};
        review.append(act('Accept species for this character',()=>h.action('species_accept',payload),h.ui.profileBusy,'check'),act('Reject provisional species',()=>h.action('species_reject',payload),h.ui.profileBusy,'x'));content.append(review);
    }
    if(h.ui.tab==='discover'&&!h.ui.profileBusy&&!h.ui.profileError&&d.discoveryJob?.lastError&&['partial','paused'].includes(d.discoveryJob.status)){
        const attention=el('section','lumistry-progress');attention.setAttribute('role','alert');attention.append(el('strong','','Saved discovery work needs attention'),el('p','lp-copy',d.discoveryJob.lastError),act('Review saved work',()=>openPanel(h,'settings','technical')));content.append(attention);
    }
    if(h.ui.tab==='settings'&&h.ui.settingsPage==='technical'&&authoringJobs.some(([,job])=>job?.slots.some(s=>s.progress||s.quarantinedProgress))){
        const inspect=el('details','lumistry-progress');inspect.append(el('summary','','Private unfinished authoring'),el('p','lp-copy','Editor-only evidence; unfinished people are not public profiles or contacts.'));
        for(const [label,job] of authoringJobs){
            for(const slot of job?.slots.filter(s=>s.progress||s.quarantinedProgress)||[]){
                const section=el('details');
                section.append(el('summary','',`${label} · ${slot.id} · ${slot.progress?.task||'storage review'}`),el('pre','lumistry-authoring-source',slot.progress?.authored.dossier?.text||slot.quarantineReason||'Saved plan; no character text produced yet.'));
                if(slot.status==='failed')section.append(el('p','lp-copy',slot.quarantineReason||slot.progress?.problems.slice(0,2).join('; ')||(slot.progress?.lastAttempt?.outcome==='provider-failed'&&slot.progress.lastAttempt.issues?.some(i=>i.code==='timeout')?'The provider timed out before returning an accepted unit. Check authoring reasoning/output settings, then use Retry this draft and Find more. Saved identity and accepted work are kept.':'Provider request paused. Check authoring connection settings, then retry this draft.')));
                for(const issue of slot.progress?.issues||[])section.append(el('p','lp-copy',`${issue.recordId||issue.labels.join(', ')||'Draft'} · ${issue.code}: ${issue.message}`));
                section.append(act('Export private repair evidence',()=>{
                    const payload={schema:'lumistry-replay-1',categoryOptions:Object.fromEntries(d.worldFields.map(w=>[w.key,w.options])),exportedAt:new Date().toISOString(),contract:job!.creationContract,jobId:job!.id,slotId:slot.id,plan:slot.plan,counts:{questions:slot.questionCount,photos:slot.photoCount},attempts:slot.unitAttempts,spent:job!.spent,progress:slot.progress,quarantine:slot.quarantinedProgress};
                    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lumistry-private-repair-'+slot.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);
                },false,'download'));
                section.append(el('p','lp-copy','Private evidence includes this draft’s authoring and Lumistry request data, before native provider adaptation.'));
                if(slot.status==='failed'&&!slot.quarantinedProgress&&slot.plan?.creativeSpecies?.status!=='rejected'&&!slot.progress?.draft.speciesProposal)section.append(act('Retry this draft',()=>h.action('retry_slot',{slotId:slot.id,manual:label==='Manual draft'}),h.ui.profileBusy,'refresh'));
                inspect.append(section);
            }
            if(job?.slots.some(s=>s.progress)&&!h.ui.profileBusy)inspect.append(act(label==='Discovery'?'Discard unfinished discovery':'Discard unfinished manual draft',()=>h.action(label==='Discovery'?'discard_discovery':'discard_manual'),false,'trash',true));
        }
        inspect.append(el('p','lp-copy','Discarding clears the selected job and its usage summary. Published profiles and native generation history stay saved.'));
        diagnostics.append(inspect);
    }
    for(const [jobLabel,job] of authoringJobs) if(h.ui.tab==='settings'&&h.ui.settingsPage==='technical'&&job?.metrics.length){
        const usage = discoveryUsageSummary(job), detail = el('details', 'lumistry-progress');
        detail.append(el('summary', '', `${jobLabel} usage`), el('p','lp-copy',`Backend authoring revision: ${job.authoringRevision}`), el('p', 'lp-copy', `${jobLabel==='Manual draft'?(job.reviewDraft?'1 draft ready':'0 drafts ready'):(d.measurementBaseline?job.metrics.reduce((n,m)=>n+m.accepted,0):usage.published)+' profiles saved'} · ${usage.attempts} retained requests · ${usage.rejected} responses needing correction`));
        detail.append(el('p', 'lp-copy', usage.reportedAttempts ? `${usage.promptTokens.toLocaleString()} input + ${usage.completionTokens.toLocaleString()} output tokens reported for ${usage.reportedAttempts} of ${usage.attempts} requests. Missing usage and unmetered aborts are excluded; this is not a billing total.` : 'Token usage unavailable from the provider for these requests. Text sizes and output limits are not token charges.'));
        if(job.invocation){const i=job.invocation,elapsed=(at:string)=>Math.max(0,(Date.parse(at)-Date.parse(i.startedAt))/1000).toFixed(1);detail.append(el('p','lp-copy',`Invocation target ${job.scheduling?.readyTarget||5}; batch cap ${job.scheduling?.photoBatchCap||5}; workers ${job.scheduling?.workers||1}. Started with ${i.startingReady} ready.${i.firstPublishedAt?' First new profile: '+elapsed(i.firstPublishedAt)+'s.':''}${i.completedAt?' Pool completion: '+elapsed(i.completedAt)+'s.':''}`));}
        const quality = discoveryQualitySummary(job);
        if (quality.attempts) {
            detail.append(el('p', 'lp-copy', `Current update: ${quality.firstAccepted}/${quality.first} first stage attempts accepted · ${quality.repairsAccepted}/${quality.repairs} repairs accepted.`));
            detail.append(el('p', 'lp-copy', `${quality.tokens.toLocaleString()} measured tokens across ${quality.measured}/${quality.attempts} current requests; ${quality.reasoning.toLocaleString()} reported reasoning tokens (included in output).${quality.tokensPerProfile !== undefined ? ` ${quality.tokensPerProfile.toLocaleString()} measured tokens per saved profile.` : ' Work may be unfinished; no per-profile cost estimate yet.'}`));
        }
        const providerFailures=job.metrics.filter(m=>m.failureLayer==='provider').length;
        const authoringFailures=job.metrics.filter(m=>['authoring','validation','parse','protected-field'].includes(m.failureLayer||'')).length;
        if(providerFailures||authoringFailures)detail.append(el('p','lp-copy',`${providerFailures} provider failures · ${authoringFailures} authoring responses needing correction. Earlier unclassified attempts remain in the total above.`));
        const attempts=el('details');attempts.append(el('summary','','Recent request diagnostics'));
        for(const metric of job.metrics.slice(-8)){
            const measured=typeof metric.promptTokens==='number'&&typeof metric.completionTokens==='number'?`${metric.promptTokens.toLocaleString()} input + ${metric.completionTokens.toLocaleString()} output tokens`:'usage unavailable';
            attempts.append(el('p','lp-copy',`${metric.task||metric.stage||'unrecorded stage'} · ${metric.failureLayer==='provider'?'provider failed':['authoring','validation','parse','protected-field'].includes(metric.failureLayer||'')?'needs correction':metric.checkpoint?'saved progress':'unclassified'} · ${measured}${metric.unresolvedLabels?.length?' · '+metric.unresolvedLabels.join(', '):''}${metric.validationIssues?.length?' · '+metric.validationIssues.map(i=>(i.recordId?i.recordId+': ':'')+i.code).join(', '):''}`));
        }
        detail.append(attempts);
        diagnostics.append(detail);
    }
    if ((h.ui.profileBusy || h.ui.profileStatus || h.ui.profileError) && (h.ui.tab!=='discover'||h.ui.profileAction!=='discover'||h.ui.profileError||h.ui.pendingProfile)) {
        const status = el('details', 'lumistry-progress');status.dataset.lumistryDetail='profile-progress';
        status.open = Boolean(h.ui.profileError);
        if (h.ui.profileError) status.setAttribute('data-force-open', '');
        const worldReading=h.ui.profileAction==='world',imageChecking=h.ui.profileAction==='image_check';
        status.append(el('summary', '', imageChecking?(h.ui.profileError?'Image inspection needs attention':h.ui.profileBusy?'Inspecting saved image':'Image inspection complete'):worldReading?(h.ui.profileError?'World reading needs attention':h.ui.profileBusy?'Reading world':'World reading complete'):h.ui.profileError ? 'Profile generation needs attention' : h.ui.pendingProfile ? 'Profile ready · review' : h.ui.profileBusy?'Profile generation in progress':h.ui.profileStatus?.match(/^\d+ profiles ready/)?.[0]||'Profile update complete'));
        status.setAttribute('role', h.ui.profileError ? 'alert' : 'status');
        const statusText=el('p','lp-copy',h.ui.profileError||h.ui.profileStatus||(worldReading?'Reading world evidence…':'Creating profiles in the background…'));statusText.dataset.lumistryProfileStatus='';status.append(statusText);
        if(h.ui.worldReview&&h.ui.tab==='settings'&&h.ui.settingsPage!=='world')status.append(act('Review world suggestions',()=>{h.ui.settingsPage='world';h.render();}));
        if (h.ui.pendingProfile)
            status.append(act('Review generated profile', () => {
                if (h.ui.pendingProfileKind === 'self_draft') {
                    h.ui.editor = h.ui.pendingProfile;
                    h.ui.draft = undefined;
                    h.ui.tab = 'self';
                    h.ui.selfEditing = true;
                }
                else {
                    h.ui.draft = h.ui.pendingProfile;
                    h.ui.editingNpc = h.ui.pendingProfileKind === 'edit_draft';
                }
                h.ui.pendingProfile = undefined;
                h.ui.pendingProfileKind = '';
                h.render();
            }, true, 'edit'));
        if (h.ui.profileBusy)
            status.append(act(imageChecking?'Cancel image inspection':worldReading?'Cancel world reading':'Cancel profile generation', () => h.action('cancel_profiles'), false, 'x'));
        else
            status.append(act('Dismiss', () => { h.ui.profileStatus = ''; h.ui.profileError = ''; h.ui.profileAction=undefined; h.render(); }));
        content.append(status);
    }
    if (h.ui.error) {
        const error = el('div', 'lp-card lumistry-error');error.append(el('strong','','Needs attention'),el('p','',h.ui.error),el('p','lp-copy','Saved profiles and accepted checkpoints are kept.'));
        error.prepend(icon('alert'));
        error.setAttribute('role', 'alert');
        content.append(error);
    }
    if (h.ui.busy) {
        const status = el('div', 'lumistry-inline-status');const statusText=el('span','',h.ui.status||'Working…');statusText.dataset.lumistryInlineStatus='';status.append(statusText);
        status.setAttribute('role', 'status');
        status.append(act('Cancel', () => h.action('cancel'), false, 'x'));
        content.append(status);
    }
    if (h.ui.photoTarget) {
        const p = h.ui.photoTarget, box = el('div', 'lp-card lp-stack');
        box.append(control('Photo description', h.ui.photoBrief || '', v => h.ui.photoBrief = v, 'textarea'), act('Generate one photo', () => h.action('photo', { profileId: p, description: h.ui.photoBrief || '' }), true, 'camera'), act('Back', () => { h.ui.photoTarget = undefined; h.render(); }, false, 'chevronLeft'));
        content.append(box);
        return page;
    }
    if (h.ui.draft) {
        content.append(editor(h, h.ui.draft, false));
        return page;
    }
    if (h.ui.tab === 'settings') {
        content.classList.add('lumistry-settings');
        const destination=h.ui.settingsPage||'home';
        const appearance=el('section','lp-card lp-stack'),discovery=el('section','lp-card lp-stack lumistry-settings-section'),people=el('details','lumistry-settings-section'),personality=el('details','lp-card lp-stack lumistry-settings-section'),worldOverview=el('section','lp-card lp-stack lumistry-world-overview'),pipeline=el('details','lp-card lumistry-settings-section');
        let bankPart:HTMLElement=el('details');
        const settings=h.ui.generationDraft ||= structuredClone(d.generationSettings);
        if(destination==='app') {
        const label = el('label', 'lp-label', 'Theme'), select = el('select', 'lp-select');
        for (const [value, name] of [['sticker', 'Sticker Lab'], ['distillery', 'Distillery'], ['modern', 'Modern']]) {
            const option = el('option', '', name); option.value = value; option.selected = (h.ui.appThemeDraft??d.theme) === value; select.append(option);
        }
        select.disabled = h.ui.busy;
        select.addEventListener('change', () => h.ui.appThemeDraft=select.value);
        label.append(select);
        appearance.append(el('h2', 'lp-title', 'App theme'), label, el('p', 'lp-copy', 'Save app & integrations to apply this theme.'));

        }
        if(destination==='world') {
        const adultRow=el('label','lp-row'),adultInput=el('input');adultInput.type='checkbox';adultInput.checked=settings.adultJobs!==false;adultInput.addEventListener('change',()=>settings.adultJobs=adultInput.checked);adultRow.append(adultInput,el('span','','Include adult-industry jobs'));
        const appearanceRow=el('label','lp-row'),appearanceInput=el('input');appearanceInput.type='checkbox';appearanceInput.checked=settings.appearanceDiversity!==false;appearanceInput.addEventListener('change',()=>settings.appearanceDiversity=appearanceInput.checked);appearanceRow.append(appearanceInput,el('span','','Vary physical appearance'));
        people.dataset.lumistryDetail='people-appearance';people.append(el('summary','','People & appearance'),el('p','lp-copy','Species follows your world choices. Skin tone, facial features, hair and clothing vary automatically for new people. Saved people keep their appearance.'),appearanceRow,el('p','lp-copy','Use planned complexion, face and hair variety for compatible human characters.'),adultRow,el('p','lp-copy','Job variety only; this does not set attraction or sexual preferences.'));
        const toggle = el('label', 'lp-row'), input = el('input');
        input.type = 'checkbox'; input.checked = settings.allTropes;
        input.addEventListener('change', () => settings.allTropes = input.checked);
        toggle.append(input, el('span', '', 'Use the full trope catalog'));
        const catalog = el('details'); catalog.append(el('summary', '', `Browse all ${DATING_TROPES.length} tropes`));
        catalog.append(el('p', 'lp-copy', 'Main nine: ' + MAIN_DATING_TROPES.map(t => t.label).join(', ')));
        for (const trope of DATING_TROPES.filter(t => !t.main)) catalog.append(el('p', 'lp-copy', `${trope.label}${trope.condition !== 'any' ? ` (${trope.condition} setting)` : ''} — ${trope.profile}`));
        people.append(toggle,el('p','lp-copy','Off uses the nine main tropes. On adds compatible ideas from the full catalog.'),catalog);
        }
        if(destination==='discovery') {
        discovery.append(el('h2','lp-title','Discovery'));
        const speed=el('details','lumistry-settings-section');speed.append(el('summary','','Generation speed'),el('p','lp-copy','Larger batches use fewer calls. Two profiles can spend tokens together.'));
        settings.creation ||= {readyTarget:5,photoBatchCap:5,workers:1};
        for(const [key,labelText,values] of [['readyTarget','Profiles to keep ready',[5,10,25]],['photoBatchCap','Photos described per request',[3,4,5]],['workers','Profiles generated at once',[1,2]]] as const){
            const label=el('label','lp-label',labelText),select=el('select','lp-select');
            for(const value of values){const option=el('option','',String(value));option.value=String(value);option.selected=settings.creation[key]===value;select.append(option);}
            select.addEventListener('change',()=>{(settings.creation as any)[key]=Number(select.value)});label.append(select);if(key==='readyTarget')discovery.append(label);else speed.append(label);
        }
        discovery.append(speed);
        }
        if(destination==='world') {
        h.ui.worldSettingsBaseline||=worldBaseline(d);
        const world=h.ui.populationWorldDraft ||= structuredClone(d.populationWorld||normalizePopulationWorld(undefined,d.worldContext));
        const worldBox=el('section','lp-stack');
        const worldKind=el('select','lp-select');worldKind.setAttribute('aria-label','Population world profile');
        for(const kind of ['modern','historical','fantasy','cyberpunk','spacefaring','custom'] as const){const option=el('option','',title(kind));option.value=kind;option.selected=world.kind===kind;worldKind.append(option);}
        worldKind.addEventListener('change',()=>{h.ui.populationWorldDraft=worldDefaults(worldKind.value as PopulationWorld['kind']);h.render();});const worldLabel=el('label','lp-label','World type');worldLabel.append(worldKind);worldBox.append(worldLabel,el('p','lp-copy','World type sets era/technology defaults. Species and magical capabilities are independent: modern settings can include nonhuman people and reviewed magic.'));
        const capabilities=el('details','lumistry-settings-section');capabilities.append(el('summary','','Technology & institutions'),el('p','lp-copy','Choose what exists in this setting. These choices limit which jobs and details are plausible.'));
        for(const cap of WORLD_CAPABILITIES){const row=el('label','lp-row'),input=el('input');input.type='checkbox';input.checked=world.capabilities.includes(cap);input.addEventListener('change',()=>{world.capabilities=input.checked?[...world.capabilities,cap]:world.capabilities.filter(c=>c!==cap)});row.append(input,el('span','',title(cap.replaceAll('_',' '))));capabilities.append(row);}
        worldBox.append(capabilities,control('Maximum adult age in this world',String(world.maxAdultAge),v=>world.maxAdultAge=Math.round(Math.max(18,Math.min(9999,Number(v)||99))),'number'));
        worldBox.append(worldGuideEditor(h,world));
        worldOverview.append(el('h2','lp-title','World & setting'));
        const palette=h.ui.worldGuideDraft?.species||d.worldGuide?.species||[];
        const worldStatus=el('p','lp-copy',`${title(world.kind)} · ${palette.length?palette.length+' selected species':'No species palette selected'}`);worldStatus.setAttribute('role','status');worldOverview.append(worldStatus,el('p','lp-copy','Read your story to suggest a setting, then review the suggestions. You can also edit the world yourself.'));
        const readWorld=act('Read world & suggest filters',()=>h.action('world',{extraEvidence:h.ui.worldEvidenceDraft,selectedSourceIds:h.ui.worldSourceIds}),false,'sparkle');readWorld.disabled=h.ui.busy||!!h.ui.profileBusy||!h.generation;worldOverview.append(readWorld);
        worldOverview.append(act('Choose reading sources',()=>h.action('world_sources'),false,'eye'));
        if(h.ui.worldSources){const picker=el('details','lp-stack');picker.open=true;picker.append(el('summary','','Sources for the next read'));const search=el('input','lp-input');search.type='search';search.placeholder='Find a source';search.value=h.ui.worldSourceSearch||'';const rows=el('div','lp-stack'),pager=el('div','lp-row');
          const draw=()=>{const found=h.ui.worldSources!.filter(s=>s.label.toLowerCase().includes(search.value.toLowerCase()));const page=Math.max(0,Math.min(h.ui.worldSourcePage||0,Math.max(0,Math.ceil(found.length/24)-1)));rows.replaceChildren();pager.replaceChildren();rows.append(el('p','lp-copy',`${found.length} sources; up to 64 may be selected. Lore excerpts share a 24,000-character budget.`));for(const source of found.slice(page*24,page*24+24)){const label=el('label','lp-row'),choice=el('input');choice.type='checkbox';choice.checked=(h.ui.worldSourceIds||[]).includes(source.id);choice.addEventListener('change',()=>{const ids=new Set(h.ui.worldSourceIds||[]);if(choice.checked){if(ids.size>=64){choice.checked=false;return;}ids.add(source.id);}else ids.delete(source.id);h.ui.worldSourceIds=[...ids];});label.append(choice,document.createTextNode(source.label+(source.originalCharacters===undefined?' · content not read':` · ${source.originalCharacters} characters`)));rows.append(label);if(source.reason)rows.append(el('small','lp-copy',source.reason));}if(page)pager.append(act('Previous sources',()=>{h.ui.worldSourcePage=page-1;draw();}));if((page+1)*24<found.length)pager.append(act('Next sources',()=>{h.ui.worldSourcePage=page+1;draw();}));};
          search.addEventListener('input',()=>{h.ui.worldSourceSearch=search.value;h.ui.worldSourcePage=0;draw();});picker.append(search,rows,pager,...(h.ui.worldSourceWarnings||[]).map(w=>el('p','lp-copy',w)));draw();worldOverview.append(picker);
        }
        const advanced = el('details', 'lumistry-advanced-settings lumistry-settings-section');advanced.dataset.lumistryDetail='world-manual';
        advanced.append(el('summary', '', 'Edit world details'),worldBox);
        advanced.append(control('Additional world evidence (optional)',h.ui.worldEvidenceDraft||'',v=>h.ui.worldEvidenceDraft=v,'textarea'),el('p','lp-copy','Add relevant lore that source coverage cannot read. This is evidence for the next explicit Read world action; it is not automatically accepted.'));
        const separate=act('Start a separate setting',()=>h.action('setting_new'),false,'plus');separate.disabled=!reviewedSettingKey(d)||h.ui.busy;advanced.append(el('p','lp-copy','Refining a world summary keeps its setting identity. Use a separate setting when moving to another world; saved people and matches remain intact.'),separate);
        if (d.worldContext)
            {const summary=el('details');summary.append(el('summary','','Saved world summary'),el('p','lumistry-bio',d.worldContext));advanced.append(summary);}
        if(h.ui.worldReview)worldOverview.append(worldReviewEditor(h,h.ui.worldReview));
        if (h.ui.world&&!h.ui.worldReview) {
            const preview = el('div', 'lp-card lp-stack');
            preview.append(el('h2', 'lp-title', 'Review setting suggestions'), control('World context', h.ui.worldContext || '', v => h.ui.worldContext = v, 'textarea'));
            for (const w of h.ui.world)
                preview.append(control('Category name', w.label, v => w.label = v), control(`${w.label} options`, w.options.join(', '), v => w.options = v.split(',').map(x => x.trim()).filter(Boolean)));
            preview.append(act('Accept suggestions', () => h.action('world_accept', { worldFields: h.ui.world, worldContext: h.ui.worldContext }), true, 'check'), act('Discard', () => { h.ui.world = undefined; h.render(); }, false, 'x'));
            worldOverview.append(preview);
        }

        worldOverview.append(advanced);
        }
        if(destination==='experience') {
        personality.append(el('summary','','Personality & tone'));
        personality.append(el('p','lp-copy','Choose the tone for new profiles and optional conversation surprises.'));
        const experience = settings.experience = normalizeExperience(settings.experience);
        const modes = el('div', 'lumistry-actions');
        for (const [value,label] of [['A','Profiles only'],['B','Conversations only'],['C','Both']] as const) {
            const choose=act(label,()=>{experience.scope=value;h.render();},experience.scope===value);
            choose.setAttribute('aria-pressed',String(experience.scope===value));modes.append(choose);
        }
        const tones=el('div','lumistry-actions');
        for (const value of ['grounded','balanced','chaotic'] as const) {
            const choose=act(title(value),()=>{Object.assign(experience,EXPERIENCE_PRESETS[value],{tone:value});h.render();},experience.tone===value);
            choose.setAttribute('aria-pressed',String(experience.tone===value));tones.append(choose);
        }
        personality.append(el('h3','','Apply extra personality to'),modes,el('h3','','Tone'),tones);
        const tuning=el('details');tuning.append(el('summary','','Fine-tune personality'));
        for(const [field,label,group] of [['tropeRate','Profile trope frequency','profile'],['exaggeration','Profile exaggeration','profile'],['socialLift','Social opportunity lift','social'],['socialIntensity','Social intensity','social']] as const){
            const row=el('label','lp-stack'),slider=el('input'),value=el('span','',String(experience[field]));slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.value=String(experience[field]);slider.disabled=group==='profile'?experience.scope==='B':experience.scope==='A';slider.setAttribute('aria-label',label);slider.addEventListener('input',()=>{experience[field]=Number(slider.value);value.textContent=slider.value;});row.append(el('span','',label),slider,value);tuning.append(row);
        }
        const parody=el('label','lp-row'),parodyInput=el('input');parodyInput.type='checkbox';parodyInput.checked=experience.parody;parodyInput.addEventListener('change',()=>experience.parody=parodyInput.checked);parody.append(parodyInput,el('span','','Include fictional bot/scam parodies'));
        const lab=el('label','lp-row'),labInput=el('input');labInput.type='checkbox';labInput.checked=experience.voiceLab;labInput.addEventListener('change',()=>experience.voiceLab=labInput.checked);lab.append(labInput,el('span','','Enable voice rehearsal tools for matches'));
        tuning.append(parody,lab,el('p','lp-copy','Social lift is a bounded increase in eligible writing opportunities, not a percentage of chats that must trigger events. Matches, consent and scene events remain independent.'));personality.append(tuning);
        pipeline.append(el('summary','','Profile development'));
        const flags = h.ui.pipelineDraft ||= structuredClone(d.pipeline);
        for (const [key, labelText] of [['enrichment', 'Develop background after matching'], ['events', 'Remember agreed dates & contact exchanges'], ['rpBridge', 'Use agreed plans in relevant scenes']] as const) {
            const label = el('label', 'lp-row'), checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = flags[key];
            checkbox.addEventListener('change', () => flags[key] = checkbox.checked); label.append(checkbox, el('span', '', labelText)); pipeline.append(label);
        }
        pipeline.append(act('Save development settings', () => h.action('pipeline_settings', { settings: flags }), true, 'check'));
        for(const b of [...pipeline.querySelectorAll('button')])if(b.textContent==='Save development settings')b.remove();
        }
        if(destination==='app') {
        const bankSection=el('details','lp-card lumistry-settings-section');bankSection.append(el('summary','','Existing NPCs'));
        const bank = el('section', 'lp-stack'), settings = h.ui.bankDraft ||= { enabled: d.bankDating.enabled, chance: d.bankDating.chance };
        bank.append(el('p','lp-copy','Let eligible characters from your NPC Bank consider joining Lumistry.'));
        const toggle = el('input', '');
        toggle.type = 'checkbox';
        toggle.checked = settings.enabled;
        const label = el('label', 'lp-copy', 'Enable NPC Bank dating');
        label.prepend(toggle);
        toggle.addEventListener('change', () => settings.enabled = toggle.checked);
        const range = el('input', '');
        range.type = 'range';
        range.min = '0';
        range.max = '100';
        range.step = '1';
        range.value = String(settings.chance);
        range.setAttribute('aria-label', 'Profile assessment chance');
        const chance = el('p', 'lp-copy', `Profile assessment chance: ${settings.chance}%`);
        range.addEventListener('input', () => { settings.chance = Number(range.value); chance.textContent = `Profile assessment chance: ${settings.chance}%`; });
        bank.append(label, chance, range, el('p', 'lp-copy', 'Chance per eligible Pocket background opportunity, not a forced signup or match. Off sends no NPC Bank dating evidence to generation. Pocket background activity must also be enabled. Saved assessments are not rerolled.'), act('Save NPC Bank settings', () => h.action('bank_settings', { settings }), true, 'check'));
        if (!h.backgroundEnabled)
            bank.append(act('Turn on Pocket background activity (occasional)', () => h.action('enable_background'), false, 'check'));
        const assessmentHistory=el('details');assessmentHistory.append(el('summary','','Past Bank decisions · '+d.bankDating.assessments.length));
        for (const a of d.bankDating.assessments) {
            const contact = h.state.contacts.find(c => c.source.kind === 'npc' && c.source.bankId === a.bankId);
            assessmentHistory.append(el('p', 'lp-copy', `${contact?.name || 'Bank NPC'} · ${title(a.status)} · Fit estimate ${a.suitability}% · ${a.reason}`));
        }
        if (d.bankDating.assessments.some(a => a.status !== 'joined'))
            bank.append(act('Reconsider declined / unknown profiles', () => h.action('bank_reassess'), false, 'refresh'));
        if(d.bankDating.assessments.length)bank.append(assessmentHistory);bankSection.append(bank);bankPart=bankSection;
        for(const b of [...bankPart.querySelectorAll('button')])if(b.textContent==='Save NPC Bank settings')b.remove();
        }
        if(destination==='technical') {
        const archives=el('details','lp-stack');archives.append(el('summary','','Private archived authoring'));
        for(const archive of d.authoringArchives||[]){archives.append(el('p','lp-copy',`${archive.kind==='draftJob'?'Manual draft':archive.kind==='discoveryJob'?'Discovery draft':archive.kind==='profile'?'Passed profile':archive.kind==='conversation'?'Conversation history':'Measurement history'} · ${archive.createdAt}`),act('Inspect archive',()=>h.action('archive_read',{archiveId:archive.id}),false,'eye'));if(['draftJob','discoveryJob'].includes(archive.kind))archives.append(act('Delete archived draft',()=>h.action('archive_delete',{archiveId:archive.id}),false,'trash',true,'delete_archive'));}
        if(!(d.authoringArchives||[]).length)archives.append(el('p','lp-copy','No archived jobs.'));
        if(h.ui.authoringArchive){const archiveView=control('Editor-only archive; retained evidence, never model instructions',JSON.stringify(h.ui.authoringArchive,null,2),()=>{},'textarea');archiveView.querySelector('textarea')!.readOnly=true;archives.append(archiveView,act('Close archive',()=>{h.ui.authoringArchive=undefined;h.render()},false,'x'));}
        diagnostics.append(archives);
        }
        const settingsView=renderSettingsDashboard(h,d,{appearance,discovery,people,personality,world:worldOverview,pipeline,bank:bankPart,tools:settingsTools});
        if(h.ui.busy)for(const control of settingsView.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement>('input,select,textarea,button'))control.disabled=true;
        content.append(settingsView);if(['home','technical'].includes(destination))content.append(exportDiagnostics);
        return page;
    }
    if(h.ui.tab==='self'&&h.ui.selfPage!=='character'&&!h.ui.selfEditing&&!(h.ui.selfPage==='profile'&&!d.self)){
        const go=(destination:string)=>{h.ui.selfPage=destination;h.render();};
        if(h.ui.selfPage==='interests'){
            if(!d.self){content.append(el('p','lp-copy','Save your character profile before editing private interests.'),act('Create my character',()=>go('character'),true));return page;}
            h.ui.preferenceDraft||=makePreferenceDraft(preferenceScope,'terms',d.self.adultPreferences);const draft=h.ui.preferenceDraft;
            content.append(act('Back to Me',()=>{if(preferenceDraftDirty(draft))h.ui.preferenceLeave=()=>{h.ui.preferenceDraft=undefined;go('');};else{h.ui.preferenceDraft=undefined;go('');}h.render();},false,'chevronLeft'),renderMyInterests(draft,d.populationWorld!,d.worldGuide,()=>h.action('self_preferences',{kind:'both',preferences:draft.value,baseline:draft.baseline}),()=>{h.ui.preferenceDraft=undefined;h.render();},h.ui.busy,kind=>{go(kind);}));return page;
        }
        if(h.ui.selfPage==='terms'||h.ui.selfPage==='species'){
            if(!d.self){content.append(el('p','lp-copy','Create and save your character profile before editing personal preferences.'),act('Create my character',()=>go('character'),true));return page;}
            const kind=h.ui.selfPage==='terms'?'terms':'species';
            if(!h.ui.preferenceDraft)h.ui.preferenceDraft=makePreferenceDraft(preferenceScope,kind,d.self.adultPreferences);
            if(h.ui.preferenceDraft.kind!==kind){Object.assign(h.ui.preferenceDraft,{kind,selected:[],search:'',category:'',page:0},h.ui.libraryView?.[preferenceScope+':'+kind]||{});}
            const draft=h.ui.preferenceDraft;const viewKey=preferenceScope+':'+kind;h.ui.libraryView||={};h.ui.libraryView[viewKey]={search:draft.search,category:draft.category};
            content.append(act('Back to Me',()=>{if(preferenceDraftDirty(draft))h.ui.preferenceLeave=()=>{h.ui.preferenceDraft=undefined;go('');};else{h.ui.preferenceDraft=undefined;go('');}h.render();},false,'chevronLeft'),act('Back to My interests',()=>go('interests')),renderPreferenceLibrary(draft,d.populationWorld!,d.worldGuide,()=>h.action('self_preferences',{kind:'both',preferences:draft.value,baseline:draft.baseline}),()=>{h.ui.preferenceDraft=undefined;go('');},h.ui.busy,()=>{h.ui.libraryView![viewKey]={search:draft.search,category:draft.category};}));return page;
        }
        if(h.ui.selfPage==='play'){content.append(act('Back to Me',()=>go(''),false,'chevronLeft'),renderSimplePlay(h,d));return page;}
        if(h.ui.selfPage==='type'){
            content.append(sectionHeading('My Type','Personal attraction and discovery rules are separate choices.'),act('Back to Me',()=>go(''),false,'chevronLeft'),act('My interests',()=>go('interests'),true),el('p','lp-copy','Your private attraction library does not automatically change who Discover requires. Set preferences or must-haves explicitly in Discovery filters.'),act('Discovery filters',()=>openPanel(h,'filters')),el('p','lp-copy',`${d.filters.minAge}–${d.filters.maxAge} · ${Object.values(d.filters.fields).filter(f=>f.mode==='required'&&f.value).length} strict requirements`));return page;
        }
        if(h.ui.selfPage!=='profile'){
            content.append(sectionHeading('Me','Make it yours.'));
            const hub=el('div','lumistry-me-grid');
            const destination=(name:string,summary:string,fn:()=>void)=>{const b=act('',fn);b.classList.add('lumistry-settings-destination');b.append(el('strong','',name),el('span','lp-copy',summary));return b;};
            hub.append(destination('My profile',d.self?d.self.alias+' · identity, appearance and dating card':'Create your dating profile',()=>go('character')),destination('Who I want',`${d.filters.minAge}–${d.filters.maxAge} · your dating preferences`,()=>openPanel(h,'filters')),destination('How it feels','Tone, adult content and boundaries',()=>go('play')));
            const more=el('details','lumistry-me-more');more.append(el('summary','','More'),act('My interests',()=>go('interests')),act('Quick setup · eight optional choices',()=>{h.ui.setupQuick=true;h.ui.settingsPage='setup';openPanel(h,'settings','setup');}),act('Advanced settings',()=>openPanel(h,'settings')));content.append(hub,more);return page;
        }
    }
    if (h.ui.tab === 'self') {
        content.append(sectionHeading('My profile', 'Your identity, appearance and dating card.'));
        if(h.ui.savedProfileDiff?.length&&!h.ui.busy&&!h.ui.error){const diff=el('details');diff.append(el('summary','','Your last profile save · public changes'));for(const row of h.ui.savedProfileDiff)diff.append(el('strong','',row.field),el('pre','',JSON.stringify(row.before)+' → '+JSON.stringify(row.after)));content.append(diff);}
        if (d.self && !h.ui.selfEditing && h.ui.selfPage==='profile') {
            content.append(savedProfileControls(h),act('My interests',()=>{h.ui.selfPage='interests';h.render();}),act('Edit profile', () => { h.ui.selfEditing = true; h.ui.editor ||= structuredClone(d.self!);h.ui.selfBaseline??=profileEditSignature(d.self); h.render(); }, true, 'edit'), profileCard(h, d.self, true));
            return page;
        }
        if (d.self) content.append(act('Back to Me', () => { if(profileEditorDirty(h.ui)){h.ui.editorLeave=()=>{clearProfileEditor(h.ui);h.render();};}else{h.ui.selfEditing = false; h.ui.selfPage=undefined;}h.render(); }, false, 'chevronLeft'));
        if(h.ui.selfBaseline===undefined)h.ui.selfBaseline=profileEditSignature(d.self);
        h.ui.editor ||= structuredClone(d.self || normalizeDatingProfile({ id: 'self', alias: h.state.pocketPersona.displayName || 'Anonymous', age: 18, anonymous: false, bio: h.state.pocketPersona.identityBrief || '', pronouns: h.state.pocketPersona.pronouns, fields: {}, phoneProfile: h.state.pocketPersona.phoneProfile || {} })!);
        if (!d.self && !h.ui.editor.contactId) {
            h.ui.editor.age = 0;
            h.ui.editor.contactId = h.owner;
        }
        const tools=el('details');tools.dataset.lumistryDetail='profile-tools';tools.append(el('summary','','Use a Persona or saved profile · optional'),savedProfileControls(h));
        const enhance = act('Enhance from Persona', () => h.action('self_generate', { profile: h.ui.editor }), false, 'sparkle');
        enhance.disabled = h.ui.profileBusy || !h.generation;
        tools.append(enhance,el('p','lp-copy','Creates an editable draft. Review it before saving.'));content.append(tools);
        content.append(editor(h,h.ui.editor,true));if(d.self)content.append(act('Preview dating card',()=>{const preview=content.querySelector<HTMLElement>('.lumistry-editor-preview');if(preview){preview.tabIndex=-1;preview.focus({preventScroll:true});preview.scrollIntoView?.({block:'nearest'});}},false,'person'));
        return page;
    }
    if (h.ui.tab === 'generate') {
        content.append(sectionHeading('Add someone', 'Create a new profile or adapt an existing contact.'));
        const box = el('div', 'lp-card lp-stack'), select = el('select', 'lp-select');
        select.setAttribute('aria-label', 'New NPC or existing contact');
        const newOption = el('option', '', 'Create a new NPC');
        newOption.value = '';
        select.append(newOption);
        for (const c of h.state.contacts) {
            const o = el('option', '', c.name);
            o.value = c.id;
            o.selected = h.ui.contactId === c.id;
            select.append(o);
        }
        select.addEventListener('change', () => h.ui.contactId = select.value);
        const generate = act('Generate profile draft', () => h.action('generate', { description: h.ui.description, contactId: h.ui.contactId || undefined }), true, 'flask');
        generate.disabled = h.ui.profileBusy || !h.generation || !d.self;
        box.append(select, control('Describe the person or profile', h.ui.description, v => h.ui.description = v, 'textarea'), generate, el('p', 'lp-copy', 'Existing contacts need an established age of at least 18. New NPCs are saved only after you accept their draft.'));
        content.append(box);
        return page;
    }
    if (h.ui.tab === 'discover') {
        const toolbar = el('div', 'lumistry-discovery-toolbar'), actions = el('div', 'lumistry-toolbar-actions');
        const options = el('details', 'lumistry-options'); options.append(el('summary', '', 'More'));
        const menu = el('div', 'lumistry-options-menu');
        menu.append(act('Advanced settings', () => openPanel(h, 'settings'), false, 'sliders'),
            act('Add a profile', () => { openPanel(h, 'generate'); }, false, 'plus'), act('Restore passed profiles', () => h.action('reset_passes'), false, 'refresh'));
        options.append(menu);
        actions.append(act('Wishlist', () => { openPanel(h, 'filters'); }, false, 'sliders'), options);
        toolbar.append(sectionHeading('Discover', 'See who catches your eye.'), actions); content.append(toolbar);
        if (!d.self) {
            content.append(empty('person', 'Create your profile in Me to start discovering people.'),sampleProfile());
            return page;
        }
        const available=discoverProfiles(d),incoming=available.filter(p=>hasPriorLike(p,d));
        const collections=el('div','lumistry-actions');
        for(const [key,label] of [['all','Discover'],['liked',`Liked you · ${incoming.length}`],['saved',`Saved · ${available.filter(p=>d.tools?.shortlist.includes(p.id)).length}`]] as const){const b=act(label,()=>{h.ui.discoverCollection=key;h.render();});b.setAttribute('aria-pressed',String((h.ui.discoverCollection||'all')===key));collections.append(b);}content.append(collections);
        const profiles=h.ui.discoverCollection==='liked'?incoming:h.ui.discoverCollection==='saved'?available.filter(p=>d.tools?.shortlist.includes(p.id)):available;
        const tools=browsingTools(h,d,available);
        const pool = el('div', 'lumistry-pool-status');
        const find = act('Find more', () => h.action('discover'), true, 'refresh');
        find.disabled = Boolean(h.ui.profileBusy) || !h.generation;
        pool.append(find);
        const finding=h.ui.profileBusy&&h.ui.profileAction==='discover'&&!h.ui.profileError;
        if(finding&&available.length){const indicator=el('span','lumistry-finding','Finding more…');indicator.setAttribute('role','status');pool.append(indicator);}
        pool.append(el('span', 'lp-copy', `${profiles.length} ${profiles.length === 1 ? 'profile' : 'profiles'} to explore`));

        const currentFilters=el('details');currentFilters.append(el('summary','','Who you\u2019re looking for'),filterChips(d.filters,(key,excluded)=>{h.ui.filterSessions||={};const scope=JSON.stringify([h.state.chatId,h.state.characterId,h.owner]);const session=h.ui.filterSessions[scope]||={baseline:structuredClone(d.filters),draft:structuredClone(d.filters)};const filters=structuredClone(session.draft);if(key.startsWith('connection:')){delete (filters.connection as any)?.[key.slice(11)];if(filters.connection&&Object.keys(filters.connection).length===1)delete filters.connection;}else if(excluded)delete filters.excludedValues?.[key];else if(key==='age'){filters.minAge=18;filters.maxAge=99;}else if(key==='distance'){filters.maxKm=50;delete filters.distanceMode;delete filters.settingKey;}else {filters.fields[key]={mode:'any',value:''};delete filters.traits?.choices[key];if(filters.traits?.allOpen)filters.traits.allOpen=filters.traits.allOpen.filter(k=>k!==key);}session.draft=filters;openPanel(h,'filters');}));if(finding){const target=d.discoveryJob?.scheduling?.readyTarget||d.generationSettings.creation?.readyTarget||5;const status=el('span','lp-copy',`${Math.min(available.length,target)} of ${target} profiles ready`),bar=el('progress','lumistry-pool-progress');bar.max=target;bar.value=Math.min(available.length,target);bar.setAttribute('aria-label',status.textContent!);pool.append(status,bar);}content.append(pool);
        const p = profiles.find(p=>p.id===h.ui.discoverPick)||profiles[0];
        if (!p) {
            content.append(tools,currentFilters);
            const message=empty('flask', finding&&!available.length ? 'Looking for someone new…' : h.ui.discoverCollection==='liked'?'No prior likes to show right now.':h.ui.discoverCollection==='saved'?'No eligible saved people here yet. Saving does not Like or match.':emptyFilterExplanation(d));
            if(finding&&!available.length){message.classList.add('lumistry-waiting-card');message.setAttribute('role','status');message.prepend(waitingSkeleton());}content.append(message);
            return page;
        }
        page.dataset.lumistryView = 'discover';page.dataset.lumistryCandidate=p.id;
        const profile = profileCard(h, p, true);profile.dataset.lumistryScrollAnchor='discover-profile';
        const hints=el('div','lumistry-shared-hints');for(const hint of sharedInterestHints(d.self,p))hints.append(el('span','lumistry-tag',hint));if(hints.childElementCount)profile.querySelector('.lumistry-profile-body')?.prepend(hints);
        content.append(profile);
        const swipe = el('div', 'lumistry-actions lumistry-swipe');
        swipe.append(act('Pass', () => h.action('pass', { profileId: p.id }), false, 'x'), act('Like', () => h.action('like', { profileId: p.id }), true, 'doodle:heart'), act('Super Like', () => h.action('like', { profileId: p.id, super: true }), false, 'doodle:star'));
        for (const b of swipe.querySelectorAll('button'))
            b.disabled = h.ui.busy;
        page.classList.add('lumistry-discover');
        content.append(swipe,tools,currentFilters);profile.classList.add('lumistry-discovery-card');
        const buttons=[...swipe.querySelectorAll<HTMLButtonElement>('button')];buttons.forEach((b,i)=>b.dataset.decision=['pass','like','super'][i]);
        attachDiscoveryGesture(page,profile,kind=>{if(!h.ui.busy&&h.ui.tab==='discover'&&page.isConnected)buttons[kind==='pass'?0:1].click();});
        return page;
    }
    const profilesById=new Map(d.profiles.map(p=>[p.id,p]));
    const decisions = d.decisions.filter(x => x.action !== 'pass');
    if (h.ui.selectedProfileId) {
        const p = d.profiles.find(p => p.id === h.ui.selectedProfileId), x = decisions.find(x => x.profileId === p?.id);
        if (p && x) {
            const layout=el('div','lumistry-connections-layout'),side=el('nav','lumistry-connections-sidebar'),detail=el('section','lp-stack');side.setAttribute('aria-label','Your connections');
            for(const decision of decisions){const person=profilesById.get(decision.profileId);if(person)side.append(matchTile(h,person,decision));}
            detail.append(act('Back to matches', () => { h.ui.selectedProfileId = undefined; h.render(); }, false, 'chevronLeft'),el('p', 'lumistry-detail-status', connectionStatus(x)), profileCard(h, p, true), h.owner===h.state.pocketPersonaActorId?renderLoveMeter(h.state,p.id,(a,v)=>h.action(a,v),h.ui.busy,h.visible!==false):el('div'), connectionActions(h, p, x));layout.append(side,detail);content.append(layout);
            return page;
        }
        h.ui.selectedProfileId = undefined;
    }
    if (h.ui.tab === 'inbox') {
        const conversationsById=new Map(h.state.conversations.map(c=>[c.id,c]));
        const matched=decisions.filter(x=>x.status==='matched'&&x.conversationId).map(decision=>({decision,time:Date.parse(conversationsById.get(decision.conversationId!)?.updatedAt||'')||0})).sort((a,b)=>b.time-a.time).map(x=>x.decision);
        content.append(sectionHeading('Inbox', 'A little chemistry starts with a hello.'));
        const list = el('div', 'lumistry-inbox-list');
        for (const x of matched) { const p = profilesById.get(x.profileId); if (p) { const row = inboxRow(h, p, x,conversationsById.get(x.conversationId!)); if (row) list.append(row); } }
        content.append(list.childElementCount ? list : empty('chat', 'No conversations yet. Your matches will appear here.'));
    } else {
        content.append(sectionHeading('Your connections', 'People you matched with, and likes you sent.'));
        for (const [label, statuses] of [['Matches', ['matched']], ['Likes sent', ['pending', 'evaluating', 'error']], ['Past connections', ['declined', 'unmatched']]] as const) {
            const group = decisions.filter(x => (statuses as readonly string[]).includes(x.status) && profilesById.has(x.profileId));
            if (!group.length) continue;
            const section = el('section', 'lumistry-match-section'); section.append(el('h2', '', `${label} · ${group.length}`));
            const grid = el('div', 'lumistry-match-grid');
            for (const x of group) grid.append(matchTile(h, profilesById.get(x.profileId)!, x));
            section.append(grid); content.append(section);
        }
        if (!decisions.some(x => profilesById.has(x.profileId))) content.append(empty('heart', 'Your connections will appear here. Find someone who catches your eye.'));
    }
    if (!h.backgroundEnabled || !h.automaticReplies) {
        const settings = el('details', 'lumistry-chat-settings'); settings.append(el('summary', '', 'Replies and background matching'));
        if (!h.backgroundEnabled) settings.append(el('p', 'lp-copy', 'Likes you send stay pending until Pocket\u2019s background activity looks at them.'), act('Turn on Pocket background activity (occasional)', () => h.action('enable_background'), false, 'check'));
        if (!h.automaticReplies) settings.append(el('p', 'lp-copy', 'Automatic replies are off. You can still request replies manually.'), act('Turn on automatic replies', () => h.action('enable_replies'), false, 'check'));
        content.append(settings);
    }
    return page;
}
