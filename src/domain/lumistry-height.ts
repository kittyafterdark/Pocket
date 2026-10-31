/** Heights stay in centimetres internally; unit choices change presentation only. */
export type HeightUnit = 'metric' | 'imperial';
export function heightCm(value: string): number | undefined {
    const metric = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(cm|m)$/i);
    const imperial = value.trim().match(/^(\d+)\s*(?:feet|ft|['′])\s*(\d{0,2})\s*(?:inches|in|["″])?$/i);
    const cm = metric ? Number(metric[1].replace(',', '.')) * (metric[2].toLowerCase() === 'm' ? 100 : 1) : imperial && Number(imperial[2]) < 12 ? (Number(imperial[1]) * 12 + Number(imperial[2] || 0)) * 2.54 : NaN;
    return Number.isFinite(cm) && cm > 0 && cm <= 1000 ? Math.round(cm) : undefined;
}
export function heightRange(value: string): [number, number] | undefined {
    const range = value.trim().match(/^(\d+)\s*[–-]\s*(\d+)\s*cm$/i);
    if (!range) return undefined;
    const lo = Number(range[1]), hi = Number(range[2]);
    return lo > 0 && hi >= lo && hi <= 1000 ? [lo, hi] : undefined;
}
export function heightAlternatives(value: string): string[] {
    const range = heightRange(value);
    return range ? Array.from({ length: range[1] - range[0] + 1 }, (_, i) => `${range[0] + i} cm`) : [...new Set(value.split(',').map(v => v.trim()).filter(Boolean))];
}
export function heightMatches(actual: string, wanted: string): boolean {
    const range = heightRange(wanted), cm = heightCm(actual);
    if (range) return cm !== undefined && cm >= range[0] && cm <= range[1];
    const exactWanted=heightCm(wanted);if(cm!==undefined&&exactWanted!==undefined)return cm===exactWanted;
    return actual.split(',').some(part => wanted.split(',').some(v => part.trim().toLowerCase() === v.trim().toLowerCase() || heightCm(part) !== undefined && heightCm(part) === heightCm(v)));
}
export function formatHeight(cm: number, unit: HeightUnit): string {
    if (unit === 'metric') return `${cm} cm`;
    const inches = Math.round(cm / 2.54);
    return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}
export function displayHeight(value: string, unit: HeightUnit): string {
    const range = heightRange(value);
    if (range) return `${formatHeight(range[0], unit)} – ${formatHeight(range[1], unit)}`;
    return value.split(',').map(v => { const cm = heightCm(v); return cm === undefined ? v.trim() : formatHeight(cm, unit); }).join(', ');
}
