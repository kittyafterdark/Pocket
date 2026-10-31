import {interestContext} from '../src/domain/lumistry-compatibility.js';
import { expect, test } from 'bun:test';
import { Lumistry } from '../src/backend/lumistry.js';
import { normalizeDating, normalizeDatingProfile, datingFor, publicDatingProfile, datingReplyMessages } from '../src/domain/lumistry.js';
import { parseAuthoring, projectDossier, projectPublic, projectPhotos, normalizeAuthoring, photoArtifacts, identityIssues, publicRepair } from '../src/domain/lumistry-v2.js';
import { normalizeDiscoveryJob, verifiedPhotoCompilation, discoveryUsageSummary } from '../src/domain/lumistry-pipeline.js';
import { normalizeExperience, socialOpportunity } from '../src/domain/lumistry-experience.js';
import { selectDatingPresentation, DATING_TROPES, allowsEmptyDatingBio } from '../src/domain/lumistry-tropes.js';
import { v2AuthorPrompt } from '../src/backend/lumistry-v2-prompts.js';
import { V2_GUIDANCE } from '../src/domain/lumistry-v2-template.js';
import { compileDatingVisual } from '../src/domain/lumistry-visual.js';
import type { PhoneState } from '../src/types.js';
import { dossier, publicText, photo } from './fixtures/lumistry-v2.js';
function authored(text: string, kind: any = 'dossier') { return parseAuthoring(text, kind, 'stop'); }
function identity(text = dossier()) {
    const a: any = { version: 2, dossier: authored(text), photos: [], gallery: [], provenance: {} };
    return { ...projectDossier(a, {}, 'slot_0', 2), a };
}
import {lumistryHarness as harness} from './fixtures/lumistry-harness.js';
async function retryFailed(h:ReturnType<typeof harness>,manual=false){
 const job=h.state.lumistry.owner[manual?'draftJob':'discoveryJob'];
 for(const slot of job?.slots.filter(x=>x.status==='failed'&&!x.quarantinedProgress)||[])await h.app.handle({action:'retry_slot',slotId:slot.id,manual,requestId:'explicit-retry'},{chatId:'c',characterId:'a'},'u');
}
test('source-derived original V2 guidance has 56 dossier fields and canonical optional intimacy policy', () => {
    expect(V2_GUIDANCE['1A — Guided original dossier']).toHaveLength(56);
    for (const task of ['dossier', 'index', 'public', 'photos', 'match', 'portrayal', 'voiceLab'] as const) {
        const p = v2AuthorPrompt(task);
        expect(p).toContain('All prose and dialogue samples are English');
        expect(p).not.toContain('100 words');
        expect(p).not.toContain('66 and 100');
        expect(p).not.toContain('Caption target 180, maximum 600');
        if(task==='photos')expect(p).toContain('Public caption maximum 180 characters.');
        expect(p).not.toContain('@@ lumistry');
        expect(p).toContain('Do not invent an intimacy inventory');
    }
    expect(identity().problems).toEqual([]);
    expect(identity().row.person.intimacy.kinks).toBe('');
});
test('prose labels tolerate bold, wrapped lines and optional decoration without JSON interpretation', () => {
    const d = identity(dossier().replace('Hair: dark brown short waves', '**Hair:** dark brown\nshort waves') + '\nPresentation: []');
    expect(d.problems).toEqual([]);
    expect(d.row.person.appearance.hair).toBe('dark brown\nshort waves');
    expect(d.row.person.availability.routine).toBe('Usually checks after closing the shop.');
    expect(d.row.person.availability.minReplySeconds).toBe(10);
    expect(d.row.fields.interests).toBe('books, coffee');
    expect(d.row.privateFields.independentGoal).toContain('daylight');
});
test('conflicting required labels are unresolved; missing facts do not become defaults', () => {
    const d = identity(dossier() + '\nAge and life stage: 19');
    expect(d.problems).toContain('Exact adult age');
    const missing = identity(dossier().replace('Existing relationship and commitments: Single; no exclusivity agreements.', 'Existing relationship and commitments: Not established.'));
    expect(missing.problems).toContain('Existing commitments');
    expect(missing.row.privateFields.commitments).toBeUndefined();
});
test('index maps canonical options and units without overwriting an explicit required conflict', () => {
    const d = identity();
    d.a.index = authored('Category occupation: skilled-trades\nCategory height: 5 ft 6 in', 'index');
    let p = projectDossier(d.a, {}, 'slot_0', 2);
    expect(p.row.fields.occupation).toBe('tradesperson');
    expect(p.row.fields.height).toBe('168 cm');
    p = projectDossier(d.a, { gender: 'man' }, 'slot_0', 2);
    expect(p.problems).toContain('Category gender: preserve the selected required alternative');
    expect(p.row.fields.gender).toBe('woman');
});
test('public projection needs complete questions and all selected gallery purposes; cannot change disclosure', () => {
    const d = identity(), p = projectPublic(authored(publicText(3, 5) + '\nPublic categories: orientation', 'public'), d.row, 3, 5);
    expect(p.problems).toEqual([]);
    expect(p.row.hiddenFields).toEqual(d.row.hiddenFields);
    expect(p.gallery).toHaveLength(5);
    expect(p.row.person.prompts).toHaveLength(3);
    expect(projectPublic(authored(publicText(1, 2), 'public'), d.row, 2, 3).problems).toHaveLength(2);
});
test('photo adapter survives normalize/compiler; pet-only, group and scenery remain distinct', () => {
    const d = identity(dossier('Aster', '### Companion\nCompanion name: Pip\nCompanion kind: pet\nCompanion appearance: small white dog with one black ear\nCompanion relationship: owner’s dog'));
    for (const subjects of ['owner', 'Pip', 'owner, Pip', 'none']) {
        const p = projectPhotos(authored(photo('A literal workshop photograph.', subjects), 'photos'), d.row, 1);
        expect(p.problems).toEqual([]);
        const n = normalizeDatingProfile({ ...d.row, photoPlan: p.photos })!;
        expect(n.photoPlan).toHaveLength(1);
        expect(verifiedPhotoCompilation(n)).toBe(true);
        const compiled = compileDatingVisual(n, n.photoPlan[0].visual, n.photoPlan[0].prompt, n.photoPlan[0].subjectIds);
        expect(compiled).not.toContain('<region');
        if (subjects === 'none') {
            expect(compiled).not.toContain('Person A');
            expect(compiled).not.toContain('brown');
        }
        if (subjects === 'Pip') {
            expect(compiled).toContain('one black ear');
            expect(compiled).not.toContain('dark brown short waves');
        }
    }
    expect(projectPhotos(authored(photo('A scene', 'unregistered friend'), 'photos'), d.row, 1).problems.some(x => x.includes('unrecognized'))).toBe(true);
});
test('truncation retains complete earlier photo units and never pretends the last is complete', () => {
    const a = parseAuthoring(photo() + '\n' + photo().replace(/END PHOTO\.$/, ''), 'photos', 'length');
    const units = photoArtifacts(a);
    expect(units).toHaveLength(2);
    expect(units[0].complete).toBe(true);
    expect(units[1].complete).toBe(false);
});
test('V2 uses native plain text, persists accepted artifacts, publishes complete galleries and creates no contacts', async () => {
    const h = harness();
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    const p = h.state.lumistry.owner.profiles.at(-1)!;
    expect(p.authoring?.dossier?.text).toContain('Independent goal');
    expect(p.person?.prompts.length).toBeGreaterThanOrEqual(1);
    expect(p.photoPlan.length).toBe(h.calls[0].req.counts.photos);
    expect(verifiedPhotoCompilation(p)).toBe(true);
    expect(h.state.contacts).toEqual([]);
    expect(h.state.conversations).toEqual([]);
    expect(h.calls.every(x => x.task === 'lumistry-author')).toBe(true);
    expect(h.calls.some(x => x.req.task === 'index')).toBe(false);
    expect(h.calls.every(x => !x.input.messages[1].content.includes('PRIVATE OWNER SECRET'))).toBe(true);
    expect(publicDatingProfile(p)).not.toHaveProperty('authoring');
    expect(normalizeDating(h.state.lumistry.owner).profiles.at(-1)?.authoring?.dossier?.text).toBe(p.authoring?.dossier?.text);
});
test('missing disclosure is authored explicitly rather than invented by an organizer', async () => {
    const h = harness();let first=true;
    h.generate=async req=>{const r=h.response(req);if(req.task==='dossier'){if(first){first=false;r.authoredText=r.authoredText.replace(/Public categories:[^\n]+\n/,'');}else r.authoredText='Public categories: gender, occupation, height, interests, intentions';}return r;};
    await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(x=>x.req.task==='dossier')).toHaveLength(2);expect(h.calls.filter(x=>x.req.task==='index')).toHaveLength(0);
    expect(h.calls[1].req.requestedUnresolved).toContain('Public categories');
});
test('bad photo caption retains other complete photos and repair requests only failed slots', async () => {
    const h = harness();
    let bad = false;
    h.generate = async (req) => { const r = h.response(req); if (req.task === 'photos' && !bad) {
        bad = true;
        const units = photoArtifacts(authored(r.authoredText, 'photos'));
        r.authoredText = units.map((u, i) => i === 0 ? u.text.replace('Public caption: it lives', 'Public caption: ' + 'x'.repeat(601)) : u.text).join('\n');
    } return r; };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    const photoCalls = h.calls.filter(x => x.req.task === 'photos');
    expect(photoCalls[1].req.batchCount).toBe(1);
    expect(photoCalls[1].req.retainedPhotoRecords[0]).toContain('x'.repeat(601));
});
test('provider error stops one request; Find more resumes same plan and retains accepted dossier', async () => {
    const h = harness();
    let failed = false;
    h.generate = async (req) => { if (req.task === 'public' && !failed) {
        failed = true;
        throw new Error('provider unavailable');
    } return h.response(req); };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(24);
    expect(h.state.lumistry.owner.discoveryJob?.slots[0].progress?.authored.dossier?.text).toContain('New Aster');
    const plan = structuredClone(h.state.lumistry.owner.discoveryJob?.slots[0].selection);
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(x => x.req.task === 'dossier')).toHaveLength(1);
    expect(h.state.lumistry.owner.discoveryJob?.slots[0].selection).toEqual(plan);
});
test('cancel and scope switch reject a late model result without destroying earlier accepted artifacts', async () => {
    const h = harness();
    h.generate = async (req) => { if (req.task === 'public')
        await h.app.handle({ action: 'cancel' }, { chatId: 'c', characterId: 'a' }, 'u'); return h.response(req); };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(24);
    expect(h.state.lumistry.owner.discoveryJob?.slots[0].progress?.authored.dossier).toBeDefined();
});
test('generation settings changes preserve active snapshot while filters reject late results', async () => {
    const h = harness();
    h.generate = async (req) => { if (req.task === 'public')
        h.state.lumistry.owner.generationSettings.experience = normalizeExperience({ scope: 'C', tone: 'chaotic' }); return h.response(req); };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.at(-1).req.experience.scope).toBe('A');
    const g = harness();
    g.generate = async (req) => { g.state.lumistry.owner.filters.maxKm = 0; return g.response(req); };
    await expect(g.run()).rejects.toThrow('context changed');
    expect(g.state.lumistry.owner.profiles).toHaveLength(24);
});
test('V2 deliberately does not resume old jobs; saved published profiles remain intact', () => {
    expect(normalizeDiscoveryJob({ version: 1, id: 'old', fingerprint: 'f', slots: [] })).toBeUndefined();
    expect(normalizeDating({ profiles: [{ alias: 'Saved', age: 29 }], discoveryJob: { version: 1, id: 'old', fingerprint: 'f', slots: [] } }).profiles[0].alias).toBe('Saved');
});
test('experience scopes, trope pools and optional social proposals cannot guarantee outcomes', () => {
    expect(DATING_TROPES).toHaveLength(61);
    expect(DATING_TROPES.filter(t => t.main)).toHaveLength(9);
    expect(selectDatingPresentation(false, '', () => 0, normalizeExperience({ tropeRate: 0 })).tropes).toEqual([]);
    expect(selectDatingPresentation(false, '', () => 0, normalizeExperience({ tropeRate: 100 })).tropes[0].main).toBe(true);
    const messages = [{ id: '1', sender: 'persona', text: 'hi' }, { id: '2', sender: 'contact', text: 'hello' }];
    expect(socialOpportunity(normalizeExperience({ scope: 'A', socialLift: 100 }), messages, true)).toBeUndefined();
    expect(socialOpportunity(normalizeExperience({ scope: 'C', socialLift: 100 }), messages, false)).toBeUndefined();
});
test('unknown organizer sentinels stay unknown and reviewed custom categories round-trip', () => {
    const a = identity(dossier('Aster', 'Category species: android').replace(/Public categories:[^\n]+/, 'Public categories: species'));
    const projection = projectDossier(a.a, {}, 'slot', 2, { species: ['human', 'android'] });
    expect(projection.row.fields.species).toBe('android');
    expect(projection.needsDisclosure).toBe(false);
    a.a.dossier = authored(dossier().replace(/Actual orientation and attraction:[^\n]+\n/, ''));
    a.a.index = authored('Actual orientation: NOT_ESTABLISHED', 'index');
    expect(projectDossier(a.a, {}, 'slot', 2).problems).toContain('Actual orientation');
    const invalid=identity(dossier('Aster','### Companion\nCompanion name: owner\nCompanion kind: adult\nCompanion appearance: red hair\nCompanion relationship: friend'));expect(invalid.row.person.entities).toHaveLength(0);expect(invalid.row.person.unresolvedSubjects[0].name).toBe('owner');
});
test('public projection rejects a withheld real name and requires a bio except a selected sparse premise', () => {
    const id = identity(dossier('Aster').replace('Name and dating alias: Aster', 'Name and dating alias: Daisy North; app: Aster')).row;
    expect(projectPublic(authored(publicText(2, 1, 'Daisy North at your service'), 'public'), id, 2, 1).problems).toContain('Public prose reveals the private real name');
    expect(projectPublic(authored(publicText(2, 1, ''), 'public'), id, 2, 1).problems.length).toBeGreaterThan(0);
    expect(projectPublic(authored(publicText(2, 1, ''), 'public'), id, 2, 1, true).problems).toEqual([]);
});
test('organizer cannot rewrite accepted appearance while extracting disclosure', async () => {
    const h = harness();
    h.generate = async (req) => req.task === 'dossier' ? { authoredText: dossier('New Aster').replace('Anonymous profile: no', 'Anonymous profile: I do not hide my identity.'), finishReason: 'stop' } : req.task === 'index' ? { authoredText: 'Anonymous profile: no\nHair: red curls', finishReason: 'stop' } : h.response(req);
    await h.run();
    const data = h.state.lumistry.owner;
    expect(data.profiles).toHaveLength(25);
    expect(data.profiles.at(-1)?.person.appearance.hair).toContain('dark brown short waves');
    expect(data.profiles.at(-1)?.person.appearance.hair).not.toContain('red curls');
    expect(data.discoveryJob?.metrics.some(m=>m.discardedLabels?.includes('Hair'))).toBe(true);
});
test('single manual draft uses V2 and waits for review without publishing or creating a contact', async () => {
    const h = harness();
    await h.app.handle({ action: 'generate', description: 'A night-shift bicycle mechanic', requestId: 'manual' }, { chatId: 'c', characterId: 'a' }, 'u');
    const draft = h.sent.find(x => x.phase === 'draft')?.draft;
    expect(draft?.authoring.version).toBe(2);
    expect(draft?.photoPlan.length).toBeGreaterThan(0);
    expect(verifiedPhotoCompilation(draft)).toBe(true);
    expect(h.state.lumistry.owner.profiles).toHaveLength(24);
    expect(h.state.contacts).toHaveLength(0);
    expect(h.calls.every(x => x.task === 'lumistry-author')).toBe(true);
});
test('item rewrite returns a review draft changing exactly one answer', async () => {
    const h = harness();
    await h.run();
    const profile = h.state.lumistry.owner.profiles.at(-1)!, before = structuredClone(profile);
    h.generate = async () => ({ authoredText: 'Answer: the lamp stopped flickering', finishReason: 'stop' });
    await h.app.handle({ action: 'rewrite_item', profileId: profile.id, target: 'answer', index: 0, requestId: 'rewrite' }, { chatId: 'c', characterId: 'a' }, 'u');
    const draft = h.sent.find(x => x.phase === 'edit_draft')?.draft;
    expect(draft.person.prompts[0].answer).toBe('the lamp stopped flickering');
    const expected = structuredClone(before);
    expected.person!.prompts[0].answer = 'the lamp stopped flickering';
    expect(draft).toEqual(expected);
    expect(h.state.lumistry.owner.profiles.at(-1)).toEqual(before);
});
test('voice rehearsal is editor-only and does not enter replies or establish events', async () => {
    const h = harness();
    await h.run();
    const s = h.state, p = s.lumistry.owner.profiles.at(-1)!;
    p.interest = { version: 2, status: 'matched', seen: true, context:interestContext(datingFor(h.state)) };
    s.lumistry.owner.generationSettings.experience = normalizeExperience({ voiceLab: true });
    h.state = s;
    await h.app.handle({ action: 'like', profileId: p.id }, { chatId: 'c', characterId: 'a' }, 'u');
    h.generate = async () => ({ authoredText: 'DIAGNOSTIC REHEARSAL ONLY', finishReason: 'stop' });
    await h.app.handle({ action: 'voice_lab', profileId: p.id, requestId: 'lab' }, { chatId: 'c', characterId: 'a' }, 'u');
    const updated = h.state;
    expect(h.calls.at(-1)?.input.parameters).toBeUndefined();
    expect(updated.lumistry.owner.profiles.at(-1)?.development?.voiceLab?.text).toBe('DIAGNOSTIC REHEARSAL ONLY');
    expect(updated.events).toHaveLength(0);
    const c = updated.conversations.find(c => c.channel === 'dating')!;
    expect(JSON.stringify(datingReplyMessages(updated, c, 'reply'))).not.toContain('DIAGNOSTIC REHEARSAL ONLY');
});
test('full photo prose survives short camera fields and compilation after canonical save/reload', () => {
    const row = identity().row, description = ('A plainly visible lamp, cables and tools fill the workshop bench. '.repeat(15) + 'A yellow mug sits at the far end.').trim();
    expect(description.length).toBeGreaterThan(500);
    const projected = projectPhotos(authored(photo(description), 'photos'), row, 1);
    expect(projected.problems).toEqual([]);
    const saved = normalizeDatingProfile({ ...row, photoPlan: projected.photos })!;
    const reload = normalizeDatingProfile(JSON.parse(JSON.stringify(saved)))!;
    expect(reload.photoPlan[0].description).toBe(description);
    expect(reload.photoPlan[0].visual?.description).toBe(description);
    expect(compileDatingVisual(reload, reload.photoPlan[0].visual, reload.photoPlan[0].prompt, ['self'])).toContain(description);
    expect(verifiedPhotoCompilation(reload)).toBe(true);
});
test('invalid organizer scope does not erase the original unresolved labels on resume', async () => {
    const h = harness();
    let bad = true;
    h.generate = async (req) => req.task === 'dossier' ? { authoredText: dossier('New Aster').replace('Anonymous profile: no', 'Anonymous profile: I do not hide my identity.'), finishReason: 'stop' } : req.task === 'index' ? { authoredText: bad ? 'Hair: red curls' : 'Anonymous profile: no', finishReason: 'stop' } : h.response(req);
    await h.run();
    expect(h.state.lumistry.owner.discoveryJob?.slots[0].progress?.problems.join(' ')).toContain('Anonymous profile');
    bad=false;await retryFailed(h);
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(c => c.req.task === 'dossier')).toHaveLength(1);
});
test('known absence differs from unknown and ordinary category equivalents extract locally', () => {
    const a = identity(dossier('Aster').replace('Category occupation: tradesperson', 'Occupation or role: lawyer; environmental cases').replace('Single; no exclusivity agreements.', 'NONE_ESTABLISHED'));
    expect(a.row.privateFields.commitments).toBe('None established.');
    expect(a.problems).toEqual([]);
    expect(a.row.fields.occupation).toBe('law');
});
test('recent trope weighting rotates presentation families without excluding the original main seeds', () => {
    const sequence = (...v: number[]) => () => v.shift() ?? .99;
    const first = selectDatingPresentation(false, '', sequence(.01, .05));
    const rotated = selectDatingPresentation(false, '', sequence(.01, .05), undefined, '', ['fish-photo']);
    expect(first.tropes[0].id).toBe('fish-photo');
    expect(rotated.tropes[0].id).not.toBe('fish-photo');
    expect(DATING_TROPES.filter(t => t.main)).toHaveLength(9);
});

