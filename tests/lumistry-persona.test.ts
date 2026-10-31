import { expect, test } from 'bun:test';
import { mergePersonaDraft } from '../src/domain/lumistry-persona.js';
import { normalizeDatingProfile } from '../src/domain/lumistry.js';
import { compileDatingVisual } from '../src/domain/lumistry-visual.js';

test('explicit Persona height has one authority, preserving reviewed edits and complete photo plans', () => {
    const previous = normalizeDatingProfile({ alias: 'My alias', age: 32, fields: { occupation: 'My edit' }, photoPlan: [{ description: 'whole scene', prompt: 'saved prompt' }] })!;
    const p = mergePersonaDraft({ alias: 'Different', fields: { occupation: 'Writer' }, person: { appearance: { hair: 'violet curls' } }, phoneProfile: { appearance: 'violet curls, amber eyes' } }, previous, { sourceDescription: '**Height:** 182 cm\nOccupation: Lawyer' });
    expect(p.fields.height).toBe('182 cm'); expect(p.person.appearance.height).toBe('');
    expect(p.alias).toBe('My alias'); expect(p.fields.occupation).toBe('My edit'); expect(p.photoPlan[0].prompt).toBe('saved prompt');
    const edited = mergePersonaDraft(p, { fields: { height: '180 cm' } }, { sourceDescription: 'Height: 182 cm' }); expect(edited.fields.height).toBe('180 cm');
});
test('unlabelled measurements or conflicting heights are not mechanically assigned to the Persona', () => {
    for (const sourceDescription of ['a 180 cm bookshelf', 'Height: 170 cm\nHeight: 190 cm']) {
        expect(mergePersonaDraft({}, null, { sourceDescription }).fields?.height).toBeUndefined();
    }
});
test('empty structured appearance falls back to saved identity in flat and structured photo compilation', () => {
    const p = normalizeDatingProfile({ alias: 'Moon', age: 32, person: { version: 1 }, phoneProfile: { appearance: 'violet curls, amber eyes, freckles' } })!;
    expect(compileDatingVisual(p, undefined, 'reading a book')).toContain('violet curls, amber eyes, freckles');
    const scene = { camera: 'portrait', subjects: [{ id: 'self', position: '', clothing: 'blue coat', expression: '', pose: '', action: '', gaze: '' }], interaction: '', spatial: '', environment: 'park', lighting: 'daylight' };
    expect(compileDatingVisual(p, scene, 'scene')).toContain('Person A — violet curls, amber eyes, freckles, blue coat');
    p.anonymous = true; expect(compileDatingVisual(p, scene, 'scene')).not.toContain('violet curls');
});

import { loadDatingPersonaEvidence } from '../src/backend/lumistry-persona-evidence.js';
import type { ChatPocketPersona } from '../src/types.js';
const pocketPersona = (extra: any = {}) => ({ source: 'manual', linkedPersonaId: '', displayName: 'Phone alias', identityBrief: 'Pocket-only context', phoneProfile: { appearance: '', personality: 'Warm with friends', textingStyle: 'short lowercase texts' }, ...extra } as ChatPocketPersona);
const originalPersona = { id: 'original', name: 'Original name', title: 'Architect', description: 'Height: 178 cm\nSilver curls, brown eyes', metadata: { pronouns: 'she/her', unrelatedPrivateMetadata: 'not needed' } } as any;

