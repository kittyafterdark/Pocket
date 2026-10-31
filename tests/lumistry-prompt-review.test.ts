import {test,expect} from 'bun:test';
import {dossier,photo,publicText} from './fixtures/lumistry-v2.js';
import {lumistryHarness} from './fixtures/lumistry-harness.js';
import {DYNAMIC_DOSSIER_FIELDS,isInstructionNonanswer} from '../src/domain/lumistry-dynamic-fields.js';
import {parseAuthoring,projectDossier,projectPhotos,projectPublic} from '../src/domain/lumistry-v2.js';
import {canReferencePublicRepair} from '../src/backend/lumistry-creation-context.js';
import {v2AuthorPrompt,v2RepairPrompt} from '../src/backend/lumistry-v2-prompts.js';
import {compileDatingVisual,subjectSceneField,normalizeDatingVisual} from '../src/domain/lumistry-visual.js';
import {developmentPrompt,developmentAuthority} from '../src/domain/lumistry-development-contract.js';
import {normalizeDevelopment} from '../src/domain/lumistry-pipeline.js';
import {textingOwnBrief} from '../src/domain/lumistry-messaging.js';
import {catalogEntries,TEMPERAMENT_ACCENTS,characterBrief} from '../src/domain/lumistry-catalog.js';
const identity=(text=dossier())=>projectDossier({version:2,dossier:parseAuthoring(text,'dossier','stop'),photos:[],gallery:[],provenance:{}},{},'fixture',1);