test('the actual empty-bio trope permits silence while a rejected blank bio can be corrected',()=>{
 const plan={flavor:'sparse',tropes:[DATING_TROPES.find(t=>t.id==='empty-bio-beauty')!]};expect(allowsEmptyDatingBio(plan)).toBe(true);
 const before=authored(publicText(2,1,''),'public'),next=authored(publicText(2,1,'one lamp fixed'),'public');expect(()=>publicRepair(before,next)).not.toThrow();expect(()=>publicRepair(before,next,true)).toThrow('already authored');
});

test('required plan alternatives never hide explicit contradictory gender, height or orientation',()=>{
 const a=identity(dossier('Aster').replace('Gender and pronouns: woman; she/her','Gender and pronouns: man; he/him').replace('Category gender: woman','').replace('Height and build: 168 cm','Height and build: 190 cm').replace('Bisexual; drawn','Gay; drawn')).a;
 const p=projectDossier(a,{gender:'woman',height:'168 cm',orientation:'straight'},'slot',2);expect(p.row.fields.gender).toBe('man');expect(p.row.fields.height).toBe('190 cm');expect(p.row.fields.orientation).toBe('gay');expect(p.problems.filter(x=>x.startsWith('Category '))).toHaveLength(3);
});

test('truncated dossier correction receives its retained baseline and completes only the unfinished field',async()=>{
 const h=harness();let first=true;h.generate=async(req)=>{if(req.task==='dossier'){if(first){first=false;return {authoredText:dossier('New Aster').replace(/Independent goal:[\s\S]*/,'Independent goal: Find a workshop'),finishReason:'length'};}expect(req.repair.retainedFields['Public alias']).toBeUndefined();expect(req.repair.retainedFields['Independent goal']).toBe('Find a workshop');return {authoredText:'Independent goal: Find a workshop with more daylight.',finishReason:'stop'};}return h.response(req);};await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.calls.filter(c=>c.req.task==='dossier')).toHaveLength(2);expect(h.state.lumistry.owner.profiles.at(-1)?.privateFields.independentGoal).toBe('Find a workshop with more daylight.');
});

