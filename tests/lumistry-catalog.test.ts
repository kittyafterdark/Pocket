import { expect, test } from 'bun:test';
import { applySelectedFields, catalogEntries, characterBrief, normalizeCharacterSelection, normalizeSelectionHistory, selectCharacter, selectedFieldProblems, type MacroResolver } from '../src/domain/lumistry-catalog.js';
import { normalizeDating } from '../src/domain/lumistry.js';
import { normalizeDiscoveryJob } from '../src/domain/lumistry-pipeline.js';
const scope = { chatId: 'chat', characterId: 'character', userId: 'operator', commit: false } as const;
const first: MacroResolver = async template => ({ text: template.replace(/\{\{pick::([^}]+)\}\}/g, (_, args) => args.split('::')[0]), diagnostics: [] });

test('catalog has unique stable IDs and short original definitions, without a full catalog in a brief', async () => {
    const entries = catalogEntries();
    expect(entries.length).toBe(120); expect(new Set(entries.map(e => e.id)).size).toBe(entries.length);
    expect(entries.every(e => e.definition.length < 260)).toBe(true);
    const plan = await selectCharacter(normalizeDating(null), first, scope,()=>.8);
    expect(plan.tags).toHaveLength(4); expect(new Set(plan.tags).size).toBe(4);
    expect(characterBrief(plan, 'identity')!.directions).toHaveLength(4);
    expect(characterBrief(plan, 'public')!.directions.map(e => e.dimension).sort()).toEqual(['mechanics', 'rhythm']);
    expect(characterBrief(plan, 'photos')!.directions).toEqual([]);
    expect(characterBrief(undefined, 'identity')).toBeUndefined();
});
test('unrestricted and empty required categories impose no gender quota or preference requirement', async () => {
    const data = normalizeDating({ filters: { fields: { gender: { mode: 'any', value: 'woman' }, height: { mode: 'required', value: '  ' }, interests: { mode: 'preferred', value: 'art, music' } } } });
    const plan = await selectCharacter(data, first, scope);
    expect(plan.requiredFields).toEqual({});
});
test('engine resolves one OR alternative in every required category, with trusted scope and opaque option IDs', async () => {
    const seen: string[] = [];
    const label = '{{setvar::secret::changed}}';
    const data = normalizeDating({ filters: { fields: { gender: { mode: 'required', value: 'man, woman' }, height: { mode: 'required', value: '174 cm, 182 cm' }, custom: { mode: 'required', value: label } } } });
    const plan = await selectCharacter(data, async (template, options) => { expect(options).toEqual(scope); seen.push(template); return first(template, options); }, scope);
    expect(plan.requiredFields).toEqual({ gender: 'man', height: '174 cm', custom: label });
    expect(seen.join('')).not.toContain(label);
    expect(selectedFieldProblems({ fields: { gender: 'man', height: '182 cm', custom: label } }, plan)).toEqual(['fields.height: preserve the engine-selected required alternative']);
    expect(selectedFieldProblems({ fields: plan.requiredFields }, plan)).toEqual([]);
});
test('recent optional tags are excluded without touching required facts', async () => {
    const data = normalizeDating({ filters: { fields: { gender: { mode: 'required', value: 'woman' } } } });
    const previous = await selectCharacter(data, first, scope);
    data.selectionHistory.push(previous.tags);
    const next = await selectCharacter(data, first, scope);
    expect(next.cooldown).toEqual(previous.tags);
    expect(next.cooldown.every(id => previous.tags.includes(id) && !next.tags.includes(id))).toBe(true);
    expect(next.requiredFields).toEqual(previous.requiredFields);
});
test('unresolved, diagnostic or out-of-pool macro results fail before provider work', async () => {
    for (const resolve of [async (template: string) => ({ text: template, diagnostics: [] }), async () => ({ text: 'invented', diagnostics: [] }), async (template: string) => ({ ...(await first(template, scope)), diagnostics: [{ message: 'warning' }] })]) {
        await expect(selectCharacter(normalizeDating(null), resolve, scope)).rejects.toThrow('could not resolve');
    }
});
test('selection round trips through native state/job normalization without a duplicate biography', async () => {
    const plan = await selectCharacter(normalizeDating(null), first, scope);
    const data = normalizeDating({ selectionHistory: Array.from({ length: 30 }, () => plan.tags), discoveryJob: { version: 2, tagSelectionVersion: 1, id: 'job', fingerprint: 'f', slots: [{ id: 'slot', selection: plan }] } });
    expect(data.selectionHistory).toHaveLength(24); expect(data.discoveryJob!.slots[0].selection).toEqual(plan);
    expect(normalizeDating(JSON.parse(JSON.stringify(data))).discoveryJob!.slots[0].selection).toEqual(plan);
    expect(normalizeSelectionHistory([['unknown', 'promises-carefully']])).toEqual([['promises-carefully']]);
    expect(normalizeCharacterSelection({ version: 99 })).toBeUndefined();
    expect(normalizeDiscoveryJob({ version: 1, id: 'legacy', fingerprint: 'f', slots: [] })).toBeUndefined();
    expect(() => characterBrief({ ...plan, tags: ['unknown'] }, 'identity')).toThrow('do not reroll');
});

test('code supplies omitted preselected fields without overwriting authored conflicts or inventing private agency', async () => {
    const data = normalizeDating({ filters: { fields: { gender: { mode: 'required', value: 'woman' }, height: { mode: 'required', value: '174 cm' } } } });
    const plan = await selectCharacter(data, first, scope);
    const original = { alias: 'Adult', fields: { occupation: 'law' }, privateFields: { orientation: 'bisexual' } };
    const supplied = applySelectedFields(original, plan);
    expect(supplied.fields).toEqual({ gender: 'woman', height: '174 cm', occupation: 'law' });
    expect(original.fields).toEqual({ occupation: 'law' });
    expect(supplied.privateFields).toEqual(original.privateFields);
    expect(supplied.privateFields.commitments).toBeUndefined();
    const conflict = applySelectedFields({ fields: { gender: 'man' } }, plan);
    expect(conflict.fields.gender).toBe('man'); expect(selectedFieldProblems(conflict, plan)).toHaveLength(1);
    expect(applySelectedFields({ fields: 'wrong type' }, plan).fields).toBe('wrong type');
});

test('height range required filters resolve a canonical cm alternative within inclusive bounds', async () => {
    const data = normalizeDating({ filters: { fields: { height: { mode: 'required', value: '160–185 cm' } } } });
    const plan = await selectCharacter(data, first, scope);
    expect(plan.requiredFields.height).toBe('160 cm');
    expect(selectedFieldProblems({ fields: plan.requiredFields }, plan)).toEqual([]);
    const restored = normalizeDating(JSON.parse(JSON.stringify(data)));
    expect(restored.filters.fields.height.value).toBe('160–185 cm');
});