test('known instruction-shaped examples cannot pass as individual facts; nuanced facts remain accepted',()=>{
 for(const [label,value] of [['Actual orientation and attraction','Attraction remains personal and never a promise to this user.'],['Existing relationship and commitments','No invented partner merely to create a complication.'],['Skin / fur / scales / surface','Surface texture follows the accepted anatomy.']]){
  const text=dossier().replace(new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':.*$','m'),label+': '+value);
  expect(identity(text).issues.some(i=>i.code==='instruction-nonanswer'&&i.labels.includes(label))).toBe(true);
 }
 expect(identity().problems).toEqual([]);
 for(const field of DYNAMIC_DOSSIER_FIELDS)for(const example of field.examples)expect(isInstructionNonanswer(example)).toBe(false);
});
test('a nonanswer receives targeted new-person authoring, without buying an organizer call',async()=>{
 const h=lumistryHarness(24);let first=true;
 h.generate=async req=>{const result=h.response(req);if(req.task==='dossier'&&first){first=false;result.authoredText=result.authoredText.replace(/Actual orientation and attraction:.*/, 'Actual orientation and attraction: Attraction remains personal and never a promise to this user.');}return result;};
 await h.run();expect(h.calls.filter(c=>c.req.task!=='photos').map(c=>c.req.task)).toEqual(['dossier','dossier','public']);expect(h.calls.some(c=>c.req.task==='photos')).toBe(true);
 expect(h.calls[1].input.messages[0].content).toContain('Return only the requested labeled scalar answers');
 expect(h.calls[1].input.messages[0].content).not.toContain('TARGETED ORGANIZER');
 expect(h.state.lumistry.owner.profiles).toHaveLength(25);
});
test('public authoring has one consumed output contract',()=>{
 const prompt=v2AuthorPrompt('public');
 for(const unused of ['Q&A cards:','Conversation opener or expectation:','Self-presentation discrepancy:','RECORD FORMAT overrides'])expect(prompt).not.toContain(unused);
 for(const label of ['Bio:','Question:','Answer:','Gallery photo purpose:'])expect(prompt).toContain(label);
 const projected=projectPublic(parseAuthoring(publicText(),'public','stop'),identity().row,2,3);
 expect(projected.problems).toEqual([]);expect(projected.row.person.prompts).toHaveLength(2);expect(projected.gallery).toHaveLength(3);
});
test('repair formats choose scalar, referenced table, companion and photo operations',()=>{
 const scalar=v2RepairPrompt('public',['Bio']);expect(scalar).toContain('Return only the requested labeled scalar');expect(scalar).not.toContain('Photo purpose:');
 const record=v2RepairPrompt('public',['Answer'],undefined,0,true);expect(record).toContain('exact supplied Record reference');expect(record).not.toContain('return the complete relevant');
 expect(v2RepairPrompt('public',['Question'])).toContain('return the complete relevant Q&A or gallery table');
 expect(v2RepairPrompt('public',['Bio','Answer'],undefined,0,true)).toContain('scalar corrections: Bio');
 expect(v2RepairPrompt('dossier',['Companion appearance','Hair'])).toContain('scalar corrections: Hair');
 const short=parseAuthoring(publicText(1,2),'public','stop');expect(canReferencePublicRepair(short,['Answer'],2,2)).toBe(true);expect(canReferencePublicRepair(short,['Answer'],1,2)).toBe(true);
 expect(v2RepairPrompt('dossier',['Companion appearance'])).toContain('complete named companion table');
 const photos=v2RepairPrompt('photos',['Public caption'],undefined,2,true);expect(photos).toContain('each starting Record reference then Photo purpose');expect(photos).not.toContain('each beginning Photo purpose');
 const index=v2RepairPrompt('index',['Actual orientation']);expect(index).toContain('unknown stays NOT_ESTABLISHED');expect(index).not.toContain('Author actual compatible facts');
});
test('group outfits, actions and positions survive projection, reload and nonregional compilation',()=>{
 const owner=identity().row;owner.person.appearance.usualStyle='navy blazer';owner.person.entities=[{id:'friend',name:'Rae',kind:'adult',appearance:'short black hair',relationship:'adult friend'}];
 const text=photo('The owner wears a red raincoat; Rae wears a yellow sweater.','owner, Rae')
 .replace('Clothing and accessories: green work shirt','Clothing and accessories: Rae — yellow sweater; owner — red raincoat')
 .replace('Pose, action and gaze: looking at the lamp','Pose, action and gaze: owner — waves at camera; Rae — looks at owner')
 .replace('Relative positions: owner at frame left','Relative positions: Rae — frame right; owner — frame left');
 const result=projectPhotos(parseAuthoring(text,'photos','stop'),owner,1);expect(result.issues).toEqual([]);
 const visual=normalizeDatingVisual(JSON.parse(JSON.stringify(result.photos[0].visual)))!;
 expect(visual.subjects[0].clothing).toBe('red raincoat');expect(visual.subjects[1].clothing).toBe('yellow sweater');expect(visual.subjects[0].pose).toBe('waves at camera');
 const prompt=compileDatingVisual(owner,visual,'');expect(prompt).toContain('Person A — frame left');expect(prompt).toContain('Person B — frame right');expect(prompt).not.toContain('navy blazer');expect(prompt).not.toContain('<region');
 // Existing unstructured group descriptions remain usable without inventing subject fields.
 visual.subjects.forEach(s=>s.clothing='');expect(compileDatingVisual(owner,visual,'')).not.toContain('navy blazer');
 expect(subjectSceneField('owner — red; owner — blue','owner')).toBe('');expect(subjectSceneField('owner friend — red','owner')).toBe('');
});
test('development authority distinguishes background, witnessed facts and diagnostic samples',()=>{
 const modules=[{key:'daily',label:'Unseen daily life',guidance:'Ordinary detail.'},{key:'voice',label:'Texting voice in practice',guidance:'Sample.'},{key:'knowledge',label:'Who knows what',guidance:'Knowledge.'}];
 expect(developmentAuthority(modules[0],true)).toBe('private-background');expect(developmentAuthority(modules[0],false)).toBe('performance');
 expect(developmentAuthority(modules[1],true)).toBe('diagnostic');expect(developmentAuthority(modules[2],true)).toBe('witnessed');
 expect(developmentPrompt(modules,'MUTUAL_MATCH',true)).toContain('not another participant’s knowledge');
 const dev=normalizeDevelopment({version:1,origin:'profile_first',attempts:{},units:{'MUTUAL_MATCH:voice':{authority:'diagnostic',trigger:'MUTUAL_MATCH',evidence:['match:x'],text:'Sample: practical questions get quick answers.',revision:1}}});
 expect(dev?.units?.['MUTUAL_MATCH:voice'].authority).toBe('diagnostic');
 const owner=identity().row;owner.development=dev;owner.privateFields.initiative='Suggests a place, gets impatient about vague plans.';owner.privateFields.selfStory='Thinks of herself as easygoing.';
 const brief=textingOwnBrief(owner);expect(brief.socialPattern.initiative).toContain('impatient');expect(brief.diagnosticVoice).toContain('Sample:');
});
test('all 120 original directions remain, with optional behavioral accents rather than mandatory flaws',()=>{
 expect(catalogEntries()).toHaveLength(120);expect(Object.keys(TEMPERAMENT_ACCENTS)).toHaveLength(9);
 const brief=characterBrief({version:2,tags:['enjoys-competence'],cooldown:[],requiredFields:{}},'identity');expect(brief?.directions[0].optionalAccent).toContain('no compulsory flaw');
});

