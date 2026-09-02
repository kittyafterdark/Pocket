// @bun
// src/domain/preferences.ts
var PREFERENCES_VERSION = 1;
var PREFERENCES_PATH = "device/preferences.json";
var HEX = /^#[0-9a-f]{6}$/i;
var THEME_COLORS = {
  midnight: {
    accent: "#8b7dff",
    bezel: "#17151d",
    background: "#0d0c12",
    surface: "#17131f",
    text: "#f8f6ff",
    wallpaperPrimary: "#171327",
    wallpaperSecondary: "#123a4a",
    chatPrimary: "#2c2448",
    chatSecondary: "#13111c"
  },
  porcelain: {
    accent: "#6657d9",
    bezel: "#d6d0cb",
    background: "#f2f0ed",
    surface: "#f7f3ef",
    text: "#201d25",
    wallpaperPrimary: "#eeeae6",
    wallpaperSecondary: "#cfd9e8",
    chatPrimary: "#e4def8",
    chatSecondary: "#faf8f6"
  },
  rose: {
    accent: "#ff78a8",
    bezel: "#321722",
    background: "#1b1018",
    surface: "#28131c",
    text: "#fff4f7",
    wallpaperPrimary: "#4a1830",
    wallpaperSecondary: "#7a294e",
    chatPrimary: "#4b1d31",
    chatSecondary: "#1d1117"
  },
  forest: {
    accent: "#63d8a4",
    bezel: "#10251d",
    background: "#0d1713",
    surface: "#11231c",
    text: "#f1fff8",
    wallpaperPrimary: "#14372a",
    wallpaperSecondary: "#1d5a41",
    chatPrimary: "#17412f",
    chatSecondary: "#0f1c17"
  }
};
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function text(value, fallback = "", max = 12000) {
  return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
}
function bool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function numberIn(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}
function safeColor(value, fallback) {
  const candidate = text(value, fallback, 16);
  return HEX.test(candidate) ? candidate.toLowerCase() : fallback;
}
function themePalette(theme) {
  return structuredClone(THEME_COLORS[theme === "custom" ? "midnight" : theme]);
}
function defaultPreferences() {
  return {
    version: PREFERENCES_VERSION,
    theme: "midnight",
    colors: themePalette("midnight"),
    handsetScale: 1,
    animation: "spring",
    animationDurationMs: 280,
    reducedMotion: false,
    autoOpenOnModelAction: false,
    pushNotifications: false,
    useSwarmProfile: true,
    sceneEnhancer: true,
    manualVisualProfile: { positive: "", negative: "", model: "", connectionId: "", loras: [], parameters: {} }
  };
}
function normalizePreferences(value) {
  const fallback = defaultPreferences();
  const raw = record(value);
  const version = Number(raw.version ?? 0);
  if (Number.isFinite(version) && version > PREFERENCES_VERSION)
    return fallback;
  const allowedThemes = new Set(["midnight", "porcelain", "rose", "forest", "custom"]);
  const theme = allowedThemes.has(raw.theme) ? raw.theme : fallback.theme;
  const preset = themePalette(theme);
  const colors = record(raw.colors);
  const legacyAccent = safeColor(raw.accent, preset.accent);
  const legacyBezel = safeColor(raw.bezelColor, preset.bezel);
  const palette = {
    accent: safeColor(colors.accent, legacyAccent),
    bezel: safeColor(colors.bezel, legacyBezel),
    background: safeColor(colors.background, preset.background),
    surface: safeColor(colors.surface, preset.surface),
    text: safeColor(colors.text, preset.text),
    wallpaperPrimary: safeColor(colors.wallpaperPrimary, preset.wallpaperPrimary),
    wallpaperSecondary: safeColor(colors.wallpaperSecondary, preset.wallpaperSecondary),
    chatPrimary: safeColor(colors.chatPrimary, preset.chatPrimary),
    chatSecondary: safeColor(colors.chatSecondary, preset.chatSecondary)
  };
  const manual = record(raw.manualVisualProfile);
  const allowedAnimations = new Set(["spring", "slide", "fade", "none"]);
  return {
    version: PREFERENCES_VERSION,
    theme,
    colors: palette,
    handsetScale: numberIn(raw.handsetScale, fallback.handsetScale, 0.8, 1.25),
    animation: allowedAnimations.has(String(raw.animation)) ? raw.animation : fallback.animation,
    animationDurationMs: Math.round(numberIn(raw.animationDurationMs, fallback.animationDurationMs, 0, 700)),
    reducedMotion: bool(raw.reducedMotion, fallback.reducedMotion),
    autoOpenOnModelAction: bool(raw.autoOpenOnModelAction, fallback.autoOpenOnModelAction),
    pushNotifications: bool(raw.pushNotifications, fallback.pushNotifications),
    useSwarmProfile: bool(raw.useSwarmProfile, fallback.useSwarmProfile),
    sceneEnhancer: bool(raw.sceneEnhancer, fallback.sceneEnhancer),
    manualVisualProfile: {
      positive: text(manual.positive, "", 12000),
      negative: text(manual.negative, "", 12000),
      model: text(manual.model, "", 500),
      connectionId: text(manual.connectionId, "", 200),
      loras: (Array.isArray(manual.loras) ? manual.loras : []).slice(0, 24).flatMap((entry) => {
        const item = record(entry);
        const name = text(item.name, "", 500);
        if (!name)
          return [];
        return [{ name, weight: numberIn(item.weight, 1, -4, 4) }];
      }),
      parameters: record(manual.parameters)
    }
  };
}
function isFuturePreferences(value) {
  const raw = record(value);
  return Number.isFinite(Number(raw.version)) && Number(raw.version) > PREFERENCES_VERSION;
}

// src/domain/trackers.ts
var TRACKER_HISTORY_LIMIT = 40;
var KINDS = new Set(["meter", "counter", "state", "timer"]);
var CLOCKS = new Set(["real", "roleplay"]);
var MODES = new Set(["manual", "model", "automatic"]);
var PRESENTATIONS = new Set(["relationship", "meter", "vitals", "segmented", "counter", "timer", "state", "compact"]);
var TARGETS = new Set(["character", "persona", "relationship", "scene", "world", "custom"]);
function record2(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function clean(value, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function iso(value, fallback) {
  const text2 = clean(value, 80);
  return Number.isFinite(Date.parse(text2)) ? text2 : fallback;
}
function trackerId(prefix = "trk") {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`}`;
}
function trackerKey(value, fallback = "tracker") {
  const key = clean(value, 120).toLocaleLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return key || fallback;
}
function normalizeTrackerTarget(value, fallback = { type: "custom", id: "", label: "Unassigned" }) {
  if (!record2(value))
    return fallback;
  const type = TARGETS.has(value.type) ? value.type : fallback.type;
  return { type, id: clean(value.id, 180), label: clean(value.label, 160) || fallback.label };
}
function normalizeBands(value, min, max, color) {
  const bands = (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!record2(item))
      return [];
    const bandMin = Math.max(min, Math.min(max, finite(item.min, min)));
    const bandMax = Math.max(bandMin, Math.min(max, finite(item.max, max)));
    const label = clean(item.label, 80);
    return label ? [{ min: bandMin, max: bandMax, label, color: clean(item.color, 40) || color }] : [];
  }).slice(0, 12);
  if (bands.length || max <= min)
    return bands;
  const span = max - min;
  return [
    { min, max: min + span * 0.33, label: "Low", color: "#ef6b73" },
    { min: min + span * 0.33, max: min + span * 0.67, label: "Steady", color },
    { min: min + span * 0.67, max, label: "High", color: "#62c994" }
  ];
}
function normalizeHistory(value) {
  return (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!record2(item))
      return [];
    const operation = ["set", "add", "subtract", "reset", "set_state", "automatic"].includes(String(item.operation)) ? item.operation : "set";
    const source = item.source === "model" || item.source === "tag" || item.source === "automatic" || item.source === "migration" ? item.source : "user";
    const createdAt = iso(item.createdAt, new Date().toISOString());
    return [{
      id: clean(item.id, 160) || trackerId("hist"),
      previous: typeof item.previous === "string" ? clean(item.previous, 160) : finite(item.previous, 0),
      next: typeof item.next === "string" ? clean(item.next, 160) : finite(item.next, 0),
      operation,
      amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined,
      reason: clean(item.reason, 300),
      source,
      createdAt,
      roleplayAt: clean(item.roleplayAt, 80) || undefined
    }];
  }).slice(-TRACKER_HISTORY_LIMIT);
}
function normalizeTracker(value, context = {}) {
  if (!record2(value))
    return null;
  const now = context.now || new Date().toISOString();
  const label = clean(value.label, 120);
  if (!label)
    return null;
  const legacy = !KINDS.has(value.kind);
  const kind = legacy ? "meter" : value.kind;
  const min = finite(value.min, kind === "counter" ? 0 : 0);
  const max = Math.max(min, finite(value.max, kind === "counter" ? 999999 : 100));
  const numeric = Math.max(min, Math.min(max, finite(value.value, min)));
  const initialValue = Math.max(min, Math.min(max, finite(value.initialValue, numeric)));
  const color = clean(value.color, 40) || "#8b7dff";
  const ratePerHour = Math.max(-1e5, Math.min(1e5, finite(value.ratePerHour, 0)));
  const target = legacy ? { type: "custom", id: "", label: "Unassigned" } : normalizeTrackerTarget(value.target, context.characterId ? { type: "character", id: context.characterId, label: context.characterName || "Character" } : { type: "custom", id: "", label: "Unassigned" });
  const clock = legacy ? "real" : CLOCKS.has(value.clock) ? value.clock : "real";
  const updateMode = MODES.has(value.updateMode) ? value.updateMode : ratePerHour ? "automatic" : "manual";
  const presentation = PRESENTATIONS.has(value.presentation) ? value.presentation : kind === "counter" ? "counter" : kind === "timer" ? "timer" : kind === "state" ? "state" : "meter";
  const base = {
    id: clean(value.id, 120) || trackerId(),
    key: trackerKey(value.key || label),
    label,
    kind,
    value: numeric,
    initialValue,
    min,
    max,
    unit: clean(value.unit, 40),
    color,
    target,
    updateMode,
    clock,
    allowModelWrite: legacy ? false : value.allowModelWrite === true,
    presentation,
    bands: normalizeBands(value.bands, min, max, color),
    history: normalizeHistory(value.history),
    ratePerHour,
    lastUpdated: iso(value.lastUpdated, now),
    lastRoleplayAt: iso(value.lastRoleplayAt, iso(context.roleplayNow, "")),
    pausedReason: clean(value.pausedReason, 240),
    visibleToModel: value.visibleToModel !== false,
    createdAt: iso(value.createdAt, now),
    updatedAt: iso(value.updatedAt, iso(value.lastUpdated, now))
  };
  if (kind === "state") {
    const states = (Array.isArray(value.states) ? value.states : []).map((entry) => clean(entry, 80)).filter(Boolean).slice(0, 24);
    const initialState = clean(value.initialState, 80) || states[0] || "Unknown";
    const state = clean(value.state, 80) || initialState;
    return { ...base, kind, state, initialState, states: states.includes(state) ? states : [...states, state].slice(0, 24) };
  }
  if (kind === "counter")
    return { ...base, kind, step: Math.max(0.0001, Math.abs(finite(value.step, 1))) };
  if (kind === "timer")
    return { ...base, kind, direction: value.direction === "up" ? "up" : "down" };
  return { ...base, kind };
}
function addHistory(tracker, entry) {
  return { ...tracker, history: [...tracker.history, { ...entry, id: trackerId("hist") }].slice(-TRACKER_HISTORY_LIMIT) };
}
function trackerBand(tracker, value = tracker.value) {
  return tracker.bands.find((band, index) => value >= band.min && (value < band.max || index === tracker.bands.length - 1)) || null;
}
function applyTrackerOperation(tracker, input) {
  const now = input.now || new Date().toISOString();
  if (tracker.kind === "state") {
    if (input.operation !== "set_state" && input.operation !== "reset")
      throw new Error("State trackers accept set_state or reset.");
    const next2 = input.operation === "reset" ? tracker.initialState : clean(input.state, 80);
    if (!next2)
      throw new Error("set_state requires a state value.");
    if (tracker.states.length && !tracker.states.includes(next2))
      throw new Error(`State must be one of: ${tracker.states.join(", ")}`);
    if (next2 === tracker.state)
      return tracker;
    return addHistory({ ...tracker, state: next2, updatedAt: now }, {
      previous: tracker.state,
      next: next2,
      operation: input.operation,
      reason: clean(input.reason, 300),
      source: input.source,
      createdAt: now,
      roleplayAt: clean(input.roleplayNow, 80) || undefined
    });
  }
  const amount = finite(input.amount, 0);
  const rawNext = input.operation === "reset" ? tracker.initialValue : input.operation === "add" ? tracker.value + amount : input.operation === "subtract" ? tracker.value - amount : input.operation === "set" ? amount : (() => {
    throw new Error("Numeric trackers accept set, add, subtract, or reset.");
  })();
  const next = Math.max(tracker.min, Math.min(tracker.max, rawNext));
  if (next === tracker.value)
    return tracker;
  return addHistory({ ...tracker, value: next, updatedAt: now, lastUpdated: now }, {
    previous: tracker.value,
    next,
    operation: input.operation,
    amount: input.operation === "reset" ? undefined : amount,
    reason: clean(input.reason, 300),
    source: input.source,
    createdAt: now,
    roleplayAt: clean(input.roleplayNow, 80) || undefined
  });
}
function materializeTracker(tracker, roleplayNow, wallNow = new Date().toISOString()) {
  if (tracker.kind === "state" || tracker.updateMode !== "automatic" || !tracker.ratePerHour)
    return { tracker, changed: false };
  const current = tracker.clock === "roleplay" ? Date.parse(roleplayNow) : Date.parse(wallNow);
  const previous = tracker.clock === "roleplay" ? Date.parse(tracker.lastRoleplayAt) : Date.parse(tracker.lastUpdated);
  if (!Number.isFinite(current)) {
    const pausedReason = tracker.clock === "roleplay" ? "Roleplay time is approximate or unavailable." : "Real-time clock is unavailable.";
    return { tracker: { ...tracker, pausedReason }, changed: tracker.pausedReason !== pausedReason };
  }
  if (!Number.isFinite(previous)) {
    const anchor2 = new Date(current).toISOString();
    return {
      tracker: {
        ...tracker,
        pausedReason: "",
        lastUpdated: tracker.clock === "real" ? anchor2 : tracker.lastUpdated,
        lastRoleplayAt: tracker.clock === "roleplay" ? anchor2 : tracker.lastRoleplayAt
      },
      changed: true
    };
  }
  if (current <= previous)
    return { tracker: tracker.pausedReason ? { ...tracker, pausedReason: "" } : tracker, changed: Boolean(tracker.pausedReason) };
  const nextValue = Math.max(tracker.min, Math.min(tracker.max, tracker.value + (current - previous) / 3600000 * tracker.ratePerHour));
  const anchor = new Date(current).toISOString();
  let next = {
    ...tracker,
    value: nextValue,
    pausedReason: "",
    updatedAt: wallNow,
    lastUpdated: tracker.clock === "real" ? anchor : tracker.lastUpdated,
    lastRoleplayAt: tracker.clock === "roleplay" ? anchor : tracker.lastRoleplayAt
  };
  if (nextValue !== tracker.value)
    next = addHistory(next, {
      previous: tracker.value,
      next: nextValue,
      operation: "automatic",
      amount: nextValue - tracker.value,
      reason: tracker.clock === "roleplay" ? "Roleplay time advanced" : "Real time advanced",
      source: "automatic",
      createdAt: wallNow,
      roleplayAt: clean(roleplayNow, 80) || undefined
    });
  return { tracker: next, changed: true };
}