test('explicitly discarding an unfinished job keeps all published people and makes no generation call',async()=>{
 const h=harness();h.generate=async(req)=>req.task==='public'?{authoredText:'Bio: incomplete',finishReason:'stop'}:h.response(req);await h.run();const published=structuredClone(h.state.lumistry.owner.profiles),calls=h.calls.length;expect(h.state.lumistry.owner.discoveryJob).toBeDefined();await h.app.handle({action:'discard_discovery',requestId:'discard'},{chatId:'c',characterId:'a'},'u');expect(h.state.lumistry.owner.discoveryJob).toBeUndefined();expect(h.state.lumistry.owner.profiles).toEqual(published);expect(h.calls).toHaveLength(calls);
});

 test('ordinary sentence punctuation and long combined voice preserve locally extractable facts', () => {
    const text = dossier().replace('Anonymous profile: no', 'Anonymous profile: No.').replace('Public categories: gender, occupation, height, interests, intentions', 'Public categories: gender, occupation, height, interests, intentions.').replace('Written mechanics: lowercase, short punctuation, rare emoji', 'Written mechanics: ' + 'Careful ordinary punctuation and capitalization. '.repeat(7)).replace('Voice samples: profile: one lamp fixed. friend: it lives again', 'Voice samples: ' + 'A considered message with specific everyday detail. '.repeat(5));
    const d = identity(text);
    expect(d.problems).toEqual([]);
    expect(d.needsDisclosure).toBe(false);
    expect(d.row.anonymous).toBe(false);
    expect(d.row.hiddenFields).not.toContain('intentions');
    expect(d.row.phoneProfile.textingStyle.length).toBeGreaterThan(500);
    expect(d.row.phoneProfile.textingStyle.length).toBeLessThanOrEqual(600);
    expect(d.row.person.writingVoice.sample).toBe('A considered message with specific everyday detail. '.repeat(5).trim());
    expect(d.a.dossier.text).toBe(text);
});

