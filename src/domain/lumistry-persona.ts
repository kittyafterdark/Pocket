import { DATING_OPTIONS } from './lumistry-options.js';
const stringValue = (value: any): string => typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean).join(', ') : '';
const keyFor = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
/** Only unambiguous equivalents; never infer a preference from another trait or from negative prose. */
const EQUIVALENTS: Record<string, Record<string, string>> = {
    sugarRole: {'sugar baby':'receive support','sugar daddy':'provide support','sugar mommy':'provide support','sugar mummy':'provide support',provider:'provide support',recipient:'receive support'},
    gender: { female: 'woman', male: 'man', 'non-binary': 'nonbinary' },
    orientation: { bi: 'bisexual', pan: 'pansexual', heterosexual: 'straight', homosexual: 'gay' },
    occupation: { lawyer: 'law', attorney: 'law', solicitor: 'law', programmer: 'technology', 'software developer': 'technology', 'software engineer': 'engineer' },
    interests: { reading: 'books', 'video games': 'gaming', 'board games': 'tabletop games' },
    bodyType: { slender: 'slim' },
    drinking: { 'does not drink': 'never', 'non-drinker': 'never', 'social drinker': 'socially' },
    smoking: { nonsmoker: 'never', 'non-smoker': 'never', 'does not smoke': 'never' },
    relationshipStatus: { 'in a relationship': 'partnered' },
    monogamy: { 'non-monogamous': 'nonmonogamous', polyamory: 'polyamorous', monogamy: 'monogamous' },
    sexualRole: { dom: 'dominant', sub: 'submissive', dominance: 'dominant', submission: 'submissive', switching: 'switch' },
    kinks: { 'rope bondage': 'bondage', 'light bondage': 'bondage', 'praise kink': 'praise', dominant: 'dominance', submissive: 'submission', switch: 'switching' },
};
export function selectedValue(key: string, value: any, preserveNegatives = false): string {
    const source = stringValue(value);
    if (key === 'height') {
        let cm: number | undefined;
        const metric = source.match(/^(\d+(?:[.,]\d+)?)\s*(cm|m)$/i);
        const imperial = source.match(/^([4-7])\s*(?:feet|ft|['′])\s*(\d{0,2})\s*(?:inches|in|["″])?$/i);
        if (metric) cm = Number(metric[1].replace(',', '.')) * (metric[2].toLowerCase() === 'm' ? 100 : 1);
        else if (imperial && Number(imperial[2]) < 12) cm = (Number(imperial[1]) * 12 + Number(imperial[2] || 0)) * 2.54;
        const choice = cm === undefined ? '' : `${Math.round(cm)} cm`;
        return DATING_OPTIONS.height.includes(choice) ? choice : source;
    }
    const options = Object.hasOwn(DATING_OPTIONS,key) ? DATING_OPTIONS[key] : [];
    return [...new Set(source.split(',').map(part => {
        const original = part.trim(); const normalized = keyFor(original);
        const exact = options.find(option => keyFor(option) === normalized);
        if (exact) return exact;
        if (key === 'kinks' && !preserveNegatives && /^(no|not|never|dislike|dislikes|avoid|hate|does not)\b/.test(normalized)) return '';
        const aliases=Object.hasOwn(EQUIVALENTS,key)?EQUIVALENTS[key]:undefined;
        return aliases&&Object.hasOwn(aliases,normalized)?aliases[normalized]:original;
    }).filter(Boolean))].join(', ');
}
/** Adapt selections locally before native string-only normalization; retain nuances in private records. */
export function normalizePersonaSelections(draft: any, previous?: any): any {
    const result = structuredClone(draft);
    result.fields = { ...result.fields }; result.privateFields = { ...result.privateFields };
    if (!result.person && ['sexualInterests', 'sexualRole', 'kinks', 'boundaries'].some(k => stringValue(result.privateFields[k]))) result.person = { version: 1, intimacy: {} };
    if (result.person) {
        result.person.version = 1;
        for (const group of ['appearance', 'life', 'intimacy', 'writingVoice', 'presentation']) {
            if (result.person[group] && typeof result.person[group] === 'object')
                for (const [key, value] of Object.entries(result.person[group])) result.person[group][key] = stringValue(value);
        }
    }
    // Known private/intimacy facts also populate the owner's category selections, with visibility handled below.
    const intimacyKeys: Record<string, string> = { sexualInterests: 'sexualInterests', sexualRole: 'role', kinks: 'kinks', boundaries: 'boundaries' };
    for (const key of ['orientation', 'preferences', 'intentions', 'sexualInterests', 'sexualRole', 'libido', 'kinks', 'boundaries', 'dealbreakers']) {
        const detail = stringValue(result.privateFields[key]) || stringValue(result.person?.intimacy?.[intimacyKeys[key]]) || stringValue(result.fields[key]);
        if (!stringValue(result.fields[key]) && detail) result.fields[key] = detail;
    }
    for (const [key, value] of Object.entries(result.fields)) {
        const raw = stringValue(value); const selected = selectedValue(key, raw);
        result.fields[key] = selected;
        if (raw && raw !== selected && key !== 'height' && keyFor(raw) !== keyFor(selected) && !['gender', 'orientation', 'drinking', 'smoking', 'monogamy', 'sexualRole'].includes(key) && !(key === 'occupation' && keyFor(result.person?.life?.career || '').includes(keyFor(raw)))) {
            if (!stringValue(result.privateFields[key + 'Detail'])) result.privateFields[key + 'Detail'] = raw;
        }
    }
    result.pronouns = selectedValue('pronouns', stringValue(result.pronouns).replace(/\s*\/\s*/g, '/'));
    for (const [key, value] of Object.entries(result.privateFields)) {
        const raw = stringValue(value); const selected = selectedValue(key, raw, true);
        if (raw && keyFor(raw) !== keyFor(selected) && !['gender', 'orientation', 'drinking', 'smoking', 'monogamy', 'sexualRole', 'height'].includes(key) && !stringValue(result.privateFields[key + 'Detail'])) result.privateFields[key + 'Detail'] = raw;
        // The shorter option is selectable; detailed intimacy keeps the original constraints/wording.
        const target = intimacyKeys[key];
        if (raw !== selected && target && result.person && !stringValue(result.person.intimacy?.[target]))
            result.person.intimacy = { ...result.person.intimacy, [target]: raw };
        result.privateFields[key] = selected;
    }
    const hidden = new Set<string>(Array.isArray(result.hiddenFields) ? result.hiddenFields : []);
    for (const [key, value] of Object.entries(previous?.fields || {}))
        if (stringValue(value) && !previous.hiddenFields?.includes(key)) hidden.delete(key);
    for (const key of previous?.hiddenFields || []) hidden.add(key);
    for (const key of ['preferences', 'sexualInterests', 'sexualRole', 'libido', 'kinks', 'boundaries', 'dealbreakers']) {
        if (stringValue(previous?.fields?.[key])) {
            // A reviewed selection already has a deliberate visibility choice.
            if (!previous.hiddenFields?.includes(key)) hidden.delete(key);
        } else if (result.fields[key]) hidden.add(key);
    }
    result.hiddenFields = [...hidden];
    return result;
}

/** Preserve reviewed edits; complete blanks from the extracted Persona, never an NPC template. */
export function mergePersonaDraft(response: any, previous: any, evidence: any): any {
    const merge = (fresh: any, saved: any): any => {
        if (Array.isArray(saved)) return saved.length ? saved : fresh;
        if (saved && typeof saved === 'object') {
            const result = { ...(fresh && typeof fresh === 'object' ? fresh : {}) };
            for (const key of Object.keys(saved)) result[key] = merge(fresh?.[key], saved[key]);
            return result;
        }
        return typeof saved === 'string' ? saved.trim() ? saved : fresh : typeof saved === 'number' || typeof saved === 'boolean' ? saved : fresh;
    };
    const fresh = structuredClone(response);
    // Removed copies are not missing facts for the model to re-invent on the next enhancement.
    for (const [key, value] of Object.entries(previous?.fields || {})) {
        if (!stringValue(value)) continue;
        if (!previous?.privateFields?.[key] && selectedValue(key, fresh.privateFields?.[key]) === selectedValue(key, fresh.fields?.[key])) delete fresh.privateFields?.[key];
        const target = ({ sexualInterests: 'sexualInterests', kinks: 'kinks', sexualRole: 'role', boundaries: 'boundaries' } as Record<string, string>)[key];
        if (target && !previous?.person?.intimacy?.[target] && selectedValue(key, fresh.person?.intimacy?.[target]) === selectedValue(key, fresh.fields?.[key])) delete fresh.person?.intimacy?.[target];
    }
    const result = merge(fresh, previous);
    // Only an explicitly labelled height is deterministic evidence. Never scrape arbitrary measurements.
    const sources = [evidence?.originalPersona?.description || evidence?.sourceDescription, evidence?.pocketPersona?.identityBrief, evidence?.description];
    let explicitHeight = '';
    for (const value of sources) {
        if (typeof value !== 'string') continue;
        const source = value.replace(/[*_`]/g, '');
        const heights = [...source.matchAll(/\b(?:height|boy)\s*[:=]\s*(\d{3}(?:[.,]\d+)?\s*cm|[12][.,]\d{1,2}\s*m|[4-7]\s*(?:feet|ft|['′])\s*\d{0,2}\s*(?:inches|in|["″])?)/gi)].map(m => m[1].trim());
        if (heights.length) {
            // Original explicit facts win over a conflicting shortened Pocket summary.
            explicitHeight = new Set(heights).size === 1 ? heights[0] : '';
            break;
        }
    }
    const height = previous?.fields?.height?.trim() || explicitHeight || result.fields?.height || result.person?.appearance?.height;
    if (height) {
        result.fields = { ...result.fields, height };
        if (result.person?.appearance) result.person.appearance.height = '';
    }
    result.hiddenFields = [...new Set([...(Array.isArray(response.hiddenFields) ? response.hiddenFields : []), ...(previous?.hiddenFields || [])])];
    return normalizePersonaSelections(result, previous);
}