// src/domain/projection.ts
var MODEL_CONTEXT_BUDGET = 5600;
function safeTime(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}
function serializeWithinBudget(value, budget = MODEL_CONTEXT_BUDGET) {
  let serialized = JSON.stringify(value);
  if (serialized.length <= budget)
    return serialized;
  const compact = { ...value };
  const shrinkOrder = ["contacts", "pinnedNotes", "upcoming", "trackers"];
  for (const key of shrinkOrder) {
    const entries = Array.isArray(compact[key]) ? compact[key] : [];
    while (entries.length && serialized.length > budget) {
      entries.pop();
      serialized = JSON.stringify(compact);
    }
  }
  if (serialized.length <= budget)
    return serialized;
  const fallback = JSON.stringify({ roleplayNow: String(value.roleplayNow || "").slice(0, Math.max(0, budget - 24)), truncated: true });
  if (fallback.length <= budget)
    return fallback;
  return "{}";
}
function projectPhoneContext(state, budget = MODEL_CONTEXT_BUDGET) {
  const contacts = state.contacts.filter((contact) => contact.presence.inScene || contact.contextPolicy.pinned).slice(0, 12).map((contact) => ({
    id: contact.id.slice(0, 180),
    name: contact.name.slice(0, 120),
    role: contact.role.slice(0, 120),
    source: contact.source.kind,
    inScene: contact.presence.inScene,
    pinned: contact.contextPolicy.pinned,
    ...contact.source.kind === "npc" ? { brief: (contact.source.description || contact.description).slice(0, 360) } : {}
  }));
  const trackers = state.trackers.filter((tracker) => tracker.visibleToModel).slice(0, 12).map((tracker) => {
    const target = `${tracker.target.type}:${tracker.target.label || tracker.target.id || "unassigned"}`;
    const value = tracker.kind === "state" ? tracker.state : `${Number(tracker.value.toFixed(2))}${tracker.unit.slice(0, 40)}`;
    const band = tracker.kind === "state" ? "" : trackerBand(tracker)?.label || "";
    return `${tracker.label.slice(0, 120)} [${target}] = ${value}${band ? ` (${band})` : ""}`;
  });
  const upcoming = state.events.filter((event) => !event.completed).sort((a, b) => safeTime(a.start) - safeTime(b.start)).slice(0, 8).map((event) => `${event.whenText || event.start || "Unscheduled"} \u2014 ${event.title.slice(0, 180)}`);
  return serializeWithinBudget({
    roleplayNow: state.roleplayNow,
    weather: {
      location: state.weather.location.slice(0, 160),
      condition: state.weather.condition.slice(0, 120),
      temperature: state.weather.temperature,
      unit: state.weather.unit,
      details: state.weather.details.slice(0, 300)
    },
    trackers,
    upcoming,
    pinnedNotes: state.notes.filter((note) => note.pinned).slice(0, 5).map((note) => `${note.title.slice(0, 120)}: ${note.body.slice(0, 320)}`),
    contacts
  }, budget);
}

// src/domain/navigation.ts
var APPS = new Set(["home", "messages", "contacts", "gallery", "camera", "notes", "weather", "calendar", "trackers", "settings"]);
function shortId(value) {
  if (typeof value !== "string")
    return;
  const clean2 = value.trim().slice(0, 180);
  return clean2 || undefined;
}
function normalizePocketRoute(value, fallback = { app: "home" }) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fallback;
  const raw = value;
  const app = typeof raw.app === "string" && APPS.has(raw.app) ? raw.app : fallback.app;
  if (app === "messages")
    return {
      app,
      conversationId: shortId(raw.conversationId),
      contactId: shortId(raw.contactId),
      messageId: shortId(raw.messageId),
      view: raw.view === "new-group" || raw.view === "group-detail" || raw.view === "thread" ? raw.view : undefined
    };
  if (app === "contacts")
    return {
      app,
      contactId: shortId(raw.contactId),
      view: raw.view === "detail" || raw.view === "config" || raw.view === "import" || raw.view === "new" || raw.view === "list" ? raw.view : undefined
    };
  if (app === "trackers")
    return {
      app,
      trackerId: shortId(raw.trackerId),
      view: raw.view === "config" ? "config" : raw.view === "detail" ? "detail" : undefined
    };
  if (app === "calendar")
    return { app, eventId: shortId(raw.eventId) };
  if (app === "notes")
    return { app, noteId: shortId(raw.noteId) };
  if (app === "gallery")
    return { app, imageId: shortId(raw.imageId) };
  if (app === "settings")
    return { app, section: shortId(raw.section) };
  if (app === "camera" || app === "weather" || app === "home")
    return { app };
  return fallback;
}
function legacyActionRoute(app, action) {
  const id = shortId(action);
  if (app === "messages")
    return { app, contactId: id };
  if (app === "contacts")
    return { app, contactId: id, view: id ? "detail" : "list" };
  if (app === "trackers")
    return { app, trackerId: id, view: id ? "detail" : undefined };
  if (app === "calendar")
    return { app, eventId: id };
  if (app === "notes")
    return { app, noteId: id };
  if (app === "gallery")
    return { app, imageId: id };
  if (app === "settings")
    return { app, section: id };
  return { app };
}