test('organizer receives canonical labels from typed issues instead of combined diagnostics', () => {
    const d = identity(dossier().replace(/(?:Written mechanics|Sentence rhythm and conversational effort|Voice samples|Spoken voice and register|Public categories|Anonymous profile):[^\n]*\n/g, ''));
    expect(d.repairLabels).toEqual(expect.arrayContaining(['Written mechanics', 'Sentence rhythm and conversational effort', 'Voice samples', 'Spoken voice and register', 'Public categories', 'Anonymous profile']));
    expect(d.repairLabels.some(label=>label.includes(' / '))).toBe(false);
});
test('punctuated disclosure and longer voice publish without an organizer or paid correction', async () => {
    const h = harness();
    h.generate = async req => {
        const r = h.response(req);
        if (req.task === 'dossier') r.authoredText = r.authoredText.replace('Anonymous profile: no', 'Anonymous profile: No.').replace('Public categories: gender, occupation, height, interests, intentions', 'Public categories: gender, occupation, height, interests, intentions.').replace('Written mechanics: lowercase, short punctuation, rare emoji', 'Written mechanics: ' + 'Careful ordinary punctuation and capitalization. '.repeat(7)).replace('Voice samples: profile: one lamp fixed. friend: it lives again', 'Voice samples: ' + 'A considered message with specific everyday detail. '.repeat(5));
        return r;
    };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.some(x => x.req.task === 'index')).toBe(false);
    expect(h.calls.some(x => x.req.repair)).toBe(false);
    expect(h.state.lumistry.owner.profiles.at(-1)?.person.writingVoice.mechanics).toContain('Careful ordinary');
});

test('saved index work revalidates retained evidence before another paid organizer request', async () => {
    const h = harness();
    h.generate = async req => {
        if (req.task === 'index') throw new Error('provider unavailable');
        const r = h.response(req);
        if (req.task === 'dossier') r.authoredText = r.authoredText.replace('Anonymous profile: no', 'Anonymous profile: I do not hide my identity.');
        return r;
    };
    await h.run();
    const slot = h.state.lumistry.owner.discoveryJob!.slots[0];
    expect(slot.progress?.task).toBe('index');
    slot.progress!.authored.dossier = authored(slot.progress!.authored.dossier!.text.replace('Anonymous profile: I do not hide my identity.','Anonymous profile: No.'));
    // Equivalent to evidence becoming valid under a corrected local validator.
    const before = h.calls.length;
    h.generate = async req => h.response(req);
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.slice(before).some(x => ['dossier', 'index'].includes(x.req.task))).toBe(false);
});