test('unlinked manual and generated Pocket Personas read the active original without replacing Pocket identity', async () => {
    for (const source of ['manual', 'generated']) {
        const p = pocketPersona({ source }); const calls: any[] = [];
        const api = { get: async (...args: any[]) => { calls.push(['get', ...args]); return null; }, getActive: async (...args: any[]) => { calls.push(['active', ...args]); return originalPersona; } };
        const evidence = await loadDatingPersonaEvidence(p, api, () => true, 'trusted-user');
        expect(calls).toEqual([['active', 'trusted-user']]); expect(evidence.originalPersona.description).toContain('Height: 178 cm');
        expect(evidence.pocketPersona.displayName).toBe('Phone alias'); expect(evidence.pocketPersona.phoneProfile?.textingStyle).toBe('short lowercase texts');
        expect(evidence.originalPersona).not.toHaveProperty('metadata'); expect(p.linkedPersonaId).toBe(''); expect(evidence.sourceSelection).toBe('active');
    }
});
test('an explicit original link wins over the active Persona and a broken link never substitutes another person', async () => {
    let activeCalls = 0; const calls: any[] = [];
    const api = { get: async (...args: any[]) => { calls.push(args); return originalPersona; }, getActive: async () => { activeCalls++; return { ...originalPersona, id: 'unrelated' }; } };
    const evidence = await loadDatingPersonaEvidence(pocketPersona({ linkedPersonaId: 'original' }), api, () => true, 'u');
    expect(calls).toEqual([['original', 'u']]); expect(activeCalls).toBe(0); expect(evidence.sourceSelection).toBe('linked');
    await expect(loadDatingPersonaEvidence(pocketPersona({ linkedPersonaId: 'deleted' }), { ...api, get: async () => null }, () => true, 'u')).rejects.toThrow('linked original Persona');
    expect(activeCalls).toBe(0);
});
test('missing original and denied/revoked permission fail instead of silently using only the Pocket summary', async () => {
    let calls = 0; let allowed = false;
    const api = { get: async () => null, getActive: async () => { calls++; allowed = false; return originalPersona; } };
    await expect(loadDatingPersonaEvidence(pocketPersona(), api, () => allowed, 'u')).rejects.toThrow('Enable Personas permission'); expect(calls).toBe(0);
    allowed = true; await expect(loadDatingPersonaEvidence(pocketPersona(), api, () => allowed, 'u')).rejects.toThrow('Enable Personas permission'); expect(calls).toBe(1);
    await expect(loadDatingPersonaEvidence(pocketPersona(), { ...api, getActive: async () => null }, () => true, 'u')).rejects.toThrow('Select an active Persona');
});
test('original description is complete and explicit original height takes precedence over the Pocket summary', async () => {
    const description = 'Long supported Persona history. '.repeat(1200) + '\nHeight: 178 cm';
    const evidence = await loadDatingPersonaEvidence(pocketPersona({ identityBrief: 'Height: 180 cm' }), { get: async () => null, getActive: async () => ({ ...originalPersona, description }) }, () => true, 'u');
    expect(evidence.originalPersona.description).toBe(description);
    const draft = mergePersonaDraft({}, null, evidence); expect(draft.fields.height).toBe('178 cm'); expect(draft.person?.appearance?.height || '').toBe('');
    const reviewed = mergePersonaDraft({}, { fields: { height: '179 cm' } }, evidence); expect(reviewed.fields.height).toBe('179 cm');
});

import { DATING_OPTIONS } from '../src/domain/lumistry-options.js';
import { publicDatingProfile } from '../src/domain/lumistry.js';

