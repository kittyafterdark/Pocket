import {LOVE_STYLES} from './components/lumistry-love.js';
import {LUMISTRY_VISUAL_POLISH_STYLES} from './lumistry-visual-polish-styles.js';
import {LUMISTRY_LIBRARY_STYLES} from './lumistry-flow-styles.js';
import {SIMPLE_FILTER_STYLES} from './apps/lumistry-filters.js';
import { LUMISTRY_FLOW_STYLES } from './lumistry-flow-styles.js';
import { LUMISTRY_THREAD_STYLES } from './lumistry-thread-styles.js';
import { LUMISTRY_STYLES_STICKER } from './lumistry-styles-sticker.js';
import { LUMISTRY_STYLES_DISTILLERY } from './lumistry-styles-distillery.js';

import { LUMISTRY_STYLES_MODERN } from './lumistry-styles-modern.js';

// All three looks are loaded once; the app root selects the persisted appearance.
export const LUMISTRY_STYLES = LOVE_STYLES + LUMISTRY_LIBRARY_STYLES + LUMISTRY_STYLES_STICKER + LUMISTRY_STYLES_DISTILLERY + LUMISTRY_STYLES_MODERN + LUMISTRY_THREAD_STYLES + LUMISTRY_FLOW_STYLES + SIMPLE_FILTER_STYLES + LUMISTRY_VISUAL_POLISH_STYLES;