test('a conflicting photo record cannot erase later valid siblings or widen repair permission', async () => {
    const h = harness(); let phase = 0;
    h.generate = async req => {
        const r = h.response(req);
        if (req.task !== 'photos') return r;
        if (phase++ === 0) {
            const units = photoArtifacts(authored(r.authoredText,'photos'));
            r.authoredText = units.map((a,i)=>i===0?a.text.replace('Public caption: it lives','Public caption: '+'x'.repeat(601)):a.text).join('\n');
        } else if (phase === 2) {
            r.authoredText = r.authoredText.replace('Full literal description:','Full literal description: Changed the accepted scene. ');
        }
        return r;
    };
    await h.run();
    const job = h.state.lumistry.owner.discoveryJob!, progress=job.slots[0].progress!;
    expect(progress.photoRepairLabels?.['0']).toEqual(['Public caption']);
    expect(progress.photoDrafts?.['0']?.fields['Full literal description']).not.toContain('Changed the accepted scene');
    expect(progress.draft.photoPlan.filter(Boolean)).toHaveLength(job.slots[0].photoCount>=3?2:job.slots[0].photoCount-1);
    const before=h.calls.length;h.generate=async req=>h.response(req);await retryFailed(h);await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.slice(before).every(x=>x.req.task==='photos')).toBe(true);
});
test('malformed first photo record retains complete later records from the same response', async () => {
    const h=harness();let bad=true;
    h.generate=async req=>{
        const r=h.response(req);
        if(req.task==='photos'&&bad){bad=false;const units=photoArtifacts(authored(r.authoredText,'photos'));r.authoredText=units.map((u,i)=>i===0?u.text.replace('Public caption: it lives','Public caption: it lives\nPublic caption: a conflicting second caption'):u.text).join('\n');}
        return r;
    };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(x=>x.req.task==='photos')[1].req.batchCount).toBe(1);
});
test('generated filter contradiction stops after one authored response and never rerolls facts', async () => {
    const h=harness();h.state.lumistry.owner.filters.fields.gender={mode:'required',value:'woman'};
    h.generate=async req=>({...h.response(req),authoredText:dossier('New Aster').replace('Gender and pronouns: woman','Gender and pronouns: man')});
    await h.run();expect(h.calls).toHaveLength(1);expect(h.state.lumistry.owner.profiles).toHaveLength(24);
    expect(h.state.lumistry.owner.discoveryJob?.slots[0].progress?.draft.fields.gender).toBe('man');
});
test('missing companion detail is an actionable organizer extraction and survives saved-stage normalization', async () => {
    const h=harness();
    h.generate=async req=>{
        if(req.task==='dossier')return {authoredText:dossier('New Aster','### Companion\nCompanion name: Pip\nCompanion kind: pet\nCompanion relationship: her dog\nStable visual anchors: Pip is a white dog with a black ear.'),finishReason:'stop'};
        if(req.task==='index')return {authoredText:'Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog with a black ear\nCompanion relationship: her dog',finishReason:'stop'};
        return h.response(req);
    };
    await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.some(x=>x.req.task==='index')).toBe(false);
    expect(h.state.lumistry.owner.profiles.at(-1)?.person.unresolvedSubjects?.[0].name).toBe('Pip');expect(h.state.lumistry.owner.profiles.at(-1)?.person.entities).toHaveLength(0);
});

test('current usage distinguishes provider failures from accepted partial authoring and survives reload', async () => {
    const h=harness();h.generate=async req=>req.task==='dossier'?{authoredText:dossier('New Aster').replace('Anonymous profile: no','Anonymous profile: I do not hide my identity.'),finishReason:'stop'}:req.task==='index'?Promise.reject(new Error('provider unavailable')):h.response(req);
    await h.run();const metrics=h.state.lumistry.owner.discoveryJob!.metrics;
    expect(metrics[0].invalid).toBe(1);expect(metrics[0].checkpoint).toBe(true);expect(metrics[0].failureLayer).toBe('validation');
    expect(metrics[1].failureLayer).toBe('provider');expect(metrics[1].task).toBe('index');
    expect(metrics[0].authoringRevision).toBe('v2-contract-recovery-20261014');
    expect(normalizeDiscoveryJob(h.state.lumistry.owner.discoveryJob)!.metrics).toEqual(metrics);
});

test('manual authoring resumes the same checkpointed pipeline after reload without publishing or repeating identity', async () => {
    const h=harness();let interrupted=false;
    h.generate=async req=>{if(req.task==='public'&&!interrupted){interrupted=true;throw new Error('temporary provider outage');}return h.response(req);};
    await expect(h.app.handle({action:'generate',description:'An adult who repairs radios.',requestId:'manual-one'},{chatId:'c',characterId:'a'},'u')).rejects.toThrow();
    const before=h.calls.length,jobId=h.state.lumistry.owner.draftJob!.id;
    expect(h.state.lumistry.owner.draftJob?.slots[0].progress?.authored.dossier?.text).toContain('New Aster');
    expect(h.state.lumistry.owner.profiles).toHaveLength(24);
    const reloaded=new Lumistry(h.h);
    await reloaded.handle({action:'generate',description:'An adult who repairs radios.',requestId:'manual-two'},{chatId:'c',characterId:'a'},'u');
    expect(h.state.lumistry.owner.draftJob?.id).toBe(jobId);
    expect(h.state.lumistry.owner.draftJob?.status).toBe('complete');
    expect(h.calls.slice(before).some(x=>x.req.task==='dossier'||x.req.task==='index')).toBe(false);
    expect(h.state.lumistry.owner.profiles).toHaveLength(24);
    expect(h.state.contacts).toHaveLength(0);expect(h.state.conversations).toHaveLength(0);
    expect(h.sent.some(x=>x.phase==='draft')).toBe(true);
});
test('manual draft checkpoints do not overwrite paused discovery or its usage', async () => {
    const h=harness();h.generate=async req=>{if(req.task==='public')throw new Error('provider unavailable');return h.response(req);};await h.run();
    const discovery=structuredClone(h.state.lumistry.owner.discoveryJob);
    h.generate=async req=>{const r=h.response(req);if(req.task==='dossier')r.authoredText=dossier('Review Aster');return r;};
    await h.app.handle({action:'generate',description:'A different adult for review.',requestId:'manual'},{chatId:'c',characterId:'a'},'u');
    expect(h.state.lumistry.owner.discoveryJob).toEqual(discovery);
    expect(h.state.lumistry.owner.draftJob?.reviewDraft).toBeTruthy();
    await h.app.handle({action:'discard_manual'},{chatId:'c',characterId:'a'},'u');
    expect(h.state.lumistry.owner.draftJob).toBeUndefined();expect(h.state.lumistry.owner.discoveryJob).toEqual(discovery);
});

test('a repeated public Answer can be corrected without restarting the authored identity', async () => {
    const h=harness();let first=true;h.generate=async req=>{const r=h.response(req);if(req.task==='public'&&first){first=false;r.authoredText=r.authoredText.replace('Answer: the lamp 1 finally works','Answer: the lamp 1 finally works\nAnswer: a conflicting answer');}return r;};
    await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.calls.filter(x=>x.req.task==='dossier')).toHaveLength(1);expect(h.calls.filter(x=>x.req.task==='public')).toHaveLength(2);
});

test('new-person authoring inherits native parameters across every stage and avoids irrelevant catalogs',async()=>{
 const h=harness();await h.run();
 expect(h.state.lumistry.owner.profiles).toHaveLength(25);
 for(const call of h.calls){expect(call.input.parameters).toBeUndefined();expect(call.input.reasoning).toBeUndefined();}
 const first=h.calls[0];expect(first.req.categoryOptions.height).toBeUndefined();expect(first.req.heightGuidance).toContain('centimetres');
 expect(first.req.categoryOptions.kinks).toBeUndefined();
 expect(first.input.messages[0].content).not.toContain('PROPOSED INITIAL UI DEFAULTS');
 expect(first.input.messages[0].content).not.toContain('population planning ledger');
});

test('manual authoring actually receives its saved creative brief with native settings',async()=>{
 const h=harness();h.state.lumistry.owner.filters.fields={};await h.app.handle({action:'generate',requestId:'manual-brief',description:'A botanist who restores old radios.'},{chatId:'c',characterId:'a'},'u');
 expect(h.calls[0].req.description).toBe('A botanist who restores old radios.');
 expect(h.calls.every(x=>x.input.parameters===undefined)).toBe(true);
 expect(h.state.lumistry.owner.draftJob?.reviewDraft).toBeDefined();
 expect(h.state.lumistry.owner.profiles).toHaveLength(24);
});

