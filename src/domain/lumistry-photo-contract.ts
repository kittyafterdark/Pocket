import { WRITING_FIELDS as F, AUTHORING_LIMITS as L } from './lumistry-authoring-contract.js';
/** Model-facing targets and private acceptance bounds; never disclose the latter as writing allowances. */
export const PHOTO_TEXT_LIMITS = {
    captionTarget: F.caption.target, caption: F.caption.accepted, descriptionTarget: F.description.target, description: F.description.accepted,
    subjectsTarget:L.subjectsTarget, subjects:L.subjects, promptTarget: F.prompt.target, prompt: F.prompt.accepted, kind: 40,
} as const;
