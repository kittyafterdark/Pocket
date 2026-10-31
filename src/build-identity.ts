export interface PocketBuildIdentity {policy:string;sourceHash:string;variant:string;minimumHost:string;sdk:string;creationContract:string;repairPolicy:string;}
declare const __POCKET_BUILD__:PocketBuildIdentity;
/** Build-time literal; tests/source imports deliberately identify themselves as development. */
export const POCKET_BUILD:PocketBuildIdentity=typeof __POCKET_BUILD__==='undefined'?{policy:'lumistry-reliability-1',sourceHash:'development',variant:'source',minimumHost:'1.3.0',sdk:'0.6.32',creationContract:'efficiency-style-1',repairPolicy:'repair-policy-2'}:__POCKET_BUILD__;