test('all supported profile categories select catalog equivalents while retaining life and intimate qualifications', () => {
    const response = { alias: 'Moon', age: 32, pronouns: 'SHE / HER',
        fields: { gender: 'Female', orientation: 'Bi', occupation: 'Attorney', height: '1.78 m', bodyType: 'curvy', interests: ['reading', 'music'], religion: 'Agnostic', drinking: 'social drinker', smoking: 'non-smoker', relationshipStatus: 'single', intentions: 'long-term relationship', monogamy: 'monogamy', children: ['no children', 'do not want children'], preferences: 'direct communication', sexualInterests: 'sex after emotional connection', sexualRole: 'Sub', libido: 'HIGH', kinks: ['rope bondage', 'praise kink', 'consensual breeding roleplay'], boundaries: ['discuss consent first', 'no unsolicited explicit photos'], dealbreakers: 'dishonesty' },
        privateFields: { commitments: 'Single with no exclusivity agreements', kinks: 'rope bondage, praise kink, consensual breeding roleplay' },
        person: { version: 1, life: { career: 'Attorney specializing in environmental law', routine: 'Gardens on Sundays', values: 'Honesty and autonomy' }, intimacy: { kinks: 'Enjoys rope bondage only with prior negotiation and an agreed stop word; praise; consensual breeding roleplay', boundaries: 'No choking or surprise restraint', turnOffs: 'Pressure or humiliation', turnOns: 'Praise', role: 'Submissive with a trusted partner' }, writingVoice: { primaryLanguage: 'Turkish', mechanics: 'short lowercase texts' } },
    };
    const draft = mergePersonaDraft(response, null, {});
    const p = normalizeDatingProfile(draft)!;
    expect(p.fields.gender).toBe('woman'); expect(p.fields.orientation).toBe('bisexual'); expect(p.fields.occupation).toBe('law'); expect(p.fields.height).toBe('178 cm');
    expect(p.fields.interests).toBe('books, music'); expect(p.fields.smoking).toBe('never'); expect(p.fields.drinking).toBe('socially'); expect(p.fields.sexualRole).toBe('submissive'); expect(p.fields.libido).toBe('high');
    expect(p.fields.kinks).toBe('bondage, praise, consensual breeding roleplay'); expect(p.privateFields.kinks).toBeUndefined();
    expect(p.privateFields.occupationDetail).toBeUndefined(); expect(p.person?.life.career).toContain('environmental law'); expect(p.person?.life.routine).toBe('Gardens on Sundays');
    expect(p.person?.intimacy.kinks).toContain('agreed stop word'); expect(p.person?.intimacy.boundaries).toBe('No choking or surprise restraint'); expect(p.person?.writingVoice?.primaryLanguage).toBe('Turkish'); expect(p.pronouns).toBe('she/her');
    for (const key of Object.keys(response.fields).filter(k => k !== 'kinks'))
        for (const value of p.fields[key].split(', ')) expect(DATING_OPTIONS[key]).toContain(value);
    expect((publicDatingProfile(p).fields as any).kinks).toBeUndefined(); expect((publicDatingProfile(p).fields as any).sexualRole).toBeUndefined();
    expect(publicDatingProfile(p).bio).not.toContain('bondage');
});
test('negative kink facts do not become positive selections and unsupported preferences remain empty', () => {
    const p = normalizeDatingProfile(mergePersonaDraft({ alias: 'Moon', age: 32, privateFields: { kinks: 'no bondage' } }, null, {}))!;
    expect(p.fields.kinks || '').toBe(''); expect(p.privateFields.kinks).toBe('no bondage'); expect(p.fields.sexualRole || '').toBe(''); expect(p.fields.libido || '').toBe('');
    const blank = mergePersonaDraft({ alias: 'Moon', age: 32 }, null, {}); expect(blank.fields.kinks).toBeUndefined();
});
test('reviewed visibility and private edits survive enhancement, new private categories stay hidden', () => {
    const previous = normalizeDatingProfile({ alias: 'Moon', age: 32, fields: { kinks: 'vanilla', religion: 'agnostic' }, privateFields: { kinks: 'vanilla' }, hiddenFields: ['religion'] })!;
    const p = normalizeDatingProfile(mergePersonaDraft({ fields: { kinks: 'bondage', sexualRole: 'Sub' }, privateFields: { kinks: 'bondage' }, hiddenFields: ['kinks', 'sexualRole', 'orientation'] }, previous, {}))!;
    expect(p.fields.kinks).toBe('vanilla'); expect(p.privateFields.kinks).toBeUndefined(); expect(p.hiddenFields).not.toContain('kinks'); expect(p.hiddenFields).toContain('religion'); expect(p.hiddenFields).toContain('sexualRole'); expect(p.hiddenFields).toContain('orientation');
});

