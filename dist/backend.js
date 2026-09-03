// @bun
// src/domain/preferences.ts
var PREFERENCES_VERSION = 5;
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
function defaultWallpaper() {
  return { source: null, fit: "cover", focalX: 0.5, focalY: 0.5, scrim: 0.22 };
}
function normalizeImageSource(value) {
  const raw = record(value);
  if (raw.kind === "gallery") {
    const imageId = text(raw.imageId, "", 180);
    return imageId ? { kind: "gallery", imageId } : null;
  }
  if (raw.kind === "asset") {
    const assetId = text(raw.assetId, "", 180);
    return assetId ? { kind: "asset", assetId } : null;
  }
  if (raw.kind === "url") {
    const url = text(raw.url, "", 2000);
    return /^(https?:\/\/|\/)/i.test(url) ? { kind: "url", url } : null;
  }
  return null;
}
function normalizeWallpaper(value, legacyUrl = "") {
  const raw = record(value);
  const fit = raw.fit === "contain" || raw.fit === "stretch" ? raw.fit : "cover";
  const migratedUrl = text(legacyUrl, "", 2000);
  return {
    source: normalizeImageSource(raw.source) || (/^(https?:\/\/|\/)/i.test(migratedUrl) ? { kind: "url", url: migratedUrl } : null),
    fit,
    focalX: numberIn(raw.focalX, 0.5, 0, 1),
    focalY: numberIn(raw.focalY, 0.5, 0, 1),
    scrim: numberIn(raw.scrim, 0.22, 0, 0.85)
  };
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
    homeWallpaper: defaultWallpaper(),
    chatWallpaper: defaultWallpaper(),
    handsetScale: 1,
    uiScale: 1,
    animation: "spring",
    animationDurationMs: 280,
    reducedMotion: false,
    autoOpenOnModelAction: false,
    pushNotifications: false,
    useSwarmProfile: true,
    sceneEnhancer: true,
    generationMode: "roleplay",
    sidecarConnectionId: "",
    sidecarModelOverride: "",
    autoReplyAfterSend: false,
    replyCadence: "natural",
    ambientMessaging: "off",
    roleplayContextMode: "smart",
    recentRoleplayMessages: 8,
    notificationSounds: false,
    notificationPreviews: true,
    notifyMessages: true,
    notifyContacts: true,
    notifyTrackers: true,
    customCss: "",
    personaAppearance: {},
    generationHistory: [],
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
  const history = (Array.isArray(raw.generationHistory) ? raw.generationHistory : []).slice(-24).flatMap((entry) => {
    const item = record(entry);
    const requestId = text(item.requestId, "", 180);
    const task = text(item.task, "", 40);
    const tasks = new Set(["npc-contact", "profile-refresh", "scene-sync", "persona-profile", "message-reply", "message-retry", "reply-decision", "ambient-decision", "scene-planner", "connection-test"]);
    if (!requestId || !tasks.has(task))
      return [];
    const status = item.status === "completed" || item.status === "failed" ? item.status : "started";
    return [{
      requestId,
      task,
      mode: item.mode === "sidecar" ? "sidecar" : "roleplay",
      connectionId: text(item.connectionId, "", 180),
      connectionName: text(item.connectionName, "", 180),
      provider: text(item.provider, "", 120),
      model: text(item.model, "", 500),
      status,
      startedAt: text(item.startedAt, new Date(0).toISOString(), 40),
      completedAt: text(item.completedAt, "", 40) || undefined,
      latencyMs: Number.isFinite(Number(item.latencyMs)) ? Math.max(0, Math.round(Number(item.latencyMs))) : undefined,
      error: text(item.error, "", 500) || undefined
    }];
  });
  const rawPersonaAppearance = record(raw.personaAppearance);
  const personaAppearance = {};
  for (const [personaId, value2] of Object.entries(rawPersonaAppearance).slice(0, 32)) {
    if (!personaId || personaId.length > 180)
      continue;
    const item = record(value2);
    const overrideTheme = allowedThemes.has(item.theme) ? item.theme : theme;
    const overrideColors = record(item.colors);
    const overridePreset = themePalette(overrideTheme);
    personaAppearance[personaId] = {
      enabled: bool(item.enabled, false),
      theme: overrideTheme,
      colors: {
        accent: safeColor(overrideColors.accent, overridePreset.accent),
        bezel: safeColor(overrideColors.bezel, overridePreset.bezel),
        background: safeColor(overrideColors.background, overridePreset.background),
        surface: safeColor(overrideColors.surface, overridePreset.surface),
        text: safeColor(overrideColors.text, overridePreset.text),
        wallpaperPrimary: safeColor(overrideColors.wallpaperPrimary, overridePreset.wallpaperPrimary),
        wallpaperSecondary: safeColor(overrideColors.wallpaperSecondary, overridePreset.wallpaperSecondary),
        chatPrimary: safeColor(overrideColors.chatPrimary, overridePreset.chatPrimary),
        chatSecondary: safeColor(overrideColors.chatSecondary, overridePreset.chatSecondary)
      },
      customCss: text(item.customCss, "", 30000),
      homeWallpaper: normalizeWallpaper(item.homeWallpaper, text(item.wallpaperImageUrl, "", 2000)),
      chatWallpaper: normalizeWallpaper(item.chatWallpaper, text(item.chatWallpaperImageUrl, "", 2000))
    };
  }
  const contextMode = raw.roleplayContextMode === "off" || raw.roleplayContextMode === "recent" || raw.roleplayContextMode === "story" ? raw.roleplayContextMode : "smart";
  return {
    version: PREFERENCES_VERSION,
    theme,
    colors: palette,
    homeWallpaper: normalizeWallpaper(raw.homeWallpaper, text(raw.wallpaperImageUrl, "", 2000)),
    chatWallpaper: normalizeWallpaper(raw.chatWallpaper, text(raw.chatWallpaperImageUrl, "", 2000)),
    handsetScale: numberIn(raw.handsetScale, fallback.handsetScale, 0.8, 1.25),
    uiScale: numberIn(raw.uiScale, fallback.uiScale, 0.7, 1.3),
    animation: allowedAnimations.has(String(raw.animation)) ? raw.animation : fallback.animation,
    animationDurationMs: Math.round(numberIn(raw.animationDurationMs, fallback.animationDurationMs, 0, 700)),
    reducedMotion: bool(raw.reducedMotion, fallback.reducedMotion),
    autoOpenOnModelAction: bool(raw.autoOpenOnModelAction, fallback.autoOpenOnModelAction),
    pushNotifications: bool(raw.pushNotifications, fallback.pushNotifications),
    useSwarmProfile: bool(raw.useSwarmProfile, fallback.useSwarmProfile),
    sceneEnhancer: bool(raw.sceneEnhancer, fallback.sceneEnhancer),
    generationMode: raw.generationMode === "sidecar" ? "sidecar" : "roleplay",
    sidecarConnectionId: text(raw.sidecarConnectionId, "", 180),
    sidecarModelOverride: text(raw.sidecarModelOverride, "", 500),
    autoReplyAfterSend: bool(raw.autoReplyAfterSend, fallback.autoReplyAfterSend),
    replyCadence: raw.replyCadence === "instant" || raw.replyCadence === "quick" || raw.replyCadence === "relaxed" ? raw.replyCadence : "natural",
    ambientMessaging: raw.ambientMessaging === "sparse" || raw.ambientMessaging === "normal" ? raw.ambientMessaging : "off",
    roleplayContextMode: contextMode,
    recentRoleplayMessages: Math.round(numberIn(raw.recentRoleplayMessages, fallback.recentRoleplayMessages, 0, 20)),
    notificationSounds: bool(raw.notificationSounds, fallback.notificationSounds),
    notificationPreviews: bool(raw.notificationPreviews, fallback.notificationPreviews),
    notifyMessages: bool(raw.notifyMessages, fallback.notifyMessages),
    notifyContacts: bool(raw.notifyContacts, fallback.notifyContacts),
    notifyTrackers: bool(raw.notifyTrackers, fallback.notifyTrackers),
    customCss: text(raw.customCss, "", 30000),
    personaAppearance,
    generationHistory: history,
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
    identityBrief: (contact.identityBrief || contact.description || "").slice(0, 360),
    sceneNote: (contact.sceneNote || "").slice(0, 240)
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
var APPS = new Set(["home", "messages", "contacts", "gallery", "camera", "notes", "weather", "calendar", "trackers", "notifications", "settings"]);
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
  if (app === "camera" || app === "weather" || app === "notifications" || app === "home")
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
function contactAccent(contact) {
  return contact.colorMode === "source" && contact.sourceAccent ? contact.sourceAccent : contact.accent;
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
  const identityBrief = clean2(value.identityBrief, 1200) || clean2(value.description, 1200) || clean2(value.subtitle, 160);
  const description = identityBrief;
  const source = normalizeSource(value.source, contactId, context.characterId, description);
  const presence = record3(value.presence) ? value.presence : {};
  const contextPolicy = record3(value.contextPolicy) ? value.contextPolicy : {};
  const generationPolicy = record3(value.generationPolicy) ? value.generationPolicy : {};
  const messagingPolicy = record3(value.messagingPolicy) ? value.messagingPolicy : {};
  const createdAt = timestamp(value.createdAt, context.now);
  return {
    id: contactId,
    name,
    role: clean2(value.role, 120) || clean2(value.subtitle, 120) || (source.kind === "character" ? "Character" : source.kind === "council" ? "Council member" : "Pocket NPC"),
    description,
    identityBrief,
    sceneNote: clean2(value.sceneNote, 600),
    avatarUrl: clean2(value.avatarUrl, 2000),
    sourceAvatarUrl: clean2(value.sourceAvatarUrl, 2000) || clean2(value.avatarUrl, 2000),
    avatarOverrideUrl: clean2(value.avatarOverrideUrl, 2000),
    accent: /^#[0-9a-f]{6}$/i.test(clean2(value.accent, 20)) ? clean2(value.accent, 20) : stableContactAccent(contactId),
    sourceAccent: /^#[0-9a-f]{6}$/i.test(clean2(value.sourceAccent, 20)) ? clean2(value.sourceAccent, 20) : "",
    colorMode: value.colorMode === "source" ? "source" : "pocket",
    source,
    presence: {
      inScene: flag(presence.inScene, false),
      lastSceneAt: timestamp(presence.lastSceneAt, "")
    },
    contextPolicy: { pinned: flag(contextPolicy.pinned) },
    generationPolicy: { relevant: flag(generationPolicy.relevant, true) },
    messagingPolicy: {
      remoteEligible: flag(messagingPolicy.remoteEligible, true),
      allowAmbientInScene: flag(messagingPolicy.allowAmbientInScene, false),
      lastInitiatedMessageAt: timestamp(messagingPolicy.lastInitiatedMessageAt, ""),
      lastInitiatedRoleplayAt: timestamp(messagingPolicy.lastInitiatedRoleplayAt, "")
    },
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
  const generation = record3(value.generation) ? value.generation : null;
  const info = generation && record3(generation.info) ? generation.info : null;
  const decision = info && record3(info.replyDecision) ? info.replyDecision : null;
  const count = (input) => Math.max(0, Math.round(Number(input) || 0));
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
    imageUrl: clean2(value.imageUrl, 2000) || undefined,
    generation: generation && clean2(generation.requestId, 180) ? {
      requestId: clean2(generation.requestId, 180),
      retryOf: clean2(generation.retryOf, 180) || undefined,
      info: info ? {
        speaker: clean2(info.speaker, 120),
        source: clean2(info.source, 240),
        sourceId: clean2(info.sourceId, 180),
        sourceResolution: info.sourceResolution === "resolved" || info.sourceResolution === "manual" ? info.sourceResolution : "snapshot",
        activeCharacterId: clean2(info.activeCharacterId, 180),
        activeCharacterUsed: flag(info.activeCharacterUsed),
        identityChars: count(info.identityChars),
        sceneSnapshotStale: flag(info.sceneSnapshotStale, true),
        contextMode: info.contextMode === "off" || info.contextMode === "recent" || info.contextMode === "story" ? info.contextMode : "smart",
        recentCount: count(info.recentCount),
        recentChars: count(info.recentChars),
        storyCount: count(info.storyCount),
        storyChars: count(info.storyChars),
        threadCount: count(info.threadCount),
        threadChars: count(info.threadChars),
        generationMode: info.generationMode === "sidecar" ? "sidecar" : "roleplay",
        connectionName: clean2(info.connectionName, 180),
        model: clean2(info.model, 500),
        replyDecision: decision ? {
          rawAction: decision.rawAction === "reply" || decision.rawAction === "pause" || decision.rawAction === "handoff" ? decision.rawAction : "none",
          normalizedAction: decision.normalizedAction === "reply" || decision.normalizedAction === "pause" || decision.normalizedAction === "handoff" ? decision.normalizedAction : "none",
          reason: clean2(decision.reason, 80),
          normalizationReason: clean2(decision.normalizationReason, 180)
        } : undefined
      } : undefined
    } : undefined
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
  const pauseValue = record3(value.pause) ? value.pause : null;
  const pauseReasons = new Set(["ended", "busy", "away", "sleeping", "unknown"]);
  const legacyArriving = pauseValue?.reason === "arriving";
  const pauseReason = pauseReasons.has(pauseValue?.reason) ? pauseValue?.reason : null;
  const availabilityValue = record3(value.availability) ? value.availability : null;
  const localReasons = new Set(["in_scene", "arrived", "took_action", "continued_in_person"]);
  const migratedLocalReason = availabilityValue?.reason === "arriving" ? "arrived" : localReasons.has(availabilityValue?.reason) ? availabilityValue?.reason : null;
  const resumePauseReason = pauseReasons.has(availabilityValue?.resumePauseReason) ? availabilityValue?.resumePauseReason : undefined;
  const availability = availabilityValue?.state === "local" && migratedLocalReason ? resumePauseReason ? { state: "local", reason: migratedLocalReason, resumePauseReason } : { state: "local", reason: migratedLocalReason } : availabilityValue?.state === "arriving" || legacyArriving ? { state: "arriving" } : availabilityValue?.state === "paused" && pauseReasons.has(availabilityValue.reason) ? { state: "paused", reason: availabilityValue.reason } : pauseReason ? { state: "paused", reason: pauseReason } : { state: "remote" };
  const burstValue = record3(value.outgoingBurst) ? value.outgoingBurst : null;
  const burstId = clean2(burstValue?.id, 180);
  const rawTail = value.tailSnapshot && typeof value.tailSnapshot === "object" && !Array.isArray(value.tailSnapshot) ? value.tailSnapshot : value.snapshot && typeof value.snapshot === "object" && !Array.isArray(value.snapshot) ? value.snapshot : null;
  return {
    id: clean2(value.id, 180) || makeId("conversation"),
    kind,
    title: clean2(value.title, 120) || (kind === "direct" ? fallback?.name || "Conversation" : participantContactIds.map((entry) => contacts.find((contact) => contact.id === entry)?.name).filter(Boolean).join(", ").slice(0, 120) || "Group"),
    participantContactIds,
    messages,
    unread: Math.max(0, Math.min(999, Math.floor(Number(value.unread) || messages.filter((entry) => entry.sender === "contact" && !entry.read).length))),
    pause: pauseReason ? {
      reason: pauseReason,
      createdAt: timestamp(pauseValue?.createdAt, now),
      source: pauseValue?.source === "scene" ? "scene" : "model"
    } : undefined,
    availability,
    tailSnapshot: rawTail ? {
      text: clean2(rawTail.text ?? rawTail.summary, 2400),
      recentMessageIds: (Array.isArray(rawTail.recentMessageIds) ? rawTail.recentMessageIds : []).map((entry) => clean2(entry, 180)).filter(Boolean).slice(-8),
      updatedAt: timestamp(rawTail.updatedAt, now)
    } : undefined,
    lastDecision: record3(value.lastDecision) ? {
      rawAction: value.lastDecision.rawAction === "reply" || value.lastDecision.rawAction === "pause" || value.lastDecision.rawAction === "handoff" ? value.lastDecision.rawAction : "none",
      normalizedAction: value.lastDecision.normalizedAction === "reply" || value.lastDecision.normalizedAction === "pause" || value.lastDecision.normalizedAction === "handoff" ? value.lastDecision.normalizedAction : "none",
      reason: clean2(value.lastDecision.reason, 80),
      normalizationReason: clean2(value.lastDecision.normalizationReason, 180),
      contactInScene: flag(value.lastDecision.contactInScene),
      remoteEligible: flag(value.lastDecision.remoteEligible, true),
      explicitRemoteOverride: flag(value.lastDecision.explicitRemoteOverride),
      createdAt: timestamp(value.lastDecision.createdAt, now),
      burstId: clean2(value.lastDecision.burstId, 180) || undefined,
      relayId: clean2(value.lastDecision.relayId, 180) || undefined
    } : undefined,
    outgoingBurst: burstId ? {
      id: burstId,
      messageIds: (Array.isArray(burstValue?.messageIds) ? burstValue.messageIds : []).map((entry) => clean2(entry, 180)).filter(Boolean).slice(-12),
      open: flag(burstValue?.open, false),
      held: flag(burstValue?.held, false),
      finalized: flag(burstValue?.finalized, false),
      explicitRemoteOverride: flag(burstValue?.explicitRemoteOverride, false),
      updatedAt: timestamp(burstValue?.updatedAt, now)
    } : undefined,
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
    identityBrief: "",
    sceneNote: "",
    avatarUrl: "",
    sourceAvatarUrl: "",
    avatarOverrideUrl: "",
    accent: stableContactAccent(contactId),
    sourceAccent: "",
    colorMode: "pocket",
    source: { kind: "character", characterId: contactId },
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
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
    availability: { state: "remote" },
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

// src/domain/notifications.ts
function routesShareDestination(leftInput, rightInput) {
  const left = normalizePocketRoute(leftInput);
  const right = normalizePocketRoute(rightInput);
  if (left.app !== right.app)
    return false;
  if (left.app === "messages" && right.app === "messages") {
    return Boolean(left.conversationId && right.conversationId && left.conversationId === right.conversationId);
  }
  if (left.app === "trackers" && right.app === "trackers") {
    return Boolean(left.trackerId && right.trackerId && left.trackerId === right.trackerId);
  }
  return left.app !== "home" && left.app !== "notifications";
}
function destinationIsVisible(open, current, target) {
  return Boolean(open && current && routesShareDestination(current, target));
}
function markNotificationRead(notifications, notificationId) {
  const entry = notifications.find((item) => item.id === notificationId);
  if (entry)
    entry.read = true;
}
function dismissNotification(notifications, notificationId, at) {
  const entry = notifications.find((item) => item.id === notificationId);
  if (entry)
    entry.dismissedAt = at;
}
function clearNotifications(notifications, mode, at) {
  for (const entry of notifications) {
    if (!entry.dismissedAt && (mode === "all" || entry.read))
      entry.dismissedAt = at;
  }
}

// src/domain/messaging.ts
function ambientEligibleContacts(contacts) {
  return contacts.filter((contact) => contact.messagingPolicy.remoteEligible && (!contact.presence.inScene || contact.messagingPolicy.allowAmbientInScene));
}
function contactCooldownReady(contact, frequency, roleplayNow, wallNow = Date.now()) {
  const wallCooldown = frequency === "sparse" ? 60 * 60000 : 15 * 60000;
  const roleplayCooldown = frequency === "sparse" ? 6 * 60 * 60000 : 2 * 60 * 60000;
  const lastWall = Date.parse(contact.messagingPolicy.lastInitiatedMessageAt);
  if (Number.isFinite(lastWall) && wallNow - lastWall < wallCooldown)
    return false;
  const currentRoleplay = Date.parse(roleplayNow);
  const lastRoleplay = Date.parse(contact.messagingPolicy.lastInitiatedRoleplayAt);
  if (Number.isFinite(currentRoleplay) && Number.isFinite(lastRoleplay) && currentRoleplay >= lastRoleplay && currentRoleplay - lastRoleplay < roleplayCooldown)
    return false;
  return true;
}
function shouldTakeAmbientOpportunity(frequency, random = Math.random()) {
  if (frequency === "off")
    return false;
  return random < (frequency === "sparse" ? 0.18 : 0.42);
}

// src/backend/generation.ts
var historyLocks = new Map;
function compactError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/\b(?:sk-|key-|Bearer\s+)[A-Za-z0-9._-]{8,}\b/gi, "[redacted]").replace(/\s+/g, " ").trim().slice(0, 500) || "Generation failed";
}
function summary(connection) {
  return {
    id: String(connection?.id || ""),
    name: String(connection?.name || connection?.provider || "Connection"),
    provider: String(connection?.provider || ""),
    model: String(connection?.model || ""),
    isDefault: Boolean(connection?.is_default),
    configured: Boolean(connection?.has_api_key)
  };
}
async function inspectPocketGeneration(host, preferences, userId) {
  if (!host.spindle.permissions.has("generation"))
    return { mode: preferences.generationMode, effective: null, connections: [], history: preferences.generationHistory, modelOverride: preferences.sidecarModelOverride };
  const connections = (await host.spindle.connections.list(userId)).map(summary);
  const effective = preferences.generationMode === "sidecar" ? connections.find((entry) => entry.id === preferences.sidecarConnectionId) || null : connections.find((entry) => entry.isDefault) || connections[0] || null;
  return { mode: preferences.generationMode, effective, connections, history: preferences.generationHistory, modelOverride: preferences.sidecarModelOverride };
}
async function writeRun(host, run, userId) {
  const key = userId || "_default";
  const previous = historyLocks.get(key) || Promise.resolve(null);
  const current = previous.catch(() => null).then(async () => {
    const latest = await host.loadPreferences(userId);
    const history = latest.generationHistory.filter((entry) => entry.requestId !== run.requestId);
    history.push(run);
    latest.generationHistory = history.slice(-24);
    return host.savePreferences(latest, userId);
  });
  historyLocks.set(key, current);
  try {
    return await current;
  } finally {
    if (historyLocks.get(key) === current)
      historyLocks.delete(key);
  }
}
async function runPocketGeneration(host, task, requestId, input, userId) {
  const preferences = await host.loadPreferences(userId);
  const info = await inspectPocketGeneration(host, preferences, userId);
  if (!info.effective)
    throw new Error(preferences.generationMode === "sidecar" ? "The selected Pocket sidecar connection is unavailable." : "No active roleplay generation connection is configured.");
  const startedAt = new Date().toISOString();
  const run = {
    requestId,
    task,
    mode: preferences.generationMode,
    connectionId: info.effective.id,
    connectionName: info.effective.name,
    provider: info.effective.provider,
    model: preferences.sidecarModelOverride || info.effective.model,
    status: "started",
    startedAt
  };
  await writeRun(host, run, userId);
  host.send({ type: "lumiphone:generation_status", run }, userId);
  const started = Date.now();
  try {
    const request = { ...input };
    if (preferences.generationMode === "sidecar") {
      request.connection_id = info.effective.id;
      if (preferences.sidecarModelOverride)
        request.parameters = { ...request.parameters || {}, model: preferences.sidecarModelOverride };
    }
    const result = await host.spindle.generate.quiet(request);
    const completed = { ...run, status: "completed", completedAt: new Date().toISOString(), latencyMs: Date.now() - started };
    await writeRun(host, completed, userId);
    host.send({ type: "lumiphone:generation_status", run: completed }, userId);
    return result;
  } catch (error) {
    const failed = { ...run, status: "failed", completedAt: new Date().toISOString(), latencyMs: Date.now() - started, error: compactError(error) };
    await writeRun(host, failed, userId);
    host.send({ type: "lumiphone:generation_status", run: failed }, userId);
    throw error;
  }
}

// src/backend/structured.ts
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Generation returned an invalid JSON object.");
  return value;
}
function fencedBody(value) {
  const match = value.match(/^```(?:json)?[\t ]*\r?\n([\s\S]*?)\r?\n```$/i);
  return match ? match[1].trim() : null;
}
function firstCompleteObject(value) {
  const start = value.indexOf("{");
  if (start < 0)
    return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start;index < value.length; index += 1) {
    const char = value[index];
    if (quoted) {
      if (escaped)
        escaped = false;
      else if (char === "\\")
        escaped = true;
      else if (char === '"')
        quoted = false;
      continue;
    }
    if (char === '"')
      quoted = true;
    else if (char === "{")
      depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0)
        return value.slice(start, index + 1);
    }
  }
  return null;
}
function parseGeneratedObject(content) {
  const raw = typeof content === "string" ? content.trim().slice(0, 30000) : "";
  if (!raw)
    throw new Error("Generation returned an empty response.");
  const fenced = fencedBody(raw);
  if (fenced !== null)
    return object(JSON.parse(fenced));
  try {
    return object(JSON.parse(raw));
  } catch (directError) {
    const extracted = firstCompleteObject(raw);
    if (extracted)
      return object(JSON.parse(extracted));
    throw directError;
  }
}
function looksTruncated(content) {
  const raw = typeof content === "string" ? content.trim() : "";
  if (!raw)
    return true;
  if (raw.startsWith("```") && !raw.endsWith("```"))
    return true;
  let braces = 0;
  let quoted = false;
  let escaped = false;
  for (const char of raw) {
    if (quoted) {
      if (escaped)
        escaped = false;
      else if (char === "\\")
        escaped = true;
      else if (char === '"')
        quoted = false;
      continue;
    }
    if (char === '"')
      quoted = true;
    else if (char === "{")
      braces += 1;
    else if (char === "}")
      braces -= 1;
  }
  return quoted || braces > 0;
}
async function parseWithTruncationRetry(content, retry) {
  try {
    return parseGeneratedObject(content);
  } catch (error) {
    if (!looksTruncated(content))
      throw error;
    return parseGeneratedObject(await retry());
  }
}

