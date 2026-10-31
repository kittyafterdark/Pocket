import { PocketFailure } from '../domain/reliability.js';
/** Abort the native request and reject late results even if a provider ignores cancellation. */
export async function generationDeadline<T>(seconds:number,parent:AbortSignal|undefined,work:(signal:AbortSignal)=>Promise<T>):Promise<T> {
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    let rejectAbort!:(error:unknown)=>void;
    const stopped=new Promise<never>((_,reject)=>{rejectAbort=reject;});
    const abort=()=>{controller.abort();rejectAbort(new DOMException('Generation cancelled','AbortError'));};
    parent?.addEventListener('abort',abort,{once:true});
    try {
        parent?.throwIfAborted();
        timer=setTimeout(()=>{controller.abort();rejectAbort(new PocketFailure({layer:'provider',code:'timeout',saved:false,retryable:true},'The provider did not finish before the authoring deadline. Saved work is kept.'));},seconds*1000);
        const result=await Promise.race([work(controller.signal),stopped]);
        parent?.throwIfAborted();controller.signal.throwIfAborted();return result;
    }finally{if(timer)clearTimeout(timer);parent?.removeEventListener('abort',abort);controller.abort();}
}