import { personaEnhancementRequest } from '../src/backend/lumistry-persona-evidence.js';
import { personaProfilePrompt } from '../src/backend/lumistry-prompts.js';
test('Persona request includes the complete original once and distinct Pocket prose without gallery duplication', () => {
    const description = 'An adult architect with silver curls and detailed private consent boundaries. '.repeat(40);
    const evidence = { sourceSelection: 'linked', originalPersona: { description }, pocketPersona: { identityBrief: description, avatarUrl: 'PRIVATE AVATAR', linkedPersonaId: 'id', phoneProfile: { appearance: description, textingStyle: 'lowercase short replies, with deliberate pauses and no emoji' } } };
    const previous = { alias: 'Reviewed', age: 35, fields: { height: '178 cm' }, photoPlan: [{ description: 'SAVED GALLERY', prompt: 'SAVED PROMPT' }], photos: [{ url: 'RENDERED IMAGE' }] };
    const before = structuredClone({ evidence, previous });
    const request = personaEnhancementRequest(evidence, previous, []);
    expect(request.persona.originalPersona.description).toBe(description);
    expect(request.persona.pocketPersona).not.toHaveProperty('identityBrief');
    expect(request.persona.pocketPersona.phoneProfile).not.toHaveProperty('appearance');
    expect(request.persona.pocketPersona.phoneProfile.textingStyle).toContain('deliberate pauses');
    expect(request.currentDraft!.fields.height).toBe('178 cm');
    expect(request.hasSavedPhotoPlans).toBe(true);
    for (const excluded of ['PRIVATE AVATAR', 'SAVED GALLERY', 'SAVED PROMPT', 'RENDERED IMAGE']) expect(JSON.stringify(request)).not.toContain(excluded);
    expect({ evidence, previous }).toEqual(before);
    expect(personaProfilePrompt).not.toContain('140 cm');
    expect(personaProfilePrompt).toContain('Stable appearance lives ONLY');
});
test('Persona request retains differing Pocket evidence and qualifications without guessing semantic duplication', () => {
    const original = 'Specific original identity and boundaries that must be read in full.';
    const pocket = 'A different Pocket-specific description and explicit conditions for intimacy.';
    const request = personaEnhancementRequest({ originalPersona: { description: original }, pocketPersona: { identityBrief: pocket } }, null, []);
    expect(request.persona.originalPersona.description).toBe(original); expect(request.persona.pocketPersona.identityBrief).toBe(pocket);
});

test('anonymous render keeps general saved body and surface without exposing facial identity; identity precedes scene',()=>{
 const p=normalizeDatingProfile({alias:'Private alias',age:30,anonymous:true,fields:{gender:'woman',height:'143 cm',bodyType:'petite'},person:{version:1,appearance:{face:'recognizable facial scar',eyes:'amber eyes',hair:'violet curls',skin:'Deep brown skin, a named identifying tattoo at the wrist',build:'compact small-framed body with a recognizable scar'}},phoneProfile:{appearance:''}})!;
 const scene={camera:'rear view',subjects:[{id:'self',position:'',clothing:'maroon jacket',expression:'',pose:'',action:'walking',gaze:''}],interaction:'',spatial:'',environment:'sidewalk',lighting:'afternoon'};
 for(const prompt of [compileDatingVisual(p,scene,'scene text'),compileDatingVisual(p,undefined,'scene text',['self'])]){
  for(const trait of ['143 cm','petite','compact','Deep brown skin','30-year-old adult','woman','face and identifying features out of frame'])expect(prompt).toContain(trait);
  for(const secret of ['recognizable','amber eyes','violet curls','tattoo','Private alias'])expect(prompt).not.toContain(secret);
  expect(prompt.indexOf('143 cm')).toBeLessThan(prompt.indexOf('scene text'));expect(prompt).not.toContain('<region');
 }
 p.anonymous=false;const portrait=compileDatingVisual(p,scene,'scene text');expect(portrait).toContain('violet curls');expect(portrait).toContain('amber eyes');expect(portrait.indexOf('violet curls')).toBeLessThan(portrait.indexOf('scene text'));
 const scenery=compileDatingVisual(p,{...scene,subjects:[]},'empty sidewalk',[]);expect(scenery).not.toContain('Person A');expect(scenery).not.toContain('violet curls');
});

import {datingVisualIdentitySnapshot} from '../src/domain/lumistry-visual.js';
test('companion appearance is not clipped and participates in the saved visual identity check',()=>{
 const appearance='ordinary adult with auburn hair, '.repeat(40)+'distinctive final eye detail';
 const p=normalizeDatingProfile({alias:'Moon',age:32,phoneProfile:{appearance:'silver curls'},person:{version:1,entities:[{id:'friend',kind:'adult',name:'Friend',appearance,relationship:'friend'}]}})!;
 p.person!.entities[0].appearance=appearance;
 const before=datingVisualIdentitySnapshot(p);const prompt=compileDatingVisual(p,undefined,'at the cafe',['friend']);expect(prompt).toContain('distinctive final eye detail');
 p.person!.entities[0].appearance='different saved appearance';expect(datingVisualIdentitySnapshot(p)).not.toBe(before);
});
