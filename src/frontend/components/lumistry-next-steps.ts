import {renderLoveMeter} from './lumistry-love.js';
import { connectionHistory } from '../../domain/lumistry-connection-tools.js';
import { nearbyEncounterPossible } from '../../domain/lumistry-location.js';
import { rememberedClaims, voiceObservations, settledMessage } from '../../domain/lumistry-experience-tools.js';
import type { PhoneState } from '../../types.js';
import { activeDatingMatch, needsStarter, openingStarters, dateActivities, invitationText, agreedDates, type DateInvitationDraft } from '../../domain/lumistry-discovery-view.js';
import { snapshotActivityClock } from '../../domain/activity-clock.js';
import { el, button } from '../shared.js';
export interface DatingNextSteps {
    toolsOpen?:boolean;
    note?: {
        messageId: string;
        quote: string;
        kind: string;
        field: string;
        value: string;
        baseline: string;
        dirty: boolean;
        open?: boolean;
        parentOpen?: boolean;
        lifeOpen?: boolean;
    };
    scope?: string;
    planner?: DateInvitationDraft;
    pending?: string;
}
export interface NextStepsHost {
    visible?:boolean;
    state: PhoneState;
    owner: string;
    conversationId: string;
    ui: DatingNextSteps;
    action?(action: string, payload?: Record<string, unknown>): void;
    valid(): boolean;
    draft(): string;
    stage(value: string): void;
    render(): void;
    openTimeline(id: string): void;
}
const action = (label: string, run: () => void) => { const b = button(label, 'lp-button'); b.type = 'button'; b.addEventListener('click', run); return b; };
/** Closed by default, with lazy content so hidden panels consume no chat area or change animation receipts. */
export function renderDatingNextSteps(h:NextStepsHost):HTMLElement {
 const root=el('div','lumistry-chat-tools'),m=activeDatingMatch(h.state,h.owner,h.conversationId);
 if(!m||!h.valid()){h.ui.toolsOpen=false;return root;}
 const scope=JSON.stringify([h.state.chatId,h.state.characterId,h.owner,h.conversationId]);
 if(h.ui.scope!==scope){h.ui.scope=scope;h.ui.toolsOpen=false;h.ui.planner=undefined;h.ui.pending=undefined;h.ui.note=undefined;}
 const toggle=action(h.ui.toolsOpen?'Close connection tools':'Connection tools',()=>{if(!h.valid()||h.ui.scope!==scope)return;h.ui.toolsOpen=!h.ui.toolsOpen;h.render();});toggle.classList.add('lumistry-chat-tools-toggle');toggle.setAttribute('aria-expanded',String(!!h.ui.toolsOpen));root.append(toggle);
 if(h.ui.toolsOpen){const panel=el('section','lumistry-chat-tools-panel');panel.setAttribute('aria-label','Connection tools');panel.append(renderLoveMeter(h.state,m.p.id,h.action,false,h.visible!==false),renderDatingToolsContent(h));root.append(panel);}
 return root;
}
function renderDatingToolsContent(h: NextStepsHost): HTMLElement {
    const box = el('div', 'lumistry-next-steps');
    const m = activeDatingMatch(h.state, h.owner, h.conversationId);
    if (!m || !h.valid()) {
        h.ui.scope = undefined;
        h.ui.planner = undefined;
        h.ui.pending = undefined;
        h.ui.note = undefined;
        return box;
    }
    const scope = JSON.stringify([h.state.chatId, h.state.characterId, h.owner, h.conversationId]);
    if (h.ui.scope !== scope) {
        h.ui.scope = scope;
        h.ui.planner = undefined;
        h.ui.pending = undefined;
        h.ui.note = undefined;
    }
    const stage = (text: string) => {
        if (!h.valid())
            return;
        if (h.draft().trim()) {
            h.ui.pending = text;
            h.render();
        }
        else {
            h.stage(text);
            h.ui.pending = undefined;
            h.ui.planner = undefined;
            h.render();
        }
    };
    if (h.ui.pending) {
        const pending = h.ui.pending;
        const review = el('section', 'lumistry-stage-review');
        review.setAttribute('aria-label', 'Review draft change');
        review.append(el('p', '', 'Your composer already contains text.'), el('p', '', h.ui.pending));
        for (const label of ['Add to draft', 'Replace draft', 'Cancel'])
            review.append(action(label, () => {
                if (!h.valid() || h.ui.pending !== pending)
                    return;
                if (label !== 'Cancel')
                    h.stage(label === 'Add to draft' ? h.draft() + '\n\n' + pending : pending);
                h.ui.pending = undefined;
                if (label !== 'Cancel')
                    h.ui.planner = undefined;
                h.render();
            }));
        box.append(review);
        return box;
    }
    if (h.ui.planner) {
        const v = h.ui.planner;
        const editor = el('section', 'lumistry-date-editor');
        editor.setAttribute('aria-label', 'Plan a date');
        editor.append(el('strong', '', 'Plan a date'), el('p', '', 'Prepare an invitation. A date is agreed only after both of you agree in chat.'));
        const use = action('Use invitation', () => {
            if (h.ui.planner === v && v.activity.trim())
                stage(invitationText(v));
        });
        use.disabled = !v.activity.trim();
        for (const [key, label] of [['activity', 'Activity'], ['place', 'Place (optional)'], ['when', 'When (story time)']] as const) {
            const wrap = el('label', 'lp-field'), input = el('input');
            input.value = v[key];
            input.type = 'text';
            if (key === 'activity') {
                input.required = true;
                input.setAttribute('aria-required', 'true');
            }
            input.addEventListener('input', () => {
                v[key] = input.value;
                if (key === 'activity')
                    use.disabled = !input.value.trim();
            });
            wrap.append(document.createTextNode(label), input);
            editor.append(wrap);
        }
        const choices = el('div', 'lumistry-actions');
        for (const idea of dateActivities(m.d, m.p))
            choices.append(action(idea, () => {
                if (!h.valid() || h.ui.planner !== v)
                    return;
                v.activity = idea;
                h.render();
            }));
        editor.append(choices);
        const clock = snapshotActivityClock(h.state);
        editor.append(el('p', 'lp-copy', clock.storyAt ? `Story clock: ${clock.storyAt}` : clock.storyTimeLabel ? `Story time: ${clock.storyTimeLabel}` : 'Story calendar unknown. Describe the timing in your own words.'));
        editor.append(use, action('Cancel', () => {
            if (!h.valid() || h.ui.planner !== v)
                return;
            h.ui.planner = undefined;
            h.render();
        }));
        box.append(editor);
        return box;
    }
    const more = el('details', 'lumistry-chat-next');
    more.append(el('summary', '', 'Conversation ideas'));
    if (needsStarter(h.state, h.owner, h.conversationId)) {
        more.append(el('p', '', 'Start with something public from their profile.'));
        for (const text of openingStarters(m.p, m.d.populationWorld))
            more.append(action(text, () => stage(text)));
    }
    const recent = m.c.messages.filter(m=>settledMessage(m,h.state)).slice(-4);
    if (recent.length) {
        const recap = el('details');
        recap.append(el('summary', '', 'Where you left off'));
        for (const message of recent)
            recap.append(el('p', '', (message.sender === 'persona' ? 'You: ' : m.p.alias + ': ') + (message.text || message.datingPhoto?.description || 'Photo attachment')));
        more.append(recap);
    }
    const connection = connectionHistory(h.state, h.owner, h.conversationId);
    if (connection) {
        const history = el('details');
        history.append(el('summary', '', 'This conversation'), el('p', '', connection.rhythm));
        if (connection.pause)
            history.append(el('p', '', 'Pocket records this conversation as paused. Silence alone does not mean rejection.'));
        if (connection.matchedStoryAt || connection.matchedStoryLabel)
            history.append(el('p', '', `Recorded story time at matching: ${connection.matchedStoryAt || connection.matchedStoryLabel}`));
        if (connection.daysSinceMatch !== undefined)
            history.append(el('p', '', `${connection.daysSinceMatch} story days since the recorded match. No inactivity penalty applies.`));
        for (const e of connection.completed)
            history.append(el('p', '', `Established completed event: ${e.title}${e.whenText ? ' — ' + e.whenText : ''}`));
        if (connection.canReflect)
            history.append(action('Reflect on an established date', () => stage('I have been thinking about our time together. What did you think of it?')));
        more.append(history);
    }
    const relationship = el('details');
    relationship.append(el('summary', '', 'Talk about the connection'));
    for (const [label, text] of [['Talk about taking it slowly', 'Would you be interested in taking this slowly and getting to know each other first?'], ['Talk about casual dating', 'Would casual dating be something you would want, or are you looking for something different?'], ['Talk about longer-term intentions', 'What would you want from a longer-term connection, if we get there?'], ['Ask about exclusivity', 'How do you feel about exclusivity and seeing other people? You can keep anything private that you do not want to share.'], ['Draft a closure message', 'I do not want to continue this dating connection. I wanted to say that clearly rather than leave you guessing.']] as const)
        relationship.append(action(label, () => stage(text)));
    relationship.append(el('p', '', 'These are editable questions or your own proposed message. They do not assign a relationship, reveal rivals, send themselves or end the match automatically.'));
    if (h.action) {
        if (nearbyEncounterPossible(m.p, m.d))
            relationship.append(action('Make available for a possible encounter', () => {
                if (h.valid())
                    h.action!('encounter', { profileId: m.p.id });
            }));
        const end = el('details');
        end.append(el('summary', '', 'End this match'), el('p', '', 'Archives this dating thread and stops its replies. History remains. Review any changed agreements in Timeline explicitly.'), action('Confirm end match', () => {
            if (h.valid())
                h.action!('unmatch', { profileId: m.p.id });
        }));
        relationship.append(end);
    }
    more.append(relationship);
    const photos = el('details');
    photos.append(el('summary', '', 'Photos and shared moments'));
    for (const [label, text] of [['Ask what they are up to', 'Would you like to share a photo of what you are up to? Only if you feel like it.'], ['Ask for an occasion photo', 'Would you like to send a photo from an occasion you choose? No pressure.'], ['Ask about a received photo', "What's the story behind the photo you sent?"]] as const) {
        if (label === 'Ask about a received photo' && !m.c.messages.some(x => settledMessage(x,h.state) && x.sender !== 'persona' && x.datingPhoto))
            continue;
        photos.append(action(label, () => stage(text)));
    }
    more.append(photos);
    if (h.action) {
        const shared = el('details');
        shared.append(el('summary', '', 'Remember something they shared'), el('p', '', 'Save an exact statement as a thread note. It remains a claim they made, not proof of a new job, location, meeting or relationship.'));
        const select = el('select', 'lp-select');
        select.setAttribute('aria-label', 'Their statement');
        const messages = m.c.messages.filter(x => settledMessage(x,h.state) && (x.senderActorId || x.senderContactId) === m.p.contactId && x.text).slice(-8);
        const note = h.ui.note ||= { messageId: messages[0]?.id || '', quote: messages[0] && messages[0].text.length <= 800 ? messages[0].text : '', kind: 'life', field: 'work', value: '', baseline: '', dirty: false };
        shared.open = note.open ?? note.dirty;
        more.open = note.parentOpen ?? (more.open || note.dirty);
        shared.querySelector('summary')!.addEventListener('click', () => { note.open = !shared.open; });
        more.querySelector('summary')!.addEventListener('click', () => { note.parentOpen = !more.open; });
        for (const msg of messages) {
            const option = el('option', '', msg.text.length > 100 ? msg.text.slice(0, 100) + '…' : msg.text);
            option.value = msg.id;
            select.append(option);
        }
        if (note.messageId && !messages.some(x => x.id === note.messageId)) {
            const missing = el('option', '', 'The selected statement is no longer available');
            missing.value = note.messageId;
            select.append(missing);
        }
        select.value = note.messageId;
        const quote = el('textarea', 'lp-textarea');
        quote.setAttribute('aria-label', 'Exact quote');
        quote.maxLength = 800;
        quote.value = note.quote;
        quote.addEventListener('input', () => { note.quote = quote.value; note.dirty = true; updateNoteControls(); });
        select.addEventListener('change', () => { const msg = messages.find(x => x.id === select.value); note.messageId = select.value; quote.value = note.quote = msg && msg.text.length <= 800 ? msg.text : ''; note.dirty = true; note.value = ''; value.value = ''; note.baseline = ''; updateNoteControls(); });
        const kind = el('select', 'lp-select');
        kind.setAttribute('aria-label', 'Note category');
        for (const value of ['life', 'place', 'routine', 'companion', 'style']) {
            const option = el('option', '', value);
            option.value = value;
            kind.append(option);
        }
        kind.value = note.kind;
        kind.addEventListener('change', () => { note.kind = kind.value; note.dirty = true; });
        const save = action('Remember this statement', () => {
            if (h.valid())
                h.action!('tools_note', { conversationId: h.conversationId, messageId: select.value, kind: kind.value, quote: quote.value });
        });
        save.disabled = !messages.some(x => x.id === note.messageId);
        shared.append(select, quote, kind, save);
        for (const n of rememberedClaims(h.state, h.owner, h.conversationId))
            shared.append(el('p', '', n.kind + ': ' + n.quote));
        const life = el('details');
        life.append(el('summary', '', 'Review a current-life change'), el('p', '', 'For a Lumistry-created person, explicitly accept a current work, home, routine or pressure value they have already stated. Creation provenance, identity, public profile and relationship stay intact. Established Bank characters use their native editor.'));
        const field = el('select', 'lp-select');
        field.setAttribute('aria-label', 'Current-life field');
        for (const key of ['work', 'residence', 'routine', 'pressure']) {
            const o = el('option', '', key);
            o.value = key;
            field.append(o);
        }
        field.value = note.field;
        field.addEventListener('change', () => { note.field = field.value; note.dirty = true; });
        const value = el('input', 'lp-input');
        value.setAttribute('aria-label', 'Exact new value from the quote');
        value.maxLength = 800;
        value.value = note.value;
        value.addEventListener('input', () => { note.value = value.value; note.dirty = true; note.baseline ||= JSON.stringify([m.p.privateFields, m.p.development?.revision]); updateNoteControls(); });
        life.open = note.lifeOpen ?? !!note.value;
        life.querySelector('summary')!.addEventListener('click', () => { note.lifeOpen = !life.open; });
        const accept = action('Accept this stated current-life value', () => {
            if (h.valid())
                h.action!('tools_life_update', { profileId: m.p.id, conversationId: h.conversationId, messageId: select.value, quote: quote.value, field: field.value, value: value.value, baseline: note.baseline, confirm: true });
        });
        accept.disabled = !m.p.id.startsWith('dating_npc_') || !m.p.development || !messages.some(x => x.id === note.messageId) || !note.value.trim();
        const stale = el('p', '', 'The saved character changed while this form was open. Your unsaved values are kept; clear the form and review the new baseline before accepting.');
        const updateNoteControls = () => { const source = messages.find(x => x.id === note.messageId); const valid = !!source && !!note.quote.trim() && source.text.includes(note.quote); save.disabled = !valid; const changed = !!note.baseline && note.baseline !== JSON.stringify([m.p.privateFields, m.p.development?.revision]); stale.hidden = !changed; accept.disabled = !valid || !m.p.id.startsWith('dating_npc_') || !m.p.development || !note.value.trim() || !note.quote.includes(note.value) || changed || !note.baseline; };
        life.append(field, value, stale, accept);
        updateNoteControls();
        shared.append(life, action('Clear this unsaved form', () => {
            if (!h.valid())
                return;
            h.ui.note = undefined;
            h.render();
        }));
        more.append(shared);
        const voice = el('details');
        voice.append(el('summary', '', 'Voice and rehearsal'), el('pre', '', JSON.stringify(voiceObservations(h.state, h.owner, h.conversationId), null, 2)));
        if (m.d.generationSettings.experience?.voiceLab && m.p.development)
            voice.append(action('Practice talking · one model request, not canon', () => {
                if (h.valid())
                    h.action!('voice_lab', { profileId: m.p.id });
            }));
        if (m.p.development?.voiceLab)
            voice.append(el('p', '', 'Private rehearsal only — these lines were not sent and establish no events.'), el('pre', '', m.p.development.voiceLab.text));
        more.append(voice);
    }
    more.append(action('Plan a date', () => {
        if (!h.valid())
            return;
        h.ui.planner = { activity: '', place: '', when: '' };
        h.render();
    }));
    more.append(renderAgreedDateSummaries(h.state, h.owner, h.conversationId, id => {
        if (h.valid())
            h.openTimeline(id);
    }));
    box.append(more);
    return box;
}
export function renderAgreedDateSummaries(state: PhoneState, owner: string, id: string, open: (id: string) => void): HTMLElement {
    const box = el('div', 'lumistry-agreed-plans');
    for (const row of agreedDates(state, owner, id)) {
        const summary = el('div', 'lumistry-agreed-plan');
        summary.append(el('p', '', `Agreed plan: ${row.event.title}${row.event.whenText ? ' — ' + row.event.whenText : ''}. Attendance is not established.`));
        if (row.timeline)
            summary.append(action('Open event', () => {
                const current = agreedDates(state, owner, id).find(x => x.event.id === row.event.id);
                if (current?.timeline)
                    open(current.timeline.id);
            }));
        box.append(summary);
    }
    return box;
}
