import {datingReplyTexts} from '../domain/lumistry-reply-burst.js';
import {parsePhoneReply} from './phone-reply-format.js';
import type { PocketGenerationRun } from '../types.js';
import { runPocketGeneration, type PocketGenerationHost } from './generation.js';
import { parseGeneratedObject, looksTruncated, StructuredOutputError, runStructuredResponse, validateStructuredTask, expandedStructuredBudget } from './structured.js';

/** Shared production JSON boundary, including native request parameters and retry ownership. */
export async function runStructuredJsonGeneration(host: PocketGenerationHost, task: PocketGenerationRun['task'], requestId: string, request: Record<string, any>, userId?: string): Promise<Record<string, any>> {
  const spotify=request.spotifyReply===true&&['message-reply','message-retry','reply-decision'].includes(task);
  request={...request};delete request.spotifyReply;
  const dialogue=(request.diagnosticScope==='lumistry'||spotify)&&['message-reply','message-retry'].includes(task);
  let accepted:Record<string,unknown>|undefined;
  const generate = (input: Record<string, any>, id: string) => runPocketGeneration(host, task, id, input, userId, {
    automaticRetry: false,
    validate: response => {
      let value: Record<string, any>;
      try { value = dialogue?parsePhoneReply(response.content,response.finish_reason):parseGeneratedObject(response.content); }
      catch {
        throw new StructuredOutputError(response.finish_reason === 'length' || looksTruncated(response.content) ? 'truncated' : 'invalid',
          'The response needs a complete JSON object; no generated result was applied.',
          {answerBytes: typeof response.content === 'string' ? new TextEncoder().encode(response.content).length : 0, finishReason: response.finish_reason, code:'json-shape'});
      }
      try { if(request.diagnosticScope==='lumistry'&&['message-reply','message-retry'].includes(task))value={...value,message:datingReplyTexts(value).join('\n\n')}; validateStructuredTask(task, value); accepted=value; }
      catch (error) {
        if (error instanceof StructuredOutputError) throw new StructuredOutputError('invalid', error.message,
          {answerBytes: typeof response.content === 'string' ? new TextEncoder().encode(response.content).length : 0, code:'task-envelope'});
        throw error;
      }
    },
  });

  // Dating and explicit Spotify-triggered replies start with native output settings; only an explicit numeric budget
  // can be expanded on the one user-enabled truncation retry. No 400-token fallback.
  const datingMessage=request.diagnosticScope==='lumistry'&&['message-reply','message-retry','reply-decision','group-reply'].includes(task);
  if (task === 'lumistry-relationship-assess'||task === 'lumistry-self_generate'||datingMessage||spotify) {
    const automaticRetry=(datingMessage||spotify)&&(await host.loadPreferences(userId)).automaticGenerationRetry;
    for(let attempt=0;attempt<2;attempt++){
      try {
        const parameters={...(request.parameters||{})};
        if(attempt&&Number.isFinite(parameters.max_tokens)&&parameters.max_tokens>0)parameters.max_tokens=expandedStructuredBudget(parameters.max_tokens);
        const response=await generate({...request,parameters},attempt?`${requestId}:structured-retry`:requestId);
        return accepted||validateStructuredTask(task,parseGeneratedObject(response.content));
      } catch(error) {
        if(!automaticRetry||attempt||!(error instanceof StructuredOutputError)||error.kind!=='truncated'||['reasoning-exhausted','refused'].includes(error.details?.code||''))throw error;
        if(request.signal instanceof AbortSignal)request.signal.throwIfAborted();
        host.send({type:'lumiphone:operation_progress',task,requestId,phase:'thinking',message:'The reply was cut off. Retrying once…'},userId);
      }
    }
    throw new Error('Structured generation stopped.');
  }
  const preferences = await host.loadPreferences(userId);
  const parameters = request.parameters && typeof request.parameters === 'object' && !Array.isArray(request.parameters) ? request.parameters : {};
  const rawBudget = Number(parameters.max_tokens);
  const initialBudget = Math.max(80, Math.round(Number.isFinite(rawBudget) ? rawBudget : 400));
  const parsed = await runStructuredResponse((budget, retry) => generate(
    {...request, parameters:{...parameters,max_tokens:budget}}, retry ? `${requestId}:structured-retry` : requestId
  ), initialBudget, preferences.automaticGenerationRetry, () => {
    if (request.signal instanceof AbortSignal) request.signal.throwIfAborted();
    host.send({type:'lumiphone:operation_progress',task,requestId,phase:'thinking',message:'The response was cut off. Retrying once with more output room…'},userId);
  }, {retryEmpty: !task.startsWith('lumistry-')});
  return validateStructuredTask(task, parsed);
}
