export const LUMISTRY_V2_REVISION = 'v2-contract-recovery-20261014';
/** V2 experience policy: presentation and eligible opportunities, never actor consent. */
export interface LumistryExperience {
    version: 2;
    scope: 'A' | 'B' | 'C';
    tone: 'grounded' | 'balanced' | 'chaotic';
    tropeRate: number;
    exaggeration: number;
    socialLift: number;
    socialIntensity: number;
    parody: boolean;
    voiceLab: boolean;
}
export const EXPERIENCE_PRESETS = {
    grounded: { tropeRate: 10, exaggeration: 15, socialLift: 5, socialIntensity: 15 },
    balanced: { tropeRate: 28, exaggeration: 45, socialLift: 25, socialIntensity: 40 },
    chaotic: { tropeRate: 60, exaggeration: 80, socialLift: 55, socialIntensity: 75 },
} as const;
export function normalizeExperience(v?: any): LumistryExperience {
    const tone: LumistryExperience['tone'] = v?.tone === 'grounded' || v?.tone === 'chaotic' ? v.tone : 'balanced';
    const defaults = EXPERIENCE_PRESETS[tone];
    const percent = (key: keyof typeof defaults) => typeof v?.[key] === 'number' && Number.isFinite(v[key]) ? Math.max(0, Math.min(100, Math.round(v[key]))) : defaults[key];
    return { version: 2, scope: v?.scope === 'B' || v?.scope === 'C' ? v.scope : 'A', tone, tropeRate: percent('tropeRate'), exaggeration: percent('exaggeration'), socialLift: percent('socialLift'), socialIntensity: percent('socialIntensity'), parody: v?.parody === true, voiceLab: v?.voiceLab === true };
}
/** A stable optional writing opportunity on settled native replies, not an event commit.
 * A small bounded scalar lift is deliberately distinct from the slider percentage.
 * No clock/poller, global randomness, extra call or authority over other actors. */
export function socialOpportunity(v: LumistryExperience | undefined, messages: Array<{
    id: string;
    sender: string;
    text: string;
}>, enabled: boolean) {
    const e = normalizeExperience(v);
    const settled = messages.filter(m => m.sender !== 'system');
    if (!enabled || e.scope === 'A' || !e.socialLift || !e.socialIntensity || settled.length < 2)
        return undefined;
    // At most one selected opportunity per eight settled messages; retries stay stable.
    if (settled.length % 8 !== 2)
        return undefined;
    let hash = 2166136261;
    for (const c of settled.at(-1)!.id)
        hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    if ((hash >>> 0) / 4294967296 >= e.socialLift / 100 * .3)
        return undefined;
    return { intensity: e.socialIntensity, instruction: 'Optional context-fitting awkwardness or surprise in your own next message. It may be declined when unsuitable. Do not invent another actor’s action, a sent photo, relationship, contact exchange, physical arrival or committed event. Stay in English and keep your established voice and actual boundaries.' };
}
