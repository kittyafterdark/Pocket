/** Canonical selection text; only complete string lists are decoded, never prose/private facts. */
export function selectionText(value: unknown): unknown {
    let parsed = value;
    if (typeof value === 'string' && value.length <= 16000 && value.trim().startsWith('[') && value.trim().endsWith(']')) {
        try { parsed = JSON.parse(value); } catch { return value; }
    }
    return Array.isArray(parsed) && parsed.length <= 64 && parsed.every(x => typeof x === 'string')
        ? parsed.map(x => x.trim()).filter(Boolean).join(', ') : value;
}
