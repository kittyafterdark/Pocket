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
  const contacts = state.contacts.map((contact) => ({
    name: contact.name.slice(0, 120),
    recent: contact.messages.slice(-3).map((message) => `${message.sender}: ${message.text.slice(0, 180)}`)
  })).filter((contact) => contact.recent.length).slice(0, 8);
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
var APPS = new Set(["home", "messages", "gallery", "camera", "notes", "weather", "calendar", "trackers", "settings"]);
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
    return { app, contactId: shortId(raw.contactId), messageId: shortId(raw.messageId) };
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

// src/backend.ts
var STATE_VERSION = 2;
var MAX_MESSAGES = 240;
var MAX_NOTIFICATIONS = 80;
var MAX_NOTES = 120;
var MAX_EVENTS = 200;
var MAX_TRACKERS = 40;
var MAX_ACTIVITIES = 120;
var stateLocks = new Map;
var cameraJobs = new Map;
var notificationThrottle = new Map;
var PHONE_GUIDANCE = `Pocket is available as an in-world phone shared with the current character. Use the registered phone_action tool when it is available. If tools are unavailable and a phone action materially belongs in the scene, emit exactly one hidden tag:
<lumi-phone action="message|note|event|weather|tracker|camera|notify|open" app="messages|notes|calendar|weather|trackers|camera|home" title="short title">content or compact JSON</lumi-phone>
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
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || "Character",
    roleplayNow: createdAt,
    contacts: [{
      id: characterId || "character",
      name: characterName || "Character",
      subtitle: "Available",
      avatarUrl: "",
      messages: [],
      unread: 0
    }],
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
function normalizeMessage(value) {
  if (!isRecord(value))
    return null;
  const messageText = text2(value.text, 12000);
  if (!messageText)
    return null;
  const sender = value.sender === "user" || value.sender === "system" ? value.sender : "character";
  return {
    id: text2(value.id, 120) || id("msg"),
    sender,
    text: messageText,
    createdAt: text2(value.createdAt, 40) || nowIso(),
    read: bool2(value.read, sender !== "character"),
    status: value.status === "pending" || value.status === "failed" || value.status === "sent" || value.status === "delivered" || value.status === "read" ? value.status : bool2(value.read, sender !== "character") ? "read" : "delivered",
    imageId: text2(value.imageId, 160) || undefined,
    imageUrl: text2(value.imageUrl, 2000) || undefined
  };
}
function normalizeContact(value, fallbackId, fallbackName) {
  if (!isRecord(value))
    return null;
  const messages = (Array.isArray(value.messages) ? value.messages : []).map(normalizeMessage).filter((entry) => Boolean(entry)).slice(-MAX_MESSAGES);
  const contactId = text2(value.id, 160) || fallbackId;
  const name = text2(value.name, 120) || fallbackName;
  if (!contactId || !name)
    return null;
  return {
    id: contactId,
    name,
    subtitle: text2(value.subtitle, 160) || "Available",
    avatarUrl: text2(value.avatarUrl, 2000),
    messages,
    unread: Math.max(0, Math.min(999, Math.floor(numberValue(value.unread, messages.filter((item) => !item.read).length))))
  };
}
function normalizeState(value, chatId, characterId, characterName) {
  const fallback = defaultState(chatId, characterId, characterName);
  if (!isRecord(value))
    return fallback;
  if (Number(value.version) > STATE_VERSION)
    return fallback;
  const contacts = (Array.isArray(value.contacts) ? value.contacts : []).map((item) => normalizeContact(item, characterId || "character", characterName || "Character")).filter((item) => Boolean(item)).slice(0, 30);
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
      kind: item.kind === "message" || item.kind === "tracker-change" || item.kind === "timeline" || item.kind === "note" || item.kind === "image" || item.kind === "weather" ? item.kind : "system",
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
    contacts: contacts.length ? contacts : fallback.contacts,
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
  const contact = state.contacts.find((item) => item.id === characterId);
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
    push: spindle.permissions.has("push_notification")
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
    const contactId = text2(input.contactId, 180) || context.characterId;
    const contact = state.contacts.find((item) => item.id === contactId) || state.contacts[0];
    send({ type: "lumiphone:message_progress", requestId, chatId: context.chatId, characterId: context.characterId, contactId: contact.id, phase: "pending" }, userId);
    const character = spindle.permissions.has("characters") && context.characterId !== "_none" ? await spindle.characters.get(context.characterId, userId).catch(() => null) : null;
    const history = contact.messages.slice(-24).map((message) => `${message.sender === "user" ? "User" : contact.name}: ${message.text}`).join(`
