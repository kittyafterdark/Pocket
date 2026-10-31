/** Error locations only: no exception messages, source URLs, paths or application content. */
export function clientExceptionDiagnostic(error:unknown,eventType:unknown) {
 const e=error as {name?:unknown;stack?:unknown;message?:unknown}|null;
 const errorName=['TypeError','ReferenceError','RangeError','SyntaxError','DOMException','Error'].includes(String(e?.name))?String(e?.name):'Error';
 const frames=typeof e?.stack==='string'?[...e.stack.matchAll(/:(\d{1,9}):(\d{1,9})(?:\)?\s*$)/gm)].slice(0,6).map(m=>({line:Number(m[1]),column:Number(m[2])})):[];
 const operation=typeof eventType==='string'&&/^lumiphone:[a-z_]{1,60}$/.test(eventType)?eventType:'unknown';
 const message=typeof e?.message==='string'?e.message:'';
 const category=/null|undefined/i.test(message)?'missing-value':/selector/i.test(message)?'selector':/permission|revoked/i.test(message)?'permission':/JSON|parse/i.test(message)?'parse':'uncategorized';
 return {errorName,frames,eventType:operation,category};
}
export function normalizeClientException(raw:any) {
 const errorName=['TypeError','ReferenceError','RangeError','SyntaxError','DOMException','Error'].includes(raw?.errorName)?raw.errorName:'Error';
 const frames=Array.isArray(raw?.frames)?raw.frames.slice(0,6).flatMap((f:any)=>Number.isInteger(f?.line)&&f.line>=0&&f.line<1e9&&Number.isInteger(f?.column)&&f.column>=0&&f.column<1e9?[{line:f.line,column:f.column}]:[]):[];
 return {errorName,frames,eventType:typeof raw?.eventType==='string'&&/^lumiphone:[a-z_]{1,60}$/.test(raw.eventType)?raw.eventType:'unknown',category:['missing-value','selector','permission','parse','uncategorized'].includes(raw?.category)?raw.category:'uncategorized'};
}
