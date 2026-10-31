import { compileDatingVisual, checkedDatingPhotoPrompt } from '../src/domain/lumistry-visual.js';
import { expect, test } from 'bun:test';
import { AUTHORING_LIMITS, booleanChoice, nativeSummary, AuthoringContractError } from '../src/domain/lumistry-authoring-contract.js';
import { parseAuthoring, projectDossier, projectPhotos, projectPublic, normalizeAuthoring, mergeAuthoredArtifact, publicRepair, photoArtifacts, scopedIndexArtifact, normalizePublicCounts } from '../src/domain/lumistry-v2.js';
import { normalizeDiscoveryProgress } from '../src/domain/lumistry-discovery-progress.js';
import { normalizeDatingProfile } from '../src/domain/lumistry.js';
import { discoveryProblems, verifiedPhotoCompilation } from '../src/domain/lumistry-pipeline.js';
import { dossier, publicText, photo } from './fixtures/lumistry-v2.js';
const artifact = (text: string, kind: any = 'dossier') => parseAuthoring(text, kind, 'stop');
const source = (text = dossier()) => ({version: 2 as const, dossier: artifact(text), photos: [], gallery: [], provenance: {}});
const project = (text = dossier()) => projectDossier(source(text), {}, 'slot_0', 2);

for (const [style, decorate] of Object.entries({ plain: (s: string) => s, bold: (s: string) => s.replace(/^([^:\n]+):/gm, '**$1:**'), bullet: (s: string) => s.replace(/^([^:\n]+):/gm, '- $1:'), numbered: (s: string) => s.replace(/^([^:\n]+):/gm, '1. $1:'), headings: (s: string) => s.replace(/^([^:\n]+):/gm, '### $1:'), fence: (s: string) => '```text\n' + s + '\n```', wrapped: (s: string) => s.replace(/: /g, ':\n') })) {
    test(`all authoring stages accept ${style} label presentation and retain source`, () => {
        const text = decorate(dossier()), a = source(text), d = projectDossier(a, {}, 'slot_0', 2);
        expect(d.problems).toEqual([]); expect(d.needsDisclosure).toBe(false); expect(a.dossier.text).toBe(text);
        const pub = projectPublic(artifact(decorate(publicText(3, 2)), 'public'), d.row, 3, 2);
        expect(pub.problems).toEqual([]);
        const picture = projectPhotos(artifact(decorate(photo()), 'photos'), d.row, 1);
        expect(picture.problems).toEqual([]);
        const saved = normalizeDatingProfile({...pub.row, id: 'synthetic', photoPlan: [picture.photos[0],picture.photos[0]]})!;
        expect(discoveryProblems({...saved,slotId:'slot_0'}, {id:'slot_0',questionCount:3,photoCount:2} as any)).toEqual([]);
        expect(verifiedPhotoCompilation(saved)).toBe(true);
    });
}
for (const [value, answer] of [['No',false],['No.',false],['FALSE!',false],['`true`',true],['“yes”',true],['yes.',true],['Not established.',undefined],['yes or no',undefined]] as const) {
    test(`explicit boolean choice ${value} preserves unknown versus false`, () => expect(booleanChoice(value)).toBe(answer));
}

