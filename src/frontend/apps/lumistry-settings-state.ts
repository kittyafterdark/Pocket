import type {DatingUI} from './lumistry.js';
import type {DatingState} from '../../domain/lumistry.js';
import type {ApplyGroup} from '../../domain/lumistry-setup.js';
export function acknowledgeSetupSettings(ui:DatingUI,d:DatingState,groups:string[],direct=false):void {
 for(const group of groups){if(ui.settingsBaselines)delete ui.settingsBaselines[group as ApplyGroup];
  if(group==='world'){ui.populationWorldDraft=undefined;ui.worldGuideDraft=undefined;ui.worldContextDraft=undefined;ui.worldFieldsDraft=undefined;ui.worldSettingsBaseline=undefined;if(ui.generationDraft)for(const k of ['adultJobs','appearanceDiversity','allTropes'] as const)(ui.generationDraft as any)[k]=d.generationSettings[k];}
  if(group==='experience'){ui.loveDraft=undefined;ui.pipelineDraft=undefined;ui.contentDraft=undefined;ui.contentEdited=undefined;if(ui.generationDraft)ui.generationDraft.experience=structuredClone(d.generationSettings.experience);}
  if((direct&&group==='discovery'||!direct&&group==='app')&&ui.generationDraft)ui.generationDraft.creation=structuredClone(d.generationSettings.creation);
  if(group==='app'){if(!direct&&ui.settingsBaselines)delete ui.settingsBaselines.discovery;ui.bankDraft=undefined;ui.appThemeDraft=undefined;}
 }
 ui.directBaseline=undefined;
}