// src/backend/roleplay-context.ts
var BUDGETS = { actor: 1200, scene: 1800, thread: 6000, recent: 3200, story: 2400, total: 10500 };
function clean3(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function messageIndex(message, fallback) {
  const parsed = Number(message.index_in_chat);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function storyLines(state, contact) {
  const name = contact.name.toLocaleLowerCase();
  const events = state.events.filter((event) => !event.completed && `${event.title} ${event.description}`.toLocaleLowerCase().includes(name)).slice(0, 3);
  const trackers = state.trackers.filter((tracker) => tracker.visibleToModel && (`${tracker.target.id} ${tracker.target.label}`.includes(contact.id) || `${tracker.target.label}`.toLocaleLowerCase().includes(name))).slice(0, 4);
  const notes = state.notes.filter((note) => note.pinned).slice(0, 2);
  return [
    `Roleplay time: ${state.roleplayNow}`,
    `Scene: ${state.weather.location}; ${state.weather.condition}.`,
    ...events.map((entry) => `Timeline: ${entry.whenText}: ${entry.title}`),
    ...trackers.map((entry) => `Tracker: ${entry.label}=${entry.kind === "state" ? entry.state : entry.value}`),
    ...notes.map((entry) => `Pinned note: ${entry.title}: ${entry.body.slice(0, 180)}`)
  ];
}
function sceneLines(state) {
  const snapshot = state.sceneSnapshot;
  if (!snapshot)
    return [];
  return snapshot.actors.slice(0, 8).map((actor) => {
    const contact = state.contacts.find((entry) => entry.id === actor.contactId);
    return `${contact?.name || actor.contactId}${actor.roleHint ? ` (${actor.roleHint})` : ""}${actor.sceneBrief ? ` \u2014 ${actor.sceneBrief}` : ""}`;
  });
}
function trimBlock(lines, budget) {
  return lines.filter(Boolean).join(`
`).slice(0, budget);
}
async function assemblePocketContext(options) {
  const { state, contact, conversation, preferences } = options;
  const mode = preferences.roleplayContextMode;
  const hostMessages = options.getMessages ? await options.getMessages().catch(() => []) : [];
  const authoritative = hostMessages.at(-1);
  const authoritativeLatest = authoritative ? {
    id: clean3(authoritative.id, 180),
    index: messageIndex(authoritative, hostMessages.length - 1),
    excerpt: clean3(authoritative.content, 180)
  } : { id: "", index: -1, excerpt: "" };
  const actorIdentity = clean3(options.actorIdentity || contact.identityBrief || contact.description, BUDGETS.actor);
  const scene = trimBlock(sceneLines(state), BUDGETS.scene);
  const threadLines = conversation.messages.slice(-20).map((message) => `${message.sender === "persona" ? state.pocketPersona.displayName || "You" : message.senderName || "Pocket"}: ${clean3(message.text, 520)}`);
  const thread = trimBlock(threadLines, BUDGETS.thread);
  const wantsRecent = mode === "recent" || mode === "smart" && (conversation.messages.length > 0 || contact.presence.inScene || Boolean(contact.sceneNote));
  const selectedRecent = mode !== "off" && wantsRecent && preferences.recentRoleplayMessages > 0 ? hostMessages.slice(-preferences.recentRoleplayMessages) : [];
  const recentLines = selectedRecent.map((message, index) => {
    const role = message.role === "user" ? "User" : message.role === "assistant" ? "Character" : "System";
    const anchor = clean3(message.id, 180);
    const source = anchor ? ` [${anchor} #${messageIndex(message, hostMessages.length - selectedRecent.length + index)}]` : "";
    return `${role}${source}: ${clean3(message.content, 520)}`;
  }).filter((line) => !line.endsWith(": "));
  const recent = trimBlock(recentLines, BUDGETS.recent);
  const includedMessage = selectedRecent.at(-1);
  const includedLatest = includedMessage ? {
    id: clean3(includedMessage.id, 180),
    index: messageIndex(includedMessage, hostMessages.length - 1),
    excerpt: clean3(includedMessage.content, 180)
  } : { id: "", index: -1, excerpt: "" };
  const storySource = mode === "story" || mode === "smart" ? storyLines(state, contact) : [];
  const story = trimBlock(storySource, BUDGETS.story);
  const parts = [
    actorIdentity ? `ACTOR IDENTITY
${actorIdentity}` : "",
    scene ? `SCENE SNAPSHOT${state.sceneSnapshot?.stale ? " (STALE)" : ""}
${scene}` : "",
    recent ? `RECENT ROLEPLAY
${recent}` : "",
    story ? `STORY CONTEXT
${story}` : "",
    thread ? `PHONE THREAD
${thread}` : ""
  ].filter(Boolean);
  const finalText = (mode === "off" ? [actorIdentity ? `ACTOR IDENTITY
${actorIdentity}` : "", thread ? `PHONE THREAD
${thread}` : ""].filter(Boolean).join(`

`) : parts.join(`

`)).slice(0, BUDGETS.total);
  const latestMismatch = Boolean(authoritativeLatest.id && (!includedLatest.id || authoritativeLatest.id !== includedLatest.id));
  const freshnessWarning = mode === "story" || mode === "off" || !wantsRecent ? "" : latestMismatch ? "The latest committed roleplay message is not included in the selected recent-context window." : "";
  return {
    text: finalText,
    diagnostics: {
      mode,
      actorIdentityChars: actorIdentity.length,
      sceneSnapshot: { stale: state.sceneSnapshot?.stale ?? true, capturedAt: state.sceneSnapshot?.capturedAt || "", sourceMessageId: state.sceneSnapshot?.sourceMessageId || "", sourceMessageIndex: state.sceneSnapshot?.sourceMessageIndex ?? -1, chars: scene.length },
      phoneThread: { count: threadLines.length, chars: thread.length, budget: BUDGETS.thread },
      recentRoleplay: { count: recentLines.length, chars: recent.length, budget: BUDGETS.recent, latestMessageId: includedLatest.id },
      story: { count: storySource.length, chars: story.length, budget: BUDGETS.story },
      totalChars: finalText.length,
      estimatedTokens: Math.ceil(finalText.length / 4),
      authoritativeLatest,
      includedLatest,
      freshnessWarning,
      assembled: finalText
    }
  };
}

// src/backend/continuity.ts
var PAUSE_REASONS = new Set(["ended", "busy", "away", "sleeping", "unknown"]);
var LOCAL_REASONS = new Set(["in_scene", "arrived", "took_action", "continued_in_person"]);
function compact(value, max) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}
function conversationTailSnapshot(conversation, createdAt) {
  const recent = conversation.messages.slice(-6);
  return {
    text: recent.map((message) => `${message.senderName}: ${compact(message.text, 360)}`).join(`
`).slice(0, 2400),
    recentMessageIds: recent.map((message) => message.id),
    updatedAt: createdAt
  };
}
function normalizeReplyDecision(input) {
  const candidate = String(input.rawAction || "").toLowerCase();
  const rawAction = candidate === "reply" || candidate === "pause" || candidate === "handoff" ? candidate : "none";
  const rawReason = String(input.rawReason || "").toLowerCase();
  const impossibleRemote = !input.explicitRemoteOverride && (input.contact.presence.inScene || input.conversation.availability.state === "local");
  if (impossibleRemote) {
    return {
      rawAction,
      normalizedAction: "handoff",
      reason: LOCAL_REASONS.has(rawReason) ? rawReason : input.contact.presence.inScene ? "in_scene" : "continued_in_person",
      normalizationReason: rawAction === "handoff" ? "deterministic_local_channel" : `normalized_${rawAction}_because_actor_is_local`,
      contactInScene: input.contact.presence.inScene,
      remoteEligible: input.contact.messagingPolicy.remoteEligible,
      explicitRemoteOverride: false,
      createdAt: input.createdAt,
      burstId: input.burstId
    };
  }
  if (rawAction === "pause") {
    return {
      rawAction,
      normalizedAction: "pause",
      reason: PAUSE_REASONS.has(rawReason) ? rawReason : "unknown",
      normalizationReason: "",
      contactInScene: input.contact.presence.inScene,
      remoteEligible: input.contact.messagingPolicy.remoteEligible,
      explicitRemoteOverride: input.explicitRemoteOverride,
      createdAt: input.createdAt,
      burstId: input.burstId
    };
  }
  if (rawAction === "handoff") {
    return {
      rawAction,
      normalizedAction: "handoff",
      reason: rawReason === "arriving" ? "arriving" : LOCAL_REASONS.has(rawReason) ? rawReason : "continued_in_person",
      normalizationReason: "",
      contactInScene: input.contact.presence.inScene,
      remoteEligible: input.contact.messagingPolicy.remoteEligible,
      explicitRemoteOverride: input.explicitRemoteOverride,
      createdAt: input.createdAt,
      burstId: input.burstId
    };
  }
  return {
    rawAction,
    normalizedAction: rawAction,
    reason: "",
    normalizationReason: "",
    contactInScene: input.contact.presence.inScene,
    remoteEligible: input.contact.messagingPolicy.remoteEligible,
    explicitRemoteOverride: input.explicitRemoteOverride,
    createdAt: input.createdAt,
    burstId: input.burstId
  };
}
function pendingRelayContext(state, options = {}) {
  const maxChars = Math.max(600, Math.min(6000, options.maxChars || 3600));
  const pending = options.relayId ? state.relays.filter((relay) => relay.status === "pending" && relay.id === options.relayId).slice(-1) : [];
  if (!pending.length)
    return "";
  return pending.map((relay) => {
    const contact = state.contacts.find((entry) => entry.id === relay.contactId);
    return [
      "POCKET CONTINUITY RELAY (newer than older scene summaries)",
      `Actor: ${contact?.name || relay.contactId}`,
      `Channel transition: phone -> in-person (${relay.reason})`,
      `Conversation tail:
${relay.conversationTail.text}`,
      "Continue the physical roleplay from this handoff. Do not generate another remote phone reply unless the user explicitly texts from the scene.",
      `Relay provenance: ${relay.id}`
    ].join(`
`);
  }).join(`

`).slice(0, maxChars);
}
function relayIdFromMessages(messages) {
  for (const message of [...messages].reverse()) {
    const metadata = message.sourceMessageMetadata || message.__sourceMessageMetadata;
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
      continue;
    const value = metadata;
    if (value.pocketContinuation !== true || typeof value.pocketRelayId !== "string")
      continue;
    return value.pocketRelayId.slice(0, 180);
  }
  return "";
}
function relayLatestExchange(conversation) {
  return conversation.messages.slice(-3).map((message) => `${message.senderName}: ${compact(message.text, 520)}`).join(`
`).slice(0, 1800);
}
function relayForGeneration(state, generationId) {
  return state.relays.find((relay) => relay.status === "pending" && relay.continuation.generationId === generationId);
}

// src/backend/image-sources.ts
var URL_CACHE_PATH = "device/pocket-image-url-cache.json";
var SOURCE_LABELS = {
  gallery: "Lumiverse Gallery",
  asset: "Uploaded asset",
  url: "Image URL"
};
function empty() {
  return { url: "", status: "empty", sourceKind: "none", sourceLabel: "Theme gradient" };
}
function failure(source, error) {
  return {
    url: "",
    status: "error",
    sourceKind: source.kind,
    sourceLabel: SOURCE_LABELS[source.kind],
    error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500)
  };
}
async function getStoredImage(api, source, userId) {
  if (!api.permissions.has("images"))
    throw new Error("Images permission is required to resolve this image.");
  const imageId = source.kind === "gallery" ? source.imageId : source.assetId;
  const image = await api.images.get(imageId, {
    specificity: "full",
    onlyOwned: source.kind === "asset",
    userId
  });
  if (!image)
    throw new Error(source.kind === "asset" ? "The uploaded asset is missing or is not owned by Pocket." : "The Gallery image is missing.");
  if (!String(image.mime_type || "").toLowerCase().startsWith("image/"))
    throw new Error("The selected asset is not an image.");
  if (!image.url)
    throw new Error("Lumiverse did not return a renderable image URL.");
  return { url: image.url, status: "ready", sourceKind: source.kind, sourceLabel: SOURCE_LABELS[source.kind] };
}
async function loadUrlCache(api, userId) {
  const raw = await api.userStorage.getJson(URL_CACHE_PATH, { fallback: { version: 1, entries: [] }, userId });
  return {
    version: 1,
    entries: Array.isArray(raw?.entries) ? raw.entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object")
        return [];
      const value = entry;
      return typeof value.sourceUrl === "string" && typeof value.assetId === "string" ? [{ sourceUrl: value.sourceUrl.slice(0, 2000), assetId: value.assetId.slice(0, 180), updatedAt: String(value.updatedAt || "") }] : [];
    }).slice(-32) : []
  };
}
async function resolveRemoteUrl(api, source, userId) {
  if (source.url.startsWith("/"))
    return { url: source.url, status: "ready", sourceKind: "url", sourceLabel: SOURCE_LABELS.url };
  if (!/^https:\/\//i.test(source.url))
    throw new Error("Pocket image URLs must use HTTPS.");
  if (!api.permissions.has("images"))
    throw new Error("Images permission is required to cache a remote image safely.");
  if (!api.permissions.has("cors_proxy"))
    throw new Error("CORS Proxy permission is required to verify and cache a remote image.");
  const cache = await loadUrlCache(api, userId);
  const cached = [...cache.entries].reverse().find((entry2) => entry2.sourceUrl === source.url);
  if (cached) {
    const resolved2 = await getStoredImage(api, { kind: "asset", assetId: cached.assetId }, userId).catch(() => null);
    if (resolved2)
      return { ...resolved2, sourceKind: "url", sourceLabel: SOURCE_LABELS.url };
    cache.entries = cache.entries.filter((entry2) => entry2 !== cached);
  }
  const response = await api.cors(source.url, { method: "GET", responseType: "arraybuffer", mediaType: "image" });
  if (!response || Number(response.status) < 200 || Number(response.status) >= 300) {
    throw new Error(`Remote image returned ${response?.status || "an invalid response"}${response?.statusText ? ` ${response.statusText}` : ""}.`);
  }
  if (response.encoding !== "base64" || !response.body)
    throw new Error("Lumiverse could not read the remote image bytes.");
  const mimeType = Object.entries(response.headers || {}).find(([key]) => key.toLowerCase() === "content-type")?.[1]?.split(";")[0]?.trim() || "image/png";
  if (!mimeType.toLowerCase().startsWith("image/"))
    throw new Error(`Remote URL returned ${mimeType}, not an image.`);
  const uploaded = await api.images.uploadFromDataUrl(`data:${mimeType};base64,${response.body}`, {
    originalFilename: "pocket-remote-wallpaper",
    userId
  });
  if (!uploaded?.id)
    throw new Error("Lumiverse did not return an asset ID for the cached remote image.");
  const entry = { sourceUrl: source.url, assetId: uploaded.id, updatedAt: new Date().toISOString() };
  cache.entries = [...cache.entries.filter((item) => item.sourceUrl !== source.url), entry].slice(-32);
  await api.userStorage.setJson(URL_CACHE_PATH, cache, { indent: 2, userId });
  const resolved = await getStoredImage(api, { kind: "asset", assetId: uploaded.id }, userId);
  return { ...resolved, sourceKind: "url", sourceLabel: SOURCE_LABELS.url };
}
async function resolvePocketImageSource(api, source, userId) {
  if (!source)
    return empty();
  try {
    if (source.kind === "url")
      return await resolveRemoteUrl(api, source, userId);
    return await getStoredImage(api, source, userId);
  } catch (error) {
    return failure(source, error);
  }
}
function assertPocketImageResolved(result) {
  if (result.status !== "ready" || !result.url)
    throw new Error(result.error || "Pocket could not resolve that image.");
}

// src/backend.ts
var STATE_VERSION = 7;
var MAX_MESSAGES2 = 240;
var MAX_NOTIFICATIONS = 80;
var MAX_NOTES = 120;
var MAX_EVENTS = 200;
var MAX_TRACKERS = 40;
var MAX_ACTIVITIES = 120;
var stateLocks = new Map;
var cameraJobs = new Map;
var notificationThrottle = new Map;
var ambientFlights = new Set;
var replyDecisionFlights = new Set;
var replyBurstTimers = new Map;
var relayFlights = new Set;
var frontendViews = new Map;
var PHONE_GUIDANCE = `Pocket is available as an in-world phone shared with the current character. Use the registered phone_action tool when it is available. If tools are unavailable and a phone action materially belongs in the scene, emit exactly one hidden tag:
<lumi-phone action="message|contact|scene|note|event|weather|tracker|camera|notify|open" app="messages|contacts|notes|calendar|weather|trackers|camera|home" title="short title">content or compact JSON</lumi-phone>
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
function defaultPocketPersona(createdAt = nowIso()) {
  return { source: "lumiverse", linkedPersonaId: "", displayName: "You", pronouns: "", role: "Persona", identityBrief: "", avatarUrl: "", accent: "#8b7dff", canAppear: false, updatedAt: createdAt };
}
function normalizePocketPersona(value, fallback = defaultPocketPersona()) {
  const raw = isRecord(value) ? value : {};
  const source = raw.source === "manual" || raw.source === "generated" ? raw.source : "lumiverse";
  return {
    source,
    linkedPersonaId: text2(raw.linkedPersonaId, 180),
    displayName: text2(raw.displayName, 120) || fallback.displayName,
    pronouns: text2(raw.pronouns, 120),
    role: text2(raw.role, 120) || fallback.role,
    identityBrief: text2(raw.identityBrief, 1200),
    avatarUrl: text2(raw.avatarUrl, 2000),
    accent: /^#[0-9a-f]{6}$/i.test(text2(raw.accent, 20)) ? text2(raw.accent, 20) : fallback.accent,
    canAppear: bool2(raw.canAppear),
    updatedAt: text2(raw.updatedAt, 40) || fallback.updatedAt
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
    sceneSnapshot: null,
    pocketPersona: defaultPocketPersona(createdAt),
    setup: { initialized: false, dismissed: false },
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes: [],
    events: [],
    relays: [],
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
      completed: item.kind === "phone-handoff" ? true : bool2(item.completed),
      createdBy,
      kind: item.kind === "phone-handoff" ? "phone-handoff" : "event",
      actorContactIds: (Array.isArray(item.actorContactIds) ? item.actorContactIds : []).map((entry) => text2(entry, 180)).filter(Boolean).slice(0, 8),
      source: isRecord(item.source) && item.source.app === "messages" ? {
        app: "messages",
        conversationId: text2(item.source.conversationId, 180),
        relayId: text2(item.source.relayId, 180),
        messageId: text2(item.source.messageId, 180) || undefined
      } : undefined,
      channelTransition: isRecord(item.channelTransition) && item.channelTransition.to === "local" ? {
        from: item.channelTransition.from === "arriving" || item.channelTransition.from === "paused" ? item.channelTransition.from : "remote",
        to: "local",
        reason: item.channelTransition.reason === "arrived" || item.channelTransition.reason === "took_action" || item.channelTransition.reason === "continued_in_person" ? item.channelTransition.reason : "in_scene"
      } : undefined
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
      dismissedAt: text2(item.dismissedAt, 40) || undefined,
      source: item.source === "automatic" || item.source === "system" ? item.source : "model",
      severity: item.severity === "important" || item.severity === "error" ? item.severity : "info",
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
  const snapshotValue = isRecord(value.sceneSnapshot) ? value.sceneSnapshot : null;
  const sceneSnapshot = snapshotValue ? {
    actors: (Array.isArray(snapshotValue.actors) ? snapshotValue.actors : []).slice(0, 8).flatMap((entry) => {
      if (!isRecord(entry))
        return [];
      const contactId = text2(entry.contactId, 180);
      if (!contactId)
        return [];
      return [{ contactId, roleHint: text2(entry.roleHint, 120), sceneBrief: text2(entry.sceneBrief, 600) }];
    }),
    capturedAt: text2(snapshotValue.capturedAt, 40) || nowIso(),
    sourceMessageId: text2(snapshotValue.sourceMessageId, 180),
    sourceMessageIndex: Math.max(-1, Math.round(numberValue(snapshotValue.sourceMessageIndex, -1))),
    sourceRevision: Math.max(0, Math.round(numberValue(snapshotValue.sourceRevision, 0))),
    stale: bool2(snapshotValue.stale, true)
  } : null;
  const setupValue = isRecord(value.setup) ? value.setup : {};
  const relays = (Array.isArray(value.relays) ? value.relays : []).slice(-24).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const relayId = text2(item.id, 180);
    const contactId = text2(item.contactId, 180);
    const conversationId = text2(item.conversationId, 180);
    const tail = isRecord(item.conversationTail) ? item.conversationTail : isRecord(item.conversationSnapshot) ? item.conversationSnapshot : {};
    const continuation = isRecord(item.continuation) ? item.continuation : {};
    if (!relayId || !contactId || !conversationId)
      return [];
    const reason = item.reason === "arrived" || item.reason === "took_action" || item.reason === "continued_in_person" ? item.reason : "in_scene";
    const continuationState = continuation.state === "launching" || continuation.state === "accepted" || continuation.state === "started" || continuation.state === "completed" || continuation.state === "blocked" || continuation.state === "failed" || continuation.state === "stopped" ? continuation.state : continuation.state === "requested" ? "accepted" : "idle";
    return [{
      id: relayId,
      chatId,
      characterId,
      contactId,
      conversationId,
      reason,
      actorState: reason,
      burstId: text2(item.burstId, 180) || undefined,
      conversationTail: {
        text: text2(tail.text ?? tail.summary, 2400),
        recentMessageIds: (Array.isArray(tail.recentMessageIds) ? tail.recentMessageIds : []).map((entry) => text2(entry, 180)).filter(Boolean).slice(-8),
        updatedAt: text2(tail.updatedAt, 40) || nowIso()
      },
      latestExchange: text2(item.latestExchange, 1800),
      sourceMessageId: text2(item.sourceMessageId, 180) || undefined,
      timelineEventId: text2(item.timelineEventId, 180),
      createdAt: text2(item.createdAt, 40) || nowIso(),
      status: item.status === "consumed" || item.status === "dismissed" ? item.status : "pending",
      consumedAt: text2(item.consumedAt, 40) || undefined,
      consumedMessageId: text2(item.consumedMessageId, 180) || undefined,
      continuation: {
        state: continuationState,
        generationId: text2(continuation.generationId, 180) || undefined,
        invokedAt: text2(continuation.invokedAt ?? continuation.attemptedAt, 40) || undefined,
        permissionCheckedAt: text2(continuation.permissionCheckedAt, 40) || undefined,
        permissions: isRecord(continuation.permissions) ? {
          chatMutation: continuation.permissions.chatMutation === true,
          generation: continuation.permissions.generation === true
        } : undefined,
        method: continuation.method === "spindle.chat.appendMessage(triggerGeneration)" ? continuation.method : undefined,
        hostCallReturnedAt: text2(continuation.hostCallReturnedAt, 40) || undefined,
        hostAcceptedAt: text2(continuation.hostAcceptedAt, 40) || undefined,
        generationStartedAt: text2(continuation.generationStartedAt, 40) || undefined,
        sourceMessageId: text2(continuation.sourceMessageId, 180) || undefined,
        error: text2(continuation.error, 500) || undefined
      }
    }];
  });
  const hadPocketData = Number(value.version || 0) > 0 && (collections.contacts.length > 1 || collections.conversations.some((entry) => entry.messages.length > 0) || notes.length > 0 || events.length > 0 || trackers.length > 0);
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || text2(value.characterName, 120) || fallback.characterName,
    roleplayNow: text2(value.roleplayNow, 80) || fallback.roleplayNow,
    sceneSnapshot,
    pocketPersona: normalizePocketPersona(value.pocketPersona, fallback.pocketPersona),
    setup: { initialized: bool2(setupValue.initialized, hadPocketData), dismissed: bool2(setupValue.dismissed) },
    contacts: collections.contacts,
    conversations: collections.conversations,
    notes,
    events,
    relays,
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
async function resolveActivePocketPersona(userId) {
  if (!spindle.permissions.has("personas"))
    return null;
  try {
    const persona = await spindle.personas.getActive(userId);
    if (!persona)
      return null;
    let avatarUrl = "";
    if (persona.image_id && spindle.permissions.has("images")) {
      const image = await spindle.images.get(String(persona.image_id), { specificity: "sm", userId }).catch(() => null);
      avatarUrl = text2(image?.url, 2000);
    }
    const metadata = isRecord(persona.metadata) ? persona.metadata : {};
    return {
      source: "lumiverse",
      linkedPersonaId: text2(persona.id, 180),
      displayName: text2(persona.name, 120) || "You",
      pronouns: text2(metadata.pronouns, 120),
      role: text2(persona.title, 120) || text2(metadata.role, 120) || "Persona",
      identityBrief: text2(persona.description, 1200),
      avatarUrl,
      accent: /^#[0-9a-f]{6}$/i.test(text2(metadata.color ?? metadata.accent, 20)) ? text2(metadata.color ?? metadata.accent, 20) : "#8b7dff",
      canAppear: bool2(metadata.canAppear),
      updatedAt: nowIso()
    };
  } catch {
    return null;
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
  if (state.pocketPersona.source === "lumiverse") {
    const hostPersona = await resolveActivePocketPersona(userId);
    if (hostPersona) {
      const changed = JSON.stringify({ ...state.pocketPersona, updatedAt: "" }) !== JSON.stringify({ ...hostPersona, updatedAt: "" });
      state.pocketPersona = changed ? hostPersona : state.pocketPersona;
      stateChanged ||= changed;
    }
  }
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
    corsProxy: spindle.permissions.has("cors_proxy"),
    imageGen: spindle.permissions.has("image_gen"),
    panels: spindle.permissions.has("ui_panels"),
    push: spindle.permissions.has("push_notification"),
    sceneSync: spindle.permissions.has("chat_mutation")
  };
}
function send(payload, userId) {
  spindle.sendToFrontend(payload, userId);
}
async function resolveWallpaperUrls(preferences, personaId, userId) {
  const persona = personaId ? preferences.personaAppearance[personaId] : null;
  const [deviceHome, deviceChat, personaHome, personaChat] = await Promise.all([
    resolvePocketImageSource(spindle, preferences.homeWallpaper.source, userId),
    resolvePocketImageSource(spindle, preferences.chatWallpaper.source, userId),
    resolvePocketImageSource(spindle, persona?.enabled ? persona.homeWallpaper.source : null, userId),
    resolvePocketImageSource(spindle, persona?.enabled ? persona.chatWallpaper.source : null, userId)
  ]);
  return { deviceHome, deviceChat, personaHome, personaChat };
}
function assignWallpaper(preferences, payload, forcedSource) {
  const target = text2(payload.target, 40);
  const personaId = text2(payload.personaId, 180);
  const current = target === "persona-home" || target === "persona-chat" ? preferences.personaAppearance[personaId]?.[target === "persona-chat" ? "chatWallpaper" : "homeWallpaper"] : preferences[target === "device-chat" || target === "chat" ? "chatWallpaper" : "homeWallpaper"];
  if ((target === "persona-home" || target === "persona-chat") && (!personaId || !preferences.personaAppearance[personaId]))
    throw new Error("Enable a Persona appearance before assigning its wallpaper.");
  const raw = isRecord(payload.wallpaper) ? payload.wallpaper : {};
  const wallpaper = normalizeWallpaper({ ...current, ...raw, source: forcedSource === undefined ? raw.source ?? payload.source : forcedSource });
  if (target === "persona-home" || target === "persona-chat") {
    preferences.personaAppearance[personaId][target === "persona-chat" ? "chatWallpaper" : "homeWallpaper"] = wallpaper;
  } else
    preferences[target === "device-chat" || target === "chat" ? "chatWallpaper" : "homeWallpaper"] = wallpaper;
}
function imageSourceKey(source) {
  if (!source)
    return "";
  return source.kind === "gallery" ? `gallery:${source.imageId}` : source.kind === "asset" ? `asset:${source.assetId}` : `url:${source.url}`;
}
async function validateChangedWallpaperSources(existing, next, userId) {
  const pairs = [
    [existing.homeWallpaper.source, next.homeWallpaper.source],
    [existing.chatWallpaper.source, next.chatWallpaper.source]
  ];
  const personaIds = new Set([...Object.keys(existing.personaAppearance), ...Object.keys(next.personaAppearance)]);
  for (const personaId of personaIds) {
    pairs.push([existing.personaAppearance[personaId]?.homeWallpaper.source || null, next.personaAppearance[personaId]?.homeWallpaper.source || null], [existing.personaAppearance[personaId]?.chatWallpaper.source || null, next.personaAppearance[personaId]?.chatWallpaper.source || null]);
  }
  for (const [before, after] of pairs) {
    if (!after || imageSourceKey(before) === imageSourceKey(after))
      continue;
    assertPocketImageResolved(await resolvePocketImageSource(spindle, after, userId));
  }
}
async function sendState(state, userId, reason = "refresh", open = false) {
  const preferences = await loadPreferences(userId);
  let generation = { mode: preferences.generationMode, effective: null, connections: [], history: preferences.generationHistory, modelOverride: preferences.sidecarModelOverride };
  try {
    generation = await inspectPocketGeneration({ spindle, loadPreferences, savePreferences, send }, preferences, userId);
  } catch (error) {
    spindle.log.warn(`Pocket could not inspect generation profiles: ${error instanceof Error ? error.message : String(error)}`);
  }
  const swarmProfile = await resolveSwarmProfile(state.chatId, state.characterId, preferences, userId);
  let activePersona = null;
  if (spindle.permissions.has("personas")) {
    try {
      const persona = await spindle.personas.getActive(userId);
      if (persona)
        activePersona = { id: text2(persona.id, 180), name: text2(persona.name, 120) || "Persona" };
    } catch {}
  }
  const resolvedWallpapers = await resolveWallpaperUrls(preferences, activePersona?.id || "", userId);
  for (const [target, result] of Object.entries(resolvedWallpapers)) {
    if (result.status === "error")
      spindle.log.warn(`Pocket image resolution failed (${target}/${result.sourceKind}): ${result.error || "unknown error"}`);
  }
  send({ type: "lumiphone:state", state, preferences, resolvedWallpapers, capabilities: capabilities(), generation, swarmProfile, activePersona, reason, open }, userId);
}
function viewKey(userId) {
  return userId || "_default";
}
function currentView(userId) {
  const view = frontendViews.get(viewKey(userId));
  return view && Date.now() - view.updatedAt < 120000 ? view : null;
}
function notificationDestinationVisible(state, route, userId) {
  const view = currentView(userId);
  return Boolean(view && view.chatId === state.chatId && view.characterId === state.characterId && destinationIsVisible(view.open, view.route, route));
}
function addNotification(state, notification, userId) {
  const route = notification.route || { app: notification.app };
  if (notificationDestinationVisible(state, route, userId))
    return null;
  const entry = { ...notification, id: id("ntf"), createdAt: nowIso(), read: false };
  state.notifications.unshift(entry);
  state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
  return entry;
}
function sendNotification(notification, userId) {
  if (notification)
    send({ type: "lumiphone:notification", notification }, userId);
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
      const listed = await spindle.characters.list({ limit: 200, offset: 0, userId });
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
          accent: text2(character?.color ?? character?.accent ?? character?.metadata?.color, 20),
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
        accent: text2(member?.color ?? member?.accent, 20),
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
async function runStructuredGeneration(task, requestId, request, userId) {
  const first = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, task, requestId, request, userId);
  return parseWithTruncationRetry(first.content, async () => {
    const parameters = isRecord(request.parameters) ? request.parameters : {};
    const maxTokens = Math.min(1600, Math.max(80, Math.round(numberValue(parameters.max_tokens, 400) * 1.6)));
    const retry = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, task, `${requestId}:truncation-retry`, {
      ...request,
      parameters: { ...parameters, max_tokens: maxTokens }
    }, userId);
    return retry.content;
  });
}
function upsertContact(state, contact) {
  const sourceKey = contactSourceKey(contact.source);
  const existing = state.contacts.find((entry) => entry.id === contact.id || contact.source.kind !== "npc" && contactSourceKey(entry.source) === sourceKey || contact.source.kind === "npc" && entry.source.kind === "npc" && contact.source.sceneKey && entry.source.sceneKey === contact.source.sceneKey);
  if (existing) {
    const preserved = {
      createdAt: existing.createdAt,
      accent: existing.accent,
      contextPolicy: existing.contextPolicy,
      avatarOverrideUrl: existing.avatarOverrideUrl,
      colorMode: existing.colorMode,
      sourceAccent: contact.sourceAccent || existing.sourceAccent,
      generationPolicy: contact.generationPolicy || existing.generationPolicy,
      messagingPolicy: contact.messagingPolicy || existing.messagingPolicy
    };
    Object.assign(existing, contact, preserved, { updatedAt: nowIso() });
    return existing;
  }
  state.contacts.push(contact);
  state.contacts = state.contacts.slice(-80);
  return contact;
}
function reconcileContactAvailability(state, contact) {
  const conversation = state.conversations.find((entry) => entry.kind === "direct" && entry.participantContactIds[0] === contact.id);
  if (!conversation)
    return;
  if (contact.presence.inScene) {
    const prior = conversation.availability.state === "paused" ? conversation.availability.reason : undefined;
    const reason = conversation.availability.state === "arriving" ? "arrived" : "in_scene";
    conversation.availability = prior ? { state: "local", reason, resumePauseReason: prior } : { state: "local", reason };
  } else if (conversation.availability.state === "local") {
    conversation.availability = conversation.availability.resumePauseReason ? { state: "paused", reason: conversation.availability.resumePauseReason } : { state: "remote" };
    if (conversation.availability.state === "remote")
      conversation.pause = undefined;
  }
}
function commitConversationHandoff(state, conversation, contact, decision) {
  const createdAt = decision.createdAt;
  const reason = decision.reason === "arrived" || decision.reason === "took_action" || decision.reason === "continued_in_person" ? decision.reason : "in_scene";
  const previous = conversation.availability.state === "arriving" || conversation.availability.state === "paused" ? conversation.availability.state : "remote";
  const resumePauseReason = conversation.availability.state === "paused" ? conversation.availability.reason : undefined;
  conversation.availability = resumePauseReason ? { state: "local", reason, resumePauseReason } : { state: "local", reason };
  conversation.pause = undefined;
  conversation.tailSnapshot = conversationTailSnapshot(conversation, createdAt);
  const existing = state.relays.find((entry) => entry.status === "pending" && entry.conversationId === conversation.id && decision.burstId && entry.burstId === decision.burstId);
  if (existing) {
    decision.relayId = existing.id;
    conversation.lastDecision = decision;
    return existing;
  }
  const relayId = id("relay");
  const eventId = id("evt");
  const latestMessageId = conversation.messages.at(-1)?.id;
  const relay = {
    id: relayId,
    chatId: state.chatId,
    characterId: state.characterId,
    contactId: contact.id,
    conversationId: conversation.id,
    burstId: decision.burstId,
    reason,
    actorState: reason,
    conversationTail: conversation.tailSnapshot,
    latestExchange: relayLatestExchange(conversation),
    sourceMessageId: latestMessageId,
    timelineEventId: eventId,
    createdAt,
    status: "pending",
    continuation: { state: "idle" }
  };
  decision.relayId = relayId;
  conversation.lastDecision = decision;
  state.relays.push(relay);
  state.relays = state.relays.slice(-24);
  state.events.push({
    id: eventId,
    title: `${contact.name} continued in person`,
    description: relay.latestExchange,
    start: state.roleplayNow || createdAt,
    end: state.roleplayNow || createdAt,
    whenKind: "relative",
    whenText: "Now",
    color: contactAccent(contact),
    lane: "Phone handoffs",
    completed: true,
    createdBy: "model",
    kind: "phone-handoff",
    actorContactIds: [contact.id],
    source: { app: "messages", conversationId: conversation.id, relayId, messageId: latestMessageId },
    channelTransition: { from: previous, to: "local", reason }
  });
  state.events = state.events.slice(-MAX_EVENTS);
  addActivity(state, {
    kind: "timeline",
    title: `${contact.name} is here now`,
    summary: "Pocket handed the conversation back to the physical scene.",
    route: { app: "calendar", eventId },
    source: { contactId: contact.id, conversationId: conversation.id, eventId }
  });
  return relay;
}
async function requestRelayContinuation(chatId, characterId, relayId, userId) {
  const method = "spindle.chat.appendMessage(triggerGeneration)";
  const permissions = {
    chatMutation: spindle.permissions.has("chat_mutation"),
    generation: spindle.permissions.has("generation")
  };
  const invokedAt = nowIso();
  spindle.log.info(`Pocket relay continuation invoked: relay=${relayId} chat=${chatId} method=${method} chat_mutation=${permissions.chatMutation} generation=${permissions.generation}`);
  const flightKey = `${viewKey(userId)}:${chatId}`;
  if (relayFlights.has(flightKey))
    return;
  relayFlights.add(flightKey);
  try {
    const launch = await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId);
      const relay = state.relays.find((entry) => entry.id === relayId && entry.status === "pending");
      if (!relay || relay.continuation.state === "launching" || relay.continuation.state === "accepted" || relay.continuation.state === "started")
        return { proceed: false, error: "" };
      const missing = [!permissions.chatMutation ? "Chat mutation" : "", !permissions.generation ? "Generation" : ""].filter(Boolean);
      if (missing.length) {
        const error = `${missing.join(" and ")} permission${missing.length > 1 ? "s are" : " is"} required to continue in roleplay.`;
        relay.continuation = {
          state: "blocked",
          invokedAt,
          permissionCheckedAt: nowIso(),
          permissions,
          method,
          error
        };
        await saveState(state, userId);
        await sendState(state, userId, "relay_blocked");
        return { proceed: false, error };
      }
      relay.continuation = {
        state: "launching",
        invokedAt,
        permissionCheckedAt: nowIso(),
        permissions,
        method
      };
      await saveState(state, userId);
      await sendState(state, userId, "relay_launching");
      return { proceed: true, error: "" };
    });
    if (!launch.proceed) {
      if (launch.error)
        send({ type: "lumiphone:error", error: launch.error }, userId);
      return;
    }
    const appended = await spindle.chat.appendMessage(chatId, {
      role: "user",
      content: "Continue the current scene from the Pocket conversation handoff.",
      metadata: { source: "pocket", pocketRelayId: relayId, pocketContinuation: true }
    }, { triggerGeneration: true });
    await spindle.chat.setMessageHidden(chatId, appended.id, true).catch(() => {
      return;
    });
    const generationId = text2(appended.generationId, 180);
    if (!generationId)
      throw new Error(`Lumiverse returned from ${method} without a generation ID; the continuation was not accepted.`);
    const hostReturnedAt = nowIso();
    spindle.log.info(`Pocket relay host call accepted: relay=${relayId} generation=${generationId} message=${appended.id}`);
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId);
      const relay = state.relays.find((entry) => entry.id === relayId && entry.status === "pending");
      if (!relay)
        return;
      relay.continuation = {
        ...relay.continuation,
        state: relay.continuation.state === "started" ? "started" : "accepted",
        generationId,
        sourceMessageId: appended.id,
        hostCallReturnedAt: hostReturnedAt,
        hostAcceptedAt: hostReturnedAt,
        error: undefined
      };
      await saveState(state, userId);
      await sendState(state, userId, relay.continuation.state === "started" ? "relay_started" : "relay_accepted");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
    spindle.log.error(`Pocket relay continuation failed: relay=${relayId} method=${method} error=${message}`);
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId);
      const relay = state.relays.find((entry) => entry.id === relayId && entry.status === "pending");
      if (!relay)
        return;
      relay.continuation = {
        ...relay.continuation,
        state: "failed",
        invokedAt: relay.continuation.invokedAt || invokedAt,
        permissionCheckedAt: relay.continuation.permissionCheckedAt || invokedAt,
        permissions: relay.continuation.permissions || permissions,
        method,
        hostCallReturnedAt: nowIso(),
        error: message
      };
      await saveState(state, userId);
      await sendState(state, userId, "relay_failed");
    });
    send({ type: "lumiphone:error", error: message }, userId);
  } finally {
    relayFlights.delete(flightKey);
  }
}
function contactFromSource(option) {
  const createdAt = nowIso();
  const source = option.kind === "character" ? { kind: "character", characterId: option.sourceId } : { kind: "council", memberId: option.sourceId, itemId: option.itemId || "" };
  return {
    id: id("contact"),
    name: option.name,
    role: option.role,
    description: option.description,
    identityBrief: option.description,
    sceneNote: "",
    avatarUrl: option.avatarUrl,
    sourceAvatarUrl: option.avatarUrl,
    avatarOverrideUrl: "",
    accent: stableContactAccent(`${option.kind}:${option.sourceId}`),
    sourceAccent: /^#[0-9a-f]{6}$/i.test(option.accent || "") ? option.accent : "",
    colorMode: "pocket",
    source,
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
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
async function resolveSwarmProfile(chatId, characterId, settings, userId) {
  const manual = settings?.manualVisualProfile || defaultPreferences().manualVisualProfile;
  const fallback = {
    available: false,
    status: settings?.useSwarmProfile === false ? "disabled" : "not-detected",
    error: "",
    characterPositive: manual.positive,
    personaPositive: "",
    negative: manual.negative,
    presets: "",
    checkpoint: manual.model,
    aspect: "",
    source: "manual",
    fields: {
      char_base: { detected: false, length: 0, preview: "" },
      persona_base: { detected: false, length: 0, preview: "" },
      swarm_negative: { detected: false, length: 0, preview: "" },
      swarm_preset: { detected: false, length: 0, preview: "" },
      swarm_checkpoint: { detected: false, length: 0, preview: "" },
      swarm_aspect: { detected: false, length: 0, preview: "" }
    }
  };
  if (!settings?.useSwarmProfile)
    return fallback;
  try {
    const marker = `
__LUMIPHONE_PROFILE_FIELD__
`;
    const template = ["{{char_base}}", "{{persona_base}}", "{{swarm_negative}}", "{{swarm_preset}}", "{{swarm_checkpoint}}", "{{swarm_aspect}}"].join(marker);
    const result = await spindle.macros.resolve(template, { chatId, characterId, userId, commit: false });
    const fields = result.text.split(marker).map((part) => part.trim().replace(/^\{\{[^}]+\}\}$/, ""));
    const [characterPositive = "", personaPositive = "", negative = "", presets = "", checkpoint = "", aspect = ""] = fields;
    const macroNames = ["char_base", "persona_base", "swarm_negative", "swarm_preset", "swarm_checkpoint", "swarm_aspect"];
    const diagnostics = Object.fromEntries(macroNames.map((name, index) => [name, {
      detected: Boolean(fields[index]),
      length: fields[index]?.length || 0,
      preview: (fields[index] || "").slice(0, 120)
    }]));
    const available = Boolean(characterPositive || personaPositive || negative || presets || checkpoint || aspect);
    const resolutionWarnings = result.diagnostics.map((entry) => text2(entry.message, 240)).filter(Boolean).slice(0, 3);
    if (!available)
      return resolutionWarnings.length ? { ...fallback, status: "error", error: resolutionWarnings.join(" \xB7 "), fields: diagnostics } : { ...fallback, fields: diagnostics };
    return {
      available,
      status: "connected",
      error: "",
      characterPositive: [manual.positive, characterPositive].filter(Boolean).join(", "),
      personaPositive,
      negative: [manual.negative, negative].filter(Boolean).join(", "),
      presets,
      checkpoint: manual.model || checkpoint,
      aspect,
      source: "swarm_studio",
      fields: diagnostics
    };
  } catch (error) {
    return { ...fallback, status: "error", error: text2(error instanceof Error ? error.message : String(error), 500) || "Macro resolution failed." };
  }
}
async function listGallery(input, userId) {
  if (!spindle.permissions.has("images"))
    throw new Error("Enable the Images permission to use Gallery.");
  const context = await resolveContext(input, userId);
  const scope = text2(input.scope, 30) || "chat";
  const options = { limit: 120, offset: 0, specificity: "full", userId };
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
      fullUrl: item.url,
      thumbnailUrl: `${item.url}${String(item.url).includes("?") ? "&" : "?"}size=sm`,
      filename: item.original_filename,
      mimeType: item.mime_type,
      width: item.width,
      height: item.height,
      createdAt: item.created_at
    }))
  };
}
async function enhanceScene(scene, state, preferences, profile, requestId, userId) {
  if (!preferences.sceneEnhancer || !spindle.permissions.has("generation"))
    return scene;
  const response = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, "scene-planner", `${requestId}:planner`, {
    type: "quiet",
    messages: [
      { role: "system", content: "You are a concise image scene planner. Expand the user brief into one vivid diffusion-ready prompt. Preserve identity facts, subject count, action, camera, environment, lighting, and mood. Do not add names, explanations, headings, negative prompts, or markdown." },
      { role: "user", content: `Roleplay context: ${state.weather.location}; ${state.weather.condition}. Visual profile source: ${profile.source}.
Scene brief: ${scene}` }
    ],
    parameters: { temperature: 0.45, max_tokens: 450 },
    reasoning: { source: "off" },
    userId
  }, userId);
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
  const profile = await resolveSwarmProfile(context.chatId, context.characterId, preferences, userId);
  const controller = new AbortController;
  const job = { controller, cancelled: false, chatId: context.chatId, characterId: context.characterId, userId };
  cameraJobs.get(requestId)?.controller.abort();
  cameraJobs.set(requestId, job);
  send({ type: "lumiphone:camera_progress", requestId, phase: "planning", message: "Planning the scene\u2026", profile }, userId);
  let expanded = scene;
  if (bool2(input.enhance, preferences.sceneEnhancer)) {
    try {
      expanded = await enhanceScene(scene, state, preferences, profile, requestId, userId);
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
    route,
    source: "system",
    severity: "important"
  }, userId);
  const command = state.processedCommands.find((entry) => entry.id === text2(input.__commandId, 240));
  const activity = addActivity(state, {
    kind: "image",
    title: "Photo ready",
    summary: scene.slice(0, 280),
    route,
    source: { messageId: text2(input.__sourceMessageId, 180) || undefined, imageId: imageId || undefined }
  }, command);
  await saveState(state, userId);
  if (notification)
    await maybePush(state, preferences, notification, userId);
  await sendState(state, userId, "camera", false);
  sendActivity(activity, userId);
  sendNotification(notification, userId);
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
    if (bool2(input.autonomous) && (contact.presence.inScene || !contact.messagingPolicy.remoteEligible || conversation.availability.state !== "remote" && conversation.availability.state !== "arriving"))
      return;
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
    const replaceMessageId = text2(input.replaceMessageId, 180);
    const replaceIndex = replaceMessageId ? conversation.messages.findIndex((message) => message.id === replaceMessageId && message.sender === "contact") : -1;
    const contextConversation = replaceIndex >= 0 ? { ...conversation, messages: conversation.messages.slice(0, replaceIndex) } : conversation;
    const compactIdentity = (contact.identityBrief || profile.description || [profile.role, profile.personality, profile.behavior].filter(Boolean).join(". ")).slice(0, 1200);
    const assembled = await assemblePocketContext({
      state,
      contact,
      conversation: contextConversation,
      preferences,
      actorIdentity: compactIdentity,
      getMessages: spindle.permissions.has("chat_mutation") ? () => spindle.chat.getMessages(context.chatId) : undefined
    });
    const instruction = text2(input.instruction, 2000) || "Reply naturally to the latest message.";
    const generationTask = replaceIndex >= 0 ? "message-retry" : "message-reply";
    const generationInfo = await inspectPocketGeneration({ spindle, loadPreferences, savePreferences, send }, preferences, userId);
    const response = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, generationTask, requestId, {
      type: "quiet",
      messages: [
        { role: "system", content: `Write exactly one private phone text as ${profile.name}. Stay in character and do not speak for another participant. Return strict JSON only: {"message":"the phone text","after":{"state":"remote|arriving|local|paused","reason":""}}. after describes the channel immediately after this message. Use arriving while traveling toward the physical scene, local only when the message itself crosses into physical action or confirms arrival, paused for ended/busy/away/sleeping/unknown, otherwise remote. No narration, markdown, or custom UI copy. The compact identity and bounded context below are authoritative.` },
        { role: "user", content: `${assembled.text || "(no context)"}

DIRECTION
${instruction}` }
      ],
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId
    }, userId);
    let generated = {};
    try {
      generated = parseGeneratedObject(response.content);
    } catch {
      generated = { message: response.content, after: { state: "remote" } };
    }
    const reply = text2(generated.message, 8000);
    if (!reply)
      throw new Error("The character did not return a phone message.");
    const route = { app: "messages", conversationId: conversation.id };
    const visible = notificationDestinationVisible(state, route, userId);
    const nextMessage = {
      id: id("msg"),
      sender: "contact",
      senderContactId: contact.id,
      senderName: contact.name,
      senderAccent: contact.accent,
      text: reply,
      createdAt: nowIso(),
      read: visible,
      status: visible ? "read" : "delivered",
      generation: { requestId, retryOf: replaceIndex >= 0 ? replaceMessageId : undefined }
    };
    nextMessage.generation.info = {
      speaker: profile.name,
      source: profile.source,
      sourceId: contact.source.kind === "character" ? contact.source.characterId : contact.source.kind === "council" ? contact.source.memberId || contact.source.itemId : contact.id,
      sourceResolution: contact.source.kind === "character" || contact.source.kind === "council" ? "resolved" : contact.source.origin === "manual" ? "manual" : "snapshot",
      activeCharacterId: state.characterId,
      activeCharacterUsed: contact.source.kind === "character" && contact.source.characterId === state.characterId,
      identityChars: assembled.diagnostics.actorIdentityChars,
      sceneSnapshotStale: assembled.diagnostics.sceneSnapshot.stale,
      contextMode: preferences.roleplayContextMode,
      recentCount: assembled.diagnostics.recentRoleplay.count,
      recentChars: assembled.diagnostics.recentRoleplay.chars,
      storyCount: assembled.diagnostics.story.count,
      storyChars: assembled.diagnostics.story.chars,
      threadCount: assembled.diagnostics.phoneThread.count,
      threadChars: assembled.diagnostics.phoneThread.chars,
      generationMode: preferences.generationMode,
      connectionName: generationInfo.effective?.name || "",
      model: preferences.sidecarModelOverride || generationInfo.effective?.model || ""
    };
    nextMessage.senderAccent = contactAccent(contact);
    if (replaceIndex >= 0)
      conversation.messages.splice(replaceIndex, 1, nextMessage);
    else
      conversation.messages.push(nextMessage);
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES2);
    if (!visible && replaceIndex < 0)
      conversation.unread += 1;
    conversation.updatedAt = nowIso();
    const phoneMessageId = conversation.messages.at(-1)?.id;
    route.messageId = phoneMessageId;
    const notification = preferences.notifyMessages && replaceIndex < 0 ? addNotification(state, { app: "messages", title: contact.name, body: preferences.notificationPreviews ? reply.slice(0, 220) : "New message", route, source: bool2(input.ambient) ? "automatic" : "model", severity: "important" }, userId) : null;
    if (bool2(input.initiated)) {
      contact.messagingPolicy.lastInitiatedMessageAt = nowIso();
      contact.messagingPolicy.lastInitiatedRoleplayAt = state.roleplayNow;
    }
    let relayToContinue = null;
    if (replaceIndex < 0 && !bool2(input.manualOverride)) {
      const after = isRecord(generated.after) ? generated.after : {};
      if (after.state === "arriving") {
        conversation.pause = undefined;
        conversation.availability = { state: "arriving" };
      } else if (after.state === "paused") {
        const allowed = new Set(["ended", "busy", "away", "sleeping", "unknown"]);
        const reason = allowed.has(String(after.reason)) ? String(after.reason) : "unknown";
        conversation.pause = { reason, createdAt: nowIso(), source: "model" };
        conversation.availability = { state: "paused", reason };
      } else if (after.state === "local") {
        const decision = normalizeReplyDecision({ rawAction: "handoff", rawReason: after.reason, contact, conversation, explicitRemoteOverride: false, createdAt: nowIso() });
        relayToContinue = commitConversationHandoff(state, conversation, contact, decision);
        if (nextMessage.generation?.info)
          nextMessage.generation.info.replyDecision = {
            rawAction: decision.rawAction,
            normalizedAction: decision.normalizedAction,
            reason: decision.reason,
            normalizationReason: decision.normalizationReason
          };
      } else {
        conversation.pause = undefined;
        conversation.availability = { state: "remote" };
      }
    }
    const activity = replaceIndex < 0 ? addActivity(state, { kind: "message", title: contact.name, summary: reply.slice(0, 280), route, source: { contactId: contact.id, conversationId: conversation.id } }) : undefined;
    await saveState(state, userId);
    if (notification)
      await maybePush(state, preferences, notification, userId);
    await sendState(state, userId, "message", preferences.autoOpenOnModelAction);
    sendActivity(activity, userId);
    sendNotification(notification, userId);
    if (relayToContinue)
      setTimeout(() => void requestRelayContinuation(context.chatId, context.characterId, relayToContinue.id, userId), 0);
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
  const requestId = text2(input.requestId, 180) || id("npc");
  send({ type: "lumiphone:operation_progress", task: "npc-contact", requestId, phase: "generating", message: "Generating contact\u2026" }, userId);
  const request = {
    type: "quiet",
    messages: [
      { role: "system", content: 'Create one compact roleplay phone contact from the user description. Return strict JSON only with exactly these string fields: {"name":"","role":"","identityBrief":""}. No markdown. identityBrief contains only stable facts useful across scenes: role, general personality, enduring relationship, distinctive behavior. Do not invent unsupported backstory. Name and role max 120 characters; identityBrief max 900.' },
      { role: "user", content: prompt }
    ],
    parameters: { temperature: 0.55, max_tokens: 350 },
    userId
  };
  const parsed = await runStructuredGeneration("npc-contact", requestId, request, userId);
  send({ type: "lumiphone:operation_progress", task: "npc-contact", requestId, phase: "parsing", message: "Parsing profile\u2026" }, userId);
  const name = text2(parsed.name, 120);
  if (!name)
    throw new Error("NPC generation did not return a valid name.");
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    send({ type: "lumiphone:operation_progress", task: "npc-contact", requestId, phase: "saving", message: "Saving contact\u2026" }, userId);
    const state = await loadState(context.chatId, context.characterId, userId);
    const createdAt = nowIso();
    const identityBrief = text2(parsed.identityBrief ?? parsed.description, 900);
    const contact = upsertContact(state, {
      id: id("contact"),
      name,
      role: text2(parsed.role, 120) || "Pocket NPC",
      description: identityBrief,
      identityBrief,
      sceneNote: "",
      avatarUrl: "",
      sourceAvatarUrl: "",
      avatarOverrideUrl: "",
      accent: stableContactAccent(name),
      sourceAccent: "",
      colorMode: "pocket",
      source: { kind: "npc", origin: "generated", description: identityBrief },
      presence: { inScene: false, lastSceneAt: "" },
      contextPolicy: { pinned: false },
      generationPolicy: { relevant: true },
      messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
      createdAt,
      updatedAt: createdAt
    });
    const activity = addActivity(state, { kind: "contact", title: `${contact.name} added`, summary: contact.role, route: { app: "contacts", contactId: contact.id, view: "detail" }, source: { contactId: contact.id } });
    await saveState(state, userId);
    await sendState(state, userId, "contact");
    sendActivity(activity, userId);
    send({ type: "lumiphone:operation_progress", task: "npc-contact", requestId, phase: "complete", message: "Contact saved" }, userId);
    send({ type: "lumiphone:contact_created", requestId, contactId: contact.id }, userId);
  });
}
async function refreshCompactContactProfile(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable Generation to refresh a compact contact profile.");
  const context = await resolveContext(input, userId);
  const requestId = text2(input.requestId, 180) || id("profile");
  const state = await loadState(context.chatId, context.characterId, userId);
  const contact = state.contacts.find((entry) => entry.id === text2(input.contactId, 180));
  if (!contact)
    throw new Error("That contact no longer exists.");
  const profile = await resolveContactProfile(contact, userId);
  send({ type: "lumiphone:operation_progress", task: "profile-refresh", requestId, phase: "generating", message: "Refreshing compact profile\u2026" }, userId);
  const parsed = await runStructuredGeneration("profile-refresh", requestId, {
    type: "quiet",
    messages: [
      { role: "system", content: 'Condense the authoritative actor profile into stable phone-contact facts. Return strict JSON only: {"identityBrief":""}. Include stable role, personality, relationship, and distinctive behavior when supported. Exclude temporary scene state and do not invent facts. Maximum 900 characters.' },
      { role: "user", content: `Name: ${profile.name}
Role: ${profile.role}
Description: ${profile.description}
Personality: ${profile.personality}
Behavior: ${profile.behavior}` }
    ],
    parameters: { temperature: 0.15, max_tokens: 320 },
    userId
  }, userId);
  const identityBrief = text2(parsed.identityBrief, 900);
  if (!identityBrief)
    throw new Error("Profile refresh returned no stable identity brief.");
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    const latest = await loadState(context.chatId, context.characterId, userId);
    const target = latest.contacts.find((entry) => entry.id === contact.id);
    if (!target)
      throw new Error("That contact no longer exists.");
    target.name = profile.name;
    target.role = profile.role || target.role;
    target.identityBrief = identityBrief;
    target.description = identityBrief;
    target.updatedAt = nowIso();
    await saveState(latest, userId);
    await sendState(latest, userId, "contact_profile");
    send({ type: "lumiphone:operation_progress", task: "profile-refresh", requestId, phase: "complete", message: "Compact profile refreshed" }, userId);
  });
}
function sceneKeyFor(name) {
  return name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 120) || name.toLocaleLowerCase().slice(0, 120);
}
function actorName(value) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function uniqueAliasMatch(candidate, names) {
  const normalized = actorName(candidate);
  if (!normalized)
    return null;
  const exact = names.find((name) => actorName(name) === normalized);
  if (exact)
    return exact;
  if (normalized.includes(" "))
    return null;
  const matches = names.filter((name) => actorName(name).split(" ").includes(normalized));
  return matches.length === 1 ? matches[0] : null;
}
async function syncSceneContacts(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable Generation to identify scene contacts.");
  if (!spindle.permissions.has("chat_mutation"))
    throw new Error("Enable Chat Mutation so Pocket can read the recent scene when you request a sync.");
  const context = await resolveContext(input, userId);
  const requestId = text2(input.requestId, 180) || id("scene");
  send({ type: "lumiphone:operation_progress", task: "scene-sync", requestId, phase: "request", message: "Reading current scene\u2026" }, userId);
  const messages = await spindle.chat.getMessages(context.chatId);
  const authoritative = messages.at(-1);
  const transcript = messages.slice(-24).map((message) => `${message.role}: ${text2(message.content, 1200)}`).join(`
`).slice(-16000);
  const preflightState = await loadState(context.chatId, context.characterId, userId);
  const exclusions = [preflightState.characterName, preflightState.pocketPersona.displayName].filter(Boolean);
  send({ type: "lumiphone:operation_progress", task: "scene-sync", requestId, phase: "generating", message: "Finding scene contacts\u2026" }, userId);
  const request = {
    type: "quiet",
    messages: [
      { role: "system", content: `Identify named non-user actors physically present in the most recent roleplay scene. Return strict JSON only: {"contacts":[{"name":"","role":"","identityBrief":"","sceneNote":""}]}. Return at most 6. Exclude the primary Character and active Persona, including unambiguous short aliases. Explicit exclusions: ${exclusions.join(", ") || "(none)"}. Exclude merely mentioned, messaged, absent, historical, or hypothetical people. identityBrief is stable role/personality/relationship evidence only; sceneNote is why they are present, what they are doing, or their temporary state. Do not invent unsupported biography. Name/role max 120; identityBrief max 350; sceneNote max 220.` },
      { role: "user", content: transcript || "(empty chat)" }
    ],
    parameters: { temperature: 0.2, max_tokens: 1500 },
    userId
  };
  const parsed = await runStructuredGeneration("scene-sync", requestId, request, userId);
  send({ type: "lumiphone:operation_progress", task: "scene-sync", requestId, phase: "parsing", message: "Parsing scene roster\u2026" }, userId);
  if (!Array.isArray(parsed.contacts))
    throw new Error("Scene Sync returned no contacts array; no contact state was changed.");
  const aliasUniverse = [...new Set([...exclusions, ...preflightState.contacts.map((entry) => entry.name)])];
  const found = parsed.contacts.slice(0, 6).flatMap((entry) => {
    if (!isRecord(entry))
      return [];
    const name = text2(entry.name, 120);
    if (!name)
      return [];
    const excluded = uniqueAliasMatch(name, exclusions);
    if (excluded)
      return [];
    return [{
      name,
      role: text2(entry.role, 120) || "Scene contact",
      identityBrief: text2(entry.identityBrief ?? entry.description, 350),
      sceneNote: text2(entry.sceneNote ?? entry.currentState, 220)
    }];
  });
  const relayIds = [];
  await withStateLock(stateKey(context.chatId, context.characterId), async () => {
    send({ type: "lumiphone:operation_progress", task: "scene-sync", requestId, phase: "saving", message: "Saving scene contacts\u2026" }, userId);
    const state = await loadState(context.chatId, context.characterId, userId);
    const sceneAt = nowIso();
    for (const contact of state.contacts)
      contact.presence.inScene = false;
    const contactIds = [];
    for (const candidate of found) {
      const sceneKey = sceneKeyFor(candidate.name);
      const matchedName = uniqueAliasMatch(candidate.name, aliasUniverse);
      const existing = state.contacts.find((entry) => entry.source.kind === "npc" && entry.source.origin === "scene" && entry.source.sceneKey === sceneKey) || state.contacts.find((entry) => actorName(entry.name) === actorName(matchedName || candidate.name));
      if (existing && !(existing.source.kind === "npc" && existing.source.origin === "scene")) {
        existing.presence.inScene = true;
        existing.presence.lastSceneAt = sceneAt;
        existing.sceneNote = candidate.sceneNote;
        existing.updatedAt = sceneAt;
        contactIds.push(existing.id);
        continue;
      }
      const createdAt = existing?.createdAt || sceneAt;
      const contact = upsertContact(state, {
        id: existing?.id || id("contact"),
        name: candidate.name,
        role: candidate.role,
        description: existing?.identityBrief || candidate.identityBrief,
        identityBrief: existing?.identityBrief || candidate.identityBrief,
        sceneNote: candidate.sceneNote,
        avatarUrl: existing?.avatarUrl || "",
        sourceAvatarUrl: existing?.sourceAvatarUrl || "",
        avatarOverrideUrl: existing?.avatarOverrideUrl || "",
        accent: existing?.accent || stableContactAccent(sceneKey),
        sourceAccent: existing?.sourceAccent || "",
        colorMode: existing?.colorMode || "pocket",
        source: { kind: "npc", origin: "scene", description: existing?.identityBrief || candidate.identityBrief, sceneKey },
        presence: { inScene: true, lastSceneAt: sceneAt },
        contextPolicy: existing?.contextPolicy || { pinned: false },
        generationPolicy: existing?.generationPolicy || { relevant: true },
        messagingPolicy: existing?.messagingPolicy || { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
        createdAt,
        updatedAt: sceneAt
      });
      contactIds.push(contact.id);
    }
    state.sceneSnapshot = {
      actors: contactIds.map((contactId) => {
        const contact = state.contacts.find((entry) => entry.id === contactId);
        return { contactId, roleHint: contact.role, sceneBrief: contact.sceneNote };
      }),
      capturedAt: sceneAt,
      sourceMessageId: text2(authoritative?.id, 180),
      sourceMessageIndex: Number.isFinite(Number(authoritative?.index_in_chat)) ? Number(authoritative.index_in_chat) : messages.length - 1,
      sourceRevision: Math.max(0, Math.round(numberValue(authoritative?.revision, 0))),
      stale: false
    };
    for (const conversation of state.conversations) {
      if (conversation.kind !== "direct")
        continue;
      const participant = state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]);
      if (participant?.presence.inScene && conversation.availability.state !== "local") {
        const decision = normalizeReplyDecision({
          rawAction: "handoff",
          rawReason: conversation.availability.state === "arriving" ? "arrived" : "in_scene",
          contact: participant,
          conversation,
          explicitRemoteOverride: false,
          createdAt: sceneAt
        });
        const relay = commitConversationHandoff(state, conversation, participant, decision);
        relayIds.push(relay.id);
      } else if (participant) {
        reconcileContactAvailability(state, participant);
      }
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
    send({ type: "lumiphone:operation_progress", task: "scene-sync", requestId, phase: "complete", message: "Scene contacts synced" }, userId);
    send({ type: "lumiphone:scene_contacts_done", requestId, contactIds }, userId);
  });
  for (const relayId of [...new Set(relayIds)])
    requestRelayContinuation(context.chatId, context.characterId, relayId, userId);
}
function replyCadenceMs(preferences) {
  return preferences.replyCadence === "instant" ? 0 : preferences.replyCadence === "quick" ? 1200 : preferences.replyCadence === "relaxed" ? 6500 : 3200;
}
function burstTimerKey(chatId, characterId, conversationId, userId) {
  return `${viewKey(userId)}:${stateKey(chatId, characterId)}:${conversationId}`;
}
async function scheduleReplyBurst(chatId, characterId, conversationId, userId) {
  const timerKey = burstTimerKey(chatId, characterId, conversationId, userId);
  const previous = replyBurstTimers.get(timerKey);
  if (previous)
    clearTimeout(previous);
  const preferences = await loadPreferences(userId);
  if (!preferences.autoReplyAfterSend)
    return;
  const state = await loadState(chatId, characterId, userId);
  const burst = state.conversations.find((entry) => entry.id === conversationId)?.outgoingBurst;
  if (!burst?.open || burst.finalized || burst.held)
    return;
  const timer = setTimeout(() => {
    replyBurstTimers.delete(timerKey);
    maybeReplyAfterSend(chatId, characterId, conversationId, userId, burst.id);
  }, replyCadenceMs(preferences));
  replyBurstTimers.set(timerKey, timer);
}
async function maybeReplyAfterSend(chatId, characterId, conversationId, userId, expectedBurstId = "") {
  const flightKey = `${viewKey(userId)}:${stateKey(chatId, characterId)}:${conversationId}`;
  if (replyDecisionFlights.has(flightKey))
    return;
  replyDecisionFlights.add(flightKey);
  let progressRequestId = "";
  try {
    const preferences = await loadPreferences(userId);
    if (!preferences.autoReplyAfterSend || !spindle.permissions.has("generation"))
      return;
    const state = await loadState(chatId, characterId, userId);
    const conversation = state.conversations.find((entry) => entry.id === conversationId);
    if (!conversation || conversation.kind !== "direct" || conversation.messages.at(-1)?.sender !== "persona")
      return;
    const burst = conversation.outgoingBurst;
    if (expectedBurstId && (!burst || burst.id !== expectedBurstId || !burst.open || burst.finalized || burst.held))
      return;
    const contact = state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]);
    if (!contact || !contact.generationPolicy.relevant)
      return;
    const burstMessages = burst?.messageIds.length ? conversation.messages.filter((message) => burst.messageIds.includes(message.id) && message.sender === "persona") : [conversation.messages.at(-1)];
    const requestId = id("reply_decision");
    progressRequestId = requestId;
    send({
      type: "lumiphone:message_progress",
      requestId,
      chatId,
      characterId,
      conversationId,
      contactId: contact.id,
      speakerContactId: contact.id,
      phase: "checking"
    }, userId);
    const explicitRemoteOverride = Boolean(burst?.explicitRemoteOverride);
    const deterministicLocal = !explicitRemoteOverride && (contact.presence.inScene || conversation.availability.state === "local");
    const rawDecision = deterministicLocal ? { action: "handoff", reason: contact.presence.inScene ? conversation.availability.state === "arriving" ? "arrived" : "in_scene" : conversation.availability.state === "local" ? conversation.availability.reason : "continued_in_person" } : !contact.messagingPolicy.remoteEligible ? { action: "pause", reason: "away" } : await runStructuredGeneration("reply-decision", requestId, {
      type: "quiet",
      messages: [
        { role: "system", content: 'Classify the next channel state of this fictional direct-message thread. The physical-scene facts are authoritative. Return strict JSON only: {"action":"reply"}, {"action":"none"}, {"action":"pause","reason":"ended|busy|away|sleeping|unknown"}, or {"action":"handoff","reason":"arriving|arrived|took_action|continued_in_person"}. none means the remote channel is still valid but no reply is warranted. Never use none when the actor is in the physical scene. arriving means they are traveling toward the scene but are not there yet. No prose or custom UI copy.' },
        { role: "user", content: `Contact: ${contact.name} (${contact.role})
Channel: ${conversation.availability.state}
Presence: ${contact.presence.inScene ? "physically in the active scene" : "off-scene"}
Remote eligible: ${contact.messagingPolicy.remoteEligible}
Scene snapshot: ${(state.sceneSnapshot?.actors || []).map((actor) => `${state.contacts.find((entry) => entry.id === actor.contactId)?.name || actor.contactId}: ${actor.sceneBrief}`).join(" | ") || "none"}
Recent DM:
${conversation.messages.slice(-8).map((message) => `${message.senderName}: ${message.text.slice(0, 700)}`).join(`
`)}
Settled outgoing burst:
${burstMessages.map((message) => message.text.slice(0, 1200)).join(`
`)}` }
      ],
      parameters: { temperature: 0.1, max_tokens: 100 },
      userId
    }, userId);
    const rawAction = rawDecision.action === "reply" || rawDecision.reply === true ? "reply" : rawDecision.action === "pause" ? "pause" : rawDecision.action === "handoff" ? "handoff" : "none";
    const outcome = await withStateLock(stateKey(chatId, characterId), async () => {
      const latestState = await loadState(chatId, characterId, userId);
      const latestConversation = latestState.conversations.find((entry) => entry.id === conversationId);
      if (!latestConversation?.outgoingBurst || expectedBurstId && latestConversation.outgoingBurst.id !== expectedBurstId)
        return null;
      const latestContact = latestState.contacts.find((entry) => entry.id === contact.id);
      if (!latestContact)
        return null;
      latestConversation.outgoingBurst.open = false;
      latestConversation.outgoingBurst.finalized = true;
      latestConversation.outgoingBurst.updatedAt = nowIso();
      const decision = normalizeReplyDecision({
        rawAction,
        rawReason: rawDecision.reason,
        contact: latestContact,
        conversation: latestConversation,
        explicitRemoteOverride: latestConversation.outgoingBurst.explicitRemoteOverride,
        createdAt: nowIso(),
        burstId: latestConversation.outgoingBurst.id
      });
      latestConversation.lastDecision = decision;
      let relayId;
      if (decision.normalizedAction === "reply") {
        if (latestConversation.availability.state !== "arriving")
          latestConversation.availability = { state: "remote" };
        latestConversation.pause = undefined;
      } else if (decision.normalizedAction === "pause") {
        const reason = decision.reason;
        latestConversation.pause = { reason, createdAt: decision.createdAt, source: "model" };
        latestConversation.availability = { state: "paused", reason };
      } else if (decision.normalizedAction === "handoff" && decision.reason === "arriving" && !latestContact.presence.inScene) {
        latestConversation.availability = { state: "arriving" };
        latestConversation.pause = undefined;
      } else if (decision.normalizedAction === "handoff") {
        relayId = commitConversationHandoff(latestState, latestConversation, latestContact, decision).id;
      }
      await saveState(latestState, userId);
      await sendState(latestState, userId, decision.normalizedAction === "handoff" ? "conversation_handoff" : decision.normalizedAction === "pause" ? "conversation_pause" : "reply_decision");
      return { action: decision.normalizedAction, relayId };
    });
    send({ type: "lumiphone:message_progress", requestId, chatId, characterId, conversationId, contactId: contact.id, phase: "done" }, userId);
    progressRequestId = "";
    if (outcome?.relayId) {
      requestRelayContinuation(chatId, characterId, outcome.relayId, userId);
      return;
    }
    if (outcome?.action !== "reply")
      return;
    await generateMessage({ requestId: id("auto_reply"), chatId, characterId, conversationId, speakerContactId: contact.id, autonomous: true, instruction: "Reply naturally only because the latest user text warrants a response." }, userId);
  } catch (error) {
    spindle.log.warn(`Pocket reply decision skipped: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (progressRequestId)
      send({ type: "lumiphone:message_progress", requestId: progressRequestId, chatId, characterId, conversationId, phase: "done" }, userId);
    replyDecisionFlights.delete(flightKey);
  }
}
async function considerAmbientMessage(chatId, characterId, opportunity, userId) {
  const flightKey = `${viewKey(userId)}:${stateKey(chatId, characterId)}`;
  if (ambientFlights.has(flightKey))
    return;
  ambientFlights.add(flightKey);
  try {
    const preferences = await loadPreferences(userId);
    if (!spindle.permissions.has("generation") || !shouldTakeAmbientOpportunity(preferences.ambientMessaging))
      return;
    const state = await loadState(chatId, characterId, userId);
    if (preferences.ambientMessaging === "off")
      return;
    const candidates = ambientEligibleContacts(state.contacts).filter((contact2) => contact2.generationPolicy.relevant && contactCooldownReady(contact2, preferences.ambientMessaging, state.roleplayNow)).slice(0, 16);
    if (!candidates.length)
      return;
    const requestId = id("ambient_decision");
    const decision = await runStructuredGeneration("ambient-decision", requestId, {
      type: "quiet",
      messages: [
        { role: "system", content: 'Choose at most one conservative fictional off-scene phone-message opportunity. Most opportunities should be none. Return strict JSON only: {"action":"none"} or {"action":"message","contactId":"exact id","direction":"short reason or topic"}. Never select an actor marked in-scene. Do not write the actual message.' },
        { role: "user", content: `Opportunity: ${opportunity}. Roleplay time: ${state.roleplayNow}. Candidates:
${candidates.map((contact2) => `${contact2.id} | ${contact2.name} | ${contact2.role} | ${contact2.description.slice(0, 240)}`).join(`
`)}` }
      ],
      parameters: { temperature: 0.35, max_tokens: 120 },
      userId
    }, userId);
    if (decision.action !== "message")
      return;
    const contact = candidates.find((entry) => entry.id === text2(decision.contactId, 180));
    if (!contact)
      return;
    const conversation = ensureDirectConversation(state, contact.id, nowIso(), id);
    await saveState(state, userId);
    await generateMessage({
      requestId: id("ambient_message"),
      chatId,
      characterId,
      conversationId: conversation.id,
      speakerContactId: contact.id,
      instruction: text2(decision.direction, 500) || "Send a brief natural message appropriate to your off-scene life.",
      ambient: true,
      initiated: true,
      autonomous: true
    }, userId);
  } catch (error) {
    spindle.log.warn(`Pocket ambient opportunity skipped: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    ambientFlights.delete(flightKey);
  }
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
    const relayIds = [];
    let notification = null;
    let activity;
    let result = { ok: true, action };
    if (action === "open") {
      await saveState(state, userId);
      await sendState(state, userId, "open", true);
      return result;
    }
    if (action === "scene") {
      const actors = (Array.isArray(payload.actors) ? payload.actors : Array.isArray(payload.contacts) ? payload.contacts : []).slice(0, 8);
      const sceneAt = nowIso();
      for (const contact of state.contacts)
        contact.presence.inScene = false;
      const snapshotActors = [];
      for (const raw of actors) {
        if (!isRecord(raw))
          continue;
        const name = text2(raw.name, 120);
        if (!name || uniqueAliasMatch(name, [state.characterName, state.pocketPersona.displayName].filter(Boolean)))
          continue;
        let actor = state.contacts.find((entry) => entry.id === text2(raw.contactId, 180) || actorName(entry.name) === actorName(name));
        if (!actor) {
          const identityBrief = text2(raw.identityBrief ?? raw.description, 350);
          actor = upsertContact(state, {
            id: id("contact"),
            name,
            role: text2(raw.role, 120) || "Scene contact",
            description: identityBrief,
            identityBrief,
            sceneNote: "",
            avatarUrl: "",
            sourceAvatarUrl: "",
            avatarOverrideUrl: "",
            accent: stableContactAccent(name),
            sourceAccent: "",
            colorMode: "pocket",
            source: { kind: "npc", origin: "scene", description: identityBrief, sceneKey: sceneKeyFor(name) },
            presence: { inScene: true, lastSceneAt: sceneAt },
            contextPolicy: { pinned: false },
            generationPolicy: { relevant: true },
            messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
            createdAt: sceneAt,
            updatedAt: sceneAt
          });
        }
        actor.presence = { inScene: true, lastSceneAt: sceneAt };
        actor.sceneNote = text2(raw.sceneBrief ?? raw.sceneNote, 600);
        snapshotActors.push({ contactId: actor.id, roleHint: text2(raw.roleHint ?? raw.role, 120) || actor.role, sceneBrief: actor.sceneNote });
      }
      for (const contact of state.contacts) {
        const conversation = state.conversations.find((entry) => entry.kind === "direct" && entry.participantContactIds[0] === contact.id);
        if (contact.presence.inScene && conversation && conversation.availability.state !== "local") {
          const decision = normalizeReplyDecision({
            rawAction: "handoff",
            rawReason: conversation.availability.state === "arriving" ? "arrived" : "in_scene",
            contact,
            conversation,
            explicitRemoteOverride: false,
            createdAt: sceneAt
          });
          relayIds.push(commitConversationHandoff(state, conversation, contact, decision).id);
        } else
          reconcileContactAvailability(state, contact);
      }
      state.sceneSnapshot = { actors: snapshotActors, capturedAt: sceneAt, sourceMessageId: text2(input.messageId, 180), sourceMessageIndex: Math.round(numberValue(payload.sourceMessageIndex, -1)), sourceRevision: Math.max(0, Math.round(numberValue(payload.sourceRevision, 0))), stale: false };
      result.contactIds = snapshotActors.map((entry) => entry.contactId);
      activity = addActivity(state, { kind: "contact", title: "Scene snapshot updated", summary: `${snapshotActors.length} actor${snapshotActors.length === 1 ? "" : "s"} present`, route: { app: "contacts" }, source: { messageId: text2(input.messageId, 180) || undefined } }, command);
    } else if (action === "message") {
      const requestedContactId = text2(payload.contact_id ?? payload.contactId, 180);
      let contact = state.contacts.find((item) => item.id === requestedContactId);
      if (!contact && requestedContactId) {
        const createdAt = nowIso();
        const identityBrief = text2(payload.contact_description ?? payload.contactDescription, 1200);
        contact = {
          id: requestedContactId,
          name: text2(payload.contact_name ?? payload.contactName, 120) || "Pocket NPC",
          role: text2(payload.contact_role ?? payload.contactRole, 120) || "Pocket NPC",
          description: identityBrief,
          identityBrief,
          sceneNote: "",
          avatarUrl: "",
          sourceAvatarUrl: "",
          avatarOverrideUrl: "",
          accent: stableContactAccent(requestedContactId),
          sourceAccent: "",
          colorMode: "pocket",
          source: { kind: "npc", origin: "manual", description: identityBrief },
          presence: { inScene: false, lastSceneAt: "" },
          contextPolicy: { pinned: false },
          generationPolicy: { relevant: true },
          messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
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
        senderAccent: senderContact ? contactAccent(senderContact) : "",
        text: messageText,
        createdAt: nowIso(),
        read: sender !== "contact",
        status: sender === "persona" ? "sent" : sender === "system" ? "read" : "delivered"
      };
      conversation.messages.push(message);
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES2);
      conversation.updatedAt = message.createdAt;
      if (sender === "persona" && source === "user") {
        const previousBurst = conversation.outgoingBurst;
        const explicitRemoteOverride = bool2(payload.explicitRemoteOverride ?? payload.explicit_remote_override);
        conversation.outgoingBurst = previousBurst?.open && !previousBurst.finalized ? { ...previousBurst, messageIds: [...previousBurst.messageIds, message.id].slice(-12), explicitRemoteOverride: previousBurst.explicitRemoteOverride || explicitRemoteOverride, updatedAt: message.createdAt } : { id: id("burst"), messageIds: [message.id], open: true, held: false, finalized: false, explicitRemoteOverride, updatedAt: message.createdAt };
      }
      if (sender === "contact") {
        conversation.pause = undefined;
        if (senderContact?.presence.inScene)
          reconcileContactAvailability(state, senderContact);
        else
          conversation.availability = { state: "remote" };
      }
      const visible = sender === "contact" && notificationDestinationVisible(state, { app: "messages", conversationId: conversation.id }, userId);
      if (sender === "contact" && !visible)
        conversation.unread += 1;
      if (visible) {
        message.read = true;
        message.status = "read";
      }
      const route = { app: "messages", conversationId: conversation.id, messageId: message.id };
      notification = sender === "contact" && preferences.notifyMessages ? addNotification(state, { app: "messages", title: senderContact.name, body: preferences.notificationPreviews ? messageText.slice(0, 220) : "New message", route, source: source === "user" ? "system" : "model", severity: "important" }, userId) : null;
      result = { ...result, contactId: senderContact?.id || contact?.id, conversationId: conversation.id, messageId: message.id };
      if (source !== "user")
        activity = addActivity(state, { kind: "message", title: senderContact?.name || conversation.title, summary: messageText.slice(0, 280), route, source: { messageId: text2(input.messageId, 180) || undefined, contactId: senderContact?.id || contact?.id, conversationId: conversation.id } }, command);
    } else if (action === "contact") {
      const contactId = text2(payload.contactId ?? payload.contact_id ?? payload.id, 180);
      const existing = state.contacts.find((entry) => entry.id === contactId);
      const name = text2(payload.name ?? payload.title, 120) || existing?.name;
      if (!name)
        throw new Error("A contact action needs a name.");
      const createdAt = existing?.createdAt || nowIso();
      const requestedAccent = text2(payload.accent, 20);
      const identityBrief = text2(payload.identityBrief ?? payload.description ?? payload.text ?? payload.content, 1200) || existing?.identityBrief || existing?.description || "";
      const contact = upsertContact(state, {
        id: existing?.id || id("contact"),
        name,
        role: text2(payload.role, 120) || existing?.role || "Pocket NPC",
        description: identityBrief,
        identityBrief,
        sceneNote: text2(payload.sceneNote, 600) || existing?.sceneNote || "",
        avatarUrl: existing?.avatarUrl || "",
        sourceAvatarUrl: existing?.sourceAvatarUrl || "",
        avatarOverrideUrl: existing?.avatarOverrideUrl || "",
        accent: /^#[0-9a-f]{6}$/i.test(requestedAccent) ? requestedAccent : existing?.accent || stableContactAccent(name),
        sourceAccent: existing?.sourceAccent || "",
        colorMode: payload.colorMode === "source" ? "source" : existing?.colorMode || "pocket",
        source: existing?.source || { kind: "npc", origin: "manual", description: identityBrief },
        presence: {
          inScene: bool2(payload.inScene ?? payload.in_scene, existing?.presence.inScene),
          lastSceneAt: bool2(payload.inScene ?? payload.in_scene, existing?.presence.inScene) ? nowIso() : existing?.presence.lastSceneAt || ""
        },
        contextPolicy: { pinned: bool2(payload.pinned, existing?.contextPolicy.pinned) },
        generationPolicy: { relevant: bool2(payload.generationRelevant ?? payload.generation_relevant, existing?.generationPolicy.relevant ?? true) },
        messagingPolicy: {
          remoteEligible: bool2(payload.remoteEligible ?? payload.remote_eligible, existing?.messagingPolicy.remoteEligible ?? true),
          allowAmbientInScene: bool2(payload.allowAmbientInScene ?? payload.allow_ambient_in_scene, existing?.messagingPolicy.allowAmbientInScene),
          lastInitiatedMessageAt: existing?.messagingPolicy.lastInitiatedMessageAt || "",
          lastInitiatedRoleplayAt: existing?.messagingPolicy.lastInitiatedRoleplayAt || ""
        },
        createdAt,
        updatedAt: nowIso()
      });
      reconcileContactAvailability(state, contact);
      const route = { app: "contacts", contactId: contact.id, view: "detail" };
      notification = source !== "user" && preferences.notifyContacts ? addNotification(state, { app: "contacts", title: contact.name, body: contact.role, route, source: "model", severity: "info" }, userId) : null;
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
        notification = addNotification(state, { app: "notes", title: "Journal updated", body: title, route, source: "model", severity: "info" }, userId);
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
      notification = source !== "user" ? addNotification(state, { app: "calendar", title: "Timeline updated", body: title, route, source: "model", severity: "important" }, userId) : null;
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
      notification = source !== "user" ? addNotification(state, { app: "weather", title: state.weather.location, body: `${state.weather.condition}, ${state.weather.temperature}\xB0${state.weather.unit}`, route, source: "model", severity: "info" }, userId) : null;
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
      notification = source !== "user" && preferences.notifyTrackers ? addNotification(state, { app: "trackers", title: next.label, body: trackerSummary, route, source: "model", severity: "info" }, userId) : null;
      result.trackerId = next.id;
      activity = addActivity(state, { kind: "tracker-change", title: next.label, summary: trackerSummary, route, source: { messageId: text2(input.messageId, 180) || undefined, trackerId: next.id } }, command);
    } else if (action === "notify") {
      const requestedApp = text2(payload.app ?? input.app, 40);
      const allowedApps = new Set(["home", "messages", "contacts", "gallery", "camera", "notes", "weather", "calendar", "trackers", "settings"]);
      const notifyTitle = text2(payload.title ?? input.title, 160) || "Pocket";
      const notifyBody = text2(payload.body ?? payload.text ?? payload.content, 1000);
      const notifyRoute = normalizePocketRoute(payload.route, { app: allowedApps.has(requestedApp) ? requestedApp : "home" });
      notification = source === "user" ? null : addNotification(state, {
        app: allowedApps.has(requestedApp) ? requestedApp : "home",
        title: notifyTitle,
        body: notifyBody,
        route: notifyRoute,
        source: "model",
        severity: payload.severity === "important" || payload.severity === "error" ? payload.severity : "info"
      }, userId);
      if (source !== "user")
        activity = addActivity(state, { kind: "system", title: notifyTitle, summary: notifyBody, route: notifyRoute, source: { messageId: text2(input.messageId, 180) || undefined } }, command);
    } else {
      throw new Error(`Unsupported phone action: ${action || "(empty)"}`);
    }
    await saveState(state, userId);
    if (notification)
      await maybePush(state, preferences, notification, userId);
    await sendState(state, userId, action, source !== "user" && preferences.autoOpenOnModelAction);
    sendActivity(activity, userId);
    sendNotification(notification, userId);
    if (action === "message" && source === "user" && preferences.autoReplyAfterSend && typeof result.conversationId === "string") {
      scheduleReplyBurst(context.chatId, context.characterId, result.conversationId, userId);
    }
    for (const relayId of [...new Set(relayIds)])
      setTimeout(() => void requestRelayContinuation(context.chatId, context.characterId, relayId, userId), 0);
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
        await sendState(state, userId, "load");
        break;
      }
      case "lumiphone:view_state": {
        frontendViews.set(viewKey(userId), {
          chatId: context.chatId,
          characterId: context.characterId,
          open: bool2(payload.open),
          route: normalizePocketRoute(payload.route),
          updatedAt: Date.now()
        });
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
          reconcileContactAvailability(state, contact);
          await saveState(state, userId);
          await sendState(state, userId, "contact");
          send({ type: "lumiphone:contact_saved", requestId, contactId: contact.id }, userId);
        });
        break;
      }
      case "lumiphone:generate_contact":
        await generateNpcContact(payload, userId);
        break;
      case "lumiphone:refresh_contact_profile":
        await refreshCompactContactProfile(payload, userId);
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
            availability: { state: "remote" },
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
        const next = normalizePreferences({ ...existing, ...isRecord(payload.preferences) ? payload.preferences : isRecord(payload.settings) ? payload.settings : {} });
        await validateChangedWallpaperSources(existing, next, userId);
        await savePreferences(next, userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "preferences");
        break;
      }
      case "lumiphone:save_pocket_persona": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const next = normalizePocketPersona(payload.persona, state.pocketPersona);
          next.source = payload.followLumiverse === true ? "lumiverse" : next.source === "lumiverse" ? "manual" : next.source;
          if (next.source === "lumiverse") {
            const hostPersona = await resolveActivePocketPersona(userId);
            if (hostPersona)
              Object.assign(next, hostPersona);
          }
          next.updatedAt = nowIso();
          state.pocketPersona = next;
          state.setup.initialized = true;
          await saveState(state, userId);
          await sendState(state, userId, "pocket_persona");
          send({ type: "lumiphone:pocket_persona_saved", requestId }, userId);
        });
        break;
      }
      case "lumiphone:dismiss_setup": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          state.setup.dismissed = true;
          await saveState(state, userId);
          await sendState(state, userId, "setup");
        });
        break;
      }
      case "lumiphone:generate_pocket_persona": {
        if (!spindle.permissions.has("generation"))
          throw new Error("Enable Generation to describe the Pocket Persona from roleplay.");
        const state = await loadState(context.chatId, context.characterId, userId);
        const messages = spindle.permissions.has("chat_mutation") ? await spindle.chat.getMessages(context.chatId) : [];
        const response = await runStructuredGeneration("persona-profile", requestId || id("persona"), {
          type: "quiet",
          messages: [
            { role: "system", content: 'Describe only the user/persona represented in this roleplay. Return strict JSON: {"displayName":"","pronouns":"","role":"","identityBrief":""}. Use evidence from the transcript, keep identityBrief under 900 characters, and do not include the primary character as the persona.' },
            { role: "user", content: messages.slice(-18).map((message) => `${message.role}: ${text2(message.content, 700)}`).join(`
`).slice(-9000) || `Known persona: ${state.pocketPersona.displayName}` }
          ],
          parameters: { temperature: 0.2, max_tokens: 360 },
          userId
        }, userId);
        const preview = normalizePocketPersona({ ...state.pocketPersona, ...response, source: "generated", linkedPersonaId: "", updatedAt: nowIso() }, state.pocketPersona);
        send({ type: "lumiphone:pocket_persona_preview", requestId, persona: preview }, userId);
        break;
      }
      case "lumiphone:preview_context": {
        const state = await loadState(context.chatId, context.characterId, userId);
        const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
        if (!conversation)
          throw new Error("Choose a conversation to preview.");
        const contact = state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]);
        if (!contact)
          throw new Error("That conversation has no available contact.");
        const profile = await resolveContactProfile(contact, userId);
        const assembled = await assemblePocketContext({
          state,
          contact,
          conversation,
          preferences: await loadPreferences(userId),
          actorIdentity: contact.identityBrief || profile.description,
          getMessages: spindle.permissions.has("chat_mutation") ? () => spindle.chat.getMessages(context.chatId) : undefined
        });
        send({ type: "lumiphone:context_preview", requestId, conversationId: conversation.id, diagnostics: assembled.diagnostics }, userId);
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
          considerAmbientMessage(context.chatId, context.characterId, "roleplay-time", userId);
        });
        break;
      }
      case "lumiphone:action": {
        const result = await applyAction(payload, userId, "user");
        send({ type: "lumiphone:action_done", requestId, result }, userId);
        break;
      }
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
      case "lumiphone:composer_state": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
          if (!conversation?.outgoingBurst?.open || conversation.outgoingBurst.finalized)
            return;
          conversation.outgoingBurst.held = bool2(payload.held);
          conversation.outgoingBurst.updatedAt = nowIso();
          await saveState(state, userId);
        });
        if (!bool2(payload.held))
          scheduleReplyBurst(context.chatId, context.characterId, text2(payload.conversationId, 180), userId);
        break;
      }
      case "lumiphone:generate_message":
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
          if (conversation?.outgoingBurst) {
            conversation.outgoingBurst.open = false;
            conversation.outgoingBurst.finalized = true;
            conversation.outgoingBurst.updatedAt = nowIso();
            await saveState(state, userId);
          }
        });
        await generateMessage({ ...payload, manualOverride: true }, userId);
        break;
      case "lumiphone:retry_message": {
        const state = await loadState(context.chatId, context.characterId, userId);
        const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
        const message = conversation?.messages.find((entry) => entry.id === text2(payload.messageId, 180));
        if (!conversation || !message || message.sender !== "contact")
          throw new Error("That generated message can no longer be retried.");
        await generateMessage({
          ...payload,
          replaceMessageId: message.id,
          speakerContactId: message.senderContactId,
          instruction: "Generate a different natural reply for this same point in the phone conversation."
        }, userId);
        break;
      }
      case "lumiphone:continue_relay": {
        const state = await loadState(context.chatId, context.characterId, userId);
        const conversationId = text2(payload.conversationId, 180);
        const relay = [...state.relays].reverse().find((entry) => entry.status === "pending" && (!conversationId || entry.conversationId === conversationId));
        if (!relay)
          throw new Error("There is no pending Pocket handoff for this conversation.");
        requestRelayContinuation(context.chatId, context.characterId, relay.id, userId);
        break;
      }
      case "lumiphone:test_generation": {
        const testRequestId = requestId || id("connection_test");
        const existing = await loadPreferences(userId);
        await savePreferences({
          ...existing,
          generationMode: payload.generationMode === "sidecar" ? "sidecar" : "roleplay",
          sidecarConnectionId: text2(payload.sidecarConnectionId, 180),
          sidecarModelOverride: text2(payload.sidecarModelOverride, 500)
        }, userId);
        const started = Date.now();
        const response = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, "connection-test", testRequestId, {
          type: "quiet",
          messages: [{ role: "user", content: "Reply with exactly POCKET_OK" }],
          parameters: { temperature: 0, max_tokens: 16 },
          userId
        }, userId);
        send({ type: "lumiphone:generation_test_result", requestId: testRequestId, ok: text2(response.content, 100).includes("POCKET_OK"), latencyMs: Date.now() - started }, userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "generation_test");
        break;
      }
      case "lumiphone:gallery_list":
        send({ type: "lumiphone:gallery", requestId, scope: payload.scope, ...await listGallery(payload, userId) }, userId);
        break;
      case "lumiphone:gallery_add_to_chat": {
        if (!spindle.permissions.has("chat_mutation"))
          throw new Error("Enable Chat Mutation to add a Gallery image to the roleplay chat.");
        const imageId = text2(payload.imageId, 180);
        const asset = imageId && spindle.permissions.has("images") ? await spindle.images.get(imageId, { specificity: "full", userId }) : null;
        const imageUrl = text2(asset?.url ?? payload.imageUrl, 2000);
        if (!imageUrl)
          throw new Error("That Gallery image is unavailable.");
        const label = (text2(asset?.original_filename ?? payload.filename, 180) || "Pocket photo").replace(/[\[\]]/g, "");
        const messages = await spindle.chat.getMessages(context.chatId);
        const target = [...messages].reverse().find((message) => message.role === "assistant" && text2(message.content, 40000));
        if (!target?.id)
          throw new Error("There is no existing narrative response to attach this image to yet.");
        const marker = `![${label}](${imageUrl})`;
        const content = `${text2(target.content, 40000)}

${marker}`;
        await spindle.chat.updateMessage(context.chatId, String(target.id), { content });
        send({ type: "lumiphone:gallery_action_done", requestId, action: "add-to-chat", messageId: target.id, message: "Added to the latest narrative response." }, userId);
        break;
      }
      case "lumiphone:gallery_set_wallpaper": {
        const imageId = text2(payload.imageId, 180);
        if (!imageId || !spindle.permissions.has("images"))
          throw new Error("That Gallery image is unavailable.");
        const source = { kind: "gallery", imageId };
        assertPocketImageResolved(await resolvePocketImageSource(spindle, source, userId));
        const preferences = await loadPreferences(userId);
        assignWallpaper(preferences, { ...payload, target: payload.personaId ? payload.target === "chat" ? "persona-chat" : "persona-home" : payload.target === "chat" ? "device-chat" : "device-home" }, source);
        await savePreferences(preferences, userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "preferences");
        send({ type: "lumiphone:gallery_action_done", requestId, action: "set-wallpaper", message: payload.target === "chat" ? "Chat wallpaper updated." : "Home wallpaper updated." }, userId);
        break;
      }
      case "lumiphone:set_wallpaper": {
        const preferences = await loadPreferences(userId);
        const source = payload.source === null ? null : normalizeImageSource(payload.source);
        if (payload.source !== null && !source)
          throw new Error("Choose a valid Gallery image, uploaded asset, or HTTPS image URL.");
        if (source)
          assertPocketImageResolved(await resolvePocketImageSource(spindle, source, userId));
        assignWallpaper(preferences, payload, source);
        await savePreferences(preferences, userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "preferences");
        break;
      }
      case "lumiphone:upload_wallpaper_asset": {
        if (!spindle.permissions.has("images"))
          throw new Error("Enable Images to upload a Pocket background.");
        const dataUrl = text2(payload.dataUrl, 12000000);
        if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(dataUrl))
          throw new Error("Choose a valid image file.");
        const image = await spindle.images.uploadFromDataUrl(dataUrl, {
          originalFilename: text2(payload.filename, 240) || "pocket-background",
          owner_character_id: context.characterId === "_none" ? undefined : context.characterId,
          owner_chat_id: context.chatId === "_lobby" ? undefined : context.chatId,
          userId
        });
        const source = { kind: "asset", assetId: image.id };
        assertPocketImageResolved(await resolvePocketImageSource(spindle, source, userId));
        const preferences = await loadPreferences(userId);
        assignWallpaper(preferences, payload, source);
        await savePreferences(preferences, userId);
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "preferences");
        send({ type: "lumiphone:wallpaper_uploaded", requestId, imageId: image.id }, userId);
        break;
      }
      case "lumiphone:set_contact_photo": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const contact = state.contacts.find((entry) => entry.id === text2(payload.contactId, 180));
          if (!contact)
            throw new Error("That contact no longer exists.");
          contact.avatarOverrideUrl = payload.useSource === true ? "" : text2(payload.imageUrl, 2000);
          contact.updatedAt = nowIso();
          await saveState(state, userId);
          await sendState(state, userId, "contact_photo");
          send({ type: "lumiphone:gallery_action_done", requestId, action: "set-contact-photo", message: `${contact.name} photo updated.` }, userId);
        });
        break;
      }
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
          const notificationId = text2(payload.notificationId, 180);
          if (notificationId)
            markNotificationRead(state.notifications, notificationId);
          const conversationId = text2(payload.conversationId, 180);
          const legacyContactId = text2(payload.contactId, 180);
          const conversation = state.conversations.find((entry) => entry.id === conversationId) || state.conversations.find((entry) => entry.kind === "direct" && entry.participantContactIds[0] === legacyContactId);
          if (conversation) {
            conversation.unread = 0;
            conversation.messages.forEach((message) => {
              message.read = true;
              message.status = "read";
            });
            state.notifications.forEach((entry) => {
              if (entry.route?.app === "messages" && entry.route.conversationId === conversation.id)
                entry.read = true;
            });
          } else if (app && app !== "messages") {
            state.notifications.forEach((entry) => {
              if (entry.app === app)
                entry.read = true;
            });
          }
          await saveState(state, userId);
          await sendState(state, userId, "read");
        });
        break;
      }
      case "lumiphone:notification_dismiss":
      case "lumiphone:notification_mark_read":
      case "lumiphone:notifications_clear": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          if (payload.type === "lumiphone:notification_dismiss")
            dismissNotification(state.notifications, text2(payload.notificationId, 180), nowIso());
          else if (payload.type === "lumiphone:notification_mark_read")
            markNotificationRead(state.notifications, text2(payload.notificationId, 180));
          else
            clearNotifications(state.notifications, payload.mode === "read" ? "read" : "all", nowIso());
          await saveState(state, userId);
          await sendState(state, userId, "notifications");
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
        send({ type: "lumiphone:swarm_profile", requestId, profile: await resolveSwarmProfile(context.chatId, context.characterId, await loadPreferences(userId), userId) }, userId);
        break;
      }
      case "lumiphone:export_data": {
        const state = await loadState(context.chatId, context.characterId, userId);
        send({ type: "lumiphone:export_data", requestId, data: { product: "Pocket", exportVersion: 5, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId) } }, userId);
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
        let importedPreferences = null;
        if (payload.data.preferences !== undefined) {
          const existing = await loadPreferences(userId);
          importedPreferences = normalizePreferences(payload.data.preferences);
          await validateChangedWallpaperSources(existing, importedPreferences, userId);
        }
        await saveState(state, userId);
        if (importedPreferences)
          await savePreferences(importedPreferences, userId);
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
        action: { type: "string", enum: ["message", "contact", "scene", "note", "event", "weather", "tracker", "camera", "notify", "open"] },
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
      let state = await loadState(chatId, characterId, context.userId);
      const metadataRelayId = relayIdFromMessages(messages);
      const generationRelay = state.relays.find((entry) => entry.status === "pending" && entry.continuation.generationId === context.generationId);
      const launching = state.relays.filter((entry) => entry.status === "pending" && entry.continuation.state === "launching" && !entry.continuation.generationId);
      const targetRelayId = metadataRelayId || generationRelay?.id || (launching.length === 1 ? launching[0].id : "");
      if (targetRelayId && context.generationId) {
        state = await withStateLock(stateKey(chatId, characterId), async () => {
          const current = await loadState(chatId, characterId, context.userId);
          const target = current.relays.find((entry) => entry.id === targetRelayId && entry.status === "pending");
          if (target && !target.continuation.generationId) {
            target.continuation.generationId = context.generationId;
            await saveState(current, context.userId);
          }
          return current;
        });
      }
      const relay = pendingRelayContext(state, { relayId: targetRelayId, maxChars: 3600 });
      const injected = { role: "system", content: `${PHONE_GUIDANCE}
Current Pocket snapshot:
${projectPhoneContext(state)}${relay ? `

${relay}` : ""}` };
      return { messages: [...messages, injected], breakdown: [{ messageIndex: messages.length, name: relay ? "Pocket memory + matched handoff" : "Pocket memory" }] };
    } catch {
      return messages;
    }
  }, 70);
}
spindle.frontendCapabilities.declare("message_tag_interceptor");
spindle.onFrontendMessage(handleFrontend);
spindle.on("TOOL_INVOCATION", async (payload, eventUserId) => {
  if (payload.toolName !== "phone_action")
    return "";
  try {
    const userId = eventUserId || text2(payload.userId, 180) || undefined;
    const args = isRecord(payload.args) ? payload.args : {};
    const merged = {
      ...args,
      ...isRecord(args.payload) ? args.payload : {},
      payload: args.payload,
      idempotencyKey: text2(payload.requestId, 240),
      messageId: text2(payload.messageId, 180)
    };
    const result = await applyAction(merged, userId, "model");
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
spindle.on("PERSONA_CHANGED", async (_payload, userId) => {
  try {
    if (!spindle.permissions.has("chats"))
      return;
    const chat = await spindle.chats.getActive(userId);
    const chatId = text2(chat?.id, 180);
    if (!chatId)
      return;
    const characterId = text2(chat?.character_id, 180) || "_none";
    await sendState(await loadState(chatId, characterId, userId), userId, "persona_changed");
  } catch {}
});
spindle.on("GENERATION_STARTED", async (payload, userId) => {
  const chatId = text2(payload?.chatId, 180);
  const generationId = text2(payload?.generationId, 180);
  if (!chatId || !generationId || !spindle.permissions.has("chats"))
    return;
  try {
    const chat = await spindle.chats.get(chatId, userId);
    const characterId = text2(chat?.character_id, 180) || "_none";
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId);
      let relay = relayForGeneration(state, generationId);
      if (!relay) {
        const launching = state.relays.filter((entry) => entry.status === "pending" && entry.continuation.state === "launching" && !entry.continuation.generationId);
        if (launching.length === 1)
          relay = launching[0];
      }
      if (!relay)
        return;
      relay.continuation.state = "started";
      relay.continuation.generationId = generationId;
      relay.continuation.generationStartedAt = nowIso();
      relay.continuation.error = undefined;
      await saveState(state, userId);
      await sendState(state, userId, "relay_started");
      spindle.log.info(`Pocket observed GENERATION_STARTED: relay=${relay.id} generation=${generationId}`);
    });
  } catch (error) {
    spindle.log.warn(`Pocket could not associate GENERATION_STARTED: ${error instanceof Error ? error.message : String(error)}`);
  }
});
spindle.on("GENERATION_ENDED", async (payload, userId) => {
  const chatId = text2(payload?.chatId, 180);
  const messageId = text2(payload?.messageId, 180);
  const generationId = text2(payload?.generationId, 180);
  if (!chatId || !spindle.permissions.has("chats"))
    return;
  try {
    const chat = await spindle.chats.get(chatId, userId);
    const characterId = text2(chat?.character_id, 180) || "_none";
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId);
      let changed = false;
      const relay = generationId ? relayForGeneration(state, generationId) : undefined;
      if (relay) {
        if (payload?.error || !messageId)
          relay.continuation = { ...relay.continuation, state: "failed", error: text2(payload?.error, 500) || "The roleplay continuation did not produce a message." };
        else {
          relay.status = "consumed";
          relay.consumedAt = nowIso();
          relay.consumedMessageId = messageId;
          relay.continuation = { ...relay.continuation, state: "completed", error: undefined };
        }
        changed = true;
        spindle.log.info(`Pocket observed GENERATION_ENDED: relay=${relay.id} generation=${generationId || "unknown"} status=${relay.status} message=${messageId || "none"}`);
      }
      if (messageId && state.sceneSnapshot && state.sceneSnapshot.sourceMessageId !== messageId) {
        state.sceneSnapshot.stale = true;
        changed = true;
      }
      if (!changed)
        return;
      await saveState(state, userId);
      await sendState(state, userId, relay ? relay.status === "consumed" ? "relay_consumed" : "relay_failed" : "scene_stale");
    });
  } catch (error) {
    spindle.log.warn(`Pocket could not mark the scene snapshot stale: ${error instanceof Error ? error.message : String(error)}`);
  }
});
spindle.on("GENERATION_STOPPED", async (payload, userId) => {
  const chatId = text2(payload?.chatId, 180);
  const generationId = text2(payload?.generationId, 180);
  if (!chatId || !generationId || !spindle.permissions.has("chats"))
    return;
  try {
    const chat = await spindle.chats.get(chatId, userId);
    const characterId = text2(chat?.character_id, 180) || "_none";
    await withStateLock(stateKey(chatId, characterId), async () => {
      const state = await loadState(chatId, characterId, userId);
      const relay = relayForGeneration(state, generationId);
      if (!relay)
        return;
      relay.continuation = { ...relay.continuation, state: "stopped", error: "Generation was stopped. The relay remains pending." };
      await saveState(state, userId);
      await sendState(state, userId, "relay_stopped");
    });
  } catch {}
});
spindle.on("CHARACTER_MESSAGE_RENDERED", async (payload, userId) => {
  const chatId = text2(payload?.chatId, 180);
  if (!chatId)
    return;
  try {
    const chat = spindle.permissions.has("chats") ? await spindle.chats.get(chatId, userId) : null;
    const characterId = text2(chat?.character_id, 180) || "_none";
    considerAmbientMessage(chatId, characterId, "turn", userId);
  } catch {}
});
spindle.log.info("Pocket backend loaded.");