import {renderDatingIdentityAnchor,completeStructuredScene,formatDatingImageScene,datingImageDialect} from '../src/domain/lumistry-visual.js';
const structuredPhoto=(subjects='owner')=>photo('A readable gallery description.',subjects)
 .replace('Pose, action and gaze: looking at the lamp','Expression: relaxed smile\nPose and action: holds a brass lamp\nGaze: looking down at the lamp');
test('structured scene owns render input while readable description survives reload',()=>{
 const p=identity().row;
 const result=projectPhotos(parseAuthoring(structuredPhoto(),'photos','stop'),p,1);
 expect(result.issues).toEqual([]);
 const saved=JSON.parse(JSON.stringify(result.photos[0]));
 const scene=normalizeDatingVisual(saved.visual)!;
 expect(scene.renderSource).toBe('structured');expect(scene.subjects[0].expression).toBe('relaxed smile');expect(scene.subjects[0].gaze).toBe('looking down at the lamp');
 const compiled=compileDatingVisual(p,scene,saved.description);
 expect(compiled).not.toContain('A readable gallery description');expect(saved.description).toBe('A readable gallery description.');
 for(const value of ['green work shirt','holds a brass lamp','relaxed smile','looking down at the lamp','repair workshop','soft window light'])expect(compiled).toContain(value);
 expect(compiled.match(/frame left/g)).toHaveLength(1);expect(compiled).not.toContain('<region');
});
test('old and partially specified scenes retain full prose rather than silently losing facts',()=>{
 const p=identity().row;
 for(const input of [photo('A distinctive background detail.'),structuredPhoto().replace('Gaze: looking down at the lamp\n',''),structuredPhoto().replace('Pose and action: holds a brass lamp','Pose and action: '+ 'holding a very long object '.repeat(15))]){
  const result=projectPhotos(parseAuthoring(input,'photos','stop'),p,1);
  expect(result.issues).toEqual([]);expect(result.photos[0].visual.renderSource).toBeUndefined();
  expect(compileDatingVisual(p,result.photos[0].visual,result.photos[0].description)).toContain(result.photos[0].description);
 }
});
test('new group expressions and gaze bind by reference independent of authored order',()=>{
 const p=identity().row;p.person.entities=[{id:'friend',name:'Rae',kind:'adult',appearance:'short silver hair',relationship:'adult friend'}];
 const text=structuredPhoto('owner, Rae')
 .replace('Clothing and accessories: green work shirt','Clothing and accessories: Rae — yellow sweater; owner — red coat')
 .replace('Expression: relaxed smile','Expression: Rae — neutral face; owner — laughing')
 .replace('Pose and action: holds a brass lamp','Pose and action: owner — holds a mug; Rae — points at mug')
 .replace('Gaze: looking down at the lamp','Gaze: Rae — looking at mug; owner — looking at Rae')
 .replace('Relative positions: owner at frame left','Relative positions: Rae — frame right; owner — frame left');
 const result=projectPhotos(parseAuthoring(text,'photos','stop'),p,1);expect(result.issues).toEqual([]);
 const scene=normalizeDatingVisual(JSON.parse(JSON.stringify(result.photos[0].visual)))!;
 expect(scene.renderSource).toBe('structured');expect(scene.subjects[0].gaze).toBe('looking at Rae');expect(scene.subjects[1].gaze).toBe('looking at mug');
 const compiled=compileDatingVisual(p,scene,'');const lines=compiled.split('\n');
 expect(lines.find(l=>l.startsWith('Person A —'))).toContain('red coat, laughing, holds a mug, looking at Rae');
 expect(lines.find(l=>l.startsWith('Person B —'))).toContain('yellow sweater, neutral face, points at mug, looking at mug');
 expect(compiled).not.toContain('A readable gallery description');
 // An ambiguous author reference never earns structured authority.
 scene.subjects[0].gaze='';expect(completeStructuredScene(scene)).toBe(false);
 expect(compileDatingVisual(p,scene,'')).toContain('A readable gallery description');
});
test('structured object photos omit portraits; anonymity never inserts saved facial identifiers',()=>{
 const p=identity().row;
 const object=structuredPhoto('none');const result=projectPhotos(parseAuthoring(object,'photos','stop'),p,1);
 expect(result.issues).toEqual([]);expect(result.photos[0].visual.renderSource).toBeUndefined();
 const compiled=compileDatingVisual(p,result.photos[0].visual,'');expect(compiled).toContain('A readable gallery description');expect(compiled).not.toContain('Person A');expect(compiled).toContain('repair workshop');
 p.anonymous=true;p.person.appearance.face='SECRET_FACE';p.person.appearance.eyes='SECRET_EYES';
 const scene=projectPhotos(parseAuthoring(structuredPhoto(),'photos','stop'),p,1).photos[0].visual;
 const anonymous=compileDatingVisual(p,scene,'');expect(anonymous).not.toContain('SECRET_');expect(anonymous).toContain('identifying features out of frame');
});
test('render identity ordering is deterministic and retains all canonical physical details',()=>{
 const p=identity().row;p.person.appearance={tags:'adult human',hair:'black waves',eyes:'brown eyes',face:'angular jaw',skin:'olive skin',build:'lean build',distinctive:'eyebrow scar',usualStyle:'navy suit'};
 const a=renderDatingIdentityAnchor(p,true);p.person.appearance=Object.fromEntries(Object.entries(p.person.appearance).reverse());
 expect(renderDatingIdentityAnchor(p,true)).toBe(a);expect(a.indexOf('olive skin')).toBeLessThan(a.indexOf('adult human'));expect(a).not.toContain('navy suit');
 for(const value of ['black waves','brown eyes','angular jaw','olive skin','lean build','eyebrow scar'])expect(a).toContain(value);
});
test('photo prompts and repairs use new recognized fields and keep acceptance tolerance private',()=>{
 for(const prompt of [v2AuthorPrompt('photos'),v2RepairPrompt('photos',['Expression','Pose and action','Gaze'],undefined,1,true)]){
  for(const label of ['Expression:','Pose and action:','Gaze:'])expect(prompt).toContain(label);
  expect(prompt).not.toContain('Pose, action and gaze:');expect(prompt).toContain('maximum 600 characters');expect(prompt).not.toContain('1500');expect(prompt).not.toContain('at most 8 visible subjects');
 }
 const correction=parseAuthoring('Expression: relaxed smile\nGaze: looking toward camera\nEND PHOTO.','photos','stop');expect(correction.fields.Expression).toBe('relaxed smile');expect(correction.fields.Gaze).toBe('looking toward camera');
});
test('Anima adapter preserves subject binding and private canonical traits without injecting model tags',()=>{
 expect(datingImageDialect('auto','models/anima-aesthetic.safetensors')).toBe('anima');expect(datingImageDialect('auto','unknown-checkpoint')).toBe('generic');expect(datingImageDialect('anima','native workflow')).toBe('anima');expect(datingImageDialect('generic','Anima')).toBe('generic');expect(datingImageDialect('auto','animation-other-model')).toBe('generic');
 const p=identity().row;const scene=projectPhotos(parseAuthoring(structuredPhoto(),'photos','stop'),p,1).photos[0].visual;
 const original=compileDatingVisual(p,scene,'');const result=formatDatingImageScene(original,'anima');
 for(const line of original.split('\n'))expect(result).toContain(line);
 expect(result).not.toContain('photorealistic');expect(result).not.toContain('score_');expect(result).not.toContain('masterpiece');expect(formatDatingImageScene(original,'generic')).toBe(original);
});
test('unknown and repeated structured subjects fail locally before rendering',()=>{
 const p=identity().row;const scene=projectPhotos(parseAuthoring(structuredPhoto(),'photos','stop'),p,1).photos[0].visual;
 scene.subjects.push({...scene.subjects[0]});expect(()=>compileDatingVisual(p,scene,'')).toThrow('unknown or repeated subject');
 scene.subjects[1].id='unknown';expect(()=>compileDatingVisual(p,scene,'')).toThrow('unknown or repeated subject');
});