test('every native descriptive projection remains bounded without dropping original prose', () => {
    const labels = ['Hair', 'Facial features', 'Core personality', 'Everyday rhythm', 'Spoken voice and register', 'Written mechanics', 'Sentence rhythm and conversational effort', 'Voice samples'];
    for (const label of labels) {
        const original = 'Specific accepted everyday detail. '.repeat(45);
        const text = dossier().replace(new RegExp(`^${label}:[^\\n]*`, 'm'), `${label}: ${original}`), a = source(text), d = projectDossier(a,{},'slot_0',2);
        expect(d.problems).toEqual([]); expect(a.dossier.text).toBe(text);
        expect(JSON.stringify(d.row)).toContain('Specific accepted everyday detail.');
        expect(normalizeAuthoring(a)!.dossier!.fields[label]).toBe(original.trim());
    }
});
test('long agency facts require an explicit narrow extraction rather than lost or clipped canon', () => {
    const long = 'An actual existing commitment that must remain known. '.repeat(35);
    const a = source(dossier().replace('Existing relationship and commitments: Single; no exclusivity agreements.', `Existing relationship and commitments: ${long}`));
    const d = projectDossier(a,{},'slot_0',2);
    expect(d.problems.join(' ')).toContain('maximum 1000');
    expect(d.repairLabels).toContain('Existing relationship and commitments');
    expect(d.row.privateFields.commitments).toBeUndefined();
    expect(a.dossier.fields['Existing relationship and commitments']).toBe(long.trim());
});
test('photo metadata is a bounded view while the complete scene and source remain intact', () => {
    const text = photo('The complete scene retains each meaningful detail.').replace('Camera and composition: eye-level side view', 'Camera and composition: ' + 'Slightly tilted camera and ordinary focus. '.repeat(25)).replace('Pose, action and gaze: looking at the lamp','Pose, action and gaze: ' + 'Looking at a lamp while holding a tool. '.repeat(10));
    const a = artifact(text,'photos'), p = projectPhotos(a,project().row,1);
    expect(p.problems).toEqual([]); expect(a.text).toBe(text);
    expect(p.photos[0].visual.camera.length).toBeLessThanOrEqual(AUTHORING_LIMITS.visualText);
    expect(p.photos[0].visual.subjects[0].pose.length).toBeLessThanOrEqual(AUTHORING_LIMITS.pose);
    const saved=normalizeDatingProfile({...project().row,id:'synthetic',photoPlan:p.photos})!;
    expect(saved.photoPlan[0].description).toBe('The complete scene retains each meaningful detail.');
    expect(verifiedPhotoCompilation(saved)).toBe(true);
});
test('public and photo hard limits are actionable; public text is never silently shortened', () => {
    const p=projectPhotos(artifact(photo('x'.repeat(1501)),'photos'),project().row,1);
    expect(p.repairLabels).toContain('Full literal description');
    expect(p.photos[0].description).toHaveLength(1501);
    const q=projectPublic(artifact(publicText(2,1,'x'.repeat(1601)),'public'),project().row,2,1);
    expect(q.problems.join(' ')).toContain('1600'); expect(q.row.bio).toHaveLength(1601);
});
test('saved engine counts are checked before and after native normalization', () => {
    expect(projectPublic(artifact(publicText(2,1),'public'),project().row,4,1).issues.some(i=>i.code==='questions')).toBe(true);
    const raw={...project().row,person:{...project().row.person,prompts:[{question:'One?',answer:'One.'},{question:'Two?',answer:'Two.'}]},photoPlan:[]};
    expect(discoveryProblems(raw,{id:'slot_0',questionCount:4,photoCount:3} as any)).toContain('planned photo count');
    expect(verifiedPhotoCompilation(normalizeDatingProfile({...raw,id:'synthetic'})!)).toBe(false);
});
test('private real names are rejected in question text as well as answers and captions', () => {
    const d=project().row;d.privateFields.realName='Private Example Name';
    expect(projectPublic(artifact(publicText(2,1).replace('what small thing 1?', 'Private Example Name?'),'public'),d,2,1).problems.join(' ')).toContain('private real name');
});
test('companion kind punctuation and Unicode names retain distinct saved references', () => {
    const a=source(dossier('Aster','### Companion\nCompanion name: 李\nCompanion kind: pet.\nCompanion appearance: white cat\nCompanion relationship: her cat\n### Companion\nCompanion name: 张\nCompanion kind: pet\nCompanion appearance: black cat\nCompanion relationship: her other cat'));
    const d=projectDossier(a,{},'slot_0',2);expect(d.problems).toEqual([]);expect(d.row.person.entities).toHaveLength(2);
    expect(projectPhotos(artifact(photo('The two cats rest on a chair.','李, 张'),'photos'),d.row,1).problems).toEqual([]);
});
test('companion defects are typed field issues that an organizer can actually correct', () => {
    const d=project(dossier('Aster','### Companion\nCompanion name: Pip\nCompanion kind: pet\nCompanion relationship: her dog'));
    expect(d.problems).toEqual([]);expect(d.row.person.entities).toHaveLength(0);expect(d.row.person.unresolvedSubjects[0].name).toBe('Pip');expect(projectPhotos(artifact(photo('Pip in a chair.','Pip'),'photos'),d.row,1).problems.join(' ')).toContain('unrecognized');
});
test('merged companion tables retain raw history without duplicating accepted records on reload', () => {
    const table='Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog\nCompanion relationship: her dog';
    const first=artifact(table.replace('Companion appearance: white dog\n',''),'index'), correction=artifact(table,'index');
    const merged=mergeAuthoredArtifact(first,correction,['Companion name','Companion kind','Companion appearance','Companion relationship']);
    const a={...source(),index:merged}, d=projectDossier(a,{},'slot_0',2);
    expect(merged.text).toContain(first.text);expect(d.problems).toEqual([]);expect(d.row.person.entities).toHaveLength(1);
    expect(projectDossier(normalizeAuthoring(a)!,{},'slot_0',2).row.person.entities).toEqual(d.row.person.entities);
});
test('repair permissions are exact labels and failed edits leave saved artifacts unchanged', () => {
    const before=artifact(photo(),'photos'), snapshot=JSON.stringify(before);
    expect(()=>mergeAuthoredArtifact(before,artifact('Full literal description: a completely different scene','photos'),['Public caption'])).toThrow(AuthoringContractError);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(()=>mergeAuthoredArtifact(before,artifact('Full literal description: changed','photos'),['Do not change Full literal description'])).toThrow(AuthoringContractError);
});
test('valid gallery purposes cannot be silently rerolled while repairing an answer', () => {
    const a=artifact(publicText(2,1),'public'), b=artifact(publicText(2,1).replace('owner fixing lamp number 1 in the workshop','owner on an unrelated beach'),'public');
    expect(()=>publicRepair(a,b)).toThrow('gallery purpose');
});
test('unfinished record boundaries preserve complete earlier photos even without END markers', () => {
    const text=photo().replace('END PHOTO.','')+'\n'+photo().replace(/Full literal description:[\s\S]*/,'Full literal description: cut');
    const units=photoArtifacts(parseAuthoring(text,'photos','length'));
    expect(units[0].complete).toBe(true);expect(units[1].complete).toBe(false);
});
test('progress normalization is idempotent and rejects impossible stage/task combinations', () => {
    const p={version:2,stage:'identity',task:'dossier',draft:{},authored:source(),problems:[],photoDrafts:{},photoRepairLabels:{},photoTargets:[]};
    const n=normalizeDiscoveryProgress(p)!;expect(normalizeDiscoveryProgress(n)).toEqual(n);
    expect(normalizeDiscoveryProgress({...p,stage:'photos',task:'index'})).toBeUndefined();
});
test('mandatory searchable categories come from the saved plan, optional private categories stay private', () => {
    const d=projectDossier(source(),{libido:'variable'},'slot_0',2);
    expect(d.row.fields.libido).toBe('variable');expect(d.row.hiddenFields).not.toContain('libido');
    expect(d.row.hiddenFields).toContain('orientation');
    expect(d.row.privateFields.orientation).toContain('Bisexual');
});
test('explicitly contradictory facts and declined public plan are not repaired into compatibility', () => {
    const d=projectDossier(source(dossier().replace('Gender and pronouns: woman','Gender and pronouns: man')),{gender:'woman'},'slot_0',2);
    expect(d.repairable).toBe(false);expect(d.row.fields.gender).toBe('man');
    expect(projectDossier(source(dossier().replace(/Public categories:[^\n]*/,'Public categories: none')),{gender:'woman'},'slot_0',2).repairable).toBe(false);
});

