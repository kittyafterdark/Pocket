import { OCCUPATION_ROWS } from './lumistry-occupations-data.js';
export { OCCUPATION_CROSSWALK } from './lumistry-occupations-data.js';
export const OCCUPATION_VERSION='jobs-20261013-1';
export {WORLD_CAPABILITIES,worldDefaults,normalizePopulationWorld} from './lumistry-world-core.js';
export type {WorldCapability,PopulationWorld} from './lumistry-world-core.js';
import type {WorldCapability,PopulationWorld} from './lumistry-world-core.js';
export interface Occupation {
 id:string;title:string;domain:string;family:string;worldTags:string;use:'M'|'B'|'G'|'U';rarity:'common'|'uncommon'|'rare';sourceEntries:readonly number[];aliases:readonly string[];
 pack?:string;addition?:string|null;requiredCapabilities:WorldCapability[];minAge:number;categories:string[];relationships:string[];hours:string[];places:string[];
}
const domainCategories:Record<string,string[]>={adult_industry:['other'],agriculture_environment:['other'],care_community:['public service'],creative_media:['artist'],education_culture:['teacher'],healthcare:['healthcare'],hospitality_food:['hospitality'],industrial_utilities:['tradesperson'],occasional_gigs:['other'],office_finance_legal:['finance'],performance_sports:['other'],personal_services:['other'],public_safety_government:['public service'],retail_customer:['retail'],science_engineering:['researcher'],technology:['technology'],trades_construction:['tradesperson'],transport_logistics:['other']};
// These rules are curated institution/technology requirements, not personality or legal claims.
function metadata(row:typeof OCCUPATION_ROWS[number]):Occupation {
 const r:any=row,id=r.id as string;const caps=new Set<WorldCapability>();
 const require=(test:boolean,cap:WorldCapability)=>{if(test)caps.add(cap)};
 require(r.worldTags==='MCS','electricity');
 require(/software|online_|livestream|video_|virtual_streamer|influencer|podcast|social_media|community_moderator|thumbnail|platform|game_(artist|designer|localization|mod)|website|newsletter|app_based|network_|it_support/.test(id),'digital_networks');
 require(/livestream|video_creator|virtual_streamer|podcaster|cam_performer/.test(id),'broadcast');
 require(/electrician|electronics|lighting|sound_technician|cnc|refrigeration|solar_panel|wind_turbine|power_station|telecommunications/.test(id),'electricity');
 require(/factory|production_line|food_packaging|industrial|cnc|chemical_plant|grain_storage|water_treatment|sewage_treatment/.test(id),'industrial');
 require(/driver|van_|truck_|bus_driver|car_mechanic|vehicle_body|agricultural_equipment|food_truck/.test(id),'motor_transport');
 require(/airport|flight_attendant|aircraft|commercial_pilot|air_traffic/.test(id),'aviation');
 require(/railway|train_conductor/.test(id),'railways');
 require(/supermarket|grocery_shelf/.test(id),'large_retail');
 require(r.domain==='healthcare'||/veterinar/.test(id),'clinical_care');
 require(/university|surgeon|general_practitioner|chemist|microbiologist|registered_dietitian/.test(id),'higher_education');
 require(/ship_|harbour|marine_|commercial_fisher|commercial_diver|port_crane/.test(id),'marine');
 require(/ski_instructor|snow_shovelling/.test(id),'snow');
 if(r.capability)caps.add(r.capability);
 let categories=[...(domainCategories[r.domain]||['other'])];
 if(/designer|stylist/.test(id))categories=['designer'];
 if(/writer|copy_editor|reporter|subtitle_editor|transcriptionist|newsletter/.test(id))categories=['writer'];
 if(/musician|singer|music_teacher|club_dj/.test(id))categories=['musician'];
 if(/engineer|architect|quantity_surveyor/.test(id))categories=['engineer'];
 if(/lawyer|paralegal|legal_secretary/.test(id))categories=['law'];
 if(/receptionist|administrative_assistant|data_entry|records_clerk|purchasing_assistant|human_resources|recruitment/.test(id))categories=['other'];
 if(/chef|cook|baker/.test(id))categories=['chef','hospitality'];
 if(/photographer|painter|illustrator|artist|animator|model|actor|costume|wig_maker|prop_maker/.test(id)&&r.domain!=='adult_industry')categories=['artist'];
 const advanced=/surgeon|general_practitioner|dentist$|veterinarian$|university_lecturer|harbour_pilot/.test(id);
 const qualified=/pharmacist$|physiotherapist|occupational_therapist|radiographer|optometrist|speech_language|registered_dietitian|engineer$|architect$|lawyer$|commercial_pilot|air_traffic_controller/.test(id);
 const privatePractice=/dentist$|general_practitioner|surgeon$|physiotherapist|occupational_therapist|optometrist|speech_language|registered_dietitian/.test(id);
 const institutional=r.use==='M'&&!privatePractice&&/healthcare|public_safety_government|industrial_utilities|transport_logistics/.test(r.domain);
 return {...r,requiredCapabilities:[...caps],categories,minAge:advanced?27:qualified?21:18,relationships:institutional?['employee']:r.use==='G'?['contractor','agency_worker']:['employee','contractor','independent_business_owner'],hours:r.use==='G'?['variable_hours','project_based']:institutional?['full_time','part_time','shift_based']:['full_time','part_time','variable_hours','project_based'],places:/online|software|writer|editor|digital|remote|newsletter/.test(id)?['remote','hybrid','on_site']:['on_site']};
}
export const OCCUPATIONS:readonly Occupation[]=OCCUPATION_ROWS.map(metadata);
export const OCCUPATION_BY_ID=new Map(OCCUPATIONS.map(r=>[r.id,r]));
export function eligibleOccupation(r:Occupation,w:PopulationWorld,adultJobs:boolean,age:number,side=false,explicit=false) {
 const tag={modern:'M',historical:'H',fantasy:'F',cyberpunk:'C',spacefaring:'S',custom:''}[w.kind];
 return (r.domain!=='adult_industry'||adultJobs)&&age>=r.minAge&&(!tag||r.worldTags.includes(tag))&&r.requiredCapabilities.every(c=>w.capabilities.includes(c))&&(r.use!=='U'||explicit)&&(!side||r.use==='B'||r.use==='G');
}
export function roleCategories(r:Occupation,situation:string,relationship:string) {
 return [...new Set([...r.categories,...(situation==='self_employed'&&relationship==='independent_business_owner'?['business owner']:[]),...(situation==='contracting'?['freelancer']:[])])];
}
