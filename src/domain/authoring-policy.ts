export interface AuthoringPolicy {
    transport:'response'|'stream';
    connectionId:string;
    overrideConnection:boolean;
    model:string;
    reasoning:'inherit'|'off'|'low';
    outputTokens:number;
    timeoutSeconds:number;
    sessionCalls:number;
    maxCalls:number;
    maxTokens:number;
}
export const DEFAULT_AUTHORING_POLICY:AuthoringPolicy={transport:'response',connectionId:'',overrideConnection:false,model:'',reasoning:'inherit',outputTokens:0,timeoutSeconds:180,sessionCalls:24,maxCalls:150,maxTokens:800000};
export function normalizeAuthoringPolicy(v:any):AuthoringPolicy {
    const integer=(key:keyof AuthoringPolicy,min:number,max:number)=>typeof v?.[key]==='number'&&Number.isFinite(v[key])?Math.max(min,Math.min(max,Math.round(v[key]))):Number(DEFAULT_AUTHORING_POLICY[key]);
    return {overrideConnection:typeof v?.overrideConnection==='boolean'?v.overrideConnection:!!v?.connectionId,model:typeof v?.model==='string'?v.model.trim().slice(0,500):'',transport:v?.transport==='stream'?'stream':'response',connectionId:typeof v?.connectionId==='string'?v.connectionId.trim().slice(0,180):'',reasoning:['off','low'].includes(v?.reasoning)?v.reasoning:'inherit',outputTokens:v?.outputTokens===0?0:integer('outputTokens',0,32768),timeoutSeconds:integer('timeoutSeconds',15,900),sessionCalls:integer('sessionCalls',1,100),maxCalls:integer('maxCalls',1,1000),maxTokens:integer('maxTokens',1000,10000000)};
}