test('ordinary wrapped English beginning End is retained rather than treated as a protocol terminator', () => {
    const text=publicText(2,1).replace('Answer: the lamp 1 finally works','Answer: The first detail.\nEnd of the week is when I finish it.');
    const p=projectPublic(artifact(text,'public'),project().row,2,1);expect(p.problems).toEqual([]);
    expect(p.row.person.prompts[0].answer).toContain('End of the week');
});

test('custom category case survives authoring, option mapping and public disclosure', () => {
    const a=source(dossier('Aster','Category Species: android\nPublic categories: Species'));
    // Replace rather than duplicate the scalar disclosure label.
    a.dossier=artifact(dossier().replace(/Public categories:[^\n]*/,'Public categories: Species')+'\nCategory Species: android');
    const d=projectDossier(a,{},'slot_0',2,{Species:['android','human']});
    expect(d.row.fields.Species).toBe('android');expect(d.row.hiddenFields).not.toContain('Species');expect(d.needsDisclosure).toBe(false);
});

test('only the actually unresolved disclosure label is editable; unchanged echoes are harmless', () => {
    const a=source(dossier().replace('Anonymous profile: no','')), d=projectDossier(a,{},'slot_0',2);
    expect(d.repairLabels).toEqual(['Anonymous profile']);
    const echo=scopedIndexArtifact(artifact('Anonymous profile: No.\nPublic categories: gender, occupation, height, interests, intentions.','index'),d.repairLabels,a);
    expect(Object.keys(echo.fields)).toEqual(['Anonymous profile']);
    const scoped=scopedIndexArtifact(artifact('Anonymous profile: No.\nPublic categories: orientation','index'),d.repairLabels,a);expect(scoped.fields).toEqual({'Anonymous profile':'No.'});expect(a.dossier.fields['Public categories']).toBe('gender, occupation, height, interests, intentions');
});