// src/domain/contacts.ts
var MAX_CONTACTS = 80;
var MAX_CONVERSATIONS = 80;
var MAX_MESSAGES = 240;
var ACCENTS = ["#8b7dff", "#ef6f9a", "#55bfa3", "#e19a55", "#5e9ee6", "#b779dc", "#df6f64", "#86a94c"];
function record3(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function clean2(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function flag(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}
function timestamp(value, fallback) {
  const candidate = clean2(value, 40);
  return Number.isFinite(Date.parse(candidate)) ? candidate : fallback;
}
function stableContactAccent(seed) {
  let hash = 0;
  for (const char of seed)
    hash = (hash << 5) - hash + char.charCodeAt(0) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}
function contactSourceKey(source) {
  if (source.kind === "character")
    return `character:${source.characterId}`;
  if (source.kind === "council")
    return `council:${source.memberId || source.itemId}`;
  return `npc:${source.sceneKey || ""}`;
}
function normalizeSource(value, contactId, characterId, description) {
  if (record3(value) && value.kind === "character") {
    return { kind: "character", characterId: clean2(value.characterId, 180) || contactId };
  }
  if (record3(value) && value.kind === "council") {
    return {
      kind: "council",
      memberId: clean2(value.memberId, 180),
      itemId: clean2(value.itemId, 180)
    };
  }
  if (record3(value) && value.kind === "npc") {
    return {
      kind: "npc",
      origin: value.origin === "generated" || value.origin === "scene" ? value.origin : "manual",
      description: clean2(value.description, 600) || description,
      sceneKey: clean2(value.sceneKey, 180) || undefined
    };
  }
  if (contactId === characterId)
    return { kind: "character", characterId };
  return { kind: "npc", origin: "manual", description };
}
function normalizePocketContact(value, context) {
  if (!record3(value))
    return null;
  const contactId = clean2(value.id, 180) || context.makeId("contact");
  const name = clean2(value.name, 120);
  if (!name)
    return null;
  const description = clean2(value.description, 600) || clean2(value.subtitle, 160);
  const source = normalizeSource(value.source, contactId, context.characterId, description);
  const presence = record3(value.presence) ? value.presence : {};
  const contextPolicy = record3(value.contextPolicy) ? value.contextPolicy : {};
  const createdAt = timestamp(value.createdAt, context.now);
  return {
    id: contactId,
    name,
    role: clean2(value.role, 120) || clean2(value.subtitle, 120) || (source.kind === "character" ? "Character" : source.kind === "council" ? "Council member" : "Pocket NPC"),
    description,
    avatarUrl: clean2(value.avatarUrl, 2000),
    accent: /^#[0-9a-f]{6}$/i.test(clean2(value.accent, 20)) ? clean2(value.accent, 20) : stableContactAccent(contactId),
    source,
    presence: {
      inScene: flag(presence.inScene, source.kind === "character" && source.characterId === context.characterId),
      lastSceneAt: timestamp(presence.lastSceneAt, "")
    },
    contextPolicy: { pinned: flag(contextPolicy.pinned) },
    createdAt,
    updatedAt: timestamp(value.updatedAt, createdAt)
  };
}
function normalizeMessage(value, fallbackContact, now, makeId) {
  if (!record3(value))
    return null;
  const messageText = clean2(value.text, 12000);
  if (!messageText)
    return null;
  const legacySender = clean2(value.sender, 20);
  const sender = legacySender === "system" ? "system" : legacySender === "user" || legacySender === "persona" ? "persona" : "contact";
  const senderContactId = sender === "contact" ? clean2(value.senderContactId, 180) || fallbackContact?.id : undefined;
  const read = flag(value.read, sender !== "contact");
  const status = value.status === "pending" || value.status === "failed" || value.status === "sent" || value.status === "delivered" || value.status === "read" ? value.status : read ? "read" : "delivered";
  return {
    id: clean2(value.id, 120) || makeId("msg"),
    sender,
    senderContactId,
    senderName: clean2(value.senderName, 120) || (sender === "persona" ? "You" : sender === "system" ? "Pocket" : fallbackContact?.name || "Unknown contact"),
    senderAccent: clean2(value.senderAccent, 40) || (sender === "contact" ? fallbackContact?.accent || stableContactAccent(senderContactId || "unknown") : ""),
    text: messageText,
    createdAt: timestamp(value.createdAt, now),
    read,
    status,
    imageId: clean2(value.imageId, 160) || undefined,
    imageUrl: clean2(value.imageUrl, 2000) || undefined
  };
}
function normalizeConversation(value, contacts, now, makeId) {
  if (!record3(value))
    return null;
  const participantContactIds = [...new Set((Array.isArray(value.participantContactIds) ? value.participantContactIds : []).map((entry) => clean2(entry, 180)).filter(Boolean))].slice(0, 16);
  if (!participantContactIds.length)
    return null;
  const fallback = contacts.find((contact) => contact.id === participantContactIds[0]);
  const messages = (Array.isArray(value.messages) ? value.messages : []).map((entry) => normalizeMessage(entry, fallback, now, makeId)).filter((entry) => Boolean(entry)).slice(-MAX_MESSAGES);
  const kind = value.kind === "group" || participantContactIds.length > 1 ? "group" : "direct";
  const createdAt = timestamp(value.createdAt, messages[0]?.createdAt || now);
  return {
    id: clean2(value.id, 180) || makeId("conversation"),
    kind,
    title: clean2(value.title, 120) || (kind === "direct" ? fallback?.name || "Conversation" : participantContactIds.map((entry) => contacts.find((contact) => contact.id === entry)?.name).filter(Boolean).join(", ").slice(0, 120) || "Group"),
    participantContactIds,
    messages,
    unread: Math.max(0, Math.min(999, Math.floor(Number(value.unread) || messages.filter((entry) => entry.sender === "contact" && !entry.read).length))),
    createdAt,
    updatedAt: timestamp(value.updatedAt, messages.at(-1)?.createdAt || createdAt)
  };
}
function activeContact(context) {
  const contactId = context.characterId || "character";
  return {
    id: contactId,
    name: context.characterName || "Character",
    role: "Character",
    description: "",
    avatarUrl: "",
    accent: stableContactAccent(contactId),
    source: { kind: "character", characterId: contactId },
    presence: { inScene: true, lastSceneAt: context.now },
    contextPolicy: { pinned: false },
    createdAt: context.now,
    updatedAt: context.now
  };
}
function ensureDirectConversation(state, contactId, now, makeId) {
  const existing = state.conversations.find((conversation2) => conversation2.kind === "direct" && conversation2.participantContactIds[0] === contactId);
  if (existing)
    return existing;
  const contact = state.contacts.find((entry) => entry.id === contactId);
  const conversation = {
    id: makeId("conversation"),
    kind: "direct",
    title: contact?.name || "Conversation",
    participantContactIds: [contactId],
    messages: [],
    unread: 0,
    createdAt: now,
    updatedAt: now
  };
  state.conversations.push(conversation);
  return conversation;
}
function normalizeContactCollections(value, context) {
  const contacts = (Array.isArray(value.contacts) ? value.contacts : []).map((entry) => normalizePocketContact(entry, context)).filter((entry) => Boolean(entry)).slice(0, MAX_CONTACTS);
  let current = contacts.find((entry) => entry.source.kind === "character" && entry.source.characterId === context.characterId);
  if (!current) {
    current = activeContact(context);
    contacts.unshift(current);
  } else if (context.characterName && context.characterName !== "Character") {
    current.name = context.characterName;
    current.presence.inScene = true;
    current.presence.lastSceneAt ||= context.now;
  }
  const legacy = Number(value.version || 0) < 3 || Array.isArray(value.contacts) && value.contacts.some((entry) => record3(entry) && Array.isArray(entry.messages));
  const rawConversations = Array.isArray(value.conversations) ? [...value.conversations] : [];
  if (legacy && Array.isArray(value.contacts)) {
    for (const rawContact of value.contacts) {
      if (!record3(rawContact))
        continue;
      const contactId = clean2(rawContact.id, 180) || context.characterId;
      const contact = contacts.find((entry) => entry.id === contactId);
      if (!contact)
        continue;
      rawConversations.push({
        id: `dm_${contact.id}`,
        kind: "direct",
        title: contact.name,
        participantContactIds: [contact.id],
        messages: Array.isArray(rawContact.messages) ? rawContact.messages : [],
        unread: rawContact.unread,
        createdAt: context.now,
        updatedAt: context.now
      });
    }
  }
  const normalized = rawConversations.map((entry) => normalizeConversation(entry, contacts, context.now, context.makeId)).filter((entry) => Boolean(entry));
  const conversations = [];
  const directByContact = new Map;
  for (const conversation of normalized) {
    if (conversation.kind !== "direct") {
      conversations.push(conversation);
      continue;
    }
    const contactId = conversation.participantContactIds[0];
    const duplicate = directByContact.get(contactId);
    if (!duplicate) {
      directByContact.set(contactId, conversation);
      conversations.push(conversation);
      continue;
    }
    const seen = new Set(duplicate.messages.map((entry) => entry.id));
    duplicate.messages.push(...conversation.messages.filter((entry) => !seen.has(entry.id)));
    duplicate.messages = duplicate.messages.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).slice(-MAX_MESSAGES);
    duplicate.unread = Math.max(duplicate.unread, conversation.unread);
    duplicate.updatedAt = duplicate.messages.at(-1)?.createdAt || duplicate.updatedAt;
  }
  ensureDirectConversation({ contacts, conversations }, current.id, context.now, context.makeId);
  return { contacts: contacts.slice(0, MAX_CONTACTS), conversations: conversations.slice(0, MAX_CONVERSATIONS), migrated: legacy };
}

// src/backend.ts
var STATE_VERSION = 3;
var MAX_MESSAGES2 = 240;
var MAX_NOTIFICATIONS = 80;
var MAX_NOTES = 120;
var MAX_EVENTS = 200;
var MAX_TRACKERS = 40;
var MAX_ACTIVITIES = 120;
var stateLocks = new Map;
var cameraJobs = new Map;
var notificationThrottle = new Map;
var PHONE_GUIDANCE = `Pocket is available as an in-world phone shared with the current character. Use the registered phone_action tool when it is available. If tools are unavailable and a phone action materially belongs in the scene, emit exactly one hidden tag:
<lumi-phone action="message|contact|note|event|weather|tracker|camera|notify|open" app="messages|contacts|notes|calendar|weather|trackers|camera|home" title="short title">content or compact JSON</lumi-phone>
Do not explain the tag. Do not use it for ordinary narration. Pocket messages, notes, calendar events, weather, and trackers persist separately for this chat and character.`;
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function text2(value, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function numberValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function bool2(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}
function nowIso() {
  return new Date().toISOString();
}
function id(prefix) {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 14);
  return `${prefix}_${random || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`}`;
}
function safeSegment(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 160) || "_none";
}
function stateKey(chatId, characterId) {
  return `${safeSegment(chatId || "_lobby")}__${safeSegment(characterId || "_none")}`;
}
function statePath(chatId, characterId) {
  return `phones/${stateKey(chatId, characterId)}.json`;
}
function defaultWeather() {
  return {
    location: "The current scene",
    condition: "Clear",
    temperature: 21,
    unit: "C",
    high: 24,
    low: 16,
    details: "A quiet, clear day in the roleplay timeline.",
    updatedAt: nowIso()
  };
}
function defaultState(chatId, characterId, characterName = "Character") {
  const createdAt = nowIso();
  const collections = normalizeContactCollections({}, { characterId, characterName, now: createdAt, makeId: id });
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || "Character",
    roleplayNow: createdAt,
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes: [],
    events: [],
    weather: defaultWeather(),
    trackers: [],
    notifications: [],
    activities: [],
    processedCommands: [],
    updatedAt: createdAt
  };
}
function normalizeState(value, chatId, characterId, characterName) {
  const fallback = defaultState(chatId, characterId, characterName);
  if (!isRecord(value))
    return fallback;
  if (Number(value.version) > STATE_VERSION)
    return fallback;
  const collections = normalizeContactCollections(value, { characterId, characterName, now: nowIso(), makeId: id });
  const notes = (Array.isArray(value.notes) ? value.notes : []).slice(0, MAX_NOTES).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const body = text2(item.body, 40000);
    const title = text2(item.title, 180) || body.slice(0, 36) || "Untitled note";
    return [{
      id: text2(item.id, 120) || id("note"),
      title,
      body,
      mood: text2(item.mood, 80),
      pinned: bool2(item.pinned),
      author: item.author === "character" || item.author === "model" || item.author === "shared" ? item.author : "user",
      createdAt: text2(item.createdAt, 40) || nowIso(),
      updatedAt: text2(item.updatedAt, 40) || nowIso()
    }];
  });
  const events = (Array.isArray(value.events) ? value.events : []).slice(0, MAX_EVENTS).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const title = text2(item.title, 180);
    if (!title)
      return [];
    const createdBy = item.createdBy === "character" || item.createdBy === "model" ? item.createdBy : "user";
    return [{
      id: text2(item.id, 120) || id("evt"),
      title,
      description: text2(item.description, 8000),
      start: text2(item.start, 80) || nowIso(),
      end: text2(item.end, 80) || text2(item.start, 80) || nowIso(),
      color: text2(item.color, 40) || "#8b7dff",
      whenKind: item.whenKind === "approximate" || item.whenKind === "relative" || item.whenKind === "unscheduled" ? item.whenKind : "exact",
      whenText: text2(item.whenText, 240) || text2(item.start, 80) || "Unscheduled",
      lane: text2(item.lane, 80) || "Main timeline",
      completed: bool2(item.completed),
      createdBy
    }];
  });
  const trackers = (Array.isArray(value.trackers) ? value.trackers : []).slice(0, MAX_TRACKERS).map((item) => normalizeTracker(item, { roleplayNow: text2(value.roleplayNow, 80), characterId, characterName })).filter((item) => Boolean(item));
  const notifications = (Array.isArray(value.notifications) ? value.notifications : []).slice(0, MAX_NOTIFICATIONS).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const title = text2(item.title, 160);
    if (!title)
      return [];
    const app = text2(item.app, 40) || "home";
    return [{
      id: text2(item.id, 120) || id("ntf"),
      app,
      title,
      body: text2(item.body, 1000),
      createdAt: text2(item.createdAt, 40) || nowIso(),
      read: bool2(item.read),
      route: normalizePocketRoute(item.route, legacyActionRoute(app, text2(item.action, 120))),
      action: text2(item.action, 120) || undefined
    }];
  });
  const activities = (Array.isArray(value.activities) ? value.activities : []).slice(-MAX_ACTIVITIES).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const title = text2(item.title, 160);
    if (!title)
      return [];
    const source = isRecord(item.source) ? item.source : {};
    return [{
      id: text2(item.id, 160) || id("act"),
      kind: item.kind === "message" || item.kind === "contact" || item.kind === "tracker-change" || item.kind === "timeline" || item.kind === "note" || item.kind === "image" || item.kind === "weather" ? item.kind : "system",
      title,
      summary: text2(item.summary, 500) || undefined,
      route: normalizePocketRoute(item.route),
      createdAt: text2(item.createdAt, 40) || nowIso(),
      scope: { chatId, characterId },
      source: {
        commandId: text2(source.commandId, 240) || undefined,
        messageId: text2(source.messageId, 180) || undefined,
        trackerId: text2(source.trackerId, 180) || undefined,
        contactId: text2(source.contactId, 180) || undefined,
        conversationId: text2(source.conversationId, 180) || undefined,
        eventId: text2(source.eventId, 180) || undefined,
        noteId: text2(source.noteId, 180) || undefined,
        imageId: text2(source.imageId, 180) || undefined
      }
    }];
  });
  const processedCommands = (Array.isArray(value.processedCommands) ? value.processedCommands : []).slice(-160).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const commandId = text2(item.id, 240);
    if (!commandId)
      return [];
    return [{ id: commandId, semanticKey: text2(item.semanticKey, 500), createdAt: text2(item.createdAt, 40) || nowIso(), activityId: text2(item.activityId, 180) || undefined }];
  });
  const weatherValue = isRecord(value.weather) ? value.weather : {};
  const weather = {
    location: text2(weatherValue.location, 160) || fallback.weather.location,
    condition: text2(weatherValue.condition, 120) || fallback.weather.condition,
    temperature: numberValue(weatherValue.temperature, fallback.weather.temperature),
    unit: weatherValue.unit === "F" ? "F" : "C",
    high: numberValue(weatherValue.high, fallback.weather.high),
    low: numberValue(weatherValue.low, fallback.weather.low),
    details: text2(weatherValue.details, 2000) || fallback.weather.details,
    updatedAt: text2(weatherValue.updatedAt, 40) || nowIso()
  };
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || text2(value.characterName, 120) || fallback.characterName,
    roleplayNow: text2(value.roleplayNow, 80) || fallback.roleplayNow,
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes,
    events,
    weather,
    trackers,
    notifications,
    activities,
    processedCommands,
    updatedAt: text2(value.updatedAt, 40) || fallback.updatedAt
  };
}
async function characterNameFor(characterId, userId) {
  if (!characterId || !spindle.permissions.has("characters"))
    return "Character";
  try {
    const character = await spindle.characters.get(characterId, userId);
    return text2(character?.name, 120) || "Character";
  } catch {
    return "Character";
  }
}
async function loadState(chatId, characterId, userId) {
  const characterName = await characterNameFor(characterId, userId);
  const raw = await spindle.userStorage.getJson(statePath(chatId, characterId), {
    fallback: null,
    userId
  });
  if (isRecord(raw) && Number(raw.version) > STATE_VERSION)
    throw new Error("This phone state was created by a newer Pocket version.");
  const state = normalizeState(raw, chatId, characterId, characterName);
  await loadPreferences(userId, isRecord(raw) ? raw.settings : undefined);
  let stateChanged = Boolean(isRecord(raw) && Number(raw.version || 0) <= STATE_VERSION && (raw.settings !== undefined || Number(raw.version || 0) < STATE_VERSION));
  state.trackers = state.trackers.map((tracker) => {
    const result = materializeTracker(tracker, state.roleplayNow);
    stateChanged ||= result.changed;
    return result.tracker;
  });
  const contact = state.contacts.find((item) => item.source.kind === "character" && item.source.characterId === characterId);
  if (contact && characterName !== "Character")
    contact.name = characterName;
  state.characterName = characterName;
  if (stateChanged)
    await spindle.userStorage.setJson(statePath(chatId, characterId), state, { indent: 2, userId });
  return state;
}
async function loadPreferences(userId, legacy) {
  const raw = await spindle.userStorage.getJson(PREFERENCES_PATH, { fallback: null, userId });
  const preferences = normalizePreferences(raw ?? legacy);
  if (isFuturePreferences(raw)) {
    spindle.log.warn("Pocket left newer device preferences untouched and used safe defaults for this session.");
    return preferences;
  }
  if (raw === null || Number(isRecord(raw) ? raw.version : 0) !== preferences.version) {
    await spindle.userStorage.setJson(PREFERENCES_PATH, preferences, { indent: 2, userId });
  }
  return preferences;
}
async function savePreferences(value, userId) {
  const preferences = normalizePreferences(value);
  await spindle.userStorage.setJson(PREFERENCES_PATH, preferences, { indent: 2, userId });
  return preferences;
}
async function saveState(state, userId) {
  state.updatedAt = nowIso();
  await spindle.userStorage.setJson(statePath(state.chatId, state.characterId), state, { indent: 2, userId });
}
function withStateLock(key, task) {
  const previous = stateLocks.get(key) || Promise.resolve();
  const current = previous.catch(() => {
    return;
  }).then(task);
  stateLocks.set(key, current);
  const release = () => {
    if (stateLocks.get(key) === current)
      stateLocks.delete(key);
  };
  current.then(release, release);
  return current;
}
function capabilities() {
  return {
    generation: spindle.permissions.has("generation"),
    interceptor: spindle.permissions.has("interceptor"),
    tools: spindle.permissions.has("tools"),
    chats: spindle.permissions.has("chats"),
    characters: spindle.permissions.has("characters"),
    personas: spindle.permissions.has("personas"),
    images: spindle.permissions.has("images"),
    imageGen: spindle.permissions.has("image_gen"),
    panels: spindle.permissions.has("ui_panels"),
    push: spindle.permissions.has("push_notification"),
    sceneSync: spindle.permissions.has("chat_mutation")
  };
}
function send(payload, userId) {
  spindle.sendToFrontend(payload, userId);
}
async function sendState(state, userId, reason = "refresh", open = false) {
  send({ type: "lumiphone:state", state, preferences: await loadPreferences(userId), capabilities: capabilities(), reason, open }, userId);
}
function addNotification(state, notification) {
  const entry = { ...notification, id: id("ntf"), createdAt: nowIso(), read: false };
  state.notifications.unshift(entry);
  state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
  return entry;
}
function addActivity(state, activity, command) {
  const entry = {
    ...activity,
    id: id("act"),
    createdAt: nowIso(),
    scope: { chatId: state.chatId, characterId: state.characterId },
    source: { ...activity.source, commandId: command?.id || activity.source?.commandId }
  };
  state.activities.push(entry);
  state.activities = state.activities.slice(-MAX_ACTIVITIES);
  if (command)
    command.activityId = entry.id;
  return entry;
}
function sendActivity(activity, userId) {
  if (activity)
    send({ type: "lumiphone:activity", activity }, userId);
}
async function maybePush(state, preferences, notification, userId) {
  if (!preferences.pushNotifications || !spindle.permissions.has("push_notification"))
    return;
  const throttleKey = `${userId || "_default"}:${stateKey(state.chatId, state.characterId)}:${notification.app}`;
  const lastSent = notificationThrottle.get(throttleKey) || 0;
  if (Date.now() - lastSent < 15000)
    return;
  notificationThrottle.set(throttleKey, Date.now());
  try {
    const status = await spindle.push.getStatus(userId);
    if (!status.available)
      return;
    await spindle.push.send({
      title: notification.title,
      body: notification.body || `Open ${notification.app} in Pocket`,
      tag: `lumiphone-${stateKey(state.chatId, state.characterId)}-${notification.app}`,
      url: `/chat/${state.chatId}`
    }, userId);
  } catch (error) {
    spindle.log.warn(`Pocket push notification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function resolveContext(input, userId) {
  let chatId = text2(input.chat_id ?? input.chatId, 180);
  let characterId = text2(input.character_id ?? input.characterId, 180);
  if ((!chatId || !characterId) && spindle.permissions.has("chats")) {
    try {
      const active = await spindle.chats.getActive(userId);
      chatId ||= text2(active?.id, 180);
      characterId ||= text2(active?.character_id, 180);
    } catch {}
  }
  return { chatId: chatId || "_lobby", characterId: characterId || "_none" };
}
function sourceMatches(contact, kind, sourceId, itemId = "") {
  if (kind === "character")
    return contact.source.kind === "character" && contact.source.characterId === sourceId;
  if (kind === "council")
    return contact.source.kind === "council" && (contact.source.memberId === sourceId || Boolean(itemId && contact.source.itemId === itemId) || contact.source.itemId === sourceId);
  return false;
}
async function listContactSources(state, userId) {
  const options = [];
  if (spindle.permissions.has("characters")) {
    try {
      const listed = await spindle.characters.list({ limit: 200, offset: 0 }, userId);
      for (const character of Array.isArray(listed?.data) ? listed.data : []) {
        const sourceId = text2(character?.id, 180);
        const name = text2(character?.name, 120);
        if (!sourceId || !name)
          continue;
        options.push({
          kind: "character",
          sourceId,
          name,
          role: "Character",
          description: text2(character?.description, 600),
          avatarUrl: text2(character?.avatar_url ?? character?.avatarUrl, 2000),
          importedContactId: state.contacts.find((entry) => sourceMatches(entry, "character", sourceId))?.id
        });
      }
    } catch {}
  }
  try {
    const members = await spindle.council.getMembers({ userId });
    for (const member of Array.isArray(members) ? members : []) {
      const sourceId = text2(member?.memberId, 180);
      const itemId = text2(member?.itemId, 180);
      const name = text2(member?.name, 120);
      if (!sourceId || !name)
        continue;
      options.push({
        kind: "council",
        sourceId,
        itemId,
        name,
        role: text2(member?.role, 120) || "Council member",
        description: text2(member?.definition, 600),
        avatarUrl: text2(member?.avatarUrl, 2000),
        importedContactId: state.contacts.find((entry) => sourceMatches(entry, "council", sourceId, itemId))?.id
      });
    }
  } catch {}
  return options;
}
async function resolveContactProfile(contact, userId) {
  if (contact.source.kind === "character") {
    if (!spindle.permissions.has("characters"))
      throw new Error(`Character access is required to reply as ${contact.name}.`);
    const character = await spindle.characters.get(contact.source.characterId, userId).catch(() => null);
    if (!character)
      throw new Error(`The linked character for ${contact.name} is unavailable. Re-link or remove this contact.`);
    return {
      name: text2(character.name, 120) || contact.name,
      role: contact.role,
      description: text2(character.description, 8000),
      personality: text2(character.personality, 4000),
      behavior: text2(character.scenario ?? character.mes_example, 3000),
      source: `character:${contact.source.characterId}`
    };
  }
  if (contact.source.kind === "council") {
    const councilSource = contact.source;
    const members = await spindle.council.getMembers({ userId }).catch(() => []);
    const member = members.find((entry) => text2(entry?.memberId, 180) === councilSource.memberId || text2(entry?.itemId, 180) === councilSource.itemId);
    if (member)
      return {
        name: text2(member.name, 120) || contact.name,
        role: text2(member.role, 120) || contact.role,
        description: text2(member.definition, 8000),
        personality: text2(member.personality, 4000),
        behavior: text2(member.behavior, 3000),
        source: `council:${councilSource.memberId || councilSource.itemId}`
      };
    const items = await spindle.council.getAvailableLumiaItems({ userId }).catch(() => []);
    const item = items.find((entry) => text2(entry?.id, 180) === councilSource.itemId);
    if (!item)
      throw new Error(`The linked Council profile for ${contact.name} is unavailable. Re-link or remove this contact.`);
    return {
      name: text2(item.name, 120) || contact.name,
      role: contact.role,
      description: text2(item.definition, 8000),
      personality: text2(item.personality, 4000),
      behavior: text2(item.behavior, 3000),
      source: `council-item:${councilSource.itemId}`
    };
  }
  return {
    name: contact.name,
    role: contact.role,
    description: text2(contact.source.description || contact.description, 600),
    personality: "",
    behavior: "",
    source: `npc:${contact.source.origin}`
  };
}
function parseStrictJson(content) {
  const raw = text2(content, 30000).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(raw);
  if (!isRecord(parsed))
    throw new Error("Generation returned an invalid JSON object.");
  return parsed;
}
function upsertContact(state, contact) {
  const sourceKey = contactSourceKey(contact.source);
  const existing = state.contacts.find((entry) => entry.id === contact.id || contact.source.kind !== "npc" && contactSourceKey(entry.source) === sourceKey || contact.source.kind === "npc" && entry.source.kind === "npc" && contact.source.sceneKey && entry.source.sceneKey === contact.source.sceneKey);
  if (existing) {
    const preserved = { createdAt: existing.createdAt, accent: existing.accent, contextPolicy: existing.contextPolicy };
    Object.assign(existing, contact, preserved, { updatedAt: nowIso() });
    return existing;
  }
  state.contacts.push(contact);
  state.contacts = state.contacts.slice(-80);
  return contact;
}
function contactFromSource(option) {
  const createdAt = nowIso();
  const source = option.kind === "character" ? { kind: "character", characterId: option.sourceId } : { kind: "council", memberId: option.sourceId, itemId: option.itemId || "" };
  return {
    id: id("contact"),
    name: option.name,
    role: option.role,
    description: option.description,
    avatarUrl: option.avatarUrl,
    accent: stableContactAccent(`${option.kind}:${option.sourceId}`),
    source,
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: false },
    createdAt,
    updatedAt: createdAt
  };
}
function resolveConversation(state, input) {
  const conversationId = text2(input.conversationId ?? input.conversation_id, 180);
  if (conversationId) {
    const conversation = state.conversations.find((entry) => entry.id === conversationId);
    if (!conversation)
      throw new Error("That Pocket conversation no longer exists.");
    return conversation;
  }
  const contactId = text2(input.contactId ?? input.contact_id, 180);
  const contact = state.contacts.find((entry) => entry.id === contactId) || (!contactId ? state.contacts.find((entry) => entry.source.kind === "character" && entry.source.characterId === state.characterId) : undefined);
  if (!contact)
    throw new Error("Choose a valid contact before opening a conversation.");
  return ensureDirectConversation(state, contact.id, nowIso(), id);
}
async function resolveSwarmProfile(chatId, characterId, settings) {
  const manual = settings?.manualVisualProfile || defaultPreferences().manualVisualProfile;
  const fallback = {
    available: false,
    characterPositive: manual.positive,
    personaPositive: "",
    negative: manual.negative,
    presets: "",
    checkpoint: manual.model,
    aspect: "",
    source: "manual"
  };
  if (!settings?.useSwarmProfile)
    return fallback;
  try {
    const marker = `
__LUMIPHONE_PROFILE_FIELD__
`;
    const template = ["{{char_base}}", "{{persona_base}}", "{{swarm_negative}}", "{{swarm_preset}}", "{{swarm_checkpoint}}", "{{swarm_aspect}}"].join(marker);
    const result = await spindle.macros.resolve(template, { chatId, characterId, commit: false });
    const fields = result.text.split(marker).map((part) => part.trim().replace(/^\{\{[^}]+\}\}$/, ""));
    const [characterPositive = "", personaPositive = "", negative = "", presets = "", checkpoint = "", aspect = ""] = fields;
    const available = Boolean(characterPositive || personaPositive || negative || presets || checkpoint || aspect);
    if (!available)
      return fallback;
    return {
      available,
      characterPositive: [manual.positive, characterPositive].filter(Boolean).join(", "),
      personaPositive,
      negative: [manual.negative, negative].filter(Boolean).join(", "),
      presets,
      checkpoint: manual.model || checkpoint,
      aspect,
      source: "swarm_studio"
    };
  } catch {
    return fallback;
  }
}
async function listGallery(input, userId) {
  if (!spindle.permissions.has("images"))
    throw new Error("Enable the Images permission to use Gallery.");
  const context = await resolveContext(input, userId);
  const scope = text2(input.scope, 30) || "chat";
  const options = { limit: 120, offset: 0, specificity: "sm", userId };
  if (scope === "chat")
    options.chatId = context.chatId;
  if (scope === "character")
    options.characterId = context.characterId;
  if (scope === "phone")
    options.onlyOwned = true;
  const result = await spindle.images.list(options);
  return {
    total: result.total,
    data: result.data.map((item) => ({
      id: item.id,
      url: item.url,
      filename: item.original_filename,
      mimeType: item.mime_type,
      width: item.width,
      height: item.height,
      createdAt: item.created_at
    }))
  };
}
async function enhanceScene(scene, state, preferences, profile, userId) {
  if (!preferences.sceneEnhancer || !spindle.permissions.has("generation"))
    return scene;
  const response = await spindle.generate.quiet({
    type: "quiet",
    messages: [
      { role: "system", content: "You are a concise image scene planner. Expand the user brief into one vivid diffusion-ready prompt. Preserve identity facts, subject count, action, camera, environment, lighting, and mood. Do not add names, explanations, headings, negative prompts, or markdown." },
      { role: "user", content: `Roleplay context: ${state.weather.location}; ${state.weather.condition}. Visual profile source: ${profile.source}.
Scene brief: ${scene}` }
    ],
    parameters: { temperature: 0.45, max_tokens: 450 },
    reasoning: { source: "off" },
    userId
  });
  return text2(response.content, 12000) || scene;
}
async function cameraGenerate(input, userId) {
  if (!spindle.permissions.has("image_gen"))
    throw new Error("Enable the Image Generation permission to use Camera.");
  const context = await resolveContext(input, userId);
  const state = await loadState(context.chatId, context.characterId, userId);
  const preferences = await loadPreferences(userId);
  const requestId = text2(input.requestId, 180) || id("cam");
  const scene = text2(input.scene ?? input.prompt ?? input.text ?? input.content, 12000);
  if (!scene)
    throw new Error("Describe the scene you want the camera to capture.");
  const profile = await resolveSwarmProfile(context.chatId, context.characterId, preferences);
  const controller = new AbortController;
  const job = { controller, cancelled: false, chatId: context.chatId, characterId: context.characterId, userId };
  cameraJobs.get(requestId)?.controller.abort();
  cameraJobs.set(requestId, job);
  send({ type: "lumiphone:camera_progress", requestId, phase: "planning", message: "Planning the scene\u2026", profile }, userId);
  let expanded = scene;
  if (bool2(input.enhance, preferences.sceneEnhancer)) {
    try {
      expanded = await enhanceScene(scene, state, preferences, profile, userId);
    } catch (error) {
      spindle.log.warn(`Pocket scene planner fell back to the original brief: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (job.cancelled)
    return { ok: false, cancelled: true };
  const presets = profile.presets ? `${profile.presets}, ` : "";
  const prompt = [presets + profile.characterPositive, profile.personaPositive, expanded].filter(Boolean).join(", ");
  const manual = preferences.manualVisualProfile;
  const parameters = { ...manual.parameters, ...isRecord(input.parameters) ? input.parameters : {} };
  if (manual.loras.length && parameters.loras === undefined)
    parameters.loras = manual.loras;
  const connectionId = text2(input.connectionId, 200) || manual.connectionId;
  const model = text2(input.model, 500) || profile.checkpoint;
  let result = null;
  try {
    let canStream = false;
    let resolvedConnection = connectionId;
    try {
      const connections = await spindle.imageGen.listConnections(userId);
      const connection = resolvedConnection ? connections.find((item) => item.id === resolvedConnection) : connections.find((item) => item.is_default) || connections[0];
      resolvedConnection ||= connection?.id || "";
      const providers = await spindle.imageGen.getProviders(userId);
      const provider = providers.find((item) => item.id === connection?.provider);
      canStream = Boolean(provider?.capabilities.websocketPreviewStreaming);
    } catch {}
    const generationInput = {
      prompt,
      negativePrompt: profile.negative,
      parameters,
      owner_character_id: context.characterId === "_none" ? undefined : context.characterId,
      owner_chat_id: context.chatId === "_lobby" ? undefined : context.chatId,
      userId,
      includeDataUrl: false
    };
    if (resolvedConnection)
      generationInput.connection_id = resolvedConnection;
    if (model)
      generationInput.model = model;
    if (canStream) {
      generationInput.signal = controller.signal;
      for await (const event of spindle.imageGen.generateStream(generationInput)) {
        if (job.cancelled)
          break;
        if (event.type === "status") {
          send({ type: "lumiphone:camera_progress", requestId, phase: "generating", step: event.step, totalSteps: event.totalSteps, message: event.nodeId ? `Working on ${event.nodeId}\u2026` : "Developing the image\u2026" }, userId);
        } else if (event.type === "preview") {
          send({ type: "lumiphone:camera_progress", requestId, phase: "preview", imageDataUrl: event.imageDataUrl, step: event.step, totalSteps: event.totalSteps }, userId);
        } else if (event.type === "done")
          result = event.result;
      }
    } else {
      send({ type: "lumiphone:camera_progress", requestId, phase: "generating", message: "Developing the image\u2026" }, userId);
      result = await spindle.imageGen.generate(generationInput);
    }
  } finally {
    if (cameraJobs.get(requestId) === job)
      cameraJobs.delete(requestId);
  }
  if (job.cancelled)
    return { ok: false, cancelled: true };
  if (!result)
    throw new Error("The camera did not return an image.");
  const imageUrl = text2(result.imageUrl, 2000);
  const imageId = text2(result.imageId, 200);
  const route = imageId ? { app: "gallery", imageId } : { app: "gallery" };
  const notification = addNotification(state, {
    app: "camera",
    title: "Photo ready",
    body: scene.slice(0, 180),
    route
  });
  const command = state.processedCommands.find((entry) => entry.id === text2(input.__commandId, 240));
  const activity = addActivity(state, {
    kind: "image",
    title: "Photo ready",
    summary: scene.slice(0, 280),
    route,
    source: { messageId: text2(input.__sourceMessageId, 180) || undefined, imageId: imageId || undefined }
  }, command);
  await saveState(state, userId);
  await maybePush(state, preferences, notification, userId);
  await sendState(state, userId, "camera", false);
  sendActivity(activity, userId);
  send({ type: "lumiphone:camera_done", requestId, imageId, imageUrl, prompt: expanded, profile }, userId);
  return { ok: true, imageId, imageUrl, prompt: expanded, profileSource: profile.source };
}
async function generateMessage(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable the Generation permission to create an in-phone reply.");
  const context = await resolveContext(input, userId);
  const requestId = text2(input.requestId, 180) || id("reply");
  const key = stateKey(context.chatId, context.characterId);
  await withStateLock(key, async () => {
    const state = await loadState(context.chatId, context.characterId, userId);
    const preferences = await loadPreferences(userId);
    const conversation = resolveConversation(state, input);
    const participants = conversation.participantContactIds.map((contactId) => state.contacts.find((entry) => entry.id === contactId)).filter((entry) => Boolean(entry));
    if (!participants.length)
      throw new Error("This conversation has no available contact participants.");
    let contact;
    const requestedSpeaker = text2(input.speakerContactId ?? input.speaker_contact_id, 180);
    if (requestedSpeaker && requestedSpeaker !== "auto") {
      const explicit = participants.find((entry) => entry.id === requestedSpeaker);
      if (!explicit)
        throw new Error("The selected speaker is not a participant in this conversation.");
      contact = explicit;
    } else if (conversation.kind === "direct") {
      contact = participants[0];
    } else {
      const lastSpeakerId = [...conversation.messages].reverse().find((entry) => entry.sender === "contact")?.senderContactId;
      const currentIndex = participants.findIndex((entry) => entry.id === lastSpeakerId);
      contact = participants[(currentIndex + 1 + participants.length) % participants.length];
    }
    send({
      type: "lumiphone:message_progress",
      requestId,
      chatId: context.chatId,
      characterId: context.characterId,
      conversationId: conversation.id,
      contactId: contact.id,
      speakerContactId: contact.id,
      phase: "pending"
    }, userId);
    const profile = await resolveContactProfile(contact, userId);
    const roster = participants.map((entry) => `${entry.name} (${entry.role || entry.source.kind})`).join("; ").slice(0, 2000);
    const history = conversation.messages.slice(-30).map((message) => `${message.sender === "persona" ? "User" : message.senderName || "Pocket"}: ${message.text.slice(0, 1200)}`).join(`
`).slice(-12000);
    const instruction = text2(input.instruction, 2000) || "Reply naturally to the latest message.";
    const response = await spindle.generate.quiet({
      type: "quiet",
      messages: [
        { role: "system", content: `Write exactly one private phone text as ${profile.name}. Stay in character and do not speak for another participant. Return only the message text, without a name label, quotes, narration, JSON, or XML.
Source: ${profile.source}
Role: ${profile.role.slice(0, 120)}
Description: ${profile.description.slice(0, 8000)}
Personality: ${profile.personality.slice(0, 4000)}
Behavior: ${profile.behavior.slice(0, 3000)}
Conversation roster: ${roster}` },
        { role: "user", content: `Recent thread:
${history || "(no messages yet)"}

Direction: ${instruction}` }
      ],
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId
    });
    const reply = text2(response.content, 8000);
    if (!reply)
      throw new Error("The character did not return a phone message.");
    conversation.messages.push({
      id: id("msg"),
      sender: "contact",
      senderContactId: contact.id,
      senderName: contact.name,
      senderAccent: contact.accent,
      text: reply,
      createdAt: nowIso(),
      read: false,
      status: "delivered"
    });
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES2);
    conversation.unread += 1;
    conversation.updatedAt = nowIso();
    const phoneMessageId = conversation.messages.at(-1)?.id;
    const route = { app: "messages", conversationId: conversation.id, messageId: phoneMessageId };
    const notification = addNotification(state, { app: "messages", title: contact.name, body: reply.slice(0, 220), route });
    const activity = addActivity(state, { kind: "message", title: contact.name, summary: reply.slice(0, 280), route, source: { contactId: contact.id, conversationId: conversation.id } });
    await saveState(state, userId);
    await maybePush(state, preferences, notification, userId);
    await sendState(state, userId, "message", preferences.autoOpenOnModelAction);
    sendActivity(activity, userId);
    send({
      type: "lumiphone:message_progress",
      requestId,
      chatId: context.chatId,
      characterId: context.characterId,
      conversationId: conversation.id,
      contactId: contact.id,
      speakerContactId: contact.id,
      phase: "done"
    }, userId);
  });
}
async function generateNpcContact(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable Generation to create an NPC contact from a description.");
  const context = await resolveContext(input, userId);
  const prompt = text2(input.description, 2000);
  if (!prompt)
    throw new Error("Describe the NPC you want to add.");
  const response = await spindle.generate.quiet({
    type: "quiet",
    messages: [
      { role: "system", content: 'Create one compact roleplay phone contact from the user description. Return strict JSON only with exactly these string fields: {"name":"","role":"","description":""}. No markdown. Name and role must each be at most 120 characters; description at most 600 characters.' },
      { role: "user", content: prompt }
    ],
    parameters: { temperature: 0.55, max_tokens: 350 },
    userId
  });
  const parsed = parseStrictJson(response.content);
  const name = text2(parsed.name, 120);
  if (!name)
    throw new Error("NPC generation did not return a valid name.");
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    const state = await loadState(context.chatId, context.characterId, userId);
    const createdAt = nowIso();
    const contact = upsertContact(state, {
      id: id("contact"),
      name,
      role: text2(parsed.role, 120) || "Pocket NPC",
      description: text2(parsed.description, 600),
      avatarUrl: "",
      accent: stableContactAccent(name),
      source: { kind: "npc", origin: "generated", description: text2(parsed.description, 600) },
      presence: { inScene: false, lastSceneAt: "" },
      contextPolicy: { pinned: false },
      createdAt,
      updatedAt: createdAt
    });
    const activity = addActivity(state, { kind: "contact", title: `${contact.name} added`, summary: contact.role, route: { app: "contacts", contactId: contact.id, view: "detail" }, source: { contactId: contact.id } });
    await saveState(state, userId);
    await sendState(state, userId, "contact");
    sendActivity(activity, userId);
    send({ type: "lumiphone:contact_created", requestId: text2(input.requestId, 180), contactId: contact.id }, userId);
  });
}
function sceneKeyFor(name) {
  return name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 120) || name.toLocaleLowerCase().slice(0, 120);
}
async function syncSceneContacts(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable Generation to identify scene contacts.");
  if (!spindle.permissions.has("chat_mutation"))
    throw new Error("Enable Chat Mutation so Pocket can read the recent scene when you request a sync.");
  const context = await resolveContext(input, userId);
  const messages = await spindle.chat.getMessages(context.chatId);
  const transcript = messages.slice(-24).map((message) => `${message.role}: ${text2(message.content, 1200)}`).join(`
`).slice(-16000);
  const response = await spindle.generate.quiet({
    type: "quiet",
    messages: [
      { role: "system", content: 'Identify named non-user actors who are physically or actively present in the most recent roleplay scene. Return strict JSON only: {"contacts":[{"name":"","role":"","description":""}]}. Return at most 8 contacts. Do not include merely mentioned, messaged, absent, historical, or hypothetical people. Name and role max 120 characters; description max 600.' },
      { role: "user", content: transcript || "(empty chat)" }
    ],
    parameters: { temperature: 0.2, max_tokens: 900 },
    userId
  });
  const parsed = parseStrictJson(response.content);
  const found = (Array.isArray(parsed.contacts) ? parsed.contacts : []).slice(0, 8).flatMap((entry) => {
    if (!isRecord(entry))
      return [];
    const name = text2(entry.name, 120);
    if (!name)
      return [];
    return [{ name, role: text2(entry.role, 120) || "Scene contact", description: text2(entry.description, 600) }];
  });
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    const state = await loadState(context.chatId, context.characterId, userId);
    const sceneAt = nowIso();
    for (const contact of state.contacts) {
      if (contact.source.kind === "npc" && contact.source.origin === "scene")
        contact.presence.inScene = false;
    }
    const contactIds = [];
    for (const candidate of found) {
      const sceneKey = sceneKeyFor(candidate.name);
      const existing = state.contacts.find((entry) => entry.source.kind === "npc" && entry.source.origin === "scene" && entry.source.sceneKey === sceneKey) || state.contacts.find((entry) => entry.name.toLocaleLowerCase() === candidate.name.toLocaleLowerCase());
      if (existing && !(existing.source.kind === "npc" && existing.source.origin === "scene")) {
        existing.presence.inScene = true;
        existing.presence.lastSceneAt = sceneAt;
        existing.updatedAt = sceneAt;
        contactIds.push(existing.id);
        continue;
      }
      const createdAt = existing?.createdAt || sceneAt;
      const contact = upsertContact(state, {
        id: existing?.id || id("contact"),
        name: candidate.name,
        role: candidate.role,
        description: candidate.description,
        avatarUrl: existing?.avatarUrl || "",
        accent: existing?.accent || stableContactAccent(sceneKey),
        source: { kind: "npc", origin: "scene", description: candidate.description, sceneKey },
        presence: { inScene: true, lastSceneAt: sceneAt },
        contextPolicy: existing?.contextPolicy || { pinned: false },
        createdAt,
        updatedAt: sceneAt
      });
      contactIds.push(contact.id);
    }
    const active = state.contacts.find((entry) => entry.source.kind === "character" && entry.source.characterId === state.characterId);
    if (active) {
      active.presence.inScene = true;
      active.presence.lastSceneAt = sceneAt;
    }
    const activity = addActivity(state, {
      kind: "contact",
      title: "Scene contacts synced",
      summary: `${contactIds.length} actor${contactIds.length === 1 ? "" : "s"} present`,
      route: { app: "contacts" },
      source: {}
    });
    await saveState(state, userId);
    await sendState(state, userId, "scene_contacts");
    sendActivity(activity, userId);
    send({ type: "lumiphone:scene_contacts_done", requestId: text2(input.requestId, 180), contactIds }, userId);
  });
}
function parseTagContent(content) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{"))
    return { text: trimmed };
  try {
    const parsed = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : { text: trimmed };
  } catch {
    return { text: trimmed };
  }
}
function actionSemanticKey(action, input, payload) {
  const merged = { ...input, ...payload };
  for (const key of ["type", "requestId", "request_id", "commandId", "command_id", "idempotencyKey", "chatId", "chat_id", "characterId", "character_id", "payload"])
    delete merged[key];
  const normalized = Object.keys(merged).sort().reduce((result, key) => {
    const value = merged[key];
    result[key] = typeof value === "string" ? value.trim() : value;
    return result;
  }, {});
  return `${action}:${JSON.stringify(normalized).slice(0, 4000)}`;
}
function reserveCommand(state, input, action, payload, source) {
  const commandId = text2(input.idempotencyKey ?? input.commandId ?? input.command_id ?? input.requestId, 240);
  const semanticKey = actionSemanticKey(action, input, payload);
  const cutoff = Date.now() - 20000;
  const duplicate = commandId ? state.processedCommands.find((entry) => entry.id === commandId) : source !== "user" ? state.processedCommands.find((entry) => entry.semanticKey === semanticKey && Date.parse(entry.createdAt) >= cutoff) : undefined;
  if (duplicate)
    return { accepted: false, command: duplicate };
  const command = { id: commandId || id("cmd"), semanticKey, createdAt: nowIso() };
  state.processedCommands.push(command);
  state.processedCommands = state.processedCommands.slice(-160);
  return { accepted: true, command };
}
async function applyAction(input, userId, source = "model") {
  const context = await resolveContext(input, userId);
  const action = text2(input.action, 40).toLowerCase();
  const key = stateKey(context.chatId, context.characterId);
  const payload = isRecord(input.payload) ? input.payload : input;
  if (action === "camera") {
    const reserved = await withStateLock(key, async () => {
      const state = await loadState(context.chatId, context.characterId, userId);
      const reservation = reserveCommand(state, input, action, payload, source);
      if (!reservation.accepted) {
        sendActivity(state.activities.find((entry) => entry.id === reservation.command.activityId), userId);
        return null;
      }
      await saveState(state, userId);
      return reservation.command;
    });
    return reserved ? cameraGenerate({ ...input, __commandId: reserved.id, __sourceMessageId: input.messageId }, userId) : { ok: true, action, deduplicated: true };
  }
  return withStateLock(key, async () => {
    const state = await loadState(context.chatId, context.characterId, userId);
    const preferences = await loadPreferences(userId);
    const reservation = reserveCommand(state, input, action, payload, source);
    if (!reservation.accepted) {
      const duplicateActivity = state.activities.find((entry) => entry.id === reservation.command.activityId);
      sendActivity(duplicateActivity, userId);
      return { ok: true, action, deduplicated: true, activityId: duplicateActivity?.id };
    }
    const command = reservation.command;
    let notification = null;
    let activity;
    let result = { ok: true, action };
    if (action === "open") {
      await saveState(state, userId);
      await sendState(state, userId, "open", true);
      return result;
    }
    if (action === "message") {
      const requestedContactId = text2(payload.contact_id ?? payload.contactId, 180);
      let contact = state.contacts.find((item) => item.id === requestedContactId);
      if (!contact && requestedContactId) {
        const createdAt = nowIso();
        contact = {
          id: requestedContactId,
          name: text2(payload.contact_name ?? payload.contactName, 120) || "Pocket NPC",
          role: text2(payload.contact_role ?? payload.contactRole, 120) || "Pocket NPC",
          description: text2(payload.contact_description ?? payload.contactDescription, 600),
          avatarUrl: "",
          accent: stableContactAccent(requestedContactId),
          source: { kind: "npc", origin: "manual", description: text2(payload.contact_description ?? payload.contactDescription, 600) },
          presence: { inScene: false, lastSceneAt: "" },
          contextPolicy: { pinned: false },
          createdAt,
          updatedAt: createdAt
        };
        state.contacts.push(contact);
      }
      const conversation = text2(payload.conversationId ?? payload.conversation_id, 180) ? resolveConversation(state, payload) : ensureDirectConversation(state, contact?.id || state.contacts[0].id, nowIso(), id);
      const messageText = text2(payload.text ?? payload.content, 12000);
      if (!messageText)
        throw new Error("A phone message needs text.");
      const sender = source === "user" || payload.sender === "user" || payload.sender === "persona" ? "persona" : payload.sender === "system" ? "system" : "contact";
      const senderContactId = sender === "contact" ? text2(payload.senderContactId ?? payload.sender_contact_id, 180) || contact?.id || conversation.participantContactIds[0] : undefined;
      const senderContact = senderContactId ? state.contacts.find((entry) => entry.id === senderContactId) : undefined;
      if (sender === "contact" && (!senderContact || !conversation.participantContactIds.includes(senderContact.id)))
        throw new Error("The message sender must be a participant in this conversation.");
      const message = {
        id: id("msg"),
        sender,
        senderContactId,
        senderName: sender === "persona" ? "You" : sender === "system" ? "Pocket" : senderContact.name,
        senderAccent: senderContact?.accent || "",
        text: messageText,
        createdAt: nowIso(),
        read: sender !== "contact",
        status: sender === "persona" ? "sent" : sender === "system" ? "read" : "delivered"
      };
      conversation.messages.push(message);
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES2);
      conversation.updatedAt = message.createdAt;
      if (sender === "contact")
        conversation.unread += 1;
      const route = { app: "messages", conversationId: conversation.id, messageId: message.id };
      notification = sender === "contact" ? addNotification(state, { app: "messages", title: senderContact.name, body: messageText.slice(0, 220), route }) : null;
      result = { ...result, contactId: senderContact?.id || contact?.id, conversationId: conversation.id, messageId: message.id };
      activity = addActivity(state, { kind: "message", title: senderContact?.name || conversation.title, summary: messageText.slice(0, 280), route, source: { messageId: text2(input.messageId, 180) || message.id, contactId: senderContact?.id || contact?.id, conversationId: conversation.id } }, command);
    } else if (action === "contact") {
      const contactId = text2(payload.contactId ?? payload.contact_id ?? payload.id, 180);
      const existing = state.contacts.find((entry) => entry.id === contactId);
      const name = text2(payload.name ?? payload.title, 120) || existing?.name;
      if (!name)
        throw new Error("A contact action needs a name.");
      const createdAt = existing?.createdAt || nowIso();
      const requestedAccent = text2(payload.accent, 20);
      const contact = upsertContact(state, {
        id: existing?.id || id("contact"),
        name,
        role: text2(payload.role, 120) || existing?.role || "Pocket NPC",
        description: text2(payload.description ?? payload.text ?? payload.content, 600) || existing?.description || "",
        avatarUrl: existing?.avatarUrl || "",
        accent: /^#[0-9a-f]{6}$/i.test(requestedAccent) ? requestedAccent : existing?.accent || stableContactAccent(name),
        source: existing?.source || { kind: "npc", origin: "manual", description: text2(payload.description ?? payload.text ?? payload.content, 600) },
        presence: {
          inScene: bool2(payload.inScene ?? payload.in_scene, existing?.presence.inScene),
          lastSceneAt: bool2(payload.inScene ?? payload.in_scene, existing?.presence.inScene) ? nowIso() : existing?.presence.lastSceneAt || ""
        },
        contextPolicy: { pinned: bool2(payload.pinned, existing?.contextPolicy.pinned) },
        createdAt,
        updatedAt: nowIso()
      });
      const route = { app: "contacts", contactId: contact.id, view: "detail" };
      notification = source !== "user" ? addNotification(state, { app: "contacts", title: contact.name, body: contact.role, route }) : null;
      result.contactId = contact.id;
      activity = addActivity(state, { kind: "contact", title: contact.name, summary: contact.role, route, source: { messageId: text2(input.messageId, 180) || undefined, contactId: contact.id } }, command);
    } else if (action === "note") {
      const noteId = text2(payload.id, 120);
      const existing = state.notes.find((item) => item.id === noteId);
      const body = text2(payload.body ?? payload.text ?? payload.content, 40000);
      const title = text2(payload.title, 180) || body.slice(0, 42) || "Journal entry";
      if (existing) {
        Object.assign(existing, { title, body, mood: text2(payload.mood, 80), pinned: bool2(payload.pinned, existing.pinned), updatedAt: nowIso() });
        result.noteId = existing.id;
      } else {
        const note = { id: id("note"), title, body, mood: text2(payload.mood, 80), pinned: bool2(payload.pinned), author: source === "user" ? "user" : source === "tag" ? "character" : "model", createdAt: nowIso(), updatedAt: nowIso() };
        state.notes.unshift(note);
        state.notes = state.notes.slice(0, MAX_NOTES);
        result.noteId = note.id;
      }
      const route = { app: "notes", noteId: String(result.noteId) };
      if (source !== "user")
        notification = addNotification(state, { app: "notes", title: "Journal updated", body: title, route });
      activity = addActivity(state, { kind: "note", title: "Journal updated", summary: title, route, source: { messageId: text2(input.messageId, 180) || undefined, noteId: String(result.noteId) } }, command);
    } else if (action === "event") {
      const eventId = text2(payload.id, 120);
      const existing = state.events.find((item) => item.id === eventId);
      const title = text2(payload.title, 180) || "Untitled event";
      const start = text2(payload.start, 80) || state.roleplayNow;
      const event = {
        id: existing?.id || id("evt"),
        title,
        description: text2(payload.description ?? payload.text, 8000),
        start,
        end: text2(payload.end, 80) || start,
        color: text2(payload.color, 40) || preferences.colors.accent,
        whenKind: payload.whenKind === "approximate" || payload.whenKind === "relative" || payload.whenKind === "unscheduled" ? payload.whenKind : "exact",
        whenText: text2(payload.whenText, 240) || start,
        lane: text2(payload.lane, 80) || "Main timeline",
        completed: bool2(payload.completed, existing?.completed),
        createdBy: source === "user" ? "user" : source === "tag" ? "character" : "model"
      };
      if (existing)
        Object.assign(existing, event);
      else
        state.events.push(event);
      state.events = state.events.slice(-MAX_EVENTS);
      const route = { app: "calendar", eventId: event.id };
      notification = source !== "user" ? addNotification(state, { app: "calendar", title: "Timeline updated", body: title, route }) : null;
      result.eventId = event.id;
      activity = addActivity(state, { kind: "timeline", title: "Timeline updated", summary: title, route, source: { messageId: text2(input.messageId, 180) || undefined, eventId: event.id } }, command);
    } else if (action === "weather") {
      state.weather = {
        location: text2(payload.location, 160) || state.weather.location,
        condition: text2(payload.condition, 120) || state.weather.condition,
        temperature: numberValue(payload.temperature, state.weather.temperature),
        unit: payload.unit === "F" ? "F" : "C",
        high: numberValue(payload.high, state.weather.high),
        low: numberValue(payload.low, state.weather.low),
        details: text2(payload.details ?? payload.text, 2000) || state.weather.details,
        updatedAt: nowIso()
      };
      const route = { app: "weather" };
      notification = source !== "user" ? addNotification(state, { app: "weather", title: state.weather.location, body: `${state.weather.condition}, ${state.weather.temperature}\xB0${state.weather.unit}`, route }) : null;
      activity = addActivity(state, { kind: "weather", title: state.weather.location, summary: `${state.weather.condition}, ${state.weather.temperature}\xB0${state.weather.unit}`, route, source: { messageId: text2(input.messageId, 180) || undefined } }, command);
    } else if (action === "tracker") {
      const trackerId2 = text2(payload.trackerId ?? payload.tracker_id ?? payload.id, 120);
      const requestedKey = trackerKey(payload.key, "");
      let existing = trackerId2 ? state.trackers.find((item) => item.id === trackerId2) : undefined;
      if (!existing && requestedKey)
        existing = state.trackers.find((item) => item.key === requestedKey);
      if (!existing && !trackerId2 && !requestedKey && text2(payload.label, 120)) {
        const matches = state.trackers.filter((item) => item.label.toLocaleLowerCase() === text2(payload.label, 120).toLocaleLowerCase());
        if (matches.length > 1)
          throw new Error("Tracker label is ambiguous; use trackerId or key.");
        existing = matches[0];
      }
      if (existing && source !== "user" && (!existing.allowModelWrite || existing.updateMode !== "model")) {
        throw new Error(`Tracker ${existing.label} does not allow model updates.`);
      }
      const operation = text2(payload.operation ?? payload.op, 30);
      let next;
      if (existing && operation) {
        next = applyTrackerOperation(existing, {
          operation,
          amount: numberValue(payload.amount ?? payload.value, 0),
          state: text2(payload.state ?? payload.value, 80),
          reason: text2(payload.reason, 300),
          source,
          roleplayNow: state.roleplayNow
        });
      } else {
        const candidate = normalizeTracker({
          ...existing || {},
          ...payload,
          id: existing?.id || trackerId2 || id("trk"),
          key: text2(payload.key, 120) || existing?.key || text2(payload.label, 120),
          label: text2(payload.label, 120) || existing?.label || "Tracker",
          color: text2(payload.color, 40) || existing?.color || preferences.colors.accent,
          ratePerHour: payload.ratePerHour ?? payload.rate_per_hour ?? existing?.ratePerHour,
          updatedAt: nowIso(),
          lastUpdated: existing?.lastUpdated || nowIso()
        }, { roleplayNow: state.roleplayNow, characterId: state.characterId, characterName: state.characterName });
        if (!candidate)
          throw new Error("Tracker configuration is invalid.");
        next = candidate;
      }
      if (existing)
        state.trackers[state.trackers.indexOf(existing)] = next;
      else
        state.trackers.push(next);
      state.trackers = state.trackers.slice(-MAX_TRACKERS);
      const route = { app: "trackers", trackerId: next.id, view: "detail" };
      const trackerSummary = next.kind === "state" ? next.state : `${Number(next.value.toFixed(2))}${next.unit}`;
      notification = source !== "user" ? addNotification(state, { app: "trackers", title: next.label, body: trackerSummary, route }) : null;
      result.trackerId = next.id;
      activity = addActivity(state, { kind: "tracker-change", title: next.label, summary: trackerSummary, route, source: { messageId: text2(input.messageId, 180) || undefined, trackerId: next.id } }, command);
    } else if (action === "notify") {
      const requestedApp = text2(payload.app ?? input.app, 40);
      const allowedApps = new Set(["home", "messages", "contacts", "gallery", "camera", "notes", "weather", "calendar", "trackers", "settings"]);
      notification = addNotification(state, {
        app: allowedApps.has(requestedApp) ? requestedApp : "home",
        title: text2(payload.title ?? input.title, 160) || "Pocket",
        body: text2(payload.body ?? payload.text ?? payload.content, 1000),
        route: normalizePocketRoute(payload.route, { app: allowedApps.has(requestedApp) ? requestedApp : "home" })
      });
      activity = addActivity(state, { kind: "system", title: notification.title, summary: notification.body, route: notification.route || { app: "home" }, source: { messageId: text2(input.messageId, 180) || undefined } }, command);
    } else {
      throw new Error(`Unsupported phone action: ${action || "(empty)"}`);
    }
    await saveState(state, userId);
    if (notification)
      await maybePush(state, preferences, notification, userId);
    await sendState(state, userId, action, source !== "user" && preferences.autoOpenOnModelAction);
    sendActivity(activity, userId);
    return { ...result, activityId: activity?.id };
  });
}
async function handleFrontend(payload, userId) {
  if (!isRecord(payload) || !text2(payload.type, 120).startsWith("lumiphone:"))
    return;
  const requestId = text2(payload.requestId, 180);
  try {
    const context = await resolveContext(payload, userId);
    switch (payload.type) {
      case "lumiphone:get_state": {
        const state = await loadState(context.chatId, context.characterId, userId);
        const preferences = await loadPreferences(userId);
        const swarmProfile = await resolveSwarmProfile(context.chatId, context.characterId, preferences);
        send({ type: "lumiphone:state", requestId, state, preferences, capabilities: capabilities(), swarmProfile, reason: "load" }, userId);
        break;
      }
      case "lumiphone:list_contact_sources": {
        const state = await loadState(context.chatId, context.characterId, userId);
        send({ type: "lumiphone:contact_sources", requestId, sources: await listContactSources(state, userId) }, userId);
        break;
      }
      case "lumiphone:import_contact": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const kind = text2(payload.kind, 30);
          const sourceId = text2(payload.sourceId, 180);
          const itemId = text2(payload.itemId, 180);
          const option = (await listContactSources(state, userId)).find((entry) => entry.kind === kind && entry.sourceId === sourceId && (!itemId || entry.itemId === itemId));
          if (!option)
            throw new Error("That Character or Council source is no longer available.");
          const contact = upsertContact(state, contactFromSource(option));
          const conversation = ensureDirectConversation(state, contact.id, nowIso(), id);
          const activity = addActivity(state, { kind: "contact", title: `${contact.name} imported`, summary: contact.role, route: { app: "contacts", contactId: contact.id, view: "detail" }, source: { contactId: contact.id, conversationId: conversation.id } });
          await saveState(state, userId);
          await sendState(state, userId, "contact");
          sendActivity(activity, userId);
          send({ type: "lumiphone:contact_created", requestId, contactId: contact.id, conversationId: conversation.id }, userId);
        });
        break;
      }
      case "lumiphone:save_contact": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const raw = isRecord(payload.contact) ? payload.contact : payload;
          const existing = state.contacts.find((entry) => entry.id === text2(raw.id, 180));
          const candidate = normalizePocketContact({
            ...existing || {},
            ...raw,
            id: existing?.id || text2(raw.id, 180) || id("contact"),
            source: existing?.source || { kind: "npc", origin: "manual", description: text2(raw.description, 600) },
            createdAt: existing?.createdAt || nowIso(),
            updatedAt: nowIso()
          }, { characterId: state.characterId, characterName: state.characterName, now: nowIso(), makeId: id });
          if (!candidate)
            throw new Error("A contact needs a name.");
          const contact = upsertContact(state, candidate);
          await saveState(state, userId);
          await sendState(state, userId, "contact");
          send({ type: "lumiphone:contact_saved", requestId, contactId: contact.id }, userId);
        });
        break;
      }
      case "lumiphone:generate_contact":
        await generateNpcContact(payload, userId);
        break;
      case "lumiphone:sync_scene_contacts":
        await syncSceneContacts(payload, userId);
        break;
      case "lumiphone:open_direct": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const contactId = text2(payload.contactId, 180);
          if (!state.contacts.some((entry) => entry.id === contactId))
            throw new Error("That contact no longer exists.");
          const conversation = ensureDirectConversation(state, contactId, nowIso(), id);
          await saveState(state, userId);
          send({ type: "lumiphone:conversation_opened", requestId, conversationId: conversation.id }, userId);
          await sendState(state, userId, "conversation");
        });
        break;
      }
      case "lumiphone:create_conversation": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const participantContactIds = [...new Set((Array.isArray(payload.participantContactIds) ? payload.participantContactIds : []).map((entry) => text2(entry, 180)).filter((entry) => state.contacts.some((contact) => contact.id === entry)))].slice(0, 16);
          if (participantContactIds.length < 2)
            throw new Error("A group conversation needs at least two contacts.");
          const createdAt = nowIso();
          const conversation = {
            id: id("conversation"),
            kind: "group",
            title: text2(payload.title, 120) || participantContactIds.map((entry) => state.contacts.find((contact) => contact.id === entry)?.name).filter(Boolean).join(", ").slice(0, 120) || "Group",
            participantContactIds,
            messages: [],
            unread: 0,
            createdAt,
            updatedAt: createdAt
          };
          state.conversations.push(conversation);
          await saveState(state, userId);
          await sendState(state, userId, "conversation");
          send({ type: "lumiphone:conversation_opened", requestId, conversationId: conversation.id }, userId);
        });
        break;
      }
      case "lumiphone:update_conversation": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
          if (!conversation || conversation.kind !== "group")
            throw new Error("That group conversation no longer exists.");
          const participantContactIds = [...new Set((Array.isArray(payload.participantContactIds) ? payload.participantContactIds : conversation.participantContactIds).map((entry) => text2(entry, 180)).filter((entry) => state.contacts.some((contact) => contact.id === entry)))].slice(0, 16);
          if (participantContactIds.length < 2)
            throw new Error("A group conversation needs at least two contacts.");
          conversation.participantContactIds = participantContactIds;
          conversation.title = text2(payload.title, 120) || conversation.title;
          conversation.updatedAt = nowIso();
          await saveState(state, userId);
          await sendState(state, userId, "conversation");
        });
        break;
      }
      case "lumiphone:save_preferences":
      case "lumiphone:save_settings": {
        const existing = await loadPreferences(userId);
        await savePreferences({ ...existing, ...isRecord(payload.preferences) ? payload.preferences : isRecord(payload.settings) ? payload.settings : {} }, userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "preferences");
        break;
      }
      case "lumiphone:save_roleplay_time": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const nextRoleplayNow = text2(payload.roleplayNow, 80) || state.roleplayNow;
          state.trackers = state.trackers.map((tracker) => materializeTracker(tracker, nextRoleplayNow).tracker);
          state.roleplayNow = nextRoleplayNow;
          await saveState(state, userId);
          await sendState(state, userId, "calendar");
        });
        break;
      }
      case "lumiphone:action":
        await applyAction(payload, userId, "user");
        break;
      case "lumiphone:model_action": {
        const attrs = isRecord(payload.attrs) ? payload.attrs : {};
        const tagPayload = {
          ...parseTagContent(text2(payload.content, 40000)),
          ...attrs,
          action: text2(attrs.action, 40),
          chat_id: context.chatId,
          character_id: context.characterId,
          messageId: text2(payload.messageId, 180),
          idempotencyKey: text2(payload.idempotencyKey, 240) || `tag:${text2(payload.messageId, 180)}:${text2(payload.fullMatch, 1000)}`
        };
        await applyAction(tagPayload, userId, "tag");
        break;
      }
      case "lumiphone:generate_message":
        await generateMessage(payload, userId);
        break;
      case "lumiphone:gallery_list":
        send({ type: "lumiphone:gallery", requestId, scope: payload.scope, ...await listGallery(payload, userId) }, userId);
        break;
      case "lumiphone:camera_generate":
        await cameraGenerate(payload, userId);
        break;
      case "lumiphone:camera_cancel": {
        const job = cameraJobs.get(requestId);
        if (job)
          job.cancelled = true;
        job?.controller.abort();
        cameraJobs.delete(requestId);
        send({ type: "lumiphone:camera_cancelled", requestId }, userId);
        break;
      }
      case "lumiphone:mark_read": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const app = text2(payload.app, 40);
          state.notifications.forEach((entry) => {
            if (!app || entry.app === app)
              entry.read = true;
          });
          const conversationId = text2(payload.conversationId, 180);
          const legacyContactId = text2(payload.contactId, 180);
          const conversation = state.conversations.find((entry) => entry.id === conversationId) || state.conversations.find((entry) => entry.kind === "direct" && entry.participantContactIds[0] === legacyContactId);
          if (conversation) {
            conversation.unread = 0;
            conversation.messages.forEach((message) => {
              message.read = true;
              message.status = "read";
            });
          }
          await saveState(state, userId);
          await sendState(state, userId, "read");
        });
        break;
      }
      case "lumiphone:delete": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const kind = text2(payload.kind, 30);
          const targetId = text2(payload.id, 120);
          if (kind === "note")
            state.notes = state.notes.filter((entry) => entry.id !== targetId);
          if (kind === "event")
            state.events = state.events.filter((entry) => entry.id !== targetId);
          if (kind === "tracker")
            state.trackers = state.trackers.filter((entry) => entry.id !== targetId);
          if (kind === "contact") {
            state.contacts = state.contacts.filter((entry) => entry.id !== targetId);
          }
          if (kind === "conversation")
            state.conversations = state.conversations.filter((entry) => entry.id !== targetId);
          await saveState(state, userId);
          await sendState(state, userId, "delete");
        });
        break;
      }
      case "lumiphone:get_swarm_profile": {
        send({ type: "lumiphone:swarm_profile", requestId, profile: await resolveSwarmProfile(context.chatId, context.characterId, await loadPreferences(userId)) }, userId);
        break;
      }
      case "lumiphone:export_data": {
        const state = await loadState(context.chatId, context.characterId, userId);
        send({ type: "lumiphone:export_data", requestId, data: { product: "Pocket", exportVersion: 3, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId) } }, userId);
        break;
      }
      case "lumiphone:import_data": {
        if (!isRecord(payload.data))
          throw new Error("Import must be a Pocket JSON object.");
        const rawState = isRecord(payload.data.state) ? payload.data.state : payload.data;
        if (Number(rawState.version) > STATE_VERSION)
          throw new Error("This backup uses a newer Pocket state schema.");
        const characterName = await characterNameFor(context.characterId, userId);
        const state = normalizeState(rawState, context.chatId, context.characterId, characterName);
        await saveState(state, userId);
        if (payload.data.preferences !== undefined)
          await savePreferences(payload.data.preferences, userId);
        await sendState(state, userId, "import");
        break;
      }
      case "lumiphone:reset_current": {
        const state = defaultState(context.chatId, context.characterId, await characterNameFor(context.characterId, userId));
        await saveState(state, userId);
        await sendState(state, userId, "reset_current");
        break;
      }
      case "lumiphone:reset_all_roleplay": {
        const files = await spindle.userStorage.list("phones/", userId);
        await Promise.all(files.filter((path) => path.startsWith("phones/")).map((path) => spindle.userStorage.delete(path, userId)));
        const state = defaultState(context.chatId, context.characterId, await characterNameFor(context.characterId, userId));
        await saveState(state, userId);
        await sendState(state, userId, "reset_all_roleplay");
        break;
      }
      case "lumiphone:reset_preferences": {
        await savePreferences(defaultPreferences(), userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "reset_preferences");
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    spindle.log.error(`Pocket request failed: ${message}`);
    send({ type: "lumiphone:error", requestId, error: message }, userId);
  }
}
function registerTool() {
  if (!spindle.permissions.has("tools"))
    return;
  spindle.registerTool({
    name: "phone_action",
    display_name: "Pocket Action",
    description: "Use Pocket, the character-aware roleplay phone: send a text, create or update a compact contact, write a journal note, schedule a timeline event, change fictional weather, update a typed tracker, take an AI camera photo, show a notification, or open the phone. State persists per chat and character.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["message", "contact", "note", "event", "weather", "tracker", "camera", "notify", "open"] },
        chat_id: { type: "string", description: "Current chat id when known." },
        character_id: { type: "string", description: "Current character id when known." },
        payload: {
          type: "object",
          description: "Action data. tracker operations target trackerId or stable key (label is legacy fallback) and use operation set/add/subtract/reset/set_state plus amount/state/reason. Tracker configuration supports kind, target, updateMode, clock real|roleplay, visibility and allowModelWrite. Other actions use message text/contact_name; note title/body; event title/start/end; weather fields; camera prompt; notify route/title/body.",
          additionalProperties: true
        }
      },
      required: ["action", "payload"]
    },
    council_eligible: false
  });
}
var interceptorDisposer = null;
function ensureInterceptor() {
  if (interceptorDisposer || !spindle.permissions.has("interceptor"))
    return;
  interceptorDisposer = spindle.registerInterceptor(async (messages, context) => {
    try {
      const chatId = context.chatId || "_lobby";
      const characterId = context.characterId || "_none";
      const state = await loadState(chatId, characterId, context.userId);
      const injected = { role: "system", content: `${PHONE_GUIDANCE}
Current Pocket snapshot:
${projectPhoneContext(state)}` };
      return { messages: [...messages, injected], breakdown: [{ messageIndex: messages.length, name: "Pocket memory" }] };
    } catch {
      return messages;
    }
  }, 70);
}
spindle.frontendCapabilities.declare("message_tag_interceptor");
spindle.onFrontendMessage(handleFrontend);
spindle.on("TOOL_INVOCATION", async (payload) => {
  if (payload.toolName !== "phone_action")
    return "";
  try {
    const args = isRecord(payload.args) ? payload.args : {};
    const merged = {
      ...args,
      ...isRecord(args.payload) ? args.payload : {},
      payload: args.payload,
      idempotencyKey: text2(payload.requestId, 240),
      messageId: text2(payload.messageId, 180)
    };
    const result = await applyAction(merged, undefined, "model");
    return JSON.stringify(result);
  } catch (error) {
    return `Pocket action failed: ${error instanceof Error ? error.message : String(error)}`;
  }
});
ensureInterceptor();
registerTool();
spindle.permissions.onChanged(({ permission, granted }) => {
  if (permission === "tools") {
    if (granted)
      registerTool();
    else
      spindle.unregisterTool("phone_action");
  }
  if (permission === "interceptor") {
    if (granted)
      ensureInterceptor();
    else {
      interceptorDisposer?.();
      interceptorDisposer = null;
    }
  }
  send({ type: "lumiphone:capabilities", capabilities: capabilities() });
});
spindle.on("CHAT_SWITCHED", async (payload, userId) => {
  const chatId = text2(payload?.chatId, 180);
  if (!chatId)
    return;
  try {
    const chat = spindle.permissions.has("chats") ? await spindle.chats.get(chatId, userId) : null;
    const characterId = text2(chat?.character_id, 180) || "_none";
    await sendState(await loadState(chatId, characterId, userId), userId, "chat_switched");
  } catch {}
});
spindle.log.info("Pocket backend loaded.");