test('reasoning-only failure retains its plan and usage; resume is fresh authoring rather than prose repair',async()=>{
 const {StructuredOutputError}=await import('../src/backend/structured.js');
 const {attachDiscoveryRun}=await import('../src/backend/lumistry-run-receipts.js');
 const h=harness();let first=true;
 h.generate=async req=>{if(first){first=false;const error=new StructuredOutputError('truncated','The provider used all 7,000 output tokens for reasoning and returned no answer.',{answerBytes:0,finishReason:'length'});attachDiscoveryRun(error,{requestId:'synthetic-cutoff',promptTokens:5253,completionTokens:7000,totalTokens:12253,reasoningTokens:7000,usageStatus:'reported'});throw error;}return h.response(req);};
 await h.run();expect(h.calls).toHaveLength(1);
 const job=h.state.lumistry.owner.discoveryJob!;const plan=structuredClone(job.slots[0].selection);
 expect(job.lastError).toContain('all 7,000');expect(job.metrics[0].totalTokens).toBe(12253);expect(job.metrics[0].failureLayer).toBe('provider');expect(job.slots[0].progress?.authored.dossier).toBeUndefined();
 await h.run();expect(h.calls).toHaveLength(1);h.h.authoringPolicy=async()=>({maxCalls:150,maxTokens:800000,sessionCalls:24,timeoutSeconds:180,reasoning:'off'});await h.run();expect(h.calls[1].req.repair).toBeUndefined();expect(h.calls[1].input.messages[0].content).not.toContain('Repair only the listed');
 expect(h.state.lumistry.owner.discoveryJob!.slots[0].selection).toEqual(plan);expect(h.state.lumistry.owner.profiles).toHaveLength(25);
});

test('saved explicit disclosure in key-value form resumes locally without another organizer',async()=>{
 const h=harness();let paused=true;h.generate=async req=>req.task==='dossier'?{authoredText:dossier('New Aster').replace(/^Public categories:.*$/m,'Public categories: unresolved'),finishReason:'stop'}:req.task==='index'&&paused?Promise.reject(new Error('provider unavailable')):h.response(req);
 await h.run();const s=structuredClone(h.state);const p=s.lumistry.owner.discoveryJob!.slots[0].progress!;
 p.authored.index=parseAuthoring('Public categories: gender: woman; occupation: tradesperson; height: 168 cm; interests: books, coffee; intentions: casual dating','index','stop');
 p.pendingArtifact=p.authored.index;h.state=s;paused=false;const previous=h.calls.length;
 await h.run();expect(h.calls.slice(previous).some(x=>x.req.task==='dossier'||x.req.task==='index')).toBe(false);expect(h.state.lumistry.owner.profiles).toHaveLength(25);
});

test('public Bio-only correction preserves accepted cards and gallery without a locked-field loop',async()=>{
 const h=harness();let failed=false;
 h.generate=async req=>{const r=h.response(req);if(req.task==='public'){if(!failed){failed=true;r.authoredText=r.authoredText.replace(/^Bio:.*$/m,'Bio: '+'word '.repeat(321));}else {expect(req.repair.retainedFields.Bio).toContain('word');expect(req.repair.problems).toContain('Bio: at most 65 words and 1100 characters.');expect(JSON.stringify(req.repair.problems)).not.toContain('100 words');r.authoredText='Bio: one lamp fixed. two to go.';}}return r;};
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.calls.filter(x=>x.req.task==='public')).toHaveLength(2);expect(h.state.lumistry.owner.profiles.at(-1)?.person?.prompts.length).toBe(h.calls[0].req.counts.questions);
});

test('saved public fields polluted by plain headings recover before another public call',async()=>{
 const h=harness();h.generate=async req=>{const r=h.response(req);if(req.task==='public')r.authoredText=r.authoredText.replace(/^Bio:.*$/m,'Bio: '+'word '.repeat(321));return r;};
 await h.run();const state=structuredClone(h.state),p=state.lumistry.owner.discoveryJob!.slots[0].progress!;
 p.pendingArtifact=parseAuthoring(publicText(h.calls[0].req.counts.questions,h.calls[0].req.counts.photos).replace(/### /g,''),'public','stop');
 p.pendingArtifact.fields.Bio+='\n\nQ&A';p.problems=['Bio exceeds 65 words / 1600 characters'];h.state=state;h.generate=undefined;
 const count=h.calls.length;await h.run();expect(h.calls.slice(count).every(x=>x.req.task==='photos')).toBe(true);expect(h.state.lumistry.owner.profiles).toHaveLength(25);
});

test('one retained failed photo accepts a field-only correction without changing its scene',async()=>{
 const h=harness();let failed=false;
 h.generate=async req=>{const r=h.response(req);if(req.task==='photos'){if(!failed){failed=true;r.authoredText=r.authoredText.replace('Public caption: it lives','Public caption: '+'x'.repeat(650));}else if(req.retainedPhotoRecords?.some(Boolean)){expect(req.repair.problems.some((p:string)=>p.includes('Public caption: at most 180 characters'))).toBe(true);expect(JSON.stringify(req.repair.problems)).not.toContain('600');r.authoredText='Public caption: it lives';}}return r;};
 await h.run();expect(h.state.lumistry.owner.profiles).toHaveLength(25);expect(h.calls.some(x=>x.req.requestedPhotoChanges?.some((v:string[])=>v.includes('Public caption')))).toBe(true);
 expect(h.state.lumistry.owner.profiles.at(-1)?.photoPlan.every(p=>p.description.includes('owner works on a lamp'))).toBe(true);
});

test('saved complete photo drafts recover locally before publication rather than buying the same photo again',async()=>{
 const h=harness();h.generate=async req=>{const r=h.response(req);if(req.task==='photos')r.authoredText=r.authoredText.replaceAll('Public caption: it lives','Public caption: '+'x'.repeat(650));return r;};
 await h.run();const state=structuredClone(h.state),slot=state.lumistry.owner.discoveryJob!.slots[0],p=slot.progress!;
 for(let i=0;i<slot.photoCount;i++)p.photoDrafts![String(i)]=parseAuthoring(photo(),'photos','stop');
 h.state=state;const count=h.calls.length;h.generate=undefined;await h.run();expect(h.calls).toHaveLength(count);expect(h.state.lumistry.owner.profiles).toHaveLength(25);
});

test('bio rewrites share authoring normalization and inherit native generation settings',async()=>{
 const h=harness();await h.run();const profile=h.state.lumistry.owner.profiles.at(-1)!;
 h.generate=async()=>({authoredText:'Bio: a quiet afternoon. (3 words)',finishReason:'stop'});
 await h.app.handle({action:'rewrite_item',profileId:profile.id,target:'bio',requestId:'bio-review'},{chatId:'c',characterId:'a'},'u');
 expect(h.calls.at(-1)?.input.parameters).toBeUndefined();expect(h.sent.find(x=>x.phase==='edit_draft')?.draft.bio).toBe('a quiet afternoon.');expect(h.state.lumistry.owner.profiles.at(-1)?.bio).toBe(profile.bio);
});

test('matched background development inherits native authoring settings and preserves public identity',async()=>{
 const h=harness();await h.run();const profile=h.state.lumistry.owner.profiles.at(-1)!,before=profile.bio;
 profile.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))};await h.app.handle({action:'like',profileId:profile.id},{chatId:'c',characterId:'a'},'u');
 h.generate=async()=>({authoredText:'Ordinary nuance: Keeps a spare key with an established friend.',finishReason:'stop'});
 const count=h.calls.length;await h.app.maintain({chatId:'c',characterId:'a'},'u');
 expect(h.calls.length).toBeGreaterThan(count);expect(h.calls.at(-1)?.input.parameters).toBeUndefined();expect(h.state.lumistry.owner.profiles.at(-1)?.bio).toBe(before);
});