test('chat photos with structured framing still include their complete scene text', () => {
    const d=project().row, visual=projectPhotos(artifact(photo(),'photos'),d,1).photos[0].visual;
    delete visual.description;
    const compiled=compileDatingVisual(d,visual,'A distinct lighthouse and red boat behind the owner.',['self']);
    expect(compiled).toContain('lighthouse and red boat');expect(compiled).toContain('Person A —');expect(compiled).not.toContain('<region');
    expect(()=>checkedDatingPhotoPrompt('x'.repeat(12001))).toThrow('Camera limit');
    expect(checkedDatingPhotoPrompt(compiled)).toBe(compiled);
});

test('extra public records can be removed without repair locks preserving the invalid count', () => {
    const before=artifact(publicText(3,3),'public'), after=artifact(publicText(2,2),'public');
    expect(()=>publicRepair(before,after,false,{questions:2,photos:2},project().row)).not.toThrow();
    expect(projectPublic(after,project().row,2,2).problems).toEqual([]);
});
test('conflicting Q&A fields remain repairable while valid neighboring records stay locked', () => {
    const bad=artifact(publicText(2,2).replace('Answer: the lamp 1 finally works','Answer: the lamp 1 finally works\nAnswer: a conflicting answer'),'public');
    const repaired=artifact(publicText(2,2),'public');
    expect(()=>publicRepair(bad,repaired,false,{questions:2,photos:2},project().row)).not.toThrow();
    expect(()=>publicRepair(bad,artifact(publicText(2,2).replace('the lamp 2 finally works','unrelated replacement'),'public'),false,{questions:2,photos:2},project().row)).toThrow('already authored');
});
test('a private-name leak is editable rather than frozen by the valid-prose repair lock', () => {
    const identity=project().row;identity.privateFields.realName='Private Example Name';
    const bad=artifact(publicText(2,1,'Private Example Name is here.'),'public');
    expect(()=>publicRepair(bad,artifact(publicText(2,1),'public'),false,{questions:2,photos:1},identity)).not.toThrow();
});
test('a companion record conflict requests a complete table instead of an unusable scalar patch', () => {
    const d=project(dossier('Aster','Companion name: Pip\nCompanion kind: pet\nCompanion kind: adult\nCompanion appearance: white dog\nCompanion relationship: her dog'));
    expect(d.row.person.entities).toHaveLength(0);expect(d.row.person.unresolvedSubjects[0].name).toBe('Pip');
});

test('compact dossier options retain required filter values and custom categories',async()=>{
 const {dossierCategoryOptions}=await import('../src/backend/lumistry-discovery.js');
 const options={height:['140 cm','141 cm'],orientation:['questioning'],libido:['low','high'],kinks:['vanilla'],customGuild:['smith']};
 expect(dossierCategoryOptions(options,{libido:'high'})).toEqual({orientation:['questioning'],libido:['low','high'],customGuild:['smith']});
 expect(options.height).toEqual(['140 cm','141 cm']);
});

for(const visibility of [
 'gender, occupation, height, interests, intentions.',
 'gender: woman; occupation: tradesperson; height: 168 cm; interests: books, coffee; intentions: casual dating',
 'gender, occupation, height, interests, intentions.\nGender: woman. Occupation: tradesperson. Height: 168 cm. Interests: books, coffee. Intentions: casual dating.',
 'gender: woman\noccupation: tradesperson\nheight: 168 cm\ninterests: books, coffee\nintentions: casual dating',
 '- gender: woman\n- occupation: tradesperson\n- height: 168 cm\n- interests: coffee, books\n- intentions: casual dating'
])test('explicit disclosure lists and indexed choices project without another organizer: '+visibility.split('\n')[0],()=>{
 const a=source(dossier().replace(/^Public categories:.*$/m,'Public categories: '+visibility));
 const original=a.dossier.text;const p=projectDossier(a,{},'slot_0',2);
 expect(p.needsDisclosure).toBe(false);expect(p.problems).toEqual([]);expect(a.dossier.text).toBe(original);
 expect(p.row.hiddenFields).not.toContain('gender');
});

