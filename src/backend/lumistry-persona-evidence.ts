import type { SpindleAPI } from 'lumiverse-spindle-types';
import type { ChatPocketPersona } from '../types.js';

/** Prompt-only projection. Storage and reviewed edits remain authoritative locally. */
export function personaEnhancementRequest(evidence: any, currentDraft: any, worldFields: any) {
    const originalPersona = evidence.originalPersona;
    const reviewed = currentDraft ? Object.fromEntries(['alias', 'age', 'anonymous', 'pronouns', 'bio', 'fields', 'hiddenFields', 'privateFields', 'phoneProfile', 'person'].filter(k => currentDraft[k] !== undefined).map(k => [k, structuredClone(currentDraft[k])])) : undefined;
    const seen = new Set<string>();
    const canonical = (s: string) => s.replace(/\s+/g, ' ').trim();
    const collect = (v: any) => {
        if (typeof v === 'string' && canonical(v).length >= 40) seen.add(canonical(v));
        else if (Array.isArray(v)) v.forEach(collect);
        else if (v && typeof v === 'object') Object.values(v).forEach(collect);
    };
    collect(originalPersona); collect(reviewed);
    const unique = (v: any): any => {
        if (typeof v === 'string') {
            const key = canonical(v);
            if (!key) return undefined;
            if (key.length < 40) return v;
            if (seen.has(key)) return undefined;
            seen.add(key); return v;
        }
        if (!v || typeof v !== 'object') return undefined;
        const entries = Object.entries(v).map(([k, x]) => [k, unique(x)]).filter(([, x]) => x !== undefined);
        return entries.length ? Object.fromEntries(entries) : undefined;
    };
    // Exclude display metadata and galleries; locally preserved, not extraction evidence.
    const p = evidence.pocketPersona || {};
    const pocketPersona = unique({ displayName: p.displayName, pronouns: p.pronouns, role: p.role, identityBrief: p.identityBrief, phoneProfile: p.phoneProfile });
    return { persona: { originalPersona, pocketPersona, sourceSelection: evidence.sourceSelection }, currentDraft: reviewed, hasSavedPhotoPlans: !!currentDraft?.photoPlan?.length, worldFields };
}

/** Read both sources without changing Pocket's configured identity or the user's original Persona. */
export async function loadDatingPersonaEvidence(
    pocketPersona: ChatPocketPersona,
    personas: Pick<SpindleAPI['personas'], 'get' | 'getActive'>,
    permitted: () => boolean,
    userId?: string,
) {
    const check = () => {
        if (!permitted()) throw new Error('Enable Personas permission so Lumistry can read your original Persona together with your Pocket Persona.');
    };
    check();
    const linkedId = pocketPersona.linkedPersonaId?.trim();
    // An explicit link wins over the globally active Persona. Never silently substitute another identity for a broken link.
    const original = linkedId ? await personas.get(linkedId, userId) : await personas.getActive(userId);
    check();
    if (!original) throw new Error(linkedId
        ? 'Your linked original Persona could not be read. Check the Persona link in Pocket settings.'
        : 'Select an active Persona in Lumiverse, then enhance again. Lumistry needs both the original Persona and Pocket Persona.');
    return {
        pocketPersona: structuredClone(pocketPersona),
        originalPersona: {
            id: original.id, name: original.name, title: original.title, description: original.description,
            pronouns: typeof original.metadata?.pronouns === 'string' ? original.metadata.pronouns : '',
            role: typeof original.metadata?.role === 'string' ? original.metadata.role : '',
        },
        sourceSelection: linkedId ? 'linked' as const : 'active' as const,
    };
}
