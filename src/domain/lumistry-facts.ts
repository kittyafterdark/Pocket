import { selectionText } from './lumistry-field-values.js';
import type { DatingProfile } from './lumistry.js';
const text = (v: unknown): string => typeof v === 'string' ? v.trim() : '';
const comparable = (v: unknown) => text(v).toLowerCase().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
const same = (a: unknown, b: unknown) => !!text(a) && comparable(a) === comparable(b);
export const INTIMACY_FIELDS: Record<string, string> = { sexualInterests: 'sexualInterests', kinks: 'kinks', sexualRole: 'role', boundaries: 'boundaries' };
/** Own knowledge only. Never use this resolver for public visibility/filtering. */
export function datingFact(p: any, key: string): string {
    const values = [text(p.privateFields?.[key]), text(p.person?.intimacy?.[INTIMACY_FIELDS[key]]), text(p.fields?.[key])].filter(Boolean);
    return values.find(value => !/^(unknown|not disclosed|discuss privately|prefer not to say|undisclosed|withheld|not specified|private|n\/a)$/i.test(value)) || values[0] || '';
}
/** Exact/case-equivalent copies only; differing disclosure or qualifications remain independent. */
export function deduplicateDatingProfile<T extends DatingProfile>(p: T): T {
    for (const [key, value] of Object.entries(p.privateFields)) {
        const intimacy = p.person?.intimacy?.[INTIMACY_FIELDS[key] as keyof NonNullable<DatingProfile['person']>['intimacy']];
        if (same(selectionText(value), p.fields[key]) || same(value, intimacy)) delete p.privateFields[key];
        else if (key.endsWith('Detail') && (same(value, p.fields[key.slice(0, -6)]) || same(value, p.privateFields[key.slice(0, -6)]))) delete p.privateFields[key];
    }
    if (!p.person) return p;
    for (const [key, target] of Object.entries(INTIMACY_FIELDS)) {
        if (same(p.person.intimacy[target as keyof typeof p.person.intimacy], p.fields[key])) p.person.intimacy[target as keyof typeof p.person.intimacy] = '';
    }
    if (same(p.person.appearance.height, p.fields.height)) p.person.appearance.height = '';
    if (same(p.person.availability.routine, p.person.life.routine)) p.person.availability.routine = '';
    // Preserve all legacy visual information, once. Tags supplement structured traits rather than replacing them.
    const a = p.person.appearance;
    const seen = new Set(Object.entries(a).filter(([k]) => k !== 'tags').flatMap(([, v]) => v.split(',').map(comparable)).filter(Boolean));
    const unique: string[] = [];
    for (const part of [a.tags, p.phoneProfile.appearance].flatMap(v => v.split(','))) {
        const key = comparable(part); if (!key || seen.has(key)) continue;
        seen.add(key); unique.push(part.trim());
    }
    a.tags = unique.join(', ');
    p.phoneProfile.appearance = '';
    return p;
}
/** Native Pocket requires a compact visual string; derive this projection, don't save a second authority. */
export function datingAppearance(p: any, clothing = false): string {
    const a = p.person?.appearance;
    const parts = a ? Object.entries(a).filter(([k]) => !(clothing && k === 'usualStyle')).map(([, v]) => text(v)).filter(Boolean) : [];
    if(p.person?.anatomy)parts.push(...Object.entries(p.person.anatomy).filter(([k])=>k!=='version').map(([,v])=>text(v)));
    if (!parts.length) parts.push(text(p.phoneProfile?.appearance));
    const height = text(p.fields?.height);
    if (height && !parts.some(v => comparable(v).includes(comparable(height)))) parts.push(height);
    return [...new Set(parts.flatMap(v => v.split(',').map(s => s.trim())).filter(Boolean))].join(', ');
}
/** Height and a usual outfit alone do not identify a person for a portrait. */
export function hasDatingAppearance(p: any): boolean {
    const a = p.person?.appearance;
    const traits = a ? Object.entries(a).filter(([key]) => key !== 'height' && key !== 'usualStyle').map(([, value]) => text(value)) : [];
    traits.push(text(p.phoneProfile?.appearance));
    const height = comparable(p.fields?.height);
    return traits.flatMap(value => value.split(',')).some(value => {
        const trait = comparable(value);
        return !!trait && trait !== height && !/^\d+(?:\.\d+)?\s*(?:cm|m|feet|foot|ft|inches|inch|in)(?:\s+tall)?$/i.test(trait);
    });
}
export function datingPhoneProfile(p: DatingProfile) {
    return { ...p.phoneProfile, appearance: datingAppearance(p) };
}
/** One own-profile block for replies: public content appears once, followed by private-only details. */
export function datingOwnContext(p: DatingProfile) {
    const own = deduplicateDatingProfile(structuredClone(p));
    const person = own.person ? { ...own.person, prompts: undefined } : undefined;
    return { privateFields: own.privateFields, hiddenFields: Object.fromEntries(Object.entries(own.fields).filter(([key]) => own.hiddenFields.includes(key))), phoneProfile: own.phoneProfile, person, development: own.development ? { ...own.development, voiceLab: undefined } : undefined };
}