test('disclosure syntax cannot override a selected fact or turn ambiguous visibility into permission',async()=>{
 const {disclosureChoices,equivalentAuthoredField}=await import('../src/domain/lumistry-v2.js');
 const {DATING_OPTIONS}=await import('../src/domain/lumistry-options.js');
 for(const text of ['none, gender','gender, unknownCategory','probably some things','Anonymous profile: no','gender: woman; gender: man'])expect(disclosureChoices(text,DATING_OPTIONS).valid).toBe(false);
 expect(disclosureChoices('none.',DATING_OPTIONS).valid).toBe(true);
 const p=projectDossier(source(dossier().replace(/^Public categories:.*$/m,'Public categories: gender: man; occupation: tradesperson')), {gender:'woman'},'slot_0',2);
 expect(p.problems.some(x=>x.includes('contradicts'))).toBe(true);expect(p.row.fields.gender).toBe('woman');expect(p.repairable).toBe(false);
 expect(equivalentAuthoredField('Public categories','gender: woman; occupation: tradesperson','occupation, gender')).toBe(true);
});

test('plain public section headings and a generated word count never enter profile prose',()=>{
 const text=publicText(3,1,'A quiet afternoon suits me. (5 words)').replace(/### /g,'');
 const a=artifact(text,'public'),p=projectPublic(a,project().row,3,1);
 expect(p.problems).toEqual([]);expect(p.row.bio).toBe('A quiet afternoon suits me.');
 expect(p.row.person.prompts[2].answer).toBe('the lamp 3 finally works');expect(a.text).toBe(text);
});

test('a Bio-only correction retains all Q&A and gallery records and still protects a valid bio',()=>{
 const previous=artifact(publicText(3,2,'word '.repeat(321)),'public');
 const raw=previous.text;
 const merged=publicRepair(previous,artifact('Bio: a shorter honest introduction.','public'),false,{questions:3,photos:2},project().row);
 const p=projectPublic(merged,project().row,3,2);
 expect(p.problems).toEqual([]);expect(p.row.person.prompts).toHaveLength(3);expect(p.gallery).toHaveLength(2);expect(previous.text).toBe(raw);expect(merged.text).toContain(raw);
 expect(()=>publicRepair(merged,artifact('Bio: a completely different pitch.','public'),false,{questions:3,photos:2},project().row)).toThrow('already authored');
 expect(()=>publicRepair(previous,artifact('Bio: short.\nHair: a different face','public'),false,{questions:3,photos:2},project().row)).toThrow('nonpublic');
});

test('plain companion/photo section names are structural across dossier and gallery stages',()=>{
 const d=project(dossier('Aster','Companion\nCompanion name: Pip\nCompanion kind: pet\nCompanion appearance: a white dog\nCompanion relationship: her dog'));
 expect(d.problems).toEqual([]);expect(d.needsDisclosure).toBe(false);
 const p=projectPhotos(artifact(photo().replace('END PHOTO.','Photo'),'photos'),d.row,1);
 expect(p.problems).toEqual([]);expect(p.photos[0].caption).toBe('it lives');
});

test('companion table corrections preserve every valid sibling while repairing malformed identities',()=>{
 const table='Companion name: Pip\nCompanion kind: pet\nCompanion appearance: a white dog\nCompanion relationship: her dog\nCompanion name: Ash\nCompanion kind: unknown\nCompanion appearance: a gray cat\nCompanion relationship: her cat';
 const original=artifact(dossier('Aster',table)),labels=['Companion name','Companion kind','Companion appearance','Companion relationship'];
 expect(()=>mergeAuthoredArtifact(original,artifact(table.replace('Companion kind: unknown','Companion kind: pet')),labels)).not.toThrow();
 for(const changed of [table.replace('a white dog','a black dog'),table.slice(table.indexOf('Companion name: Ash'))])expect(()=>mergeAuthoredArtifact(original,artifact(changed.replace('Companion kind: unknown','Companion kind: pet')),labels)).toThrow('already valid companion');
});

test('repair cannot add an unrequested absent field or silently truncate original public history',()=>{
 expect(()=>mergeAuthoredArtifact(artifact(photo(),'photos'),artifact('Actual orientation and attraction: new invented fact','photos'),['Public caption'])).toThrow('already authored');
 const old=artifact(publicText(2,1,'word '.repeat(321)),'public');old.text='x'.repeat(AUTHORING_LIMITS.history);
 expect(()=>publicRepair(old,artifact('Bio: short.','public'),false,{questions:2,photos:1},project().row)).toThrow('storage bound');
});

test('organizer extraction cannot replace a valid dossier companion while repairing its malformed sibling', () => {
    const valid = 'Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog\nCompanion relationship: her dog';
    const incomplete = 'Companion name: Ash\nCompanion kind: pet\nCompanion relationship: her cat';
    const a = source(dossier('Aster', valid + '\n' + incomplete));
    const table = valid + '\n' + incomplete + '\nCompanion appearance: black cat';
    const rejected = projectDossier({...a, index: artifact(table.replace('white dog','brown dog'), 'index')}, {}, 'slot_0', 2);
    expect(rejected.issues.some(issue => issue.code === 'companion-identity')).toBe(true);
    const accepted = projectDossier({...a, index: artifact(table, 'index')}, {}, 'slot_0', 2);
    expect(accepted.problems).toEqual([]);
    expect(accepted.row.person.entities.map((e:any) => e.appearance)).toEqual(['white dog','black cat']);
});

test('public component patches retain omitted bio and tables and protect valid supplied records', () => {
    const d = project().row;
    const baseline = artifact(publicText(3,2),'public');
    const gallery = baseline.content!.slice(baseline.content!.indexOf('Gallery photo purpose:'));
    const patched = publicRepair(baseline,artifact(gallery,'public'),false,{questions:3,photos:2},d);
    expect(projectPublic(patched,d,3,2).problems).toEqual([]);
    expect(patched.fields.Bio).toBe(baseline.fields.Bio);
    expect(projectPublic(patched,d,3,2).row.person.prompts).toHaveLength(3);
    expect(()=>publicRepair(baseline,artifact(gallery.replace('owner fixing lamp','owner on a beach'),'public'),false,{questions:3,photos:2},d)).toThrow('gallery purpose');
    const bad = artifact(publicText(3,2).replace('Answer: the lamp 3 finally works', 'Answer: ' + 'x'.repeat(361)),'public');
    expect(projectPublic(bad,d,3,2).problems.length).toBeGreaterThan(0);
    const questions = baseline.content!.slice(baseline.content!.indexOf('Question:'),baseline.content!.indexOf('Gallery photo purpose:'));
    const repaired = publicRepair(bad,artifact(questions,'public'),false,{questions:3,photos:2},d);
    expect(projectPublic(repaired,d,3,2).problems).toEqual([]);
    expect(projectPublic(repaired,d,3,2).gallery).toHaveLength(2);
});

test('surplus trailing public records are removed locally without rewriting selected records or source', () => {
    const d=project().row, original=artifact(publicText(4,7),'public');
    const normalized=normalizePublicCounts(original,3,5);
    expect(normalized.text).toBe(original.text);
    expect(projectPublic(normalized,d,3,5).problems).toEqual([]);
    const selected=projectPublic(normalized,d,3,5);
    expect(selected.row.person.prompts).toEqual(projectPublic(original,d,4,7).row.person.prompts.slice(0,3));
    expect(selected.gallery).toEqual(projectPublic(original,d,4,7).gallery.slice(0,5));
    expect(normalizePublicCounts(normalized,3,6)).toEqual(normalized);
    expect(projectPublic(artifact(publicText(3,7).replace(/^Bio:.*$/m,'Bio: '+ 'word '.repeat(321)),'public'),d,3,5).problems).toContain('Bio exceeds 100 words / 1600 characters');
});

test('a complete correction of the truncated public component can finish retained authoring', () => {
    const complete=artifact(publicText(3,2),'public');
    const cut=parseAuthoring(publicText(3,2),'public','length');
    const gallery=complete.content!.slice(complete.content!.indexOf('Gallery photo purpose:'));
    const repaired=publicRepair(cut,artifact(gallery,'public'),false,{questions:3,photos:2},project().row);
    expect(repaired.complete).toBe(true);
    expect(projectPublic(repaired,project().row,3,2).problems).toEqual([]);
});

test('65-word bio target accepts 66 through 100 intact and rejects 101 without deleting prose', () => {
    const d=project().row;
    for(const words of [65,66,71,100,101]) {
        const bio=Array.from({length:words},()=> 'word').join(' '), a=artifact(publicText(3,2,bio),'public');
        const result=projectPublic(a,d,3,2);
        expect(result.row.bio).toBe(bio);
        expect(result.problems).toEqual(words>100?['Bio exceeds 100 words / 1600 characters']:[]);
        if(words<=100)expect(()=>publicRepair(a,artifact('Bio: different voice.','public'),false,{questions:3,photos:2},d)).toThrow('already authored');
        else expect(projectPublic(publicRepair(a,artifact('Bio: a shorter introduction.','public'),false,{questions:3,photos:2},d),d,3,2).problems).toEqual([]);
    }
});

test('numeric counting notes and identical identity headers are metadata, never profile facts', () => {
    const d=project().row;
    const raw=`Alias: ${d.alias}\nAge: ${d.age}\nPronouns: ${d.pronouns}\n`+publicText(3,2).replace('Bio: one lamp fixed. two to go.', 'Bio: one lamp fixed. two to go.\n\nWord count: 62 · Characters: 437');
    const a=artifact(raw,'public'), normalized=publicRepair(a,a,false,{questions:3,photos:2},d);
    expect(normalized.text).toBe(raw);
    expect(normalized.content).not.toContain('Pronouns:');
    expect(projectPublic(normalized,d,3,2).row.bio).toBe('one lamp fixed. two to go.');
    expect(projectPublic(normalized,d,3,2).problems).toEqual([]);
    expect(()=>publicRepair(a,artifact('Pronouns: changed\nBio: one lamp fixed. two to go.','public'),false,{questions:3,photos:2},d)).toThrow('different Pronouns');
    expect(()=>projectPublic(artifact(raw.replace(`Alias: ${d.alias}`,'Alias: Someone Else'),'public'),d,3,2)).toThrow('different Alias');
    const ordinary=artifact(publicText(3,2,'A quiet evening.\nCharacters: ordinary people with complicated days.'),'public');
    expect(projectPublic(ordinary,d,3,2).row.bio).toContain('Characters: ordinary people');
});

test('photo writing targets are separate from acceptance and accepted long scenes survive every adapter', async () => {
    const {normalizeDatingAttachment}=await import('../src/domain/lumistry-person.js');
    const {datingPhotoProblems}=await import('../src/domain/lumistry-pipeline.js');
    const d=project().row;
    d.person.entities=Array.from({length:8},(_,i)=>({id:`friend_${i+1}`,name:`Friend ${i+1}`,kind:'adult',appearance:'adult with short silver hair',relationship:'established adult friend'}));
    for(const count of [6,7,8,9]) {
        const names=['owner',...d.person.entities.slice(0,count-1).map((e:any)=>e.name)].join(', ');
        const a=artifact(photo('A group sharing a workshop table.',names),'photos');
        const result=projectPhotos(a,d,1);
        expect(result.problems.length===0).toBe(count<=8);
        if(count<=8){expect(result.photos[0].subjectIds).toHaveLength(count);expect(result.photos[0].visual.subjects).toHaveLength(count);}
    }
    for(const length of [1200,1201,1500,1501]) {
        const description='A complete visible scene. '+ 'x'.repeat(length-26);
        expect(description).toHaveLength(length);
        const result=projectPhotos(artifact(photo(description),'photos'),d,1);
        expect(result.photos[0].description).toBe(description);
        expect(result.problems.length===0).toBe(length<=1500);
        if(length<=1500) {
            const saved=normalizeDatingProfile({...d,id:'scene-limit',photoPlan:result.photos})!;
            expect(saved.photoPlan[0].description).toBe(description);
            expect(saved.photoPlan[0].visual!.description).toBe(description);
            expect(saved.photoPlan[0].prompt).toBe(description);
            expect(datingPhotoProblems(saved)).toEqual([]);
            expect(compileDatingVisual(saved,saved.photoPlan[0].visual,saved.photoPlan[0].prompt,['self'])).toContain(description);
            expect(normalizeDatingAttachment({description,prompt:description,subjectIds:['self']})?.description).toBe(description);
        } else expect(normalizeDatingAttachment({description,prompt:description,subjectIds:['self']})).toBeUndefined();
    }
});

test('new public counts permit one card and five photos; longer-than-requested valid cards remain protected', () => {
    const d=project().row;
    const a=artifact(publicText(1,5).replace('Question: what small thing 1?','Question: '+ 'Q'.repeat(120)).replace('Answer: the lamp 1 finally works','Answer: '+ 'A'.repeat(360)),'public');
    expect(projectPublic(a,d,1,5).problems).toEqual([]);
    expect(()=>publicRepair(a,artifact('Question: a different question?\nAnswer: a different answer','public'),false,{questions:1,photos:5},d)).toThrow('already authored');
    expect(projectPublic(artifact(publicText(4,6),'public'),d,4,6).problems.length).toBeGreaterThan(0);
    const surplus=normalizePublicCounts(artifact(publicText(4,6),'public'),3,5);
    expect(projectPublic(surplus,d,3,5).problems).toEqual([]);
});

test('descriptive companion kind suffixes retain explicit types without guessing unknown kinds', () => {
    for (const kind of ['person — an elderly tenant in her building','adult - her neighbor','pet (her dog)']) {
        const d = project(dossier('Aster', `Companion name: Beier\nCompanion kind: ${kind}\nCompanion appearance: elderly woman\nCompanion relationship: her neighbor`));
        expect(d.problems).toEqual([]);
        expect(d.row.person.entities[0].kind).toBe(kind.startsWith('person')?'person':kind.startsWith('adult')?'adult':'pet');
    }
    const d = project(dossier('Aster','Companion name: Beier\nCompanion kind: unknown\nCompanion appearance: elderly woman\nCompanion relationship: neighbor'));
    expect(d.problems).toEqual([]);expect(d.row.person.entities).toHaveLength(0);expect(d.row.person.unresolvedSubjects[0].kind).toBe('unknown');
    expect(d.problems.join(' ')).not.toContain('needs stable camera-visible appearance');
});

test('single companion scalar correction retains its record heading and never parses history as current data', () => {
    const table='Companion name: Frau Beier\nCompanion kind: person — an elderly tenant\nCompanion appearance: Not established.\nCompanion relationship: her neighbor';
    const before=artifact(table,'index'), snapshot=JSON.stringify(before);
    const patch=artifact('Companion appearance: Elderly woman; other details not established.','index');
    const merged=mergeAuthoredArtifact(before,patch,['Companion appearance']);
    expect(merged.content).toContain('Companion name: Frau Beier');
    expect(merged.text).toContain('Not established.');
    expect(JSON.stringify(before)).toBe(snapshot);
    const a={...source(),index:merged};
    const d=projectDossier(normalizeAuthoring(a)!,{},'slot_0',2);
    expect(d.problems).toEqual([]);
    expect(d.row.person.entities).toHaveLength(1);
    expect(d.row.person.entities[0].appearance).toBe(patch.fields['Companion appearance']);
    const broken={...merged,content:''}; // Former merge discarded the record body but kept the snapshot.
    expect(projectDossier({...source(),index:broken},{},'slot_0',2).problems).toEqual([]);
});

test('companion field patches require unambiguous targets and preserve valid identities', () => {
    const labels=['Companion name','Companion kind','Companion appearance','Companion relationship'];
    const table='Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog\nCompanion relationship: her dog\nCompanion name: Ash\nCompanion kind: pet\nCompanion relationship: her cat';
    const before=artifact(table,'index'),snapshot=JSON.stringify(before);
    expect(()=>mergeAuthoredArtifact(before,artifact('Companion appearance: grey cat','index'),labels)).toThrow('ambiguous');
    const merged=mergeAuthoredArtifact(before,artifact('Companion name: Ash\nCompanion appearance: grey cat','index'),labels);
    expect(projectDossier({...source(),index:merged},{},'slot_0',2).row.person.entities.map((e:any)=>e.appearance)).toEqual(['white dog','grey cat']);
    expect(()=>mergeAuthoredArtifact(before,artifact('Companion name: Pip\nCompanion appearance: brown dog','index'),labels)).toThrow('already valid companion');
    expect(()=>mergeAuthoredArtifact(before,artifact('Companion name: Someone else\nCompanion appearance: grey cat','index'),labels)).toThrow('unambiguous');
    expect(JSON.stringify(before)).toBe(snapshot);
});

test('a complete companion replacement can resolve conflicting fields without accepting another conflict', () => {
    const labels=['Companion name','Companion kind','Companion appearance','Companion relationship'];
    const before=artifact('Companion name: Pip\nCompanion kind: pet\nCompanion kind: adult\nCompanion appearance: white dog\nCompanion relationship: her dog','index');
    const clean=artifact('Companion name: Pip\nCompanion kind: pet\nCompanion appearance: white dog\nCompanion relationship: her dog','index');
    const merged=mergeAuthoredArtifact(before,clean,labels);
    expect(projectDossier({...source(),index:merged},{},'slot_0',2).problems).toEqual([]);
    expect(()=>mergeAuthoredArtifact(before,artifact('Companion appearance: black dog','index'),labels)).toThrow('complete companion table');
    expect(()=>mergeAuthoredArtifact(clean,before,labels)).toThrow('Conflicting repeated');
});
