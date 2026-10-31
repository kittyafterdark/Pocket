/** Shape-only transport receipts. Never persist provider prose or arbitrary keys. */
export interface DiscoveryDiagnostic {
    version: 1;
    layer: 'transport';
    code: 'array_gap' | 'overlap' | 'duplicate' | 'shape' | 'container';
    path: string;
    relatedPath?: string;
    indices?: number[];
    expectedLength?: number;
}
const keys = new Set(('slotId alias age distanceKm anonymous bio pronouns fields hiddenFields privateFields phoneProfile person interest photoPlan openingPhoto photoPatches index photo ' +
    'appearance life intimacy writingVoice availability presentation entities prompts version name kind relationship id question answer ' +
    'tags face hair skin build height distinctive usualStyle background career routine socialCircle currentPressure values contradiction attraction ' +
    'sexualInterests kinks role turnOns turnOffs boundaries disclosure primaryLanguage bioLanguage humor sample basis register mechanics rhythm effort audience selfImage privateContrast ' +
    'appHabits minReplySeconds maxReplySeconds quietStart quietEnd hook cause profileBehavior conversationBehavior photoBehavior limits ' +
    'personality textingStyle orientation commitments intentions preferences dealbreakers gender occupation bodyType religion drinking smoking relationshipStatus monogamy children libido interests sexualRole ' +
    'status seen visual camera subjects position clothing expression pose action gaze interaction spatial environment lighting caption prompt description subjectIds subjectPosition aspect').split(' '));
export function diagnosticPath(value: unknown): string {
    if (typeof value !== 'string') return '$';
    return value.split('.').slice(0, 9).map(key => keys.has(key) || /^(?:0|[1-9]\d?)$/.test(key) && Number(key) <= 63 ? key : '[field]').join('.') || '$';
}
/** Re-sanitize on storage load: receipt data is not a trusted provider payload. */
export function normalizeDiscoveryDiagnostic(value: any): DiscoveryDiagnostic | undefined {
    if (value?.version !== 1 || value.layer !== 'transport' || !['array_gap', 'overlap', 'duplicate', 'shape', 'container'].includes(value.code)) return undefined;
    return { version: 1, layer: 'transport', code: value.code, path: diagnosticPath(value.path),
        ...(typeof value.relatedPath === 'string' ? { relatedPath: diagnosticPath(value.relatedPath) } : {}),
        ...(Array.isArray(value.indices) ? { indices: [...new Set<number>(value.indices.filter((i: any) => Number.isInteger(i) && i >= 0 && i <= 63))].sort((a, b) => a - b) } : {}),
        ...(Number.isInteger(value.expectedLength) && value.expectedLength >= 0 && value.expectedLength <= 64 ? { expectedLength: value.expectedLength } : {}) };
}
