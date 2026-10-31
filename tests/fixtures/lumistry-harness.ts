import {expect} from 'bun:test';
import {Lumistry} from '../../src/backend/lumistry.js';
import {normalizeDating,normalizeDatingProfile} from '../../src/domain/lumistry.js';
import {parseAuthoring,projectDossier,projectPhotos} from '../../src/domain/lumistry-v2.js';
import type {PhoneState} from '../../src/types.js';
import {dossier,publicText,photo,withPlannedAppearance} from './lumistry-v2.js';
function authored(text:string,kind:any='dossier'){return parseAuthoring(text,kind,'stop');}
function identity(){const a:any={version:2,dossier:authored(dossier()),photos:[],gallery:[],provenance:{}};return projectDossier(a,{},'slot_0',2);}
export function lumistryHarness(count = 24) {
    let seq = 0, locked = false, active = true, permit = true;
    const existing = Array.from({ length: count }, (_, i) => normalizeDatingProfile({ ...identity().row, id: `existing_${i}`, alias: `Saved ${i}`, bio: 'saved', photoPlan: [projectPhotos(authored(photo(), 'photos'), identity().row, 1).photos[0]], person: { ...identity().row.person, prompts: [{ question: 'a?', answer: 'yes' }, { question: 'b?', answer: 'maybe' }] } })!);
    let state = { version: 12, chatId: 'c', characterId: 'a', characterName: 'Alice', pocketPersonaActorId: 'owner', pocketPersona: { displayName: 'PRIVATE OWNER', identityBrief: 'PRIVATE OWNER SECRET' }, contacts: [], conversations: [], events: [], lumistry: { owner: normalizeDating({ generationSettings:{creation:{readyTarget:25,photoBatchCap:3,workers:1}},self: { alias: 'Moon', age: 30 },filters:{minAge:29,maxAge:29,fields:{occupation:{mode:'required',value:'tradesperson'}}}, profiles: existing }) } } as unknown as PhoneState;
    const calls: any[] = [], sent: any[] = [];
    let callback: ((req: any, task: string) => Promise<any>) | undefined;
    const archives=new Map<string,unknown>();
    const h: any = {writeAuthoringArchive:async(id:string,value:unknown)=>{archives.set(id,structuredClone(value))},readAuthoringArchive:async(id:string)=>structuredClone(archives.get(id)),deleteAuthoringArchive:async(id:string)=>{archives.delete(id)}, loadState: async () => structuredClone(state), saveState: async (s: PhoneState) => { expect(locked).toBe(true); state = { ...structuredClone(s), lumistry: Object.fromEntries(Object.entries(s.lumistry || {}).map(([k, d]) => [k, normalizeDating(d)])) }; }, sendState: async () => { }, send: (v: any) => sent.push(v), stateKey: () => 'c/a', nowIso: () => '2026-10-13T00:00:00Z', id: (p: string) => `${p}_${++seq}`, permitted: () => permit, activeScope: () => active, withStateLock: async (_: string, fn: any) => { expect(locked).toBe(false); locked = true; try {
            return await fn();
        }
        finally {
            locked = false;
        } }, resolveMacros: async (t: string, options: any) => { expect(options.commit).toBe(false); return { text: t.replace(/\{\{pick::([^}]+)\}\}/g, (_: string, v: string) => v.split('::')[0]), diagnostics: [] }; }, generate: async (task: string, id: string, input: any) => { expect(locked).toBe(false); const req = JSON.parse(input.messages[1].content); calls.push({ task, req, id, input }); if (callback)
            return callback(req, task); return response(req); }, getMessages: async () => [], cancelReply: () => { } };
    function response(req: any) { return { authoredText: req.task === 'dossier' ? withPlannedAppearance(dossier('New Aster'),req.lockedCandidate?.physicalAppearance).replace('Category occupation: tradesperson','Category occupation: '+(req.lockedCandidate?.work.categoryOptions[0]||'tradesperson')) : req.task === 'index' ? 'Anonymous profile: no\nPublic categories: gender, occupation, height, interests, intentions' : req.task === 'public' ? publicText(req.counts.questions, req.counts.photos) : Array.from({ length: req.batchCount }, (_, i) => `Record reference: ${req.photoReferences[i]}\n`+photo(`The owner works on a lamp: ${req.purposes[i]}.`)).join('\n'), finishReason: 'stop' }; }
    const app = new Lumistry(h);
    return { h, app, calls, sent, response, get state() { return state; }, set state(s: PhoneState) { state = s; }, set generate(fn: typeof callback) { callback = fn; }, set active(v: boolean) { active = v; }, set permitted(v: boolean) { permit = v; }, run: () => app.handle({ action: 'discover', requestId: `r_${++seq}` }, { chatId: 'c', characterId: 'a' }, 'u') };
}