`);
    const instruction = text2(input.instruction, 2000) || "Reply naturally to the latest message.";
    const response = await spindle.generate.quiet({
      type: "quiet",
      messages: [
        { role: "system", content: `Write one private phone text as ${contact.name}. Stay in character. Return only the message text, without a name label, quotes, narration, or XML.
Character description: ${text2(character?.description, 8000)}
Personality: ${text2(character?.personality, 4000)}` },
        { role: "user", content: `Conversation:
${history || "(no messages yet)"}

Direction: ${instruction}` }
      ],
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId
    });
    const reply = text2(response.content, 8000);
    if (!reply)
      throw new Error("The character did not return a phone message.");
    contact.messages.push({ id: id("msg"), sender: "character", text: reply, createdAt: nowIso(), read: false, status: "delivered" });
    contact.messages = contact.messages.slice(-MAX_MESSAGES);
    contact.unread += 1;
    const phoneMessageId = contact.messages.at(-1)?.id;
    const route = { app: "messages", contactId: contact.id, messageId: phoneMessageId };
    const notification = addNotification(state, { app: "messages", title: contact.name, body: reply.slice(0, 220), route });
    const activity = addActivity(state, { kind: "message", title: contact.name, summary: reply.slice(0, 280), route, source: { contactId: contact.id } });
    await saveState(state, userId);
    await maybePush(state, preferences, notification, userId);
    await sendState(state, userId, "message", preferences.autoOpenOnModelAction);
    sendActivity(activity, userId);
    send({ type: "lumiphone:message_progress", requestId, chatId: context.chatId, characterId: context.characterId, contactId: contact.id, phase: "done" }, userId);
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
      const contactId = text2(payload.contact_id ?? payload.contactId, 180) || context.characterId;
      let contact = state.contacts.find((item) => item.id === contactId);
      if (!contact) {
        contact = { id: contactId || id("contact"), name: text2(payload.contact_name ?? payload.contactName, 120) || state.characterName, subtitle: "Available", avatarUrl: "", messages: [], unread: 0 };
        state.contacts.push(contact);
      }
      const messageText = text2(payload.text ?? payload.content, 12000);
      if (!messageText)
        throw new Error("A phone message needs text.");
      const sender = source === "user" || payload.sender === "user" ? "user" : "character";
      contact.messages.push({ id: id("msg"), sender, text: messageText, createdAt: nowIso(), read: sender === "user", status: sender === "user" ? "sent" : "delivered" });
      contact.messages = contact.messages.slice(-MAX_MESSAGES);
      if (sender === "character")
        contact.unread += 1;
      const phoneMessageId = contact.messages.at(-1)?.id;
      const route = { app: "messages", contactId: contact.id, messageId: phoneMessageId };
      notification = sender === "character" ? addNotification(state, { app: "messages", title: contact.name, body: messageText.slice(0, 220), route }) : null;
      result = { ...result, contactId: contact.id, messageId: contact.messages.at(-1)?.id };
      activity = addActivity(state, { kind: "message", title: contact.name, summary: messageText.slice(0, 280), route, source: { messageId: text2(input.messageId, 180) || undefined, contactId: contact.id } }, command);
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
      const allowedApps = new Set(["home", "messages", "gallery", "camera", "notes", "weather", "calendar", "trackers", "settings"]);
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
          const contactId = text2(payload.contactId, 180);
          if (contactId) {
            state.contacts.filter((entry) => entry.id === contactId).forEach((contact) => {
              contact.unread = 0;
              contact.messages.forEach((message) => {
                message.read = true;
                message.status = "read";
              });
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
        send({ type: "lumiphone:export_data", requestId, data: { product: "Pocket", exportVersion: 2, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId) } }, userId);
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
    description: "Use Pocket, the character-aware roleplay phone: send a text, write a journal note, schedule a timeline event, change fictional weather, create or update a typed tracker, take an AI camera photo, show a notification, or open the phone. State persists per chat and character.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["message", "note", "event", "weather", "tracker", "camera", "notify", "open"] },
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