test('organizer rollback preserves valid companions while extracting another required fact', async () => {
 const h=harness();let attempts=0;
 const valid='Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog\nCompanion relationship: her dog';
 const incomplete='Companion name: Ash\nCompanion kind: pet\nCompanion relationship: her cat';
 h.generate=async req=>req.task==='dossier'?{authoredText:dossier('New Aster',valid+'\n'+incomplete).replace('Anonymous profile: no','Anonymous profile: I do not hide my identity.'),finishReason:'stop'}:req.task==='index'?{authoredText:++attempts===1?'Anonymous profile: no\nHair: unrelated changed appearance':'Anonymous profile: no',finishReason:'stop'}:h.response(req);
 await h.run();expect(attempts).toBe(1);expect(h.state.lumistry.owner.profiles).toHaveLength(25);
 const p=h.state.lumistry.owner.profiles.at(-1)!;expect(p.person!.entities.map(e=>e.appearance)).toEqual(['white dog']);expect(p.person!.unresolvedSubjects?.[0].name).toBe('Ash');
});

test('surplus gallery plans finish without a repair request and saved surplus plans resume locally', async () => {
    const h=harness();
    h.generate=async req=>req.task==='public'?{authoredText:publicText(req.counts.questions,req.counts.photos+1),finishReason:'stop'}:h.response(req);
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(x=>x.req.task==='public')).toHaveLength(1);
    const resume=harness();
    resume.generate=async req=>req.task==='public'?Promise.reject(new Error('provider unavailable')):resume.response(req);
    await resume.run();
    const slot=resume.state.lumistry.owner.discoveryJob!.slots[0];
    slot.progress!.pendingArtifact=authored(publicText(slot.questionCount,slot.photoCount+1),'public');
    resume.generate=undefined;const before=resume.calls.filter(x=>x.req.task==='public').length;
    await resume.run();
    expect(resume.calls.filter(x=>x.req.task==='public')).toHaveLength(before);
    expect(resume.state.lumistry.owner.profiles).toHaveLength(25);
});

test('public identity echoes and a bio above target but below 100 words publish without a repair call', async () => {
    const h=harness();const bio=Array.from({length:71},()=> 'word').join(' ');
    h.generate=async req=>req.task==='public'?{authoredText:`Alias: ${req.acceptedPerson.alias}\nAge: ${req.acceptedPerson.age}\nPronouns: ${req.acceptedPerson.pronouns}\n`+publicText(req.counts.questions,req.counts.photos,bio+'\n\nWord count: 62 · Characters: 437'),finishReason:'stop'}:h.response(req);
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(x=>x.req.task==='public')).toHaveLength(1);
    expect(h.state.lumistry.owner.profiles.at(-1)?.bio).toBe(bio);
    const resume=harness();
    resume.generate=async req=>req.task==='public'?Promise.reject(new Error('provider unavailable')):resume.response(req);
    await resume.run();
    const slot=resume.state.lumistry.owner.discoveryJob!.slots[0], p=slot.progress!;
    p.pendingArtifact=authored(`Pronouns: ${p.draft.pronouns}\n`+publicText(slot.questionCount,slot.photoCount,bio+'\n\nWord count: 62 · Characters: 437'),'public');
    resume.generate=undefined;const before=resume.calls.filter(x=>x.req.task==='public').length;
    await resume.run();
    expect(resume.calls.filter(x=>x.req.task==='public')).toHaveLength(before);
    expect(resume.state.lumistry.owner.profiles.at(-1)?.bio).toBe(bio);
});

test('compact messaging retains critical facts and retrieves specific public and private details without changing storage',async()=>{
 const h=harness();await h.run();const p=h.state.lumistry.owner.profiles.at(-1)!;
 p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))};await h.app.handle({action:'like',profileId:p.id},{chatId:'c',characterId:'a'},'u');
 const d=h.state.lumistry.owner,c=h.state.conversations.find(x=>x.id===d.decisions.at(-1)!.conversationId)!;
 const npc=d.profiles.at(-1)!;npc.privateFields.boundaries='Do not kiss me without asking. Do not assume a match is consent.';
 npc.privateFields.realName='NPC PRIVATE IDENTITY';npc.privateFields.independentGoal='Restore a telescope in the old observatory.';
 npc.fields.religion='NPC UNDISCLOSED RELIGION';npc.hiddenFields.push('religion');
 npc.person!.prompts=[{question:'A small victory?',answer:'The violet bicycle finally rolls.'}];
 npc.photoPlan[0].description='The striped cat sits on the blue workshop bench.';
 npc.development!.voiceLab={text:'EDITOR ONLY REHEARSAL',createdAt:'now'};
 const before=JSON.stringify(h.state);
 c.messages=[{id:'a',sender:'persona',text:'Hi, how are you?',status:'sent'} as any];
 const generic=JSON.stringify(datingReplyMessages(h.state,c,''));
 expect(generic).toContain(npc.privateFields.boundaries);expect(generic).toContain(npc.privateFields.orientation);
 expect(generic).not.toContain('NPC PRIVATE IDENTITY');expect(generic).not.toContain('The violet bicycle');expect(generic).not.toContain('striped cat');expect(generic).not.toContain('EDITOR ONLY REHEARSAL');
 c.messages[0].text='Tell me about your observatory and telescope project.';
 expect(JSON.stringify(datingReplyMessages(h.state,c,''))).toContain(npc.privateFields.independentGoal);
 c.messages[0].text='What is your religion?';expect(JSON.stringify(datingReplyMessages(h.state,c,''))).toContain('NPC UNDISCLOSED RELIGION');
 c.messages[0].text='Your profile answer mentions a violet bicycle. What happened?';expect(JSON.stringify(datingReplyMessages(h.state,c,''))).toContain('The violet bicycle finally rolls.');
 c.messages[0].text='Tell me about your first photo.';expect(JSON.stringify(datingReplyMessages(h.state,c,''))).toContain('The striped cat sits on the blue workshop bench.');
 // Context building itself never rewrites the character or replaces their source dossier.
 const after=structuredClone(h.state),old=JSON.parse(before);after.conversations=old.conversations;expect(JSON.stringify(after)).toBe(before);
});

