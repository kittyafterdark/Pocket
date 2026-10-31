/** Scheduling is snapshotted at invocation start, independently of identity/filter fingerprints. */
export const CREATION_CONTRACT='efficiency-style-1';
export interface CreationSettings {readyTarget:5|10|25;photoBatchCap:3|4|5;workers:1|2;}
export function creationSettings(v:any):CreationSettings {
 return {readyTarget:[5,10,25].includes(v?.readyTarget)?v.readyTarget:5,photoBatchCap:[3,4,5].includes(v?.photoBatchCap)?v.photoBatchCap:5,workers:v?.workers===2?2:1};
}
