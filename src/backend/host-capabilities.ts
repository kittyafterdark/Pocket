/** Current installed native contract; optional behavior is gated by capabilities, not version guesses. */
export function hostFeature(host:unknown,name:string):boolean {
 const capabilities=(host as {capabilities?:Record<string,unknown>}|undefined)?.capabilities;
 return typeof capabilities?.[name]==='number'&&Number(capabilities[name])>=1;
}
export function assertInterceptorActive(context:unknown):void {
 const c=context as {signal?:AbortSignal};c.signal?.throwIfAborted();
}
export function interceptorPreview(context:unknown):boolean {
 const c=context as {isDryRun?:boolean;dryRun?:boolean};return c.isDryRun===true||c.dryRun===true;
}