test('model prompts and repair instructions expose requested lengths, never private acceptance allowances',async()=>{
 const {modelRepairInstruction}=await import('../src/backend/lumistry-v2-prompts.js');
 const {npcProfilePrompt,personaProfilePrompt}=await import('../src/backend/lumistry-prompts.js');
 const pub=v2AuthorPrompt('public'), photos=v2AuthorPrompt('photos');
 expect(pub).toContain('Question: [Original question; at most 90 characters]');expect(pub).toContain('Answer: [Their own answer; at most 250 characters]');expect(pub).toContain('1–3 unique');expect(pub).toContain('1–5 slots');
 expect(photos).toContain('at most 6 visible subjects');expect(photos).toContain('maximum 600 characters');
 for(const p of [pub,photos,v2AuthorPrompt('index'),v2AuthorPrompt('match'),v2AuthorPrompt('voiceLab'),npcProfilePrompt,personaProfilePrompt]) {
  expect(p).not.toMatch(/(?:maximum|at most|under|<=)\s*(?:1500|1,500|1600|1,600|6000|6,000)\s*characters/i);
  expect(p).not.toContain('100 words');expect(p).not.toContain('maximum 360');expect(p).not.toContain('maximum 120 characters');
 }
 expect(modelRepairInstruction({code:'photo-length',message:'Internal maximum 1500',labels:['Full literal description']})).toContain('at most 600 characters');
 expect(modelRepairInstruction({code:'subjects',message:'Internal maximum 8',labels:['Visible subjects']})).toContain('at most 6');
 expect(modelRepairInstruction({code:'identity-length',message:'121 characters',labels:['Public alias']})).toContain('at most 80 characters');
 expect(modelRepairInstruction({code:'bio-length',message:'Internal maximum 100 words / 1600 characters',labels:['Bio']})).toBe('Bio: at most 65 words and 1100 characters.');
});

test('changing immutable plan counts quarantines a ready draft without regenerating or losing original source',async()=>{
 const originalRandom=Math.random;Math.random=()=>.99;try {
 const h=harness();h.generate=async req=>req.task==='photos'?Promise.reject(new Error('provider unavailable')):h.response(req);
 await h.run();const profileCount=h.state.lumistry.owner.profiles.length,slot=h.state.lumistry.owner.discoveryJob!.slots[0],p=slot.progress!;
 slot.photoCount=8;slot.questionCount=5;
 const original=authored(publicText(5,8),'public'),pub=projectPublic(original,p.draft,5,8);
 p.draft=pub.row;p.authored.public=original;p.authored.gallery=pub.gallery;
 const scenes=authored(Array.from({length:8},()=>photo()).join('\n'),'photos');p.draft.photoPlan=projectPhotos(scenes,p.draft,8).photos;p.authored.photos=photoArtifacts(scenes);p.photoDrafts={};p.photoTargets=[];
 h.generate=undefined;const before=h.calls.length;await h.run();
 expect(h.calls).toHaveLength(before);
 expect(h.state.lumistry.owner.profiles).toHaveLength(profileCount);
 const retained=h.state.lumistry.owner.discoveryJob!.slots[0];
 expect(retained.status).toBe('failed');expect(retained.quarantineReason).toContain('preserved');
 expect((retained.quarantinedProgress as any).progress.authored.public.text).toBe(original.text);
 expect((retained.quarantinedProgress as any).progress.draft.person.prompts).toHaveLength(5);
 expect((retained.quarantinedProgress as any).progress.draft.photoPlan).toHaveLength(8);
 }finally{Math.random=originalRandom;}
});

test('a first organizer companion scalar repair uses the single dossier record and reaches publication', async () => {
    const h=harness();
    h.generate=async req=>{
        if(req.task==='dossier')return {authoredText:dossier('New Aster','Companion name: Beier\nCompanion kind: person — an elderly tenant\nCompanion relationship: her neighbor\nStable visual anchors: Beier is an elderly woman with gray hair.').replace('Anonymous profile: no','Anonymous profile: I do not hide my identity.'),finishReason:'stop'};
        if(req.task==='index')return {authoredText:'Anonymous profile: no',finishReason:'stop'};
        return h.response(req);
    };
    await h.run();
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.calls.filter(x=>x.req.task==='index')).toHaveLength(1);
    expect(h.state.lumistry.owner.profiles.at(-1)?.person.unresolvedSubjects?.[0].name).toBe('Beier');
    const system=h.calls.find(x=>x.req.task==='index').input.messages[0].content;
    expect(system).toContain('Do not output a standalone companion field');
});

test('retained descriptive-kind organizer evidence resumes locally without another organizer call', async () => {
    const h=harness();
    h.generate=async req=>{
        if(req.task==='dossier')return {authoredText:dossier('New Aster','Companion name: Beier\nCompanion kind: person\nCompanion relationship: her neighbor'),finishReason:'stop'};
        if(req.task==='index')return {authoredText:'Companion name: Beier\nCompanion kind: person — an elderly tenant in her building\nCompanion appearance: Not established — elderly woman, other details unstated\nCompanion relationship: her neighbor',finishReason:'stop'};
        if(req.task==='public')throw new Error('temporary interruption');
        return h.response(req);
    };
    await h.run();
    const job=h.state.lumistry.owner.discoveryJob!;
    const p=job.slots.find(x=>x.status!=='saved')!.progress!;
    p.authored.index=authored('Companion name: Beier\nCompanion kind: person — an elderly tenant in her building\nCompanion appearance: elderly woman\nCompanion relationship: her neighbor','index');p.task='index';p.stage='identity';p.problems=['A recurring companion needs name, kind, stable appearance and relationship.'];
    const start=h.calls.length;
    h.generate=async req=>h.response(req);
    await h.run();
    expect(h.calls.slice(start).some(x=>x.req.task==='index'||x.req.task==='dossier')).toBe(false);
    expect(h.state.lumistry.owner.profiles).toHaveLength(25);
    expect(h.state.lumistry.owner.profiles.at(-1)?.person.entities[0].name).toBe('Beier');
});


test('initial private likes survive the full creation contract and Like matches without a provider call',async()=>{
 const h=harness(24);h.generate=async req=>{
  const result=h.response(req);
  if(req.task==='dossier'){
   expect(req.visiblePersona.alias).toBe('Moon');expect(JSON.stringify(req.visiblePersona)).not.toContain('PRIVATE OWNER');
   result.authoredText=result.authoredText.replace('END CHARACTER DOSSIER.','Initial app interest: liked\nEND CHARACTER DOSSIER.');
  }
  if(req.task==='public'||req.task==='photos')expect(req.visiblePersona).toBeUndefined();
  return result;
 };
 await h.run();const p=h.state.lumistry!.owner.profiles.at(-1)!;expect(p.alias).toBe('New Aster');expect(p.interest).toEqual({version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))});
 expect(h.state.conversations).toHaveLength(0);expect(h.state.contacts).toHaveLength(0);
 const before=h.calls.length;await h.app.handle({action:'like',profileId:p.id,requestId:'like'},{chatId:'c',characterId:'a'},'u');expect(h.calls.length).toBe(before);expect(h.state.lumistry!.owner.decisions.at(-1)?.status).toBe('matched');expect(h.state.conversations).toHaveLength(1);expect(h.state.conversations[0].channel).toBe('dating');
});

test('initial interest is optional, explicit and stable through dossier normalization',()=>{
 for(const [value,status,seen] of [['liked','matched',true],['undecided','pending',true],['unseen','pending',false],['declined','declined',true],['','pending',false],['maybe liked someday','pending',false]] as const){
  const authored:any={version:2,dossier:parseAuthoring(dossier('New Aster',value?'Initial app interest: '+value:''),'dossier','stop'),photos:[],gallery:[],provenance:{}};
  const projected=projectDossier(normalizeAuthoring(JSON.parse(JSON.stringify(authored))),{},'slot',2);
  expect(projected.row.interest).toEqual({version:2,status,seen});
 }
});
