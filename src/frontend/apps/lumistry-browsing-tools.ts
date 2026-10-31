import { datingVisualIdentityKey } from '../../domain/lumistry-visual.js';
import type { DatingHost } from './lumistry.js';
import type { DatingProfile, DatingState } from '../../domain/lumistry.js';
import { publicDatingProfile } from '../../domain/lumistry.js';
import { publicHighlight, publicPresentationQuotes, varietyProfile, publicProfileTips, publicEvidence, sharedConversationEvidence, localQualityReport, discoveryEstimate } from '../../domain/lumistry-experience-tools.js';
import { settingsSectionState } from '../../domain/lumistry-setup.js';
import { normalizeExperience, EXPERIENCE_PRESETS } from '../../domain/lumistry-experience.js';
import { el, button } from '../shared.js';
const act = (label: string, fn: () => void) => { const b = button(label, 'lp-button'); b.type = 'button'; b.addEventListener('click', fn); return b; };
export function browsingTools(h: DatingHost, d: DatingState, available: DatingProfile[]): HTMLElement {
    const box = el('details', 'lumistry-browsing-tools');
    box.append(el('summary', '', 'More ways to browse'));
    const last = d.decisions.at(-1);
    if (last?.status === 'passed' && last.action === 'pass')
        box.append(act('Undo last Pass', () => h.action('tools_rewind', { profileId: last.profileId })));
    box.append(act('Pick someone different', () => { const current = available.find(p => p.id === h.ui.discoverPick) || available[0]; const others = available.filter(p => p.id !== current?.id); const p = varietyProfile(others, h.state.roleplayNow || h.state.roleplayClockLabel || h.owner); h.ui.discoverPick = p?.id; h.ui.discoverCollection = 'all'; h.render(); }), act(d.tools?.presentation === 'bio' ? 'Show photos first' : 'Show bio first', () => h.action('tools_presentation', { value: d.tools?.presentation === 'bio' ? 'photo' : 'bio' })), act(d.experiencePreferences?.paused ? 'Resume adult themes' : 'Pause adult themes · text and photos', () => h.action('tools_pause', { paused: !d.experiencePreferences?.paused })));
    const variety = [...box.querySelectorAll('button')].find(b => b.textContent === 'Pick someone different');
    if (variety)
        variety.disabled = available.length < 2;
    const mood = el('details');
    mood.append(el('summary', '', 'Tone for new profiles'));
    const baseline = JSON.stringify(settingsSectionState(d, 'experience'));
    for (const tone of ['grounded', 'balanced', 'chaotic'] as const)
        mood.append(act(tone === 'grounded' ? 'Calm' : tone === 'balanced' ? 'Balanced' : 'Playful', () => { h.ui.moodReview = { tone, baseline }; h.render(); }));
    if (h.ui.moodReview) {
        const draft = h.ui.moodReview;
        const review = el('section', 'lp-stack');
        review.append(el('p', '', `Tone: ${d.generationSettings.experience?.tone || 'balanced'} → ${draft.tone}. Applies to future profile writing. If your saved scope is conversations only, this review also changes it to profiles and conversations. Filters, identity, adult levels and existing people stay saved. Find more remains explicit.`), act('Apply reviewed tone', () => h.action('setup_direct', { group: 'experience', baseline: draft.baseline, value: { experience: { ...normalizeExperience(d.generationSettings.experience), tone: draft.tone, scope: normalizeExperience(d.generationSettings.experience).scope === 'B' ? 'C' : normalizeExperience(d.generationSettings.experience).scope, ...EXPERIENCE_PRESETS[draft.tone] } } })), act('Apply temporarily until I restore', () => h.action('tools_tone', { tone: draft.tone, baseline: JSON.stringify(normalizeExperience(d.generationSettings.experience)) })), act('Cancel tone change', () => { h.ui.moodReview = undefined; h.render(); }));
        mood.append(review);
    }
    if (d.tools?.temporaryTone)
        mood.append(act('Restore my previous tone', () => h.action('tools_restore_tone')));
    box.append(mood);
    const work = el('details'), estimate = discoveryEstimate(d);
    work.append(el('summary', '', 'What Find more will do'), el('p', '', `${estimate.ready} ${estimate.ready === 1 ? 'profile is' : 'profiles are'} ready; Find more aims for ${estimate.target}. ${estimate.deficit ? `Adding ${estimate.deficit} more usually takes about ${estimate.typicalCalls.join('–')} requests per new profile to your model.` : 'You already have enough ready, so Find more will not add anyone new.'} ${estimate.note}`));
    box.append(work);
    const activity = el('details');
    activity.append(el('summary', '', 'Activity summary'), el('p', '', `${d.profiles.length} saved people · ${d.decisions.filter(x => x.status === 'matched').length} matches · ${d.discoveryJob?.slots.filter(s => s.status === 'failed').length || 0} saved drafts needing attention. Counts describe retained app records, not online presence.`));
    box.append(activity);
    const blocked = d.profiles.filter(p => d.tools?.blocked.includes(p.id));
    if (blocked.length) {
        const restore = el('details');
        restore.append(el('summary', '', `Blocked dating profiles · ${blocked.length}`), el('p', '', 'Unblocking does not restore a match or ordinary access.'));
        for (const p of blocked)
            restore.append(act('Unblock ' + p.alias, () => h.action('tools_unblock', { profileId: p.id })));
        box.append(restore);
    }
    return box;
}
export function profileEvidenceTools(h: DatingHost, d: DatingState, p: DatingProfile): HTMLElement {
    const box = el('details', 'lumistry-evidence-tools');
    box.append(el('summary', '', 'About this card'));
    const highlight = publicHighlight(p, d.profiles, h.state.roleplayClockPrecision === 'exact' || h.state.roleplayClockSource === 'manual' ? (h.state.roleplayNow || '').slice(0, 10) : '');
    if (highlight)
        box.append(el('strong', '', 'A detail from their public profile'), el('p', '', highlight.text), el('small', '', 'Quoted from ' + highlight.source + '; not a live status update.'));
    const written = publicPresentationQuotes(p);
    for (const line of [...written.flags, ...written.style])
        box.append(el('p', '', `They wrote: “${line}”`));
    const added = d.tools?.published[p.id];
    if (added)
        box.append(el('p', '', `Added to your discovery pool: ${added}. This is app publication time, not an in-world signup date.`));
    const images = el('details');
    images.append(el('summary', '', 'Review rendered image consistency'), el('p', '', 'Inspect sends the selected image and relevant appearance guidance to your configured authoring model in one request. It must support vision. Cost depends on your provider. The report is advisory; it never rerenders or changes identity.'));
    p.photos.forEach((photo, index) => {
        if (photo.source.kind !== 'gallery')
            return;
        const imageId = photo.source.imageId;
        const run = act(`Inspect photo ${index + 1} · one model request`, () => h.action('image_check', { profileId: p.id, index, confirm: true }));
        run.disabled = !!h.ui.profileBusy || !h.generation;
        images.append(run);
        const report = d.tools?.imageReports?.find(r => r.profileId === p.id && r.imageId === imageId);
        if (report)
            images.append(el('p', '', report.identity === datingVisualIdentityKey(p) ? 'Advisory pixel inspection; not an identity guarantee.' : 'Older report: this appearance has changed since inspection.'), el('pre', '', report.summary));
    });
    if (p.photos.length)
        box.append(images);
    const provenance = el('details');
    provenance.append(el('summary', '', 'What is public here?'), el('p', '', 'Only the public profile and messages actually sent to you appear here. An interest match is not consent or access to private information.'));
    for (const fact of publicEvidence(p).slice(0, 8))
        provenance.append(el('strong', '', fact.source), el('p', '', fact.text));
    const shared = sharedConversationEvidence(h.state, h.owner, p.id);
    if (shared.length) {
        provenance.append(el('h3', '', 'What they have told you in this dating thread'));
        for (const m of shared)
            provenance.append(el('p', '', m.text));
    }
    const known = el('details');
    known.append(el('summary', '', 'What your profile shares with them'), el('pre', '', JSON.stringify(d.self ? publicDatingProfile(d.self) : {}, null, 2)), el('p', '', 'Your sent messages in this thread and explicitly authorized continuity can add knowledge. This does not expose their hidden thoughts or other conversations.'));
    provenance.append(known);
    box.append(provenance);
    if (p.id === 'self') {
        const tips = publicProfileTips(p);
        box.append(el('p', '', `Dating alias: ${p.alias}. Pocket Persona: ${h.state.pocketPersona.displayName || 'not supplied'}. These can intentionally differ; there is no automatic identity sync.`), el('strong', '', 'Optional profile ideas'), el('p', '', tips.join(' ') || 'Your introduction, questions and photo descriptions are present. There is no profile score.'), act('Read Persona into a review draft · model request', () => {
            if (h.generation && !h.ui.profileBusy)
                h.action('self_generate');
        }), el('p', '', 'Persona refresh creates a review draft. Your dating alias and disclosure choices may intentionally differ.'));
    }
    else {
        const saved = !!d.tools?.shortlist.includes(p.id);
        box.append(act(saved ? 'Remove from shortlist' : 'Save for later', () => h.action('tools_shortlist', { profileId: p.id, selected: !saved })));
        const block = el('details');
        block.append(el('summary', '', 'Block dating connection'), el('p', '', 'Stops this dating connection and archives its chat. It does not delete history, change ordinary Pocket access or erase established events.'), act('Confirm block', () => h.action('tools_block', { profileId: p.id, confirm: true })));
        box.append(block);
    }
    return box;
}
export function qualityTools(d: DatingState): HTMLElement { const box = el('details'); box.append(el('summary', '', 'Local population observations'), el('pre', '', JSON.stringify(localQualityReport(d), null, 2))); return box; }
export function sampleProfile(): HTMLElement { const box = el('details', 'lumistry-sample'); box.append(el('summary', '', 'See a fictional example first'), el('h3', '', 'Example only — Rowan, adult'), el('p', '', 'Usually found with a book, a small repair project, or a question I forgot to finish asking. Looking for someone who enjoys a little quiet company.'), el('p', '', 'Q: A good afternoon? A shared story and no rush.'), el('p', '', 'Photo description: An adult seated in a simple room, sleeves rolled up, looking toward the camera. This is an illustrative sample, not a saved person, match, world fact or image request.')); return box; }
