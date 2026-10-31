/** Out-of-band measured usage, never mixed into model-authored profile data. */
export interface DiscoveryRunReceipt {
    requestId: string;
    usageStatus: 'reported' | 'partial' | 'unavailable';
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
    cachedTokens?: number;
}
const receipts = new WeakMap<object, DiscoveryRunReceipt>();
export function attachDiscoveryRun(value: object, receipt: DiscoveryRunReceipt) { receipts.set(value, receipt); }
export function discoveryRun(value: unknown): DiscoveryRunReceipt | undefined { return value && typeof value === 'object' ? receipts.get(value) : undefined; }
