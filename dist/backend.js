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
  const contacts = state.contacts.filter((contact) => contact.presence.inScene || contact.contextPolicy.pinned || contact.relationship === "close").slice(0, 12).map((contact) => ({
    id: contact.id.slice(0, 180),
    name: contact.name.slice(0, 120),
    role: contact.role.slice(0, 120),
    source: contact.source.kind,
    relationship: contact.relationship,
    inScene: contact.presence.inScene,
    pinned: contact.contextPolicy.pinned,
    identityBrief: (contact.identityBrief || contact.description || "").slice(0, 360),
    sceneNote: (contact.sceneNote || "").slice(0, 240)
  }));
  const discoveredActors = state.discoveredActors || [];
  const knownContactIds = new Set(discoveredActors.map((actor) => actor.promotedContactId).filter(Boolean));
  for (const actor of discoveredActors.filter((entry) => entry.relationship === "close" && !knownContactIds.has(entry.promotedContactId)).slice(0, Math.max(0, 12 - contacts.length))) {
    contacts.push({
      id: actor.id.slice(0, 180),
      name: actor.displayName.slice(0, 120),
      role: "Discovered actor",
      source: "discovered",
      relationship: "close",
      inScene: false,
      pinned: false,
      identityBrief: "",
      sceneNote: ""
    });
  }
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
      view: raw.view === "detail" || raw.view === "config" || raw.view === "import" || raw.view === "new" || raw.view === "draft" || raw.view === "list" ? raw.view : undefined
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
function percentage(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback;
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
function contactAvatar(contact) {
  return contact.avatarOverrideUrl || contact.sourceAvatarUrl || contact.avatarUrl;
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
      origin: value.origin === "generated" || value.origin === "scene" || value.origin === "discovered" ? value.origin : "manual",
      description: clean2(value.description, 600) || description,
      sceneKey: clean2(value.sceneKey, 180) || undefined,
      discoveredActorId: clean2(value.discoveredActorId, 180) || undefined,
      bankId: clean2(value.bankId, 180) || undefined
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
  const messagingStyle = record3(value.messagingStyle) ? value.messagingStyle : {};
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
    relationship: value.relationship === "close" ? "close" : "background",
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
    messagingStyle: {
      talkativeness: percentage(messagingStyle.talkativeness, 50),
      fragmentation: percentage(messagingStyle.fragmentation, 35)
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
  const senderActorId = sender === "contact" ? clean2(value.senderActorId, 180) || senderContactId : undefined;
  const senderActorKind = sender === "contact" && value.senderActorKind === "discovered" ? "discovered" : sender === "contact" ? "contact" : undefined;
  const read = flag(value.read, sender !== "contact");
  const status = value.status === "pending" || value.status === "failed" || value.status === "sent" || value.status === "delivered" || value.status === "read" ? value.status : read ? "read" : "delivered";
  const generation = record3(value.generation) ? value.generation : null;
  const info = generation && record3(generation.info) ? generation.info : null;
  const decision = info && record3(info.replyDecision) ? info.replyDecision : null;
  const groupBatch = info && record3(info.groupBatch) ? info.groupBatch : null;
  const count = (input) => Math.max(0, Math.round(Number(input) || 0));
  return {
    id: clean2(value.id, 120) || makeId("msg"),
    sender,
    senderActorId,
    senderActorKind,
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
        groupBatch: groupBatch && clean2(groupBatch.id, 180) ? {
          id: clean2(groupBatch.id, 180),
          position: Math.max(1, count(groupBatch.position)),
          size: Math.max(1, count(groupBatch.size)),
          eligibleCount: count(groupBatch.eligibleCount)
        } : undefined,
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
  const persistedContactIds = [...new Set((Array.isArray(value.participantContactIds) ? value.participantContactIds : []).map((entry) => clean2(entry, 180)).filter(Boolean))].slice(0, 16);
  const participantActorIds = [...new Set((Array.isArray(value.participantActorIds) ? value.participantActorIds : persistedContactIds).map((entry) => clean2(entry, 180)).filter(Boolean))].slice(0, 16);
  if (!participantActorIds.length)
    return null;
  const participantContactIds = [...new Set([
    ...persistedContactIds.filter((entry) => contacts.some((contact) => contact.id === entry)),
    ...participantActorIds.filter((entry) => contacts.some((contact) => contact.id === entry))
  ])].slice(0, 16);
  const fallback = contacts.find((contact) => contact.id === participantActorIds[0]);
  const messages = (Array.isArray(value.messages) ? value.messages : []).map((entry) => normalizeMessage(entry, fallback, now, makeId)).filter((entry) => Boolean(entry)).slice(-MAX_MESSAGES);
  const kind = value.kind === "group" || participantActorIds.length > 1 ? "group" : "direct";
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
    title: clean2(value.title, 120) || (kind === "direct" ? fallback?.name || messages.at(-1)?.senderName || "Conversation" : participantActorIds.map((entry) => contacts.find((contact) => contact.id === entry)?.name).filter(Boolean).join(", ").slice(0, 120) || "Group"),
    participantActorIds,
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
    relationship: "background",
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
    messagingStyle: { talkativeness: 50, fragmentation: 35 },
    createdAt: context.now,
    updatedAt: context.now
  };
}
function ensureDirectConversation(state, contactId, now, makeId) {
  const existing = state.conversations.find((conversation2) => conversation2.kind === "direct" && (conversation2.participantActorIds?.[0] || conversation2.participantContactIds[0]) === contactId);
  if (existing)
    return existing;
  const contact = state.contacts.find((entry) => entry.id === contactId);
  const conversation = {
    id: makeId("conversation"),
    kind: "direct",
    title: contact?.name || "Conversation",
    participantActorIds: [contactId],
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
        participantActorIds: [contact.id],
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
    const actorId = conversation.participantActorIds[0];
    const duplicate = directByContact.get(actorId);
    if (!duplicate) {
      directByContact.set(actorId, conversation);
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

// src/domain/npc-bank.ts
var NPC_BANK_VERSION = 1;
var NPC_BANK_PATH = "device/npc-bank.json";
var MAX_NPC_BANK_ENTRIES = 240;
function record4(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function clean3(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function percentage2(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback;
}
function timestamp2(value, fallback) {
  const candidate = clean3(value, 40);
  return Number.isFinite(Date.parse(candidate)) ? candidate : fallback;
}
function accent(value, fallback = "#8b7dff") {
  const candidate = clean3(value, 20);
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}
function normalizeNpcBankName(value) {
  return clean3(value, 120).replace(/\s+/g, " ").toLocaleLowerCase();
}
function emptyNpcBank(now = new Date().toISOString()) {
  return { version: NPC_BANK_VERSION, entries: [], updatedAt: now };
}
function isFutureNpcBank(value) {
  return record4(value) && Number(value.version) > NPC_BANK_VERSION;
}
function normalizeNpcBank(value, now = new Date().toISOString()) {
  if (!record4(value) || isFutureNpcBank(value))
    return emptyNpcBank(now);
  const seen = new Set;
  const entries = (Array.isArray(value.entries) ? value.entries : []).slice(0, MAX_NPC_BANK_ENTRIES).flatMap((raw) => {
    if (!record4(raw))
      return [];
    const name = clean3(raw.name, 120).replace(/\s+/g, " ");
    const normalizedName = normalizeNpcBankName(name);
    const entryId = clean3(raw.id, 180);
    if (!name || !normalizedName || !entryId || seen.has(entryId))
      return [];
    seen.add(entryId);
    const aliases = [...new Set((Array.isArray(raw.aliases) ? raw.aliases : []).map((item) => clean3(item, 120).replace(/\s+/g, " ")).filter((item) => item && normalizeNpcBankName(item) !== normalizedName))].slice(0, 24);
    return [{
      id: entryId,
      name,
      normalizedName,
      aliases,
      role: clean3(raw.role, 120) || "Pocket NPC",
      identityBrief: clean3(raw.identityBrief ?? raw.description, 1200),
      avatarUrl: clean3(raw.avatarUrl, 2000),
      accent: accent(raw.accent),
      messagingStyle: {
        talkativeness: percentage2(record4(raw.messagingStyle) ? raw.messagingStyle.talkativeness : undefined, 50),
        fragmentation: percentage2(record4(raw.messagingStyle) ? raw.messagingStyle.fragmentation : undefined, 35)
      },
      tags: [...new Set((Array.isArray(raw.tags) ? raw.tags : []).map((item) => clean3(item, 80)).filter(Boolean))].slice(0, 24),
      createdAt: timestamp2(raw.createdAt, now),
      updatedAt: timestamp2(raw.updatedAt, now)
    }];
  });
  return { version: NPC_BANK_VERSION, entries, updatedAt: timestamp2(value.updatedAt, now) };
}
function findNpcBankMatch(bank, name) {
  const normalized = normalizeNpcBankName(name);
  if (!normalized)
    return null;
  const matches = bank.entries.filter((entry) => entry.normalizedName === normalized || entry.aliases.some((alias) => normalizeNpcBankName(alias) === normalized));
  return matches.length === 1 ? matches[0] : null;
}
function upsertNpcBankFromContact(bank, contact, now, makeId) {
  if (contact.source.kind !== "npc")
    throw new Error("Only Pocket NPC contacts can be saved to NPC Bank.");
  const sourceBankId = contact.source.bankId || "";
  const byId = sourceBankId ? bank.entries.find((entry2) => entry2.id === sourceBankId) : undefined;
  const byName = findNpcBankMatch(bank, contact.name);
  const existing = byId || byName || undefined;
  const name = contact.name.trim().replace(/\s+/g, " ").slice(0, 120);
  if (!name)
    throw new Error("NPC Bank entries need a name.");
  const previousName = existing?.name || "";
  const aliases = [...new Set([
    ...existing?.aliases || [],
    ...previousName && normalizeNpcBankName(previousName) !== normalizeNpcBankName(name) ? [previousName] : []
  ].map((item) => item.trim()).filter(Boolean))].slice(0, 24);
  const entry = {
    id: existing?.id || makeId("npcbank"),
    name,
    normalizedName: normalizeNpcBankName(name),
    aliases,
    role: contact.role || "Pocket NPC",
    identityBrief: contact.identityBrief || contact.description || "",
    avatarUrl: contact.avatarOverrideUrl || contact.sourceAvatarUrl || contact.avatarUrl || "",
    accent: accent(contact.accent),
    messagingStyle: {
      talkativeness: percentage2(contact.messagingStyle?.talkativeness, 50),
      fragmentation: percentage2(contact.messagingStyle?.fragmentation, 35)
    },
    tags: existing?.tags || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  bank.entries = [entry, ...bank.entries.filter((item) => item.id !== entry.id)].slice(0, MAX_NPC_BANK_ENTRIES);
  bank.updatedAt = now;
  return entry;
}
function contactFromNpcBank(entry, now, makeId) {
  return {
    id: makeId("contact"),
    name: entry.name,
    role: entry.role || "Pocket NPC",
    description: entry.identityBrief,
    identityBrief: entry.identityBrief,
    sceneNote: "",
    avatarUrl: entry.avatarUrl,
    sourceAvatarUrl: entry.avatarUrl,
    avatarOverrideUrl: "",
    accent: entry.accent,
    sourceAccent: "",
    colorMode: "pocket",
    source: { kind: "npc", origin: "manual", description: entry.identityBrief, bankId: entry.id },
    relationship: "background",
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
    messagingStyle: { ...entry.messagingStyle },
    createdAt: now,
    updatedAt: now
  };
}
function applyNpcBankProfile(contact, entry, now) {
  if (contact.source.kind !== "npc")
    return contact;
  contact.name = entry.name;
  contact.role = entry.role || contact.role;
  contact.description = entry.identityBrief;
  contact.identityBrief = entry.identityBrief;
  contact.avatarUrl = entry.avatarUrl;
  contact.sourceAvatarUrl = entry.avatarUrl;
  contact.accent = entry.accent;
  contact.messagingStyle = { ...entry.messagingStyle };
  contact.source = { ...contact.source, description: entry.identityBrief, bankId: entry.id };
  contact.updatedAt = now;
  return contact;
}
function removeNpcBankEntry(bank, bankId, now) {
  const before = bank.entries.length;
  bank.entries = bank.entries.filter((entry) => entry.id !== bankId);
  if (bank.entries.length === before)
    return false;
  bank.updatedAt = now;
  return true;
}

// src/domain/actors.ts
function normalizeActorName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLocaleLowerCase().slice(0, 160) : "";
}
function normalizeDiscoveredActors(value, chatId, now) {
  if (!Array.isArray(value))
    return [];
  const seen = new Set;
  return value.slice(-160).flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return [];
    const raw = entry;
    const displayName = typeof raw.displayName === "string" ? raw.displayName.trim().slice(0, 120) : "";
    const normalizedName = normalizeActorName(raw.normalizedName || displayName);
    const id = typeof raw.id === "string" ? raw.id.trim().slice(0, 180) : "";
    if (!id || !displayName || !normalizedName || seen.has(id))
      return [];
    seen.add(id);
    const source = raw.source === "roleplay" || raw.source === "messages" || raw.source === "group-chat" ? raw.source : "model-tool";
    return [{
      id,
      chatId,
      displayName,
      normalizedName,
      firstSeenAt: validDate(raw.firstSeenAt, now),
      lastSeenAt: validDate(raw.lastSeenAt, now),
      source,
      relationship: raw.relationship === "close" ? "close" : "background",
      promotedContactId: typeof raw.promotedContactId === "string" && raw.promotedContactId.trim() ? raw.promotedContactId.trim().slice(0, 180) : undefined
    }];
  });
}
function validDate(value, fallback) {
  const text2 = typeof value === "string" ? value.trim().slice(0, 40) : "";
  return Number.isFinite(Date.parse(text2)) ? text2 : fallback;
}
function conversationActorIds(conversation) {
  return conversation.participantActorIds?.length ? conversation.participantActorIds : conversation.participantContactIds;
}
function resolvePocketActor(state, actorId) {
  const contact = state.contacts.find((entry) => entry.id === actorId);
  if (contact)
    return contactPresentation(contact, actorId);
  const discovered = state.discoveredActors.find((entry) => entry.id === actorId);
  if (!discovered)
    return null;
  const promoted = discovered.promotedContactId ? state.contacts.find((entry) => entry.id === discovered.promotedContactId) : undefined;
  if (promoted)
    return { ...contactPresentation(promoted, actorId), discovered };
  return {
    actorId,
    kind: "discovered",
    name: discovered.displayName,
    role: discovered.relationship === "close" ? "Close connection" : "Discovered actor",
    identityBrief: "",
    accent: stableContactAccent(discovered.normalizedName || discovered.id),
    avatarUrl: "",
    relationship: discovered.relationship,
    discovered
  };
}
function contactPresentation(contact, actorId) {
  return {
    actorId,
    kind: "contact",
    name: contact.name,
    role: contact.role,
    identityBrief: contact.identityBrief || contact.description,
    accent: contactAccent(contact),
    avatarUrl: contactAvatar(contact),
    relationship: contact.relationship,
    contact
  };
}
function matchingActorIds(state, name, allowedIds) {
  const normalized = normalizeActorName(name);
  if (!normalized)
    return [];
  const allowed = allowedIds ? new Set(allowedIds) : null;
  const matches = [];
  const promotedActors = new Map(state.discoveredActors.filter((entry) => entry.promotedContactId).map((entry) => [entry.promotedContactId, entry.id]));
  for (const contact of state.contacts) {
    const actorId = promotedActors.get(contact.id) || contact.id;
    if ((!allowed || allowed.has(actorId)) && normalizeActorName(contact.name) === normalized && !matches.includes(actorId))
      matches.push(actorId);
  }
  for (const actor of state.discoveredActors) {
    if ((!allowed || allowed.has(actor.id)) && actor.normalizedName === normalized && !matches.includes(actor.id))
      matches.push(actor.id);
  }
  return matches;
}
function ensureDiscoveredActor(state, options) {
  const displayName = options.name.trim().replace(/\s+/g, " ").slice(0, 120);
  const normalizedName = normalizeActorName(displayName);
  if (!normalizedName)
    throw new Error("A discovered actor needs a name.");
  const existing = state.discoveredActors.find((entry) => entry.normalizedName === normalizedName);
  if (existing) {
    existing.displayName = displayName;
    existing.lastSeenAt = options.now;
    if (options.relationship === "close")
      existing.relationship = "close";
    return existing;
  }
  const actor = {
    id: options.makeId("actor"),
    chatId: state.chatId,
    displayName,
    normalizedName,
    firstSeenAt: options.now,
    lastSeenAt: options.now,
    source: options.source,
    relationship: options.relationship === "close" ? "close" : "background"
  };
  state.discoveredActors.push(actor);
  state.discoveredActors = state.discoveredActors.slice(-160);
  return actor;
}
function ensureDirectActorConversation(state, actorId, now, makeId) {
  const existing = state.conversations.find((conversation2) => conversation2.kind === "direct" && conversationActorIds(conversation2)[0] === actorId);
  if (existing)
    return existing;
  const actor = resolvePocketActor(state, actorId);
  if (!actor)
    throw new Error("Choose a valid actor before opening a conversation.");
  const participantContactIds = actor.contact ? [actor.contact.id] : [];
  const conversation = {
    id: makeId("conversation"),
    kind: "direct",
    title: actor.name,
    participantActorIds: [actorId],
    participantContactIds,
    messages: [],
    unread: 0,
    availability: { state: "remote" },
    createdAt: now,
    updatedAt: now
  };
  state.conversations.push(conversation);
  return conversation;
}
function actorAsGenerationContact(actor, now) {
  if (actor.contact)
    return actor.contact;
  return {
    id: actor.actorId,
    name: actor.name,
    role: actor.role,
    description: "",
    identityBrief: "",
    sceneNote: "",
    avatarUrl: "",
    sourceAvatarUrl: "",
    avatarOverrideUrl: "",
    accent: actor.accent,
    sourceAccent: "",
    colorMode: "pocket",
    source: { kind: "npc", origin: "discovered", description: "", discoveredActorId: actor.actorId },
    relationship: actor.relationship,
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: actor.relationship === "close" },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
    messagingStyle: { talkativeness: actor.relationship === "close" ? 58 : 42, fragmentation: 35 },
    createdAt: actor.discovered?.firstSeenAt || now,
    updatedAt: actor.discovered?.lastSeenAt || now
  };
}
function promoteDiscoveredActor(state, actorId, now, makeId) {
  const actor = state.discoveredActors.find((entry) => entry.id === actorId);
  if (!actor)
    throw new Error("That discovered actor no longer exists.");
  const existing = actor.promotedContactId ? state.contacts.find((entry) => entry.id === actor.promotedContactId) : undefined;
  if (existing)
    return existing;
  const contactId = makeId("contact");
  const contact = {
    id: contactId,
    name: actor.displayName,
    role: "Pocket NPC",
    description: "",
    identityBrief: "",
    sceneNote: "",
    avatarUrl: "",
    sourceAvatarUrl: "",
    avatarOverrideUrl: "",
    accent: stableContactAccent(actor.normalizedName),
    sourceAccent: "",
    colorMode: "pocket",
    source: { kind: "npc", origin: "discovered", description: "", discoveredActorId: actor.id },
    relationship: actor.relationship,
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: actor.relationship === "close" },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
    messagingStyle: { talkativeness: actor.relationship === "close" ? 58 : 42, fragmentation: 35 },
    createdAt: now,
    updatedAt: now
  };
  state.contacts.push(contact);
  actor.promotedContactId = contact.id;
  actor.lastSeenAt = now;
  for (const conversation of state.conversations) {
    if (conversationActorIds(conversation).includes(actor.id) && !conversation.participantContactIds.includes(contact.id))
      conversation.participantContactIds.push(contact.id);
  }
  return contact;
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
function clean4(value, max) {
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
function participantActorIds(conversation) {
  return conversation.participantActorIds?.length ? conversation.participantActorIds : conversation.participantContactIds;
}
function actorDisplayName(state, actorId) {
  const direct = state.contacts.find((entry) => entry.id === actorId);
  if (direct)
    return direct.name;
  const discovered = state.discoveredActors?.find((entry) => entry.id === actorId);
  if (!discovered)
    return actorId;
  const promoted = discovered.promotedContactId ? state.contacts.find((entry) => entry.id === discovered.promotedContactId) : undefined;
  return promoted?.name || discovered.displayName;
}
function currentChannelLines(state, contact, conversation) {
  const persona = state.pocketPersona.displayName?.trim() || "You";
  const actorIds = participantActorIds(conversation);
  const actorNames = actorIds.map((actorId) => actorDisplayName(state, actorId)).filter(Boolean);
  if (conversation.kind === "direct") {
    const other = actorNames[0] || contact.name || conversation.title || "the contact";
    return [
      "TYPE: DIRECT MESSAGE",
      `PERSONA / PHONE OWNER / RECIPIENT: ${persona}`,
      `CONTACT / GENERATED SPEAKER: ${contact.name}`,
      `DM PARTICIPANTS: ${persona}, ${other}`,
      `TARGET LOCK: ${contact.name} is writing this phone message TO ${persona}. ${persona} is the current interlocutor and recipient.`,
      `This private DM belongs only to ${persona} and ${other}.`,
      "The active roleplay character, scene focal actor, recently mentioned actor, or actor from another phone thread is NOT the recipient merely because they are salient.",
      "Other actors may be discussed as third parties. Do not address them as though they can read this DM.",
      `Never replace ${persona} as the recipient unless the channel itself changes.`
    ];
  }
  return [
    "TYPE: GROUP CHAT",
    `PERSONA / PHONE OWNER: ${persona}`,
    `CURRENT GROUP ACTORS: ${actorNames.join(", ") || "(none)"}`,
    `CURRENT CHANNEL MEMBERS: ${[persona, ...actorNames].join(", ")}`,
    "TARGET LOCK: generated group messages are visible only to the CURRENT CHANNEL MEMBERS listed above.",
    "Messages from actors who have since left the group remain historical context only; they are not current participants, recipients, or eligible speakers.",
    "A former/absent actor may be discussed as a third party, but must not be directly addressed as though they can read this group chat.",
    "Actors mentioned only in scene, story, recent roleplay, another phone conversation, or message text do not become group members."
  ];
}
function threadLine(state, conversation, message) {
  const persona = state.pocketPersona.displayName || "You";
  const sender = message.sender === "persona" ? persona : message.senderName || "Pocket";
  if (conversation.kind !== "group" || message.sender !== "contact")
    return `${sender}: ${clean4(message.text, 520)}`;
  const currentIds = new Set([...participantActorIds(conversation), ...conversation.participantContactIds]);
  const senderId = message.senderActorId || message.senderContactId || "";
  const former = Boolean(senderId && !currentIds.has(senderId));
  return `${sender}${former ? " [former participant; historical only]" : ""}: ${clean4(message.text, 520)}`;
}
function trimBlock(lines, budget) {
  return lines.filter(Boolean).join(`
`).slice(0, budget);
}
async function assemblePocketContext(options) {
  const { state, contact, conversation, preferences } = options;
  const mode = preferences.roleplayContextMode;
  const includeRoleplayBackground = options.includeRoleplayBackground !== false;
  const hostMessages = includeRoleplayBackground && options.getMessages ? await options.getMessages().catch(() => []) : [];
  const authoritative = hostMessages.at(-1);
  const authoritativeLatest = authoritative ? {
    id: clean4(authoritative.id, 180),
    index: messageIndex(authoritative, hostMessages.length - 1),
    excerpt: clean4(authoritative.content, 180)
  } : { id: "", index: -1, excerpt: "" };
  const actorIdentity = clean4(options.actorIdentity || contact.identityBrief || contact.description, BUDGETS.actor);
  const channel = trimBlock(currentChannelLines(state, contact, conversation), 1400);
  const scene = trimBlock(sceneLines(state), BUDGETS.scene);
  const includePhoneThread = options.includePhoneThread !== false;
  const threadLines = includePhoneThread ? conversation.messages.slice(-20).map((message) => threadLine(state, conversation, message)) : [];
  const thread = trimBlock(threadLines, BUDGETS.thread);
  const wantsRecent = includeRoleplayBackground && (mode === "recent" || mode === "smart" && (conversation.messages.length > 0 || contact.presence.inScene || Boolean(contact.sceneNote)));
  const selectedRecent = mode !== "off" && wantsRecent && preferences.recentRoleplayMessages > 0 ? hostMessages.slice(-preferences.recentRoleplayMessages) : [];
  const recentLines = selectedRecent.map((message, index) => {
    const role = message.role === "user" ? `Pocket Persona (${state.pocketPersona.displayName?.trim() || "You"})` : message.role === "assistant" ? `Active RP Character (${state.characterName || "Character"})` : "System";
    const anchor = clean4(message.id, 180);
    const source = anchor ? ` [${anchor} #${messageIndex(message, hostMessages.length - selectedRecent.length + index)}]` : "";
    return `${role}${source}: ${clean4(message.content, 520)}`;
  }).filter((line) => !line.endsWith(": "));
  const recent = trimBlock(recentLines, BUDGETS.recent);
  const includedMessage = selectedRecent.at(-1);
  const includedLatest = includedMessage ? {
    id: clean4(includedMessage.id, 180),
    index: messageIndex(includedMessage, hostMessages.length - 1),
    excerpt: clean4(includedMessage.content, 180)
  } : { id: "", index: -1, excerpt: "" };
  const storySource = mode !== "off" && (mode === "story" || mode === "smart" || !includeRoleplayBackground) ? storyLines(state, contact) : [];
  const story = trimBlock(storySource, BUDGETS.story);
  const parts = [
    actorIdentity ? `ACTOR IDENTITY
${actorIdentity}` : "",
    scene ? `SCENE SNAPSHOT${state.sceneSnapshot?.stale ? " (STALE)" : ""}
${scene}` : "",
    recent ? `RECENT ROLEPLAY BACKGROUND \u2014 NOT PHONE CHANNEL
${recent}` : "",
    story ? `STORY CONTEXT
${story}` : "",
    thread ? `PHONE THREAD
${thread}` : ""
  ].filter(Boolean);
  const bodyText = mode === "off" ? [actorIdentity ? `ACTOR IDENTITY
${actorIdentity}` : "", thread ? `PHONE THREAD
${thread}` : ""].filter(Boolean).join(`

`) : parts.join(`

`);
  const finalLock = channel ? `FINAL CHANNEL LOCK
${channel}` : "";
  const bodyBudget = Math.max(0, BUDGETS.total - finalLock.length - (finalLock ? 2 : 0));
  const finalText = [bodyText.slice(0, bodyBudget), finalLock].filter(Boolean).join(`

`);
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
    const actorName = contact?.name || relay.contactId;
    const personaName = state.pocketPersona.displayName || "the current Persona";
    const physicalState = relay.reason === "arrived" || relay.reason === "in_scene" ? `${actorName} is now physically present in the current scene.` : `${actorName} has moved the interaction from the phone into the physical scene.`;
    return [
      "=== POCKET CONTINUITY RELAY \u2014 NEWER STATE ===",
      `relayId: ${relay.id}`,
      `actor: ${actorName}`,
      "transition: remote -> local",
      `reason: ${relay.reason}`,
      "",
      `${actorName} and ${personaName} were texting immediately before this generation. ${physicalState} This information is newer than older roleplay scene state and supersedes conflicting location or presence information.`,
      "",
      `Immediate phone exchange:
${relay.conversationTail.text}`,
      "",
      "Continue the physical roleplay from this handoff. Do not generate another remote phone reply unless the user explicitly texts from the scene.",
      "=== END POCKET CONTINUITY RELAY ==="
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

// src/backend/references.ts
function compact2(value, max) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}
function availabilityCopy(conversation) {
  if (conversation.availability.state === "local")
    return "The direct conversation is currently local, but this reference itself does not establish anyone\u2019s presence.";
  if (conversation.availability.state === "arriving")
    return "The conversation says a participant is arriving; only explicit scene state may establish physical presence.";
  if (conversation.availability.state === "paused")
    return `The remote conversation is paused (${conversation.availability.reason}).`;
  return "This is a remote phone conversation.";
}
function createPocketReference(input) {
  const { state, conversation, scope, createdAt, makeId } = input;
  const selected = new Set((input.selectedMessageIds || []).slice(0, 12));
  const sourceMessages = scope === "selected_messages" ? conversation.messages.filter((message) => selected.has(message.id)).slice(-8) : conversation.messages.slice(scope === "recent_messages" ? -6 : -8);
  const messages = sourceMessages.flatMap((message) => message.sender === "system" ? [] : [{
    messageId: message.id,
    sender: message.sender,
    senderActorId: message.senderActorId,
    senderContactId: message.senderContactId,
    senderName: compact2(message.senderName || (message.sender === "persona" ? state.pocketPersona.displayName : "Participant"), 120),
    text: compact2(message.text, 420),
    createdAt: message.createdAt
  }]);
  const participants = conversationActorIds(conversation).slice(0, 16).flatMap((actorId) => {
    const actor = resolvePocketActor(state, actorId);
    if (!actor)
      return [];
    return [{
      actorId,
      contactId: actor.contact?.id,
      name: compact2(actor.name, 120),
      role: compact2(actor.role, 100),
      identityBrief: compact2(actor.identityBrief, 180)
    }];
  });
  const kind = conversation.kind === "group" ? "Group chat" : "Direct message";
  const participantNames = participants.map((entry) => entry.name).join(", ") || "Unknown participants";
  return {
    id: makeId("reference"),
    chatId: state.chatId,
    characterId: state.characterId,
    sourceApp: "messages",
    conversationId: conversation.id,
    conversationTitle: compact2(conversation.title || participantNames, 120) || "Pocket conversation",
    conversationKind: conversation.kind,
    scope,
    visibility: "context",
    participants,
    snapshot: compact2(`${kind} with ${participantNames}. ${availabilityCopy(conversation)}`, 600),
    messages,
    createdAt,
    status: "armed"
  };
}
function serializePocketReference(reference, maxChars = 2200) {
  const budget = Math.max(1200, Math.min(3000, maxChars));
  const participantNames = compact2(reference.participants.map((entry) => entry.name).join(", "), 360) || "Unknown participants";
  const identityRows = reference.participants.slice(0, 8).map((entry) => {
    const detail = [entry.role, entry.identityBrief].filter(Boolean).join(" \u2014 ");
    return detail ? `- ${entry.name}: ${detail}` : `- ${entry.name}`;
  });
  const messageRows = reference.messages.map((message) => `${message.senderName}: ${JSON.stringify(compact2(message.text, 360))}`);
  const fixedStart = [
    "=== POCKET USER REFERENCE \u2014 THIS TURN ===",
    `referenceId: ${reference.id}`,
    `source: messages/${reference.conversationId}`,
    `scope: ${reference.scope}`,
    `Conversation: ${reference.conversationTitle}`,
    `Participants: ${participantNames}`,
    "",
    `Pocket context: ${compact2(reference.snapshot, 320)}`
  ];
  const fixedEnd = [
    "",
    "This is phone/social context explicitly attached by the user for this roleplay turn. It does not hand off the conversation, change channel ownership, or establish that any participant is physically present.",
    "Use it only to understand the user\u2019s roleplay message. Do not assume a scene actor saw, heard, or knows the phone content unless the user\u2019s narration establishes that.",
    "=== END POCKET USER REFERENCE ==="
  ];
  const render = () => [
    ...fixedStart,
    ...identityRows.length ? ["", "Participant context:", ...identityRows] : [],
    "",
    "Referenced phone messages:",
    ...messageRows,
    ...fixedEnd
  ].join(`
`);
  let serialized = render();
  while (serialized.length > budget && identityRows.length > 2) {
    identityRows.pop();
    serialized = render();
  }
  while (serialized.length > budget && messageRows.length > 1) {
    messageRows.shift();
    serialized = render();
  }
  if (serialized.length <= budget)
    return serialized;
  const ending = `
${fixedEnd.join(`
`)}`;
  const beginning = [...fixedStart, "", "Referenced phone messages:", messageRows.at(-1) || "(No referenced message text was available.)"].join(`
`);
  return `${beginning.slice(0, Math.max(0, budget - ending.length)).trimEnd()}${ending}`;
}
function referenceForGeneration(state, generationId) {
  return state.references.find((reference) => reference.status === "injected" && reference.injectedGenerationId === generationId);
}
function latestArmedReference(state) {
  return [...state.references].reverse().find((reference) => reference.status === "armed");
}

// src/backend.ts
var STATE_VERSION = 10;
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
var groupBatchFlights = new Map;
var frontendViews = new Map;
var PHONE_GUIDANCE = `Pocket is the authoritative persistence layer for in-world phone state.

Pocket reference blocks are read-only history. Their messages already happened. Never recreate, resend, or restyle a referenced message merely because it appears in the prompt.

When this request exposes a Pocket Action function/tool, CALL that tool for every newly-created phone action that should persist in Pocket, especially a message sent or received during the generated scene. Do not write the tool name, arguments, JSON, or a fake tool result into narrative prose. Do not substitute markdown, inline code, custom typography, colors, labels, or preset-specific text styling for a Pocket message. Normal prose may narrate the physical act of using the phone; Pocket owns the persisted message payload.

For a new direct message, use action="message" with payload containing channel="dm", speaker (or sender="persona" for the user's persona), target or conversationId, and text. For a group message, use channel="gc", an existing group/conversation, a speaker who is already a member, and text. A new named DM actor may be lightweight; Pocket can persist them without a full profile. Creating or changing group membership requires action="conversation".

ONLY when no Pocket Action function/tool is present in the model's available tools, emit hidden machine data using one <lumi-phone> tag per distinct Pocket action (maximum 3):
<lumi-phone action="message">{"channel":"dm","speaker":"Name","target":"Name","text":"message text"}</lumi-phone>
The tag is machine data and will be removed from the rendered roleplay. Do not explain it, quote it, wrap it in markdown, or imitate it elsewhere in the response. Other supported actions are conversation, contact, scene, note, event, weather, tracker, camera, notify, and open.

Pocket messages, contacts, notes, calendar events, weather, trackers, and scene state persist separately for this chat and character.`;
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
    setup: { initialized: false, dismissed: false, personaConfigured: false, worldStatus: "unconfigured" },
    contacts: collections.contacts,
    discoveredActors: [],
    conversations: collections.conversations,
    notes: [],
    events: [],
    relays: [],
    references: [],
    groupBatches: [],
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
  const discoveredActors = normalizeDiscoveredActors(value.discoveredActors, chatId, nowIso());
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
      injectedAt: text2(item.injectedAt, 40) || undefined,
      injectedGenerationId: text2(item.injectedGenerationId, 180) || undefined,
      serializedRelayChars: Math.max(0, Math.round(numberValue(item.serializedRelayChars, 0))) || undefined,
      serializedRelay: text2(item.serializedRelay, 3600) || undefined,
      relayExchangeMessageCount: Math.max(0, Math.round(numberValue(item.relayExchangeMessageCount, 0))) || undefined,
      injectionError: text2(item.injectionError, 500) || undefined,
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
        generationCompletedAt: text2(continuation.generationCompletedAt, 40) || undefined,
        sourceMessageId: text2(continuation.sourceMessageId, 180) || undefined,
        error: text2(continuation.error, 500) || undefined
      }
    }];
  });
  const references = (Array.isArray(value.references) ? value.references : []).slice(-24).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const referenceId = text2(item.id, 180);
    const conversationId = text2(item.conversationId, 180);
    if (!referenceId || !conversationId)
      return [];
    const scope = item.scope === "recent_messages" || item.scope === "selected_messages" ? item.scope : "conversation";
    const status = item.status === "injected" || item.status === "consumed" || item.status === "cancelled" || item.status === "failed" ? item.status : "armed";
    const participants = (Array.isArray(item.participants) ? item.participants : []).slice(0, 16).flatMap((participant) => {
      if (!isRecord(participant))
        return [];
      const contactId = text2(participant.contactId, 180) || undefined;
      const actorId = text2(participant.actorId, 180) || contactId;
      const name = text2(participant.name, 120);
      if (!actorId || !name)
        return [];
      return [{ actorId, contactId, name, role: text2(participant.role, 100), identityBrief: text2(participant.identityBrief, 180) }];
    });
    const messages = (Array.isArray(item.messages) ? item.messages : []).slice(-8).flatMap((message) => {
      if (!isRecord(message))
        return [];
      const messageId = text2(message.messageId, 180);
      const body = text2(message.text, 420);
      if (!messageId || !body)
        return [];
      return [{
        messageId,
        sender: message.sender === "contact" ? "contact" : "persona",
        senderActorId: text2(message.senderActorId, 180) || text2(message.senderContactId, 180) || undefined,
        senderContactId: text2(message.senderContactId, 180) || undefined,
        senderName: text2(message.senderName, 120) || (message.sender === "contact" ? "Participant" : "Persona"),
        text: body,
        createdAt: text2(message.createdAt, 40) || nowIso()
      }];
    });
    return [{
      id: referenceId,
      chatId,
      characterId,
      sourceApp: "messages",
      conversationId,
      conversationTitle: text2(item.conversationTitle, 120) || "Pocket conversation",
      conversationKind: item.conversationKind === "group" ? "group" : "direct",
      scope,
      visibility: "context",
      participants,
      snapshot: text2(item.snapshot, 600),
      messages,
      createdAt: text2(item.createdAt, 40) || nowIso(),
      status,
      injectedAt: text2(item.injectedAt, 40) || undefined,
      injectedGenerationId: text2(item.injectedGenerationId, 180) || undefined,
      boundUserMessageId: text2(item.boundUserMessageId, 180) || undefined,
      serializedReferenceChars: Math.max(0, Math.round(numberValue(item.serializedReferenceChars, 0))) || undefined,
      serializedReference: text2(item.serializedReference, 3000) || undefined,
      consumedAt: text2(item.consumedAt, 40) || undefined,
      consumedMessageId: text2(item.consumedMessageId, 180) || undefined,
      error: text2(item.error, 500) || undefined
    }];
  });
  const groupBatches = (Array.isArray(value.groupBatches) ? value.groupBatches : []).slice(-24).flatMap((item) => {
    if (!isRecord(item))
      return [];
    const batchId = text2(item.id, 180);
    const requestId = text2(item.requestId, 180);
    const conversationId = text2(item.conversationId, 180);
    if (!batchId || !requestId || !conversationId)
      return [];
    const status = item.status === "queued" || item.status === "delivering" || item.status === "completed" || item.status === "cancelled" || item.status === "failed" ? item.status : "cancelled";
    const messages = (Array.isArray(item.messages) ? item.messages : []).slice(0, 4).flatMap((message) => {
      if (!isRecord(message))
        return [];
      const id2 = text2(message.id, 180);
      const speakerId = text2(message.speakerId, 180);
      const body = text2(message.text, 8000);
      if (!id2 || !speakerId || !body)
        return [];
      const messageState = message.state === "delivered" || message.state === "cancelled" ? message.state : "queued";
      return [{
        id: id2,
        speakerId,
        text: body,
        state: messageState,
        deliveredMessageId: text2(message.deliveredMessageId, 180) || undefined,
        deliveredAt: text2(message.deliveredAt, 40) || undefined
      }];
    });
    return [{
      id: batchId,
      requestId,
      conversationId,
      sourceBurstId: text2(item.sourceBurstId, 180) || undefined,
      eligibleActorIds: (Array.isArray(item.eligibleActorIds) ? item.eligibleActorIds : Array.isArray(item.eligibleContactIds) ? item.eligibleContactIds : []).map((entry) => text2(entry, 180)).filter(Boolean).slice(0, 16),
      eligibleContactIds: (Array.isArray(item.eligibleContactIds) ? item.eligibleContactIds : []).map((entry) => text2(entry, 180)).filter(Boolean).slice(0, 16),
      messages,
      status,
      createdAt: text2(item.createdAt, 40) || nowIso(),
      updatedAt: text2(item.updatedAt, 40) || nowIso(),
      error: text2(item.error, 500) || undefined
    }];
  });
  const hadPocketData = Number(value.version || 0) > 0 && (collections.contacts.length > 1 || collections.conversations.some((entry) => entry.messages.length > 0) || notes.length > 0 || events.length > 0 || trackers.length > 0 || relays.length > 0 || references.length > 0 || groupBatches.length > 0);
  return {
    version: STATE_VERSION,
    chatId,
    characterId,
    characterName: characterName || text2(value.characterName, 120) || fallback.characterName,
    roleplayNow: text2(value.roleplayNow, 80) || fallback.roleplayNow,
    sceneSnapshot,
    pocketPersona: normalizePocketPersona(value.pocketPersona, fallback.pocketPersona),
    setup: {
      initialized: bool2(setupValue.initialized, hadPocketData),
      dismissed: bool2(setupValue.dismissed),
      personaConfigured: bool2(setupValue.personaConfigured, bool2(setupValue.initialized, hadPocketData)),
      worldStatus: setupValue.worldStatus === "seeded" || setupValue.worldStatus === "skipped" ? setupValue.worldStatus : bool2(setupValue.initialized, hadPocketData) ? "skipped" : "unconfigured",
      worldSeededAt: text2(setupValue.worldSeededAt, 80) || undefined
    },
    contacts: collections.contacts,
    discoveredActors,
    conversations: collections.conversations,
    notes,
    events,
    relays,
    references,
    groupBatches,
    weather,
    trackers,
    notifications,
    activities,
    processedCommands,
    updatedAt: text2(value.updatedAt, 40) || fallback.updatedAt
  };
}
async function characterPresentationFor(characterId, userId) {
  if (!characterId || !spindle.permissions.has("characters"))
    return { name: "Character", avatarUrl: "", accent: "" };
  try {
    const character = await spindle.characters.get(characterId, userId);
    let avatarUrl = text2(character?.avatar_url ?? character?.avatarUrl, 2000);
    const imageId = text2(character?.image_id ?? character?.imageId, 180);
    if (!avatarUrl && imageId && spindle.permissions.has("images")) {
      const image = await spindle.images.get(imageId, { specificity: "sm", userId }).catch(() => null);
      avatarUrl = text2(image?.url, 2000);
    }
    const accentCandidate = text2(character?.color ?? character?.accent ?? character?.metadata?.color ?? character?.metadata?.accent, 20);
    return {
      name: text2(character?.name, 120) || "Character",
      avatarUrl,
      accent: /^#[0-9a-f]{6}$/i.test(accentCandidate) ? accentCandidate : ""
    };
  } catch {
    return { name: "Character", avatarUrl: "", accent: "" };
  }
}
async function characterNameFor(characterId, userId) {
  return (await characterPresentationFor(characterId, userId)).name;
}
async function stateCharacterIdForChat(chatId, hintedCharacterId, userId) {
  if (chatId && chatId !== "_lobby" && spindle.permissions.has("chats")) {
    try {
      const chat = await spindle.chats.get(chatId, userId);
      const characterId = text2(chat?.character_id, 180);
      if (characterId)
        return characterId;
    } catch {}
  }
  return text2(hintedCharacterId, 180) || "_none";
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
function pocketPersonaCollidesWithActor(state, persona) {
  const candidate = normalizeActorName(persona.displayName);
  if (!candidate)
    return false;
  if (normalizeActorName(state.characterName) === candidate)
    return true;
  if (state.contacts.some((entry) => normalizeActorName(entry.name) === candidate))
    return true;
  if (state.discoveredActors.some((entry) => normalizeActorName(entry.displayName) === candidate))
    return true;
  return false;
}
async function resolveGenerationPocketPersona(state, userId) {
  const configured = state.pocketPersona;
  if (configured.source === "lumiverse")
    return configured;
  if (!pocketPersonaCollidesWithActor(state, configured) || !spindle.permissions.has("personas"))
    return configured;
  const hostPersona = await resolveActivePocketPersona(userId);
  if (!hostPersona || pocketPersonaCollidesWithActor(state, hostPersona))
    return configured;
  spindle.log.warn(`Pocket Persona "${configured.displayName}" collides with a roleplay actor; using active Lumiverse Persona "${hostPersona.displayName}" for this phone generation.`);
  return hostPersona;
}
function directGenerationHistory(conversation, actorId, contactId, personaName, contactName) {
  const history = [];
  for (const message of conversation.messages.slice(-20)) {
    const body = text2(message.text, 8000);
    if (!body)
      continue;
    if (message.sender === "persona") {
      history.push({ role: "user", content: `[DM TURN: ${personaName} \u2192 ${contactName}]
${body}` });
      continue;
    }
    const senderId = message.senderActorId || message.senderContactId || "";
    if (senderId && senderId !== actorId && senderId !== contactId)
      continue;
    history.push({ role: "assistant", content: `[DM TURN: ${contactName} \u2192 ${personaName}]
${body}` });
  }
  return history;
}
async function loadState(chatId, characterId, userId) {
  const characterPresentation = await characterPresentationFor(characterId, userId);
  const characterName = characterPresentation.name;
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
  if (contact) {
    if (characterName !== "Character" && contact.name !== characterName) {
      contact.name = characterName;
      stateChanged = true;
    }
    if (characterPresentation.avatarUrl && contact.sourceAvatarUrl !== characterPresentation.avatarUrl) {
      contact.sourceAvatarUrl = characterPresentation.avatarUrl;
      stateChanged = true;
    }
    if (characterPresentation.accent && contact.sourceAccent !== characterPresentation.accent) {
      contact.sourceAccent = characterPresentation.accent;
      stateChanged = true;
    }
  }
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
async function loadNpcBank(userId) {
  const raw = await spindle.userStorage.getJson(NPC_BANK_PATH, { fallback: null, userId });
  const bank = normalizeNpcBank(raw, nowIso());
  if (isFutureNpcBank(raw)) {
    spindle.log.warn("Pocket left a newer NPC Bank untouched and used an empty bank for this session.");
    return bank;
  }
  if (raw === null || Number(isRecord(raw) ? raw.version : 0) !== bank.version) {
    await spindle.userStorage.setJson(NPC_BANK_PATH, bank, { indent: 2, userId });
  }
  return bank;
}
async function saveNpcBank(value, userId) {
  const bank = normalizeNpcBank(value, nowIso());
  await spindle.userStorage.setJson(NPC_BANK_PATH, bank, { indent: 2, userId });
  return bank;
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
  const npcBank = await loadNpcBank(userId);
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
  send({ type: "lumiphone:state", state, npcBank, preferences, resolvedWallpapers, capabilities: capabilities(), generation, swarmProfile, activePersona, reason, open }, userId);
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
function promptDebugPath(requestId) {
  return `debug/prompts/${safeSegment(requestId)}.json`;
}
function promptDebugSnapshot(task, requestId, request) {
  const messages = (Array.isArray(request.messages) ? request.messages : []).flatMap((entry) => {
    if (!isRecord(entry))
      return [];
    const role = text2(entry.role, 40);
    const content = typeof entry.content === "string" ? entry.content : "";
    if (!role && !content)
      return [];
    return [{ role: role || "unknown", content }];
  });
  return {
    version: 1,
    task,
    requestId,
    capturedAt: nowIso(),
    type: text2(request.type, 80),
    messages,
    parameters: isRecord(request.parameters) ? request.parameters : {},
    reasoning: isRecord(request.reasoning) ? request.reasoning : undefined
  };
}
async function savePromptDebug(task, requestId, request, userId) {
  try {
    await spindle.userStorage.setJson(promptDebugPath(requestId), promptDebugSnapshot(task, requestId, request), { indent: 2, userId });
  } catch (error) {
    spindle.log.warn(`Pocket could not persist outgoing-prompt debug for ${requestId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function loadPromptDebug(requestId, userId) {
  if (!requestId)
    return null;
  const raw = await spindle.userStorage.getJson(promptDebugPath(requestId), { fallback: null, userId });
  if (!isRecord(raw) || raw.version !== 1)
    return null;
  return {
    version: 1,
    task: text2(raw.task, 120),
    requestId: text2(raw.requestId, 180) || requestId,
    capturedAt: text2(raw.capturedAt, 80),
    type: text2(raw.type, 80),
    messages: (Array.isArray(raw.messages) ? raw.messages : []).flatMap((entry) => {
      if (!isRecord(entry))
        return [];
      return [{ role: text2(entry.role, 40) || "unknown", content: typeof entry.content === "string" ? entry.content : "" }];
    }),
    parameters: isRecord(raw.parameters) ? raw.parameters : {},
    reasoning: isRecord(raw.reasoning) ? raw.reasoning : undefined
  };
}
async function runStructuredGeneration(task, requestId, request, userId) {
  await savePromptDebug(task, requestId, request, userId);
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
function upsertContact(state, contact, preserveCustomization = true) {
  const sourceKey = contactSourceKey(contact.source);
  const existing = state.contacts.find((entry) => entry.id === contact.id || contact.source.kind !== "npc" && contactSourceKey(entry.source) === sourceKey || contact.source.kind === "npc" && entry.source.kind === "npc" && contact.source.sceneKey && entry.source.sceneKey === contact.source.sceneKey);
  if (existing) {
    const preserved = preserveCustomization ? {
      createdAt: existing.createdAt,
      accent: existing.accent,
      contextPolicy: existing.contextPolicy,
      avatarOverrideUrl: existing.avatarOverrideUrl,
      colorMode: existing.colorMode,
      sourceAccent: contact.sourceAccent || existing.sourceAccent,
      generationPolicy: contact.generationPolicy || existing.generationPolicy,
      messagingPolicy: contact.messagingPolicy || existing.messagingPolicy,
      messagingStyle: contact.messagingStyle || existing.messagingStyle,
      relationship: contact.relationship || existing.relationship
    } : { createdAt: existing.createdAt };
    Object.assign(existing, contact, preserved, { updatedAt: nowIso() });
    return existing;
  }
  state.contacts.push(contact);
  state.contacts = state.contacts.slice(-80);
  return contact;
}
function directConversationForContact(state, contactId) {
  return state.conversations.find((entry) => entry.kind === "direct" && resolvePocketActor(state, conversationActorIds(entry)[0])?.contact?.id === contactId);
}
function reconcileContactAvailability(state, contact) {
  const conversation = directConversationForContact(state, contact.id);
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
      const activeRelay = state.relays.find((entry) => entry.id !== relayId && entry.status === "pending" && (entry.continuation.state === "launching" || entry.continuation.state === "accepted" || entry.continuation.state === "started"));
      if (activeRelay)
        return { proceed: false, error: `Pocket is already continuing relay ${activeRelay.id} in this roleplay.` };
      relay.continuation = {
        state: "launching",
        invokedAt,
        permissionCheckedAt: nowIso(),
        permissions,
        method
      };
      relay.injectedAt = undefined;
      relay.injectedGenerationId = undefined;
      relay.serializedRelayChars = undefined;
      relay.serializedRelay = undefined;
      relay.relayExchangeMessageCount = undefined;
      relay.injectionError = undefined;
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
      if (relay.injectedAt && !relay.injectedGenerationId)
        relay.injectedGenerationId = generationId;
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
    relationship: "background",
    presence: { inScene: false, lastSceneAt: "" },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
    messagingStyle: { talkativeness: 50, fragmentation: 35 },
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
  const actorId = text2(input.actorId ?? input.actor_id ?? input.contactId ?? input.contact_id, 180);
  const actor = resolvePocketActor(state, actorId) || (!actorId ? resolvePocketActor(state, state.contacts.find((entry) => entry.source.kind === "character" && entry.source.characterId === state.characterId)?.id || "") : null);
  if (!actor)
    throw new Error("Choose a valid actor before opening a conversation.");
  return ensureDirectActorConversation(state, actor.actorId, nowIso(), id);
}
function relationshipValue(value) {
  return value === "close" || value === true ? "close" : "background";
}
function actorRefParts(value) {
  if (typeof value === "string")
    return { id: "", name: text2(value, 120), relationship: "background" };
  if (!isRecord(value))
    return { id: "", name: "", relationship: "background" };
  return {
    id: text2(value.actorId ?? value.actor_id ?? value.contactId ?? value.contact_id ?? value.id, 180),
    name: text2(value.name ?? value.displayName ?? value.display_name, 120),
    relationship: relationshipValue(value.relationship ?? value.close)
  };
}
function resolveActorReference(state, value, allowedIds) {
  const ref = actorRefParts(value);
  const allowed = allowedIds ? new Set(allowedIds) : null;
  if (ref.id) {
    if (allowed && !allowed.has(ref.id))
      return null;
    return resolvePocketActor(state, ref.id);
  }
  if (!ref.name)
    return null;
  const matches = matchingActorIds(state, ref.name, allowedIds);
  if (matches.length > 1)
    throw new Error(`Actor name \u201C${ref.name}\u201D is ambiguous; use a stable actor or contact id.`);
  return matches.length ? resolvePocketActor(state, matches[0]) : null;
}
function exactGroupConversation(state, payload) {
  const conversationId = text2(payload.conversationId ?? payload.conversation_id, 180);
  if (conversationId) {
    const found = state.conversations.find((entry) => entry.id === conversationId && entry.kind === "group");
    if (!found)
      throw new Error("That group conversation no longer exists.");
    return found;
  }
  const title = text2(payload.conversation ?? payload.conversationTitle ?? payload.conversation_title ?? payload.target, 120);
  if (!title)
    throw new Error("A group message needs an existing conversation id or exact title.");
  const normalized = title.toLocaleLowerCase();
  const matches = state.conversations.filter((entry) => entry.kind === "group" && entry.title.trim().toLocaleLowerCase() === normalized);
  if (matches.length > 1)
    throw new Error(`Group title \u201C${title}\u201D is ambiguous; use its stable conversation id.`);
  if (!matches.length)
    throw new Error(`Group \u201C${title}\u201D does not exist. Create it explicitly before sending messages.`);
  return matches[0];
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
var POCKET_CONTINUITY_SEED_VERSION = 3;
var narrativeSeedFlights = new Map;
function continuitySeedPath(chatId, characterId) {
  return `phones/${stateKey(chatId, characterId)}.continuity-seed.json`;
}
function seedStringList(value, max = 12) {
  const values = (Array.isArray(value) ? value : []).map((entry) => text2(entry, 120)).filter(Boolean);
  return values.filter((entry, index) => values.findIndex((other) => normalizeActorName(other) === normalizeActorName(entry)) === index).slice(0, max);
}
function seedVisibility(value) {
  return value === "public" || value === "scene" ? value : "private";
}
function seedTtl(value) {
  return value === "persistent" || value === "scene" ? value : "turn";
}
function normalizeNarrativeSeed(value, sourceKey = "", sourceMessageIds = []) {
  const raw = isRecord(value) ? value : {};
  const rawWorld = isRecord(raw.world) ? raw.world : {};
  const rawWeather = isRecord(rawWorld.weather) ? rawWorld.weather : null;
  const worldFacts = (Array.isArray(rawWorld.facts) ? rawWorld.facts : []).map((entry) => text2(entry, 360)).filter((entry, index, all) => Boolean(entry) && all.indexOf(entry) === index).slice(0, 8);
  const world = {
    setting: text2(rawWorld.setting, 360),
    facts: worldFacts,
    weather: rawWeather ? {
      condition: text2(rawWeather.condition, 120),
      location: text2(rawWeather.location, 180),
      details: text2(rawWeather.details, 360)
    } : null
  };
  const facts = (Array.isArray(raw.facts) ? raw.facts : []).slice(0, 10).flatMap((entry) => {
    if (!isRecord(entry))
      return [];
    const body = text2(entry.text ?? entry.fact, 360);
    const actors2 = seedStringList(entry.actors);
    if (!body || !actors2.length)
      return [];
    return [{
      text: body,
      visibility: seedVisibility(entry.visibility),
      knownBy: seedStringList(entry.knownBy ?? entry.known_by),
      actors: actors2,
      ttl: seedTtl(entry.ttl)
    }];
  });
  const rawActors = Array.isArray(raw.actors) ? raw.actors : Array.isArray(raw.actorUpdates) ? raw.actorUpdates : [];
  const actors = rawActors.slice(0, 12).flatMap((entry) => {
    if (!isRecord(entry))
      return [];
    const name = text2(entry.name, 120);
    if (!name)
      return [];
    const status = entry.status === "available" || entry.status === "busy" || entry.status === "away" || entry.status === "asleep" || entry.status === "in_scene" ? entry.status : "unknown";
    return [{
      name,
      status,
      activity: text2(entry.activity, 260),
      location: text2(entry.location, 180),
      visibility: seedVisibility(entry.visibility),
      knownBy: seedStringList(entry.knownBy ?? entry.known_by),
      ttl: seedTtl(entry.ttl)
    }];
  });
  const timeline = (Array.isArray(raw.timeline) ? raw.timeline : []).slice(0, 6).flatMap((entry) => {
    if (!isRecord(entry))
      return [];
    const title = text2(entry.title ?? entry.event, 180);
    if (!title)
      return [];
    const scope = entry.scope === "world" ? "world" : "actor";
    const actors2 = seedStringList(entry.actors, 8);
    if (scope === "actor" && !actors2.length)
      return [];
    const whenKind = entry.whenKind === "exact" || entry.whenKind === "approximate" || entry.whenKind === "relative" ? entry.whenKind : "unscheduled";
    return [{
      scope,
      title,
      description: text2(entry.description, 500),
      whenText: text2(entry.whenText ?? entry.when, 180) || "Unscheduled",
      whenKind,
      actors: scope === "world" ? [] : actors2,
      completed: entry.completed === true,
      visibility: seedVisibility(entry.visibility),
      knownBy: seedStringList(entry.knownBy ?? entry.known_by)
    }];
  });
  return {
    version: POCKET_CONTINUITY_SEED_VERSION,
    sourceKey: text2(raw.sourceKey, 1600) || sourceKey,
    sourceMessageIds: seedStringList(raw.sourceMessageIds, 8).length ? seedStringList(raw.sourceMessageIds, 8) : sourceMessageIds.slice(-8),
    world,
    facts,
    actors,
    timeline,
    updatedAt: text2(raw.updatedAt, 40) || nowIso()
  };
}
function mergeNarrativeSeed(previous, fresh) {
  const factMap = new Map;
  const actorMap = new Map;
  for (const entry of (previous?.facts || []).filter((item) => item.ttl !== "turn"))
    factMap.set(entry.text.toLocaleLowerCase(), entry);
  for (const entry of fresh.facts)
    factMap.set(entry.text.toLocaleLowerCase(), entry);
  for (const entry of (previous?.actors || []).filter((item) => item.ttl !== "turn"))
    actorMap.set(normalizeActorName(entry.name), entry);
  for (const entry of fresh.actors)
    actorMap.set(normalizeActorName(entry.name), entry);
  const previousWorldFacts = previous?.world?.facts || [];
  const worldFacts = [...previousWorldFacts, ...fresh.world.facts].filter((entry, index, all) => Boolean(entry) && all.findIndex((other) => other.toLocaleLowerCase() === entry.toLocaleLowerCase()) === index).slice(-10);
  return {
    ...fresh,
    world: {
      setting: fresh.world.setting || previous?.world?.setting || "",
      facts: worldFacts,
      weather: fresh.world.weather || previous?.world?.weather || null
    },
    facts: [...factMap.values()].slice(-12),
    actors: [...actorMap.values()].slice(-16)
  };
}
function narrativeSeedSourceKey(messages) {
  return messages.map((message, index) => {
    const idPart = text2(message?.id, 180) || `row-${index}`;
    return `${idPart}:${String(message?.revision ?? "")}:${text2(message?.role, 20)}:${text2(message?.content, 180)}`;
  }).join("|").slice(0, 1600);
}
function seedVisibleTo(entry, speakerName) {
  if (entry.visibility === "public")
    return true;
  const speaker = normalizeActorName(speakerName);
  return Boolean(speaker && entry.knownBy.some((name) => normalizeActorName(name) === speaker));
}
function narrativeSeedContext(seed, speakerName = "", participantNames = []) {
  if (!seed)
    return "";
  const speaker = normalizeActorName(speakerName);
  const participants = new Set(participantNames.map(normalizeActorName).filter(Boolean));
  if (speaker)
    participants.add(speaker);
  const intersectsParticipants = (actors2) => actors2.some((name) => participants.has(normalizeActorName(name)));
  const facts = seed.facts.filter((entry) => {
    if (!intersectsParticipants(entry.actors))
      return false;
    return seedVisibleTo(entry, speakerName) || Boolean(speaker && entry.actors.some((name) => normalizeActorName(name) === speaker));
  }).slice(-8);
  const actors = seed.actors.filter((entry) => {
    if (!participants.has(normalizeActorName(entry.name)))
      return false;
    return seedVisibleTo(entry, speakerName) || Boolean(speaker && normalizeActorName(entry.name) === speaker);
  }).slice(-8);
  const timeline = seed.timeline.filter((entry) => {
    if (!seedVisibleTo(entry, speakerName))
      return false;
    return entry.scope === "world" || intersectsParticipants(entry.actors);
  }).slice(-4);
  const worldLines = [
    seed.world.setting ? `Setting: ${seed.world.setting}` : "",
    ...seed.world.facts.map((entry) => `World fact: ${entry}`),
    seed.world.weather?.condition ? `Weather: ${seed.world.weather.condition}${seed.world.weather.location ? ` at ${seed.world.weather.location}` : ""}${seed.world.weather.details ? `; ${seed.world.weather.details}` : ""}` : ""
  ].filter(Boolean);
  return [
    "WORLD STATE \u2014 SHARED SETTING, NOT ACTOR ROUTING",
    ...worldLines,
    "",
    "CURRENT PHONE PARTICIPANTS ONLY: " + participantNames.filter(Boolean).join(", "),
    "Actor-specific continuity about anyone outside this channel is intentionally omitted.",
    ...facts.map((entry) => `Actor fact: ${entry.text}`),
    ...actors.map((entry) => `Actor status: ${entry.name} \u2014 ${entry.status}${entry.activity ? `; ${entry.activity}` : ""}${entry.location ? `; at ${entry.location}` : ""}`),
    ...timeline.map((entry) => `Timeline: ${entry.whenText} \u2014 ${entry.title}`)
  ].filter((entry, index, all) => Boolean(entry) || index > 0 && index < all.length - 1).join(`
`).slice(0, 2800);
}
function seedActorContactIds(state, names) {
  const wanted = new Set(names.map(normalizeActorName).filter(Boolean));
  return state.contacts.filter((contact) => wanted.has(normalizeActorName(contact.name))).map((contact) => contact.id).slice(0, 8);
}
function applyNarrativeSeedState(state, seed) {
  let changed = false;
  const weather = seed.world.weather;
  if (weather) {
    const nextCondition = weather.condition || state.weather.condition;
    const nextLocation = weather.location || state.weather.location;
    const nextDetails = weather.details || state.weather.details;
    if (state.weather.condition !== nextCondition || state.weather.location !== nextLocation || state.weather.details !== nextDetails) {
      state.weather.condition = nextCondition;
      state.weather.location = nextLocation;
      state.weather.details = nextDetails;
      state.weather.updatedAt = seed.updatedAt;
      changed = true;
    }
  }
  for (const item of seed.timeline) {
    const actorContactIds = item.scope === "actor" ? seedActorContactIds(state, item.actors) : [];
    const existing = state.events.find((event) => event.lane === "Continuity" && event.title.trim().toLocaleLowerCase() === item.title.trim().toLocaleLowerCase() && event.whenText.trim().toLocaleLowerCase() === item.whenText.trim().toLocaleLowerCase());
    if (existing) {
      const nextDescription = item.description || existing.description;
      const nextActors = actorContactIds.length ? actorContactIds : existing.actorContactIds;
      if (existing.description !== nextDescription || JSON.stringify(existing.actorContactIds || []) !== JSON.stringify(nextActors || []) || existing.completed !== item.completed) {
        existing.description = nextDescription;
        existing.actorContactIds = nextActors;
        existing.completed = item.completed;
        changed = true;
      }
      continue;
    }
    const firstContact = actorContactIds.length ? state.contacts.find((contact) => contact.id === actorContactIds[0]) : undefined;
    const start = state.roleplayNow || seed.updatedAt;
    state.events.push({
      id: id("evt"),
      title: item.title,
      description: item.description,
      start,
      end: start,
      whenKind: item.whenKind,
      whenText: item.whenText,
      color: firstContact ? contactAccent(firstContact) : "#8b7dff",
      lane: "Continuity",
      completed: item.completed,
      createdBy: "model",
      actorContactIds
    });
    changed = true;
  }
  if (changed)
    state.events = state.events.slice(-MAX_EVENTS);
  return changed;
}
function applySetupCurrentGoal(state, seed) {
  const activeGoal = state.events.find((event) => event.lane === "Current goal" && !event.completed);
  if (activeGoal)
    return false;
  const persona = normalizeActorName(state.pocketPersona.displayName);
  const actorGoal = seed.timeline.find((item) => item.scope === "actor" && item.actors.some((name) => normalizeActorName(name) === persona));
  const worldGoal = seed.timeline.find((item) => item.scope === "world");
  const candidate = actorGoal || worldGoal;
  if (!candidate)
    return false;
  const matchingEvent = state.events.find((event) => event.title.trim().toLocaleLowerCase() === candidate.title.trim().toLocaleLowerCase() && event.whenText.trim().toLocaleLowerCase() === candidate.whenText.trim().toLocaleLowerCase());
  if (matchingEvent) {
    matchingEvent.lane = "Current goal";
    matchingEvent.completed = false;
    return true;
  }
  const actorContactIds = candidate.scope === "actor" ? seedActorContactIds(state, candidate.actors) : [];
  const firstContact = actorContactIds.length ? state.contacts.find((contact) => contact.id === actorContactIds[0]) : undefined;
  const start = state.roleplayNow || seed.updatedAt;
  state.events.push({
    id: id("evt"),
    title: candidate.title,
    description: candidate.description,
    start,
    end: start,
    whenKind: candidate.whenKind,
    whenText: candidate.whenText,
    color: firstContact ? contactAccent(firstContact) : "#8b7dff",
    lane: "Current goal",
    completed: false,
    createdBy: "model",
    actorContactIds
  });
  state.events = state.events.slice(-MAX_EVENTS);
  return true;
}
async function loadNarrativeSeed(chatId, characterId, userId) {
  const raw = await spindle.userStorage.getJson(continuitySeedPath(chatId, characterId), { fallback: null, userId });
  if (!isRecord(raw))
    return null;
  if (raw.version !== POCKET_CONTINUITY_SEED_VERSION) {
    spindle.log.info(`Pocket continuity seed cache invalidated (stored v${String(raw.version ?? "legacy")} \u2192 world-seed v${POCKET_CONTINUITY_SEED_VERSION}).`);
    return null;
  }
  return normalizeNarrativeSeed(raw);
}
async function refreshNarrativeSeed(chatId, characterId, userId) {
  if (!chatId || chatId === "_lobby" || !spindle.permissions.has("generation") || !spindle.permissions.has("chat_mutation")) {
    return loadNarrativeSeed(chatId, characterId, userId);
  }
  const flightKey = `${viewKey(userId)}:${stateKey(chatId, characterId)}:continuity`;
  const existingFlight = narrativeSeedFlights.get(flightKey);
  if (existingFlight)
    return existingFlight;
  const flight = (async () => {
    const hostMessages = await spindle.chat.getMessages(chatId).catch(() => []);
    const sourceMessages = hostMessages.filter((message) => (message?.role === "user" || message?.role === "assistant") && text2(message?.content, 1)).slice(-4);
    if (!sourceMessages.length)
      return loadNarrativeSeed(chatId, characterId, userId);
    const sourceKey = `v${POCKET_CONTINUITY_SEED_VERSION}:${narrativeSeedSourceKey(sourceMessages)}`;
    const sourceMessageIds = sourceMessages.map((message) => text2(message?.id, 180)).filter(Boolean).slice(-8);
    const previous = await loadNarrativeSeed(chatId, characterId, userId);
    if (previous?.sourceKey === sourceKey)
      return previous;
    const state = await loadState(chatId, characterId, userId);
    const knownActors = [
      state.pocketPersona.displayName,
      state.characterName,
      ...state.contacts.map((contact) => contact.name)
    ].filter((name, index, all) => Boolean(name) && all.findIndex((other) => normalizeActorName(other) === normalizeActorName(name)) === index).slice(0, 40);
    const recentNarrative = sourceMessages.map((message, index) => {
      const role = message?.role === "assistant" ? "ASSISTANT NARRATIVE" : "USER NARRATIVE";
      return `${role} [${index + 1}]: ${text2(message?.content, 1300)}`;
    }).join(`

`).slice(-5200);
    const parsed = await runStructuredGeneration("continuity-seed", id("continuity_seed"), {
      type: "quiet",
      messages: [
        {
          role: "system",
          content: `Extract a small structured RP WORLD STATE delta from recent fictional roleplay prose. This is NOT a phone conversation and nobody in the prose becomes a phone recipient.

Return strict JSON only:
{
  "world":{
    "setting":"short shared setting/location/era if explicitly established, else empty",
    "facts":["genuinely actor-neutral shared world/group facts only"],
    "weather":{"condition":"short condition","location":"where it applies","details":"short atmospheric detail"} | null
  },
  "facts":[{"text":"actor-specific factual state","visibility":"public|scene|private","knownBy":["exact actor names"],"actors":["REQUIRED subject actor names"],"ttl":"turn|scene|persistent"}],
  "actors":[{"name":"exact known actor name","status":"available|busy|away|asleep|in_scene|unknown","activity":"short current activity","location":"short location","visibility":"public|scene|private","knownBy":["exact actor names"],"ttl":"turn|scene|persistent"}],
  "timeline":[{"scope":"world|actor","title":"event/beat","description":"short detail","whenText":"Now|Later today|Tomorrow|etc","whenKind":"exact|approximate|relative|unscheduled","actors":["REQUIRED when scope=actor; empty when scope=world"],"completed":false,"visibility":"public|scene|private","knownBy":["exact actor names"]}]
}

Rules:
- Extract only facts supported by the supplied prose. Do not invent recipients, phone conversations, relationships, weather, or off-screen knowledge.
- WORLD means genuinely shared setting state that is not primarily ABOUT one named actor. Examples: "The kingdom requires a seasonal tribute", "Class 1-A is holding a party tonight", "A storm is hitting the city".
- A named actor doing/feeling/planning/having something is NEVER a world fact. Put it in facts/actors with that actor explicitly listed.
- weather is null unless weather/atmosphere is actually established by the prose. Never invent temperature.
- facts is actor-specific only. Every facts entry MUST have at least one subject in actors.
- timeline scope=world only for group/world events. If an event concerns a named actor (Shoto's press conference, Bakugo's cooking shift, Mina's arrival), scope=actor and actors MUST identify them.
- public means reasonably shared/cast-visible information. scene means explicitly witnessed; list witnesses in knownBy. private is the default for personal/internal information.
- knownBy must be conservative. Never assume everyone knows a private fact.
- Actor status is world/physical state only. busy does NOT mean unable to text.
- Prefer 0\u20136 world facts, 0\u20136 actor facts, 0\u20138 actor updates, and 0\u20134 timeline rows.
- Use exact names from KNOWN ACTORS when possible.`
        },
        {
          role: "user",
          content: `ROLEPLAY TIME: ${state.roleplayNow}
KNOWN ACTORS:
${knownActors.join(`
`)}

RECENT NARRATIVE:
${recentNarrative}`
        }
      ],
      parameters: { temperature: 0.08, max_tokens: 900 },
      userId
    }, userId);
    const fresh = normalizeNarrativeSeed({ ...parsed, sourceKey, sourceMessageIds, updatedAt: nowIso() }, sourceKey, sourceMessageIds);
    const seed = mergeNarrativeSeed(previous, fresh);
    await spindle.userStorage.setJson(continuitySeedPath(chatId, characterId), seed, { indent: 2, userId });
    await withStateLock(stateKey(chatId, characterId), async () => {
      const latest = await loadState(chatId, characterId, userId);
      if (!applyNarrativeSeedState(latest, seed))
        return;
      await saveState(latest, userId);
      await sendState(latest, userId, "continuity_seed");
    });
    return seed;
  })();
  narrativeSeedFlights.set(flightKey, flight);
  try {
    return await flight;
  } catch (error) {
    spindle.log.warn(`Pocket continuity seed skipped: ${error instanceof Error ? error.message : String(error)}`);
    return loadNarrativeSeed(chatId, characterId, userId);
  } finally {
    if (narrativeSeedFlights.get(flightKey) === flight)
      narrativeSeedFlights.delete(flightKey);
  }
}
async function generateMessage(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable the Generation permission to create an in-phone reply.");
  const context = await resolveContext(input, userId);
  const requestId = text2(input.requestId, 180) || id("reply");
  const key = stateKey(context.chatId, context.characterId);
  const continuitySeed = (await loadPreferences(userId)).roleplayContextMode === "off" ? null : await refreshNarrativeSeed(context.chatId, context.characterId, userId);
  await withStateLock(key, async () => {
    const state = await loadState(context.chatId, context.characterId, userId);
    const preferences = await loadPreferences(userId);
    const generationPersona = await resolveGenerationPocketPersona(state, userId);
    const generationState = generationPersona === state.pocketPersona ? state : { ...state, pocketPersona: generationPersona };
    const conversation = resolveConversation(state, input);
    const participantActors = conversationActorIds(conversation).map((actorId) => resolvePocketActor(state, actorId)).filter((entry) => Boolean(entry));
    const participants = participantActors.map((actor2) => ({ actor: actor2, contact: actorAsGenerationContact(actor2, nowIso()) }));
    if (!participants.length)
      throw new Error("This conversation has no available contact participants.");
    let contact;
    let actor = participantActors[0];
    const requestedSpeaker = text2(input.speakerActorId ?? input.speaker_actor_id ?? input.speakerContactId ?? input.speaker_contact_id, 180);
    if (requestedSpeaker && requestedSpeaker !== "auto") {
      const explicit = participants.find((entry) => entry.actor.actorId === requestedSpeaker || entry.contact.id === requestedSpeaker);
      if (!explicit)
        throw new Error("The selected speaker is not a participant in this conversation.");
      actor = explicit.actor;
      contact = explicit.contact;
    } else if (conversation.kind === "direct") {
      actor = participants[0].actor;
      contact = participants[0].contact;
    } else {
      const lastSpeakerId = [...conversation.messages].reverse().find((entry) => entry.sender === "contact")?.senderActorId;
      const currentIndex = participants.findIndex((entry) => entry.actor.actorId === lastSpeakerId);
      const selected = participants[(currentIndex + 1 + participants.length) % participants.length];
      actor = selected.actor;
      contact = selected.contact;
    }
    if (bool2(input.autonomous) && (contact.presence.inScene || !contact.messagingPolicy.remoteEligible || conversation.availability.state !== "remote" && conversation.availability.state !== "arriving"))
      return;
    send({
      type: "lumiphone:message_progress",
      requestId,
      chatId: context.chatId,
      characterId: context.characterId,
      conversationId: conversation.id,
      actorId: actor.actorId,
      contactId: actor.contact?.id,
      speakerContactId: actor.actorId,
      phase: "pending"
    }, userId);
    const profile = await resolveContactProfile(contact, userId);
    const replaceMessageId = text2(input.replaceMessageId, 180);
    const replaceIndex = replaceMessageId ? conversation.messages.findIndex((message) => message.id === replaceMessageId && message.sender === "contact") : -1;
    const contextConversation = replaceIndex >= 0 ? { ...conversation, messages: conversation.messages.slice(0, replaceIndex) } : conversation;
    const knownIdentity = contact.identityBrief || profile.description || [profile.role, profile.personality, profile.behavior].filter(Boolean).join(". ");
    const compactIdentity = `Relationship importance: ${actor.relationship}. ${knownIdentity || "No full profile is registered; use only the name and current phone exchange."}`.slice(0, 1200);
    const assembled = await assemblePocketContext({
      state: generationState,
      contact,
      conversation: contextConversation,
      preferences,
      actorIdentity: compactIdentity,
      getMessages: spindle.permissions.has("chat_mutation") ? () => spindle.chat.getMessages(context.chatId) : undefined,
      includePhoneThread: conversation.kind !== "direct",
      includeRoleplayBackground: false
    });
    const requestedInstruction = text2(input.instruction, 2000);
    const hasPhoneHistory = contextConversation.messages.length > 0;
    const defaultReplyInstruction = "Reply naturally to the latest phone message.";
    const firstDmInstruction = [
      "Start a new DM naturally. There is no prior phone message in this thread.",
      "Do not imply or answer an unseen prior message, shared plan, appointment, event, or conversation unless it appears in the structured Pocket continuity above.",
      requestedInstruction && !/^reply naturally to the latest (?:phone )?message\.?$/i.test(requestedInstruction) ? `Additional direction: ${requestedInstruction}` : ""
    ].filter(Boolean).join(" ");
    const instruction = conversation.kind === "direct" && !hasPhoneHistory ? firstDmInstruction : requestedInstruction || defaultReplyInstruction;
    const directThreadState = hasPhoneHistory ? `EXISTING THREAD \u2014 ${contextConversation.messages.length} prior phone message(s).` : "EMPTY THREAD \u2014 no prior phone messages exist. This generated message starts the conversation.";
    const generationTask = replaceIndex >= 0 ? "message-retry" : "message-reply";
    const generationInfo = await inspectPocketGeneration({ spindle, loadPreferences, savePreferences, send }, preferences, userId);
    const personaName = generationPersona.displayName?.trim() || "You";
    const personaIdentity = text2(generationPersona.identityBrief, 900);
    const continuityText = preferences.roleplayContextMode === "off" ? "" : narrativeSeedContext(continuitySeed, profile.name, [profile.name, personaName]);
    const generationMessages = conversation.kind === "direct" ? [
      {
        role: "system",
        content: `You are ${profile.name} writing a private phone DM to ${personaName}.

IMMUTABLE DM OWNERSHIP:
- This thread belongs to ${personaName} and ${profile.name}.
- THIS THREAD IS NOT THE ACTIVE RP CHARACTER'S PHONE.
- It was not rerouted, borrowed, swapped, or inherited from another actor.
- If an older generated message implies a different owner/addressee, that older text is a continuity mistake. Correct it; do not rationalize it.
${personaIdentity ? `- Pocket Persona identity: ${personaIdentity}
` : ""}
DM ROLE BINDING \u2014 AUTHORITATIVE:
- assistant role = ${profile.name}, the contact who writes the generated phone message.
- user role = ${personaName}, the Pocket Persona / phone owner / recipient.
- The host roleplay's active character is not automatically the user role or DM recipient.
- Raw host roleplay transcript is intentionally excluded from direct-message generation; cross-thread continuity must come from explicit Pocket state, not host-chat dialogue.
- Names appearing inside old messages or RP background are text content, not routing metadata.
- A historical generated message may contain a mistaken addressee; do not inherit that mistake.
- Never reinterpret the user role as another actor.

Return strict JSON only:
{"recipient":"${personaName}","message":"the phone text","after":{"state":"remote|arriving|local|paused","reason":""}}

The recipient field MUST be exactly "${personaName}".
after describes the channel immediately after this message.
Use arriving while traveling toward the physical scene, local only when the message itself crosses into physical action or confirms arrival, paused for ended/busy/away/sleeping/unknown, otherwise remote.
No narration, markdown, or custom UI copy.`
      },
      {
        role: "system",
        content: `POCKET BACKGROUND \u2014 REFERENCE ONLY, NOT CHAT-ROLE ROUTING
${assembled.text || "(no additional background)"}${continuityText ? `

STRUCTURED CONTINUITY \u2014 NOT RAW NARRATIVE
${continuityText}` : ""}`
      },
      ...directGenerationHistory(contextConversation, actor.actorId, contact.id, personaName, profile.name),
      {
        role: "user",
        content: `[POCKET CONTROL \u2014 NOT AN IN-WORLD MESSAGE]
The user role is still ${personaName}.
Generate the next assistant-role phone text from ${profile.name} TO ${personaName}.
THREAD STATE: ${directThreadState}
DIRECTION: ${instruction}
FINAL GENERATION LOCK: recipient=${personaName}; speaker=${profile.name}; thread_owner=${personaName}. This is ${personaName}'s phone conversation, not another actor's device.`
      }
    ] : [
      {
        role: "system",
        content: `Write exactly one private phone text as ${profile.name}. Stay in character and do not speak for another participant. The FINAL CHANNEL LOCK in the bounded context is authoritative. Return strict JSON only: {"message":"the phone text","after":{"state":"remote|arriving|local|paused","reason":""}}. after describes the channel immediately after this message.
Use arriving while traveling toward the physical scene, local only when the message itself crosses into physical action or confirms arrival, paused for ended/busy/away/sleeping/unknown, otherwise remote. No narration, markdown, or custom UI copy.`
      },
      {
        role: "user",
        content: `${assembled.text || "(no context)"}

DIRECTION
${instruction}

FINAL GENERATION LOCK
SPEAKER / CONTACT: ${profile.name}
RECIPIENT / POCKET PERSONA: ${personaName}
Generate ${profile.name}'s phone text TO the Pocket Persona named above. Other actors may be discussed, but they are not the recipient of this DM.`
      }
    ];
    const generationRequest = {
      type: "quiet",
      messages: generationMessages,
      parameters: { temperature: 0.85, max_tokens: 500 },
      userId
    };
    await savePromptDebug(generationTask, requestId, generationRequest, userId);
    const response = await runPocketGeneration({ spindle, loadPreferences, savePreferences, send }, generationTask, requestId, generationRequest, userId);
    let generated = {};
    try {
      generated = parseGeneratedObject(response.content);
    } catch {
      generated = { message: response.content, after: { state: "remote" } };
    }
    const reply = text2(generated.message, 8000);
    if (!reply)
      throw new Error("The character did not return a phone message.");
    if (conversation.kind === "direct") {
      const declaredRecipient = text2(generated.recipient, 120);
      if (declaredRecipient && normalizeActorName(declaredRecipient) !== normalizeActorName(personaName)) {
        throw new Error(`Pocket refused a misrouted DM: model declared recipient "${declaredRecipient}" instead of "${personaName}". Retry the message.`);
      }
    }
    const route = { app: "messages", conversationId: conversation.id };
    const visible = notificationDestinationVisible(state, route, userId);
    const nextMessage = {
      id: id("msg"),
      sender: "contact",
      senderActorId: actor.actorId,
      senderActorKind: actor.kind,
      senderContactId: actor.contact?.id,
      senderName: actor.name,
      senderAccent: actor.accent,
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
    if (bool2(input.initiated) && actor.contact) {
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
      } else if (after.state === "local" && actor.contact) {
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
    const activity = replaceIndex < 0 ? addActivity(state, { kind: "message", title: actor.name, summary: reply.slice(0, 280), route, source: { contactId: actor.contact?.id, conversationId: conversation.id } }) : undefined;
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
      actorId: actor.actorId,
      contactId: actor.contact?.id,
      speakerContactId: actor.actorId,
      phase: "done"
    }, userId);
  });
}
function groupRevealDelayMs(preferences, body, position, seed) {
  if (preferences.replyCadence === "instant")
    return 0;
  let hash = 0;
  for (const character of seed)
    hash = (hash << 5) - hash + character.charCodeAt(0) | 0;
  const jitter = Math.abs(hash) % 650;
  const base = position === 0 ? 700 : 1150;
  const typing = Math.min(2800, body.length * 18);
  const multiplier = preferences.replyCadence === "quick" ? 0.62 : preferences.replyCadence === "relaxed" ? 1.35 : 1;
  return Math.round((base + typing + jitter) * multiplier);
}
async function generateGroupBatch(input, userId) {
  if (!spindle.permissions.has("generation"))
    throw new Error("Enable the Generation permission to create a group reply.");
  const context = await resolveContext(input, userId);
  const requestId = text2(input.requestId, 180) || id("group_reply");
  const conversationId = text2(input.conversationId, 180);
  const flightKey = `${viewKey(userId)}:${stateKey(context.chatId, context.characterId)}:${conversationId}`;
  if (groupBatchFlights.has(flightKey))
    throw new Error("This group is already generating a reply burst.");
  const flightToken = id("group_flight");
  groupBatchFlights.set(flightKey, flightToken);
  let progressOpen = false;
  try {
    const groupContinuitySeed = await refreshNarrativeSeed(context.chatId, context.characterId, userId);
    const state = await loadState(context.chatId, context.characterId, userId);
    const preferences = await loadPreferences(userId);
    const conversation = state.conversations.find((entry) => entry.id === conversationId && entry.kind === "group");
    if (!conversation)
      throw new Error("That group conversation no longer exists.");
    const activeBatch = state.groupBatches.find((entry) => entry.conversationId === conversation.id && (entry.status === "queued" || entry.status === "delivering"));
    if (activeBatch)
      throw new Error("This group already has a reply burst in progress.");
    const sourceBurstId = text2(input.sourceBurstId, 180) || conversation.outgoingBurst?.id;
    const eligible = conversationActorIds(conversation).map((actorId) => resolvePocketActor(state, actorId)).filter((entry) => Boolean(entry && (!entry.contact || entry.contact.generationPolicy.relevant && entry.contact.messagingPolicy.remoteEligible && !entry.contact.presence.inScene)));
    if (!eligible.length) {
      send({ type: "lumiphone:message_progress", requestId, chatId: context.chatId, characterId: context.characterId, conversationId, phase: "done" }, userId);
      return;
    }
    progressOpen = true;
    send({ type: "lumiphone:message_progress", requestId, chatId: context.chatId, characterId: context.characterId, conversationId, phase: "checking" }, userId);
    const profiles = await Promise.all(eligible.map(async (actor) => {
      const contact = actorAsGenerationContact(actor, nowIso());
      return { actor, contact, profile: await resolveContactProfile(contact, userId) };
    }));
    const primary = profiles[0];
    const assembled = await assemblePocketContext({
      state,
      contact: primary.contact,
      conversation,
      preferences,
      actorIdentity: profiles.map(({ actor, contact, profile }) => `${actor.name} (${actor.actorId}, ${actor.relationship}) \u2014 ${contact.identityBrief || profile.description || "No profile; infer only from the live exchange."}`.slice(0, 700)).join(`
`).slice(0, 1200),
      getMessages: spindle.permissions.has("chat_mutation") ? () => spindle.chat.getMessages(context.chatId) : undefined,
      includeRoleplayBackground: false
    });
    const groupContinuityText = preferences.roleplayContextMode === "off" ? "" : narrativeSeedContext(groupContinuitySeed, "", profiles.map(({ actor }) => actor.name));
    const roster = profiles.map(({ actor, contact }) => [
      `id=${actor.actorId}`,
      `name=${actor.name}`,
      `role=${contact.role}`,
      `relationship=${actor.relationship}`,
      `profile=${actor.kind === "discovered" ? "minimal-discovered-actor" : "contact"}`,
      `talkativeness=${contact.messagingStyle.talkativeness}/100`,
      `fragmentation=${contact.messagingStyle.fragmentation}/100`,
      `identity=${(contact.identityBrief || contact.description).slice(0, 600)}`
    ].join(" | ")).join(`
`).slice(0, 5000);
    const parsed = await runStructuredGeneration("group-reply", requestId, {
      type: "quiet",
      messages: [
        { role: "system", content: 'Generate the next natural burst in a fictional private group chat. The CURRENT PHONE CHANNEL block below is authoritative for current membership. Actors marked former participant in PHONE THREAD are historical only and are not current recipients or speakers. Return strict JSON only: {"messages":[{"speakerId":"exact eligible id","text":"phone text"}]}. Return 0\u20133 messages normally and never more than 4. Silence is valid. Use only eligible speaker IDs. Select only participants with something natural to contribute; never make everyone answer by default. The ordered array is one evolving exchange: later messages may directly react to earlier generated messages. A close relationship is important social context; a background/minimal discovered actor may still speak when the plot or current exchange makes them relevant, without inventing a biography. Talkativeness changes likelihood but never forces participation. Fragmentation may produce short consecutive messages by the same speaker, while low fragmentation favors one composed bubble. No narration, markdown, delay values, or hidden reasoning.' },
        { role: "user", content: `${assembled.text || "(no context)"}${groupContinuityText ? `

STRUCTURED CONTINUITY \u2014 PUBLIC/SHARED FACTS ONLY
${groupContinuityText}` : ""}

ELIGIBLE GROUP PARTICIPANTS
${roster}

Generate the next group-chat burst.

FINAL GENERATION LOCK
POCKET PERSONA / USER: ${state.pocketPersona.displayName?.trim() || "You"}
CURRENT GROUP ACTORS: ${profiles.map(({ actor }) => actor.name).join(", ")}
Only the Pocket Persona and CURRENT GROUP ACTORS above can read this channel. An absent/former actor may be discussed, but must not be directly addressed as though they are still in the group.` }
      ],
      parameters: { temperature: 0.82, max_tokens: 900 },
      userId
    }, userId);
    const generatedRows = (Array.isArray(parsed.messages) ? parsed.messages : []).slice(0, 4).flatMap((row) => {
      if (!isRecord(row))
        return [];
      const speakerId = text2(row.speakerId, 180);
      const body = text2(row.text, 8000);
      if (!body || !eligible.some((actor) => actor.actorId === speakerId))
        return [];
      return [{ id: id("group_slot"), speakerId, text: body, state: "queued" }];
    });
    const generationInfo = await inspectPocketGeneration({ spindle, loadPreferences, savePreferences, send }, preferences, userId);
    const batchId = id("group_batch");
    const batch = await withStateLock(stateKey(context.chatId, context.characterId), async () => {
      const latest = await loadState(context.chatId, context.characterId, userId);
      const latestConversation = latest.conversations.find((entry) => entry.id === conversationId && entry.kind === "group");
      if (!latestConversation)
        return null;
      if (sourceBurstId && latestConversation.outgoingBurst?.id !== sourceBurstId)
        return null;
      const currentActorIds = new Set(conversationActorIds(latestConversation));
      const currentEligible = eligible.filter((entry) => currentActorIds.has(entry.actorId));
      const queuedRows = generatedRows.filter((entry) => currentActorIds.has(entry.speakerId));
      const createdAt = nowIso();
      const next = {
        id: batchId,
        requestId,
        conversationId,
        sourceBurstId,
        eligibleActorIds: currentEligible.map((entry) => entry.actorId),
        eligibleContactIds: currentEligible.flatMap((entry) => entry.contact?.id || []),
        messages: queuedRows,
        status: queuedRows.length ? "queued" : "completed",
        createdAt,
        updatedAt: createdAt
      };
      latest.groupBatches.push(next);
      latest.groupBatches = latest.groupBatches.slice(-24);
      await saveState(latest, userId);
      await sendState(latest, userId, queuedRows.length ? "group_batch_queued" : "group_batch_empty");
      return next;
    });
    if (!batch || !batch.messages.length)
      return;
    for (let position = 0;position < batch.messages.length; position += 1) {
      const slot = batch.messages[position];
      const speaker = eligible.find((entry) => entry.actorId === slot.speakerId);
      if (!speaker)
        continue;
      send({ type: "lumiphone:message_progress", requestId, chatId: context.chatId, characterId: context.characterId, conversationId, actorId: speaker.actorId, contactId: speaker.contact?.id, speakerContactId: speaker.actorId, phase: "pending" }, userId);
      const delay = groupRevealDelayMs(preferences, slot.text, position, slot.id);
      if (delay)
        await new Promise((resolve) => setTimeout(resolve, delay));
      const delivered = await withStateLock(stateKey(context.chatId, context.characterId), async () => {
        const latest = await loadState(context.chatId, context.characterId, userId);
        const latestBatch = latest.groupBatches.find((entry) => entry.id === batch.id);
        const latestSlot = latestBatch?.messages.find((entry) => entry.id === slot.id);
        const latestConversation = latest.conversations.find((entry) => entry.id === conversationId && entry.kind === "group");
        if (!latestBatch || !latestSlot || !latestConversation || latestBatch.status === "cancelled" || latestSlot.state !== "queued")
          return null;
        if (!conversationActorIds(latestConversation).includes(speaker.actorId)) {
          latestSlot.state = "cancelled";
          latestBatch.updatedAt = nowIso();
          if (!latestBatch.messages.some((entry) => entry.state === "queued"))
            latestBatch.status = "completed";
          await saveState(latest, userId);
          await sendState(latest, userId, "group_batch_membership_changed");
          return { skipped: true };
        }
        latestBatch.status = "delivering";
        const visible = notificationDestinationVisible(latest, { app: "messages", conversationId }, userId);
        const profileRow = profiles.find((entry) => entry.actor.actorId === speaker.actorId);
        const profile = profileRow.profile;
        const speakerContact = profileRow.contact;
        const message = {
          id: id("msg"),
          sender: "contact",
          senderActorId: speaker.actorId,
          senderActorKind: speaker.kind,
          senderContactId: speaker.contact?.id,
          senderName: speaker.name,
          senderAccent: speaker.accent,
          text: latestSlot.text,
          createdAt: nowIso(),
          read: visible,
          status: visible ? "read" : "delivered",
          generation: { requestId, info: {
            speaker: profile.name,
            source: profile.source,
            sourceId: speakerContact.source.kind === "character" ? speakerContact.source.characterId : speakerContact.source.kind === "council" ? speakerContact.source.memberId || speakerContact.source.itemId : speaker.actorId,
            sourceResolution: speakerContact.source.kind === "character" || speakerContact.source.kind === "council" ? "resolved" : speakerContact.source.origin === "manual" ? "manual" : "snapshot",
            activeCharacterId: latest.characterId,
            activeCharacterUsed: speakerContact.source.kind === "character" && speakerContact.source.characterId === latest.characterId,
            identityChars: (speakerContact.identityBrief || speakerContact.description).length,
            sceneSnapshotStale: latest.sceneSnapshot?.stale ?? true,
            contextMode: preferences.roleplayContextMode,
            recentCount: assembled.diagnostics.recentRoleplay.count,
            recentChars: assembled.diagnostics.recentRoleplay.chars,
            storyCount: assembled.diagnostics.story.count,
            storyChars: assembled.diagnostics.story.chars,
            threadCount: assembled.diagnostics.phoneThread.count,
            threadChars: assembled.diagnostics.phoneThread.chars,
            generationMode: preferences.generationMode,
            connectionName: generationInfo.effective?.name || "",
            model: preferences.sidecarModelOverride || generationInfo.effective?.model || "",
            groupBatch: { id: batch.id, position: position + 1, size: batch.messages.length, eligibleCount: eligible.length }
          } }
        };
        latestConversation.messages.push(message);
        latestConversation.messages = latestConversation.messages.slice(-MAX_MESSAGES2);
        latestConversation.updatedAt = message.createdAt;
        if (!visible)
          latestConversation.unread += 1;
        latestSlot.state = "delivered";
        latestSlot.deliveredMessageId = message.id;
        latestSlot.deliveredAt = message.createdAt;
        latestBatch.updatedAt = message.createdAt;
        if (!latestBatch.messages.some((entry) => entry.state === "queued"))
          latestBatch.status = "completed";
        const route = { app: "messages", conversationId, messageId: message.id };
        const notification = preferences.notifyMessages ? addNotification(latest, { app: "messages", title: speaker.name, body: preferences.notificationPreviews ? message.text.slice(0, 220) : "New message", route, source: "model", severity: "important" }, userId) : null;
        const activity = addActivity(latest, { kind: "message", title: speaker.name, summary: message.text.slice(0, 280), route, source: { contactId: speaker.contact?.id, conversationId } });
        await saveState(latest, userId);
        await sendState(latest, userId, "group_message", preferences.autoOpenOnModelAction);
        return { notification, activity };
      });
      if (!delivered)
        break;
      if ("skipped" in delivered && delivered.skipped)
        continue;
      if (delivered.notification)
        await maybePush(await loadState(context.chatId, context.characterId, userId), preferences, delivered.notification, userId);
      sendActivity(delivered.activity, userId);
      sendNotification(delivered.notification, userId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
    await withStateLock(stateKey(context.chatId, context.characterId), async () => {
      const state = await loadState(context.chatId, context.characterId, userId);
      const batch = [...state.groupBatches].reverse().find((entry) => entry.requestId === requestId && (entry.status === "queued" || entry.status === "delivering"));
      if (batch) {
        batch.status = "failed";
        batch.error = message;
        batch.updatedAt = nowIso();
        await saveState(state, userId);
        await sendState(state, userId, "group_batch_failed");
      }
    });
    throw error;
  } finally {
    if (groupBatchFlights.get(flightKey) === flightToken)
      groupBatchFlights.delete(flightKey);
    if (progressOpen)
      send({ type: "lumiphone:message_progress", requestId, chatId: context.chatId, characterId: context.characterId, conversationId, phase: "done" }, userId);
  }
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
      { role: "system", content: 'Create one compact roleplay phone contact draft from the user description. Return strict JSON only: {"name":"","role":"","identityBrief":"","talkativeness":50,"fragmentation":35}. No markdown. identityBrief contains only stable facts useful across scenes: role, general personality, enduring relationship, distinctive behavior. Infer talkativeness and fragmentation from 0 to 100; these are editable messaging tendencies, never guarantees. Do not invent unsupported backstory. Name and role max 120 characters; identityBrief max 900.' },
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
  const identityBrief = text2(parsed.identityBrief ?? parsed.description, 900);
  const draft = {
    name,
    role: text2(parsed.role, 120) || "Pocket NPC",
    identityBrief,
    accent: stableContactAccent(name),
    messagingStyle: {
      talkativeness: Math.max(0, Math.min(100, Math.round(numberValue(parsed.talkativeness, 50)))),
      fragmentation: Math.max(0, Math.min(100, Math.round(numberValue(parsed.fragmentation, 35))))
    },
    sourceDescription: prompt
  };
  send({ type: "lumiphone:contact_draft", requestId, chatId: context.chatId, characterId: context.characterId, draft }, userId);
  send({ type: "lumiphone:operation_progress", task: "npc-contact", requestId, phase: "complete", message: "Draft ready" }, userId);
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
  const discoveredSource = contact.source.kind === "npc" && contact.source.origin === "discovered";
  const discoveredActorId = contact.source.kind === "npc" ? contact.source.discoveredActorId : undefined;
  const phoneEvidence = discoveredSource ? state.conversations.flatMap((conversation) => conversation.messages.filter((message) => message.senderActorId === discoveredActorId || message.senderContactId === contact.id)).slice(-12).map((message) => `${message.senderName}: ${message.text.slice(0, 600)}`).join(`
`) : "";
  const roleplayEvidence = discoveredSource && spindle.permissions.has("chat_mutation") ? (await spindle.chat.getMessages(context.chatId)).slice(-18).map((message) => `${message.role}: ${text2(message.content, 700)}`).join(`
`).slice(-9000) : "";
  send({ type: "lumiphone:operation_progress", task: "profile-refresh", requestId, phase: "generating", message: "Refreshing compact profile\u2026" }, userId);
  const parsed = await runStructuredGeneration("profile-refresh", requestId, {
    type: "quiet",
    messages: [
      { role: "system", content: 'Condense the authoritative actor profile into stable phone-contact facts. Return strict JSON only: {"identityBrief":""}. Include stable role, personality, relationship, and distinctive behavior when supported. Exclude temporary scene state and do not invent facts. Maximum 900 characters.' },
      { role: "user", content: discoveredSource ? `Name: ${profile.name}
Known phone messages:
${phoneEvidence || "(none)"}
Recent roleplay evidence:
${roleplayEvidence || "(unavailable)"}
Only describe facts genuinely supported by this evidence.` : `Name: ${profile.name}
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
    const npcBank = await loadNpcBank(userId);
    const sceneAt = nowIso();
    for (const contact of state.contacts)
      contact.presence.inScene = false;
    const contactIds = [];
    for (const candidate of found) {
      const sceneKey = sceneKeyFor(candidate.name);
      const matchedName = uniqueAliasMatch(candidate.name, aliasUniverse);
      let existing = state.contacts.find((entry) => entry.source.kind === "npc" && entry.source.origin === "scene" && entry.source.sceneKey === sceneKey) || state.contacts.find((entry) => actorName(entry.name) === actorName(matchedName || candidate.name));
      if (!existing) {
        const discovered = state.discoveredActors.find((entry) => entry.normalizedName === normalizeActorName(candidate.name));
        if (discovered)
          existing = promoteDiscoveredActor(state, discovered.id, sceneAt, id);
      }
      const bankEntry = findNpcBankMatch(npcBank, candidate.name);
      if (existing?.source.kind === "npc" && !existing.source.bankId && bankEntry) {
        existing = applyNpcBankProfile(existing, bankEntry, sceneAt);
      } else if (!existing && bankEntry) {
        existing = upsertContact(state, contactFromNpcBank(bankEntry, sceneAt, id), false);
      }
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
        source: { kind: "npc", origin: "scene", description: existing?.identityBrief || candidate.identityBrief, sceneKey, bankId: existing?.source.kind === "npc" ? existing.source.bankId : undefined },
        relationship: existing?.relationship || "background",
        presence: { inScene: true, lastSceneAt: sceneAt },
        contextPolicy: existing?.contextPolicy || { pinned: false },
        generationPolicy: existing?.generationPolicy || { relevant: true },
        messagingPolicy: existing?.messagingPolicy || { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
        messagingStyle: existing?.messagingStyle || { talkativeness: 50, fragmentation: 35 },
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
      const participant = resolvePocketActor(state, conversationActorIds(conversation)[0])?.contact;
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
    if (!conversation || conversation.messages.at(-1)?.sender !== "persona")
      return;
    const burst = conversation.outgoingBurst;
    if (expectedBurstId && (!burst || burst.id !== expectedBurstId || !burst.open || burst.finalized || burst.held))
      return;
    if (conversation.kind === "group") {
      if (!burst)
        return;
      await withStateLock(stateKey(chatId, characterId), async () => {
        const latest = await loadState(chatId, characterId, userId);
        const current = latest.conversations.find((entry) => entry.id === conversationId);
        if (!current?.outgoingBurst || current.outgoingBurst.id !== burst.id || current.outgoingBurst.finalized)
          return;
        current.outgoingBurst.open = false;
        current.outgoingBurst.finalized = true;
        current.outgoingBurst.updatedAt = nowIso();
        await saveState(latest, userId);
      });
      replyDecisionFlights.delete(flightKey);
      await generateGroupBatch({ requestId: id("group_auto"), chatId, characterId, conversationId, sourceBurstId: burst.id, autonomous: true }, userId);
      return;
    }
    const actor = resolvePocketActor(state, conversationActorIds(conversation)[0]);
    if (!actor)
      return;
    const contact = actorAsGenerationContact(actor, nowIso());
    if (!contact.generationPolicy.relevant)
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
      actorId: actor.actorId,
      contactId: actor.contact?.id,
      speakerContactId: actor.actorId,
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
Scene snapshot: ${(state.sceneSnapshot?.actors || []).map((actor2) => `${state.contacts.find((entry) => entry.id === actor2.contactId)?.name || actor2.contactId}: ${actor2.sceneBrief}`).join(" | ") || "none"}
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
      const latestActor = resolvePocketActor(latestState, actor.actorId);
      if (!latestActor)
        return null;
      const latestContact = actorAsGenerationContact(latestActor, nowIso());
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
      } else if (decision.normalizedAction === "handoff" && latestActor.contact) {
        relayId = commitConversationHandoff(latestState, latestConversation, latestContact, decision).id;
      } else if (decision.normalizedAction === "handoff") {
        latestConversation.availability = { state: "local", reason: decision.reason === "arrived" || decision.reason === "in_scene" || decision.reason === "took_action" || decision.reason === "continued_in_person" ? decision.reason : "continued_in_person" };
      }
      await saveState(latestState, userId);
      await sendState(latestState, userId, decision.normalizedAction === "handoff" ? "conversation_handoff" : decision.normalizedAction === "pause" ? "conversation_pause" : "reply_decision");
      return { action: decision.normalizedAction, relayId };
    });
    send({ type: "lumiphone:message_progress", requestId, chatId, characterId, conversationId, actorId: actor.actorId, contactId: actor.contact?.id, phase: "done" }, userId);
    progressRequestId = "";
    if (outcome?.relayId) {
      requestRelayContinuation(chatId, characterId, outcome.relayId, userId);
      return;
    }
    if (outcome?.action !== "reply")
      return;
    await generateMessage({ requestId: id("auto_reply"), chatId, characterId, conversationId, speakerActorId: actor.actorId, autonomous: true, instruction: "Reply naturally only because the latest user text warrants a response." }, userId);
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
          const discovered = state.discoveredActors.find((entry) => entry.normalizedName === normalizeActorName(name));
          if (discovered)
            actor = promoteDiscoveredActor(state, discovered.id, sceneAt, id);
        }
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
            relationship: "background",
            presence: { inScene: true, lastSceneAt: sceneAt },
            contextPolicy: { pinned: false },
            generationPolicy: { relevant: true },
            messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: "", lastInitiatedRoleplayAt: "" },
            messagingStyle: { talkativeness: 50, fragmentation: 35 },
            createdAt: sceneAt,
            updatedAt: sceneAt
          });
        }
        actor.presence = { inScene: true, lastSceneAt: sceneAt };
        actor.sceneNote = text2(raw.sceneBrief ?? raw.sceneNote, 600);
        snapshotActors.push({ contactId: actor.id, roleHint: text2(raw.roleHint ?? raw.role, 120) || actor.role, sceneBrief: actor.sceneNote });
      }
      for (const contact of state.contacts) {
        const conversation = directConversationForContact(state, contact.id);
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
    } else if (action === "conversation") {
      if (payload.kind !== undefined && payload.kind !== "group" && payload.channel !== "gc" && payload.channel !== "group")
        throw new Error("Only explicit group-conversation changes are supported.");
      const title = text2(payload.title ?? payload.conversation ?? payload.conversationTitle ?? payload.conversation_title, 120);
      const requestedId = text2(payload.conversationId ?? payload.conversation_id, 180);
      let conversation = requestedId ? state.conversations.find((entry) => entry.id === requestedId && entry.kind === "group") : undefined;
      if (requestedId && !conversation)
        throw new Error("That group conversation no longer exists.");
      if (!conversation && title) {
        const matches = state.conversations.filter((entry) => entry.kind === "group" && entry.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase());
        if (matches.length > 1)
          throw new Error(`Group title \u201C${title}\u201D is ambiguous; use its stable conversation id.`);
        conversation = matches[0];
      }
      const refs = Array.isArray(payload.participants) ? payload.participants.slice(0, 16) : [];
      const participantActorIds2 = [];
      for (const value of refs) {
        const ref = actorRefParts(value);
        let actor = resolveActorReference(state, value);
        if (!actor && ref.name) {
          const discovered = ensureDiscoveredActor(state, {
            name: ref.name,
            source: "group-chat",
            relationship: ref.relationship,
            now: nowIso(),
            makeId: id
          });
          actor = resolvePocketActor(state, discovered.id);
        }
        if (!actor)
          throw new Error("Every group participant needs a valid id or name.");
        if (ref.relationship === "close") {
          if (actor.contact)
            actor.contact.relationship = "close";
          if (actor.discovered)
            actor.discovered.relationship = "close";
        }
        if (!participantActorIds2.includes(actor.actorId))
          participantActorIds2.push(actor.actorId);
      }
      if (!refs.length && conversation)
        participantActorIds2.push(...conversationActorIds(conversation));
      if (participantActorIds2.length < 2)
        throw new Error("A group conversation needs at least two explicit participants.");
      const participantContactIds = participantActorIds2.flatMap((actorId) => resolvePocketActor(state, actorId)?.contact?.id || []).filter((entry, index, all) => all.indexOf(entry) === index);
      const changedAt = nowIso();
      if (conversation) {
        conversation.participantActorIds = participantActorIds2;
        conversation.participantContactIds = participantContactIds;
        if (title)
          conversation.title = title;
        conversation.updatedAt = changedAt;
      } else {
        const names = participantActorIds2.map((actorId) => resolvePocketActor(state, actorId)?.name).filter(Boolean);
        conversation = {
          id: id("conversation"),
          kind: "group",
          title: title || names.join(", ").slice(0, 120) || "Group",
          participantActorIds: participantActorIds2,
          participantContactIds,
          messages: [],
          unread: 0,
          availability: { state: "remote" },
          createdAt: changedAt,
          updatedAt: changedAt
        };
        state.conversations.push(conversation);
      }
      result = { ...result, conversationId: conversation.id, participantActorIds: [...conversation.participantActorIds] };
      activity = addActivity(state, { kind: "message", title: conversation.title, summary: `${conversation.participantActorIds.length} participants`, route: { app: "messages", conversationId: conversation.id }, source: { conversationId: conversation.id } }, command);
    } else if (action === "message") {
      const messageText = text2(payload.text ?? payload.message ?? payload.content, 12000);
      if (!messageText)
        throw new Error("A phone message needs text.");
      const sender = source === "user" || payload.sender === "user" || payload.sender === "persona" ? "persona" : payload.sender === "system" ? "system" : "contact";
      const explicitConversationId = text2(payload.conversationId ?? payload.conversation_id, 180);
      const foundConversation = explicitConversationId ? state.conversations.find((entry) => entry.id === explicitConversationId) : undefined;
      const channel = text2(payload.channel, 20).toLowerCase();
      const groupMessage = channel === "gc" || channel === "group" || foundConversation?.kind === "group" || Boolean(!explicitConversationId && text2(payload.conversation ?? payload.conversationTitle ?? payload.conversation_title, 120));
      const rawSpeaker = payload.speaker ?? payload.speakerRef ?? payload.speaker_ref ?? (payload.sender !== "user" && payload.sender !== "persona" && payload.sender !== "contact" && payload.sender !== "system" ? payload.sender : undefined) ?? (text2(payload.senderContactId ?? payload.sender_contact_id, 180) ? { contactId: payload.senderContactId ?? payload.sender_contact_id } : undefined) ?? (text2(payload.contact_name ?? payload.contactName, 120) ? { contactId: payload.contact_id ?? payload.contactId, name: payload.contact_name ?? payload.contactName, relationship: payload.relationship } : undefined);
      let conversation;
      let senderActor = null;
      if (groupMessage) {
        conversation = exactGroupConversation(state, payload);
        if (sender === "contact") {
          senderActor = resolveActorReference(state, rawSpeaker, conversationActorIds(conversation));
          if (!senderActor)
            throw new Error("The named sender is not a participant in this group. Change membership explicitly before they can speak.");
        }
      } else if (foundConversation) {
        conversation = foundConversation;
        if (conversation.kind !== "direct")
          throw new Error('Use channel "gc" for group messages.');
        if (sender === "contact") {
          senderActor = rawSpeaker ? resolveActorReference(state, rawSpeaker, conversationActorIds(conversation)) : resolvePocketActor(state, conversationActorIds(conversation)[0]);
          if (!senderActor)
            throw new Error("The message sender must be the participant in this direct conversation.");
        }
      } else {
        if (sender === "contact") {
          senderActor = resolveActorReference(state, rawSpeaker);
          const ref = actorRefParts(rawSpeaker);
          if (!senderActor && ref.name) {
            const discovered = ensureDiscoveredActor(state, {
              name: ref.name,
              source: source === "model" ? "model-tool" : "messages",
              relationship: ref.relationship === "close" ? "close" : relationshipValue(payload.relationship ?? payload.close),
              now: nowIso(),
              makeId: id
            });
            senderActor = resolvePocketActor(state, discovered.id);
          }
          if (!senderActor)
            throw new Error("A new direct-message sender needs a name; no full profile is required.");
          conversation = ensureDirectActorConversation(state, senderActor.actorId, nowIso(), id);
        } else {
          const target = resolveActorReference(state, payload.target ?? payload.contactId ?? payload.contact_id) || resolvePocketActor(state, state.contacts.find((entry) => entry.source.kind === "character" && entry.source.characterId === state.characterId)?.id || "");
          if (!target)
            throw new Error("Choose a valid direct-message target.");
          conversation = ensureDirectActorConversation(state, target.actorId, nowIso(), id);
        }
      }
      const senderActorId = sender === "contact" ? senderActor.actorId : undefined;
      const senderContact = sender === "contact" ? senderActor.contact : undefined;
      const message = {
        id: id("msg"),
        sender,
        senderActorId,
        senderActorKind: sender === "contact" ? senderActor.kind : undefined,
        senderContactId: senderContact?.id,
        senderName: sender === "persona" ? "You" : sender === "system" ? "Pocket" : senderActor.name,
        senderAccent: sender === "contact" ? senderActor.accent : "",
        text: messageText,
        createdAt: nowIso(),
        read: sender !== "contact",
        status: sender === "persona" ? "sent" : sender === "system" ? "read" : "delivered"
      };
      conversation.messages.push(message);
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES2);
      conversation.updatedAt = message.createdAt;
      if (sender === "persona" && source === "user") {
        if (conversation.kind === "group") {
          for (const batch of state.groupBatches.filter((entry) => entry.conversationId === conversation.id && (entry.status === "queued" || entry.status === "delivering"))) {
            batch.status = "cancelled";
            batch.updatedAt = message.createdAt;
            for (const queued of batch.messages)
              if (queued.state === "queued")
                queued.state = "cancelled";
          }
          groupBatchFlights.delete(`${viewKey(userId)}:${stateKey(context.chatId, context.characterId)}:${conversation.id}`);
        }
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
      notification = sender === "contact" && preferences.notifyMessages ? addNotification(state, { app: "messages", title: senderActor.name, body: preferences.notificationPreviews ? messageText.slice(0, 220) : "New message", route, source: source === "user" ? "system" : "model", severity: "important" }, userId) : null;
      result = { ...result, actorId: senderActorId, contactId: senderContact?.id, conversationId: conversation.id, messageId: message.id };
      if (source !== "user")
        activity = addActivity(state, { kind: "message", title: sender === "contact" ? senderActor.name : conversation.title, summary: messageText.slice(0, 280), route, source: { messageId: text2(input.messageId, 180) || undefined, contactId: senderContact?.id, conversationId: conversation.id } }, command);
    } else if (action === "contact") {
      const contactId = text2(payload.contactId ?? payload.contact_id ?? payload.id, 180);
      let existing = state.contacts.find((entry) => entry.id === contactId);
      const requestedName = text2(payload.name ?? payload.title, 120);
      if (!existing && requestedName) {
        const discoveredMatch = state.discoveredActors.find((entry) => entry.normalizedName === requestedName.trim().replace(/\s+/g, " ").toLocaleLowerCase());
        if (discoveredMatch)
          existing = promoteDiscoveredActor(state, discoveredMatch.id, nowIso(), id);
      }
      if (requestedName && (!existing || existing.source.kind === "npc" && !existing.source.bankId)) {
        const bankEntry = findNpcBankMatch(await loadNpcBank(userId), requestedName);
        if (bankEntry) {
          existing = existing && existing.source.kind === "npc" ? applyNpcBankProfile(existing, bankEntry, nowIso()) : upsertContact(state, contactFromNpcBank(bankEntry, nowIso(), id), false);
        }
      }
      const name = requestedName || existing?.name;
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
        relationship: payload.relationship === "close" ? "close" : payload.relationship === "background" ? "background" : existing?.relationship || "background",
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
        messagingStyle: {
          talkativeness: Math.max(0, Math.min(100, Math.round(numberValue(payload.talkativeness, existing?.messagingStyle.talkativeness ?? 50)))),
          fragmentation: Math.max(0, Math.min(100, Math.round(numberValue(payload.fragmentation, existing?.messagingStyle.fragmentation ?? 35))))
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
      case "lumiphone:get_debug_prompt": {
        const state = await loadState(context.chatId, context.characterId, userId);
        const conversationId = text2(payload.conversationId, 180);
        const conversation = state.conversations.find((entry) => entry.id === conversationId);
        if (!conversation)
          throw new Error("That conversation is no longer available.");
        const generated = [...conversation.messages].reverse().find((message) => Boolean(message.generation?.requestId));
        const promptRequestId = generated?.generation?.requestId || "";
        const debug = await loadPromptDebug(promptRequestId, userId);
        send({
          type: "lumiphone:debug_prompt",
          requestId,
          conversationId,
          messageId: generated?.id || "",
          generatedAt: generated?.createdAt || "",
          promptRequestId,
          debug
        }, userId);
        break;
      }
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
          let option = (await listContactSources(state, userId)).find((entry) => entry.kind === kind && entry.sourceId === sourceId && (!itemId || entry.itemId === itemId));
          if (!option)
            throw new Error("That Character or Council source is no longer available.");
          if (option.kind === "character" && (!option.avatarUrl || !option.accent)) {
            const presentation = await characterPresentationFor(option.sourceId, userId);
            option = { ...option, avatarUrl: presentation.avatarUrl || option.avatarUrl, accent: presentation.accent || option.accent };
          }
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
        spindle.log.info(`Pocket contact save invoked: request=${requestId} chat=${context.chatId}`);
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
          const contact = upsertContact(state, candidate, false);
          reconcileContactAvailability(state, contact);
          await saveState(state, userId);
          await sendState(state, userId, "contact");
          spindle.log.info(`Pocket contact save completed: request=${requestId} contact=${contact.id} accent=${contactAccent(contact)}`);
          send({ type: "lumiphone:contact_saved", requestId, contactId: contact.id, contact }, userId);
        });
        break;
      }
      case "lumiphone:npc_bank_save": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const contact = state.contacts.find((entry) => entry.id === text2(payload.contactId, 180));
          if (!contact)
            throw new Error("That contact no longer exists.");
          if (contact.source.kind !== "npc")
            throw new Error("Only Pocket NPC contacts can be saved to NPC Bank.");
          const savedEntry = await withStateLock(`npc-bank:${viewKey(userId)}`, async () => {
            const bank = await loadNpcBank(userId);
            const entry = upsertNpcBankFromContact(bank, contact, nowIso(), id);
            await saveNpcBank(bank, userId);
            return entry;
          });
          contact.source = { ...contact.source, bankId: savedEntry.id, description: savedEntry.identityBrief };
          contact.updatedAt = nowIso();
          await saveState(state, userId);
          await sendState(state, userId, "npc_bank");
          send({ type: "lumiphone:npc_bank_saved", requestId, contactId: contact.id, bankId: savedEntry.id, name: savedEntry.name }, userId);
        });
        break;
      }
      case "lumiphone:npc_bank_add": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const bank = await loadNpcBank(userId);
          const bankId = text2(payload.bankId, 180);
          const bankEntry = bank.entries.find((entry) => entry.id === bankId);
          if (!bankEntry)
            throw new Error("That NPC Bank profile no longer exists.");
          const bankNames = new Set([bankEntry.name, ...bankEntry.aliases].map((name) => normalizeNpcBankName(name)));
          let contact = state.contacts.find((entry) => entry.source.kind === "npc" && entry.source.bankId === bankId) || state.contacts.find((entry) => entry.source.kind === "npc" && bankNames.has(normalizeNpcBankName(entry.name)));
          if (!contact) {
            const discovered = state.discoveredActors.find((entry) => bankNames.has(normalizeNpcBankName(entry.displayName)));
            if (discovered) {
              contact = promoteDiscoveredActor(state, discovered.id, nowIso(), id);
              for (const conversation of state.conversations) {
                if (!conversationActorIds(conversation).includes(discovered.id) || conversation.participantContactIds.includes(contact.id))
                  continue;
                conversation.participantContactIds.push(contact.id);
              }
            }
          }
          if (contact)
            contact = applyNpcBankProfile(contact, bankEntry, nowIso());
          else
            contact = upsertContact(state, contactFromNpcBank(bankEntry, nowIso(), id), false);
          await saveState(state, userId);
          await sendState(state, userId, "npc_bank");
          send({ type: "lumiphone:contact_created", requestId, contactId: contact.id }, userId);
        });
        break;
      }
      case "lumiphone:npc_bank_delete": {
        const bankId = text2(payload.bankId, 180);
        if (!bankId)
          throw new Error("Choose an NPC Bank profile to forget.");
        const removedName = await withStateLock(`npc-bank:${viewKey(userId)}`, async () => {
          const bank = await loadNpcBank(userId);
          const existing = bank.entries.find((entry) => entry.id === bankId);
          if (!existing || !removeNpcBankEntry(bank, bankId, nowIso()))
            throw new Error("That NPC Bank profile no longer exists.");
          await saveNpcBank(bank, userId);
          return existing.name;
        });
        await sendState(await loadState(context.chatId, context.characterId, userId), userId, "npc_bank");
        send({ type: "lumiphone:npc_bank_deleted", requestId, bankId, name: removedName }, userId);
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
          const actorId = text2(payload.actorId ?? payload.contactId, 180);
          if (!resolvePocketActor(state, actorId))
            throw new Error("That actor no longer exists.");
          const conversation = ensureDirectActorConversation(state, actorId, nowIso(), id);
          await saveState(state, userId);
          send({ type: "lumiphone:conversation_opened", requestId, conversationId: conversation.id }, userId);
          await sendState(state, userId, "conversation");
        });
        break;
      }
      case "lumiphone:promote_discovered_actor": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const actorId = text2(payload.actorId, 180);
          const promotedAt = nowIso();
          let contact = promoteDiscoveredActor(state, actorId, promotedAt, id);
          const bankEntry = findNpcBankMatch(await loadNpcBank(userId), contact.name);
          if (contact.source.kind === "npc" && !contact.source.bankId && bankEntry) {
            contact = applyNpcBankProfile(contact, bankEntry, promotedAt);
          }
          for (const conversation of state.conversations) {
            if (!conversationActorIds(conversation).includes(actorId) || conversation.participantContactIds.includes(contact.id))
              continue;
            conversation.participantContactIds.push(contact.id);
          }
          await saveState(state, userId);
          await sendState(state, userId, "actor_promoted");
          send({ type: "lumiphone:discovered_actor_promoted", requestId, actorId, contactId: contact.id }, userId);
        });
        break;
      }
      case "lumiphone:create_conversation": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const participantActorIds2 = [...new Set((Array.isArray(payload.participantActorIds) ? payload.participantActorIds : Array.isArray(payload.participantContactIds) ? payload.participantContactIds : []).map((entry) => text2(entry, 180)).filter((entry) => Boolean(resolvePocketActor(state, entry))))].slice(0, 16);
          if (participantActorIds2.length < 2)
            throw new Error("A group conversation needs at least two participants.");
          const participantContactIds = participantActorIds2.flatMap((actorId) => resolvePocketActor(state, actorId)?.contact?.id || []).filter((entry, index, all) => all.indexOf(entry) === index);
          const createdAt = nowIso();
          const conversation = {
            id: id("conversation"),
            kind: "group",
            title: text2(payload.title, 120) || participantActorIds2.map((entry) => resolvePocketActor(state, entry)?.name).filter(Boolean).join(", ").slice(0, 120) || "Group",
            participantActorIds: participantActorIds2,
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
          const participantActorIds2 = [...new Set((Array.isArray(payload.participantActorIds) ? payload.participantActorIds : Array.isArray(payload.participantContactIds) ? payload.participantContactIds : conversationActorIds(conversation)).map((entry) => text2(entry, 180)).filter((entry) => Boolean(resolvePocketActor(state, entry))))].slice(0, 16);
          if (participantActorIds2.length < 2)
            throw new Error("A group conversation needs at least two participants.");
          const participantContactIds = participantActorIds2.flatMap((actorId) => resolvePocketActor(state, actorId)?.contact?.id || []).filter((entry, index, all) => all.indexOf(entry) === index);
          conversation.participantActorIds = participantActorIds2;
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
          state.setup.personaConfigured = true;
          await saveState(state, userId);
          await sendState(state, userId, "pocket_persona");
          send({ type: "lumiphone:pocket_persona_saved", requestId }, userId);
        });
        break;
      }
      case "lumiphone:setup_world_seed": {
        if (!spindle.permissions.has("generation"))
          throw new Error("Enable Generation before seeding Pocket world state.");
        const seed = await refreshNarrativeSeed(context.chatId, context.characterId, userId);
        if (!seed)
          throw new Error("Pocket could not find committed roleplay text to seed the world yet.");
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          state.setup.worldStatus = "seeded";
          state.setup.worldSeededAt = nowIso();
          applySetupCurrentGoal(state, seed);
          await saveState(state, userId);
          await sendState(state, userId, "setup_world");
        });
        send({
          type: "lumiphone:setup_world_done",
          requestId,
          setting: seed.world.setting,
          worldFacts: seed.world.facts.length,
          timelineItems: seed.timeline.length
        }, userId);
        break;
      }
      case "lumiphone:setup_world_skip": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          state.setup.worldStatus = "skipped";
          state.setup.worldSeededAt = undefined;
          await saveState(state, userId);
          await sendState(state, userId, "setup_world");
        });
        break;
      }
      case "lumiphone:finish_setup": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          if (!state.setup.personaConfigured)
            throw new Error("Choose the Pocket Persona before finishing setup.");
          if (state.setup.worldStatus !== "seeded" && state.setup.worldStatus !== "skipped")
            state.setup.worldStatus = "skipped";
          state.setup.initialized = true;
          state.setup.dismissed = false;
          await saveState(state, userId);
          await sendState(state, userId, "setup_complete");
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
        const actor = resolvePocketActor(state, conversationActorIds(conversation)[0]);
        if (!actor)
          throw new Error("That conversation has no available actor.");
        const contact = actorAsGenerationContact(actor, nowIso());
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
      case "lumiphone:generate_message": {
        let groupAuto = false;
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
          groupAuto = Boolean(conversation?.kind === "group" && (!text2(payload.speakerContactId, 180) || text2(payload.speakerContactId, 180) === "auto"));
          if (conversation?.outgoingBurst) {
            conversation.outgoingBurst.open = false;
            conversation.outgoingBurst.finalized = true;
            conversation.outgoingBurst.updatedAt = nowIso();
            await saveState(state, userId);
          }
        });
        if (groupAuto)
          await generateGroupBatch({ ...payload, manualOverride: true }, userId);
        else
          await generateMessage({ ...payload, manualOverride: true }, userId);
        break;
      }
      case "lumiphone:retry_message": {
        const state = await loadState(context.chatId, context.characterId, userId);
        const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
        const message = conversation?.messages.find((entry) => entry.id === text2(payload.messageId, 180));
        if (!conversation || !message || message.sender !== "contact")
          throw new Error("That generated message can no longer be retried.");
        await generateMessage({
          ...payload,
          replaceMessageId: message.id,
          speakerActorId: message.senderActorId || message.senderContactId,
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
      case "lumiphone:arm_reference": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          if (state.references.some((entry) => entry.status === "injected"))
            throw new Error("A Pocket reference is already attached to an active roleplay generation.");
          const conversation = state.conversations.find((entry) => entry.id === text2(payload.conversationId, 180));
          if (!conversation)
            throw new Error("That Pocket conversation no longer exists.");
          const scope = payload.scope === "recent_messages" || payload.scope === "selected_messages" ? payload.scope : "conversation";
          const selectedMessageIds = (Array.isArray(payload.messageIds) ? payload.messageIds : []).map((entry) => text2(entry, 180)).filter(Boolean).slice(0, 12);
          if (scope === "selected_messages" && !selectedMessageIds.some((messageId) => conversation.messages.some((message) => message.id === messageId))) {
            throw new Error("Select at least one message to reference.");
          }
          const reference = createPocketReference({ state, conversation, scope, selectedMessageIds, createdAt: nowIso(), makeId: id });
          if (!reference.messages.length)
            throw new Error("That conversation has no messages to reference yet.");
          for (const existing of state.references) {
            if (existing.status === "armed" || existing.status === "failed")
              existing.status = "cancelled";
          }
          state.references.push(reference);
          state.references = state.references.slice(-24);
          await saveState(state, userId);
          await sendState(state, userId, "reference_armed");
          send({ type: "lumiphone:reference_armed", requestId, referenceId: reference.id, conversationId: conversation.id }, userId);
        });
        break;
      }
      case "lumiphone:rearm_reference": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          if (state.references.some((entry) => entry.status === "injected"))
            throw new Error("A Pocket reference is already attached to an active roleplay generation.");
          const reference = state.references.find((entry) => entry.id === text2(payload.referenceId, 180) && entry.status === "failed");
          if (!reference)
            throw new Error("That failed Pocket reference is no longer available to retry.");
          for (const existing of state.references)
            if (existing.status === "armed")
              existing.status = "cancelled";
          reference.status = "armed";
          reference.injectedAt = undefined;
          reference.injectedGenerationId = undefined;
          reference.boundUserMessageId = undefined;
          reference.serializedReferenceChars = undefined;
          reference.serializedReference = undefined;
          reference.consumedAt = undefined;
          reference.consumedMessageId = undefined;
          reference.error = undefined;
          await saveState(state, userId);
          await sendState(state, userId, "reference_rearmed");
          send({ type: "lumiphone:reference_armed", requestId, referenceId: reference.id, conversationId: reference.conversationId }, userId);
        });
        break;
      }
      case "lumiphone:cancel_reference": {
        await withStateLock(stateKey(context.chatId, context.characterId), async () => {
          const state = await loadState(context.chatId, context.characterId, userId);
          const reference = state.references.find((entry) => entry.id === text2(payload.referenceId, 180) && (entry.status === "armed" || entry.status === "failed"));
          if (!reference)
            throw new Error("That Pocket reference can no longer be cancelled.");
          reference.status = "cancelled";
          reference.error = undefined;
          await saveState(state, userId);
          await sendState(state, userId, "reference_cancelled");
        });
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
          const conversation = state.conversations.find((entry) => entry.id === conversationId) || directConversationForContact(state, legacyContactId);
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
            for (const actor of state.discoveredActors)
              if (actor.promotedContactId === targetId)
                actor.promotedContactId = undefined;
            for (const conversation of state.conversations)
              conversation.participantContactIds = conversation.participantContactIds.filter((entry) => entry !== targetId);
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
        send({ type: "lumiphone:export_data", requestId, data: { product: "Pocket", exportVersion: 6, state: { ...state, processedCommands: [] }, preferences: await loadPreferences(userId), npcBank: await loadNpcBank(userId) } }, userId);
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
        let importedNpcBank = null;
        if (payload.data.preferences !== undefined) {
          const existing = await loadPreferences(userId);
          importedPreferences = normalizePreferences(payload.data.preferences);
          await validateChangedWallpaperSources(existing, importedPreferences, userId);
        }
        if (payload.data.npcBank !== undefined) {
          if (isFutureNpcBank(payload.data.npcBank))
            throw new Error("This backup uses a newer NPC Bank schema.");
          importedNpcBank = normalizeNpcBank(payload.data.npcBank, nowIso());
        }
        await saveState(state, userId);
        if (importedPreferences)
          await savePreferences(importedPreferences, userId);
        if (importedNpcBank)
          await saveNpcBank(importedNpcBank, userId);
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
    description: "Pocket persistence tool for the primary roleplay model. Call this tool instead of formatting phone messages into narrative text whenever the generated scene creates a new phone action that should appear in Pocket. Messages already supplied in a Pocket reference are historical and MUST NOT be resent. Named DM actors may be lightweight and need no full profile. Group messages must target an existing group and a current member; change membership with the conversation action. State persists per chat and character.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["message", "conversation", "contact", "scene", "note", "event", "weather", "tracker", "camera", "notify", "open"] },
        chat_id: { type: "string", description: "Current chat id when known." },
        character_id: { type: "string", description: "Current character id when known." },
        payload: {
          type: "object",
          description: "Action data. Messages accept channel dm|gc, speaker as a name or {contactId|name}, text/content, and target or an existing conversation id/exact group title. Unknown named DM senders become lightweight discovered actors. Unknown GC senders are rejected unless an explicit conversation action first establishes membership. conversation uses kind=group, title, and participants as names or actor/contact refs; participant relationship may be close or background. tracker operations target trackerId or stable key and use operation set/add/subtract/reset/set_state.",
          additionalProperties: true
        }
      },
      required: ["action", "payload"]
    },
    inline_available: true,
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
      const characterId = await stateCharacterIdForChat(chatId, context.characterId, context.userId);
      const generationId = text2(context.generationId, 180);
      let state = await loadState(chatId, characterId, context.userId);
      const metadataRelayId = relayIdFromMessages(messages);
      const generationRelay = generationId ? state.relays.find((entry) => entry.status === "pending" && entry.continuation.generationId === generationId) : undefined;
      const active = state.relays.filter((entry) => entry.status === "pending" && (entry.continuation.state === "launching" || entry.continuation.state === "accepted" || entry.continuation.state === "started"));
      const targetRelayId = metadataRelayId || generationRelay?.id || (!generationId && active.length === 1 ? active[0].id : "");
      const relayBlock = pendingRelayContext(state, { relayId: targetRelayId, maxChars: 3600 });
      const generic = { role: "system", content: `${PHONE_GUIDANCE}
Current Pocket snapshot:
${projectPhoneContext(state)}` };
      const injectedMessages = [...messages, generic];
      const breakdown = [{ messageIndex: messages.length, name: "Pocket memory" }];
      if (relayBlock && targetRelayId) {
        const injectedAt = nowIso();
        let receiptStored = false;
        try {
          state = await withStateLock(stateKey(chatId, characterId), async () => {
            const current = await loadState(chatId, characterId, context.userId);
            const target = current.relays.find((entry) => entry.id === targetRelayId && entry.status === "pending");
            if (!target)
              throw new Error(`Pending relay ${targetRelayId} disappeared before injection.`);
            const matchedGenerationId = generationId || target.continuation.generationId;
            target.injectedAt = injectedAt;
            target.injectedGenerationId = matchedGenerationId || undefined;
            target.serializedRelayChars = relayBlock.length;
            target.serializedRelay = relayBlock;
            target.relayExchangeMessageCount = target.conversationTail.recentMessageIds.length;
            target.injectionError = undefined;
            await saveState(current, context.userId);
            receiptStored = true;
            return current;
          });
        } catch (error) {
          spindle.log.error(`Pocket relay injection receipt failed: relay=${targetRelayId} error=${error instanceof Error ? error.message : String(error)}`);
        }
        if (receiptStored) {
          injectedMessages.push({ role: "system", content: relayBlock });
          breakdown.push({ messageIndex: injectedMessages.length - 1, name: "Pocket continuity relay \u2014 newer state" });
          spindle.log.info(`Pocket relay injected: relay=${targetRelayId} generation=${generationId || state.relays.find((entry) => entry.id === targetRelayId)?.continuation.generationId || "awaiting-association"} chars=${relayBlock.length}`);
        }
      }
      const generationType = text2(context.generationType, 40);
      const lastUserMessage = [...messages].reverse().find((message) => message?.role === "user" && message.__isChatHistory === true && text2(message.sourceMessageId, 180));
      const referenceEligible = !targetRelayId && context.isDryRun !== true && generationType === "normal" && Boolean(lastUserMessage);
      const armedReference = referenceEligible ? latestArmedReference(state) : undefined;
      if (armedReference) {
        let referenceBlock = "";
        try {
          state = await withStateLock(stateKey(chatId, characterId), async () => {
            const current = await loadState(chatId, characterId, context.userId);
            const target = current.references.find((entry) => entry.id === armedReference.id && entry.status === "armed");
            if (!target)
              return current;
            referenceBlock = serializePocketReference(target, 2200);
            target.status = "injected";
            target.injectedAt = nowIso();
            target.injectedGenerationId = generationId || undefined;
            target.boundUserMessageId = text2(lastUserMessage?.sourceMessageId, 180) || undefined;
            target.serializedReferenceChars = referenceBlock.length;
            target.serializedReference = referenceBlock;
            target.error = undefined;
            await saveState(current, context.userId);
            return current;
          });
        } catch (error) {
          spindle.log.error(`Pocket reference injection receipt failed: reference=${armedReference.id} error=${error instanceof Error ? error.message : String(error)}`);
          referenceBlock = "";
        }
        if (referenceBlock) {
          injectedMessages.push({ role: "system", content: referenceBlock });
          breakdown.push({ messageIndex: injectedMessages.length - 1, name: "Pocket user reference \u2014 this turn" });
          spindle.log.info(`Pocket reference injected: reference=${armedReference.id} generation=${generationId || "awaiting-association"} chars=${referenceBlock.length}`);
        }
      }
      return { messages: injectedMessages, breakdown };
    } catch (error) {
      spindle.log.error(`Pocket interceptor failed: ${error instanceof Error ? error.message : String(error)}`);
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
      let reference = referenceForGeneration(state, generationId);
      if (!reference) {
        const unbound = state.references.filter((entry) => entry.status === "injected" && entry.injectedAt && !entry.injectedGenerationId);
        if (unbound.length === 1)
          reference = unbound[0];
      }
      if (!relay && !reference)
        return;
      if (relay) {
        relay.continuation.state = "started";
        relay.continuation.generationId = generationId;
        relay.continuation.generationStartedAt = nowIso();
        relay.continuation.error = undefined;
        if (relay.injectedAt && !relay.injectedGenerationId)
          relay.injectedGenerationId = generationId;
        spindle.log.info(`Pocket observed GENERATION_STARTED: relay=${relay.id} generation=${generationId}`);
      }
      if (reference) {
        reference.injectedGenerationId = generationId;
        reference.error = undefined;
        spindle.log.info(`Pocket observed GENERATION_STARTED: reference=${reference.id} generation=${generationId}`);
      }
      await saveState(state, userId);
      await sendState(state, userId, relay ? "relay_started" : "reference_started");
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
      const generationType = text2(payload?.generationType ?? payload?.generation_type, 40);
      const relay = generationId ? relayForGeneration(state, generationId) : undefined;
      let reference = generationId ? referenceForGeneration(state, generationId) : undefined;
      let endedBoundUserMessageId = "";
      if (!reference && generationType === "normal" && messageId && spindle.permissions.has("chat_mutation")) {
        try {
          const hostMessages = await spindle.chat.getMessages(chatId);
          const generatedIndex = hostMessages.findIndex((message) => text2(message?.id, 180) === messageId);
          if (generatedIndex >= 0) {
            const precedingUser = hostMessages.slice(0, generatedIndex).reverse().find((message) => message?.role === "user" && text2(message?.id, 180));
            endedBoundUserMessageId = text2(precedingUser?.id, 180);
            if (endedBoundUserMessageId) {
              const boundMatches = state.references.filter((entry) => entry.status === "injected" && entry.boundUserMessageId === endedBoundUserMessageId && (!generationId || !entry.injectedGenerationId || entry.injectedGenerationId === generationId));
              if (boundMatches.length === 1) {
                reference = boundMatches[0];
                if (generationId && !reference.injectedGenerationId)
                  reference.injectedGenerationId = generationId;
                spindle.log.info(`Pocket reference completion fallback matched bound user turn: reference=${reference.id} generation=${generationId || "missing"} userMessage=${endedBoundUserMessageId}`);
              }
            }
          }
        } catch (error) {
          spindle.log.warn(`Pocket could not reconcile reference completion from chat history: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      if (relay) {
        relay.continuation.generationCompletedAt = nowIso();
        const injectionMatched = Boolean(relay.injectedAt && relay.injectedGenerationId === generationId);
        if (payload?.error || !messageId) {
          relay.continuation = { ...relay.continuation, state: "failed", error: text2(payload?.error, 500) || "The roleplay continuation did not produce a message." };
        } else if (!injectionMatched) {
          relay.injectionError = "The generation completed without a confirmed matching Pocket relay injection.";
          relay.continuation = { ...relay.continuation, state: "failed", error: relay.injectionError };
        } else {
          relay.status = "consumed";
          relay.consumedAt = nowIso();
          relay.consumedMessageId = messageId;
          relay.continuation = { ...relay.continuation, state: "completed", error: undefined };
        }
        changed = true;
        spindle.log.info(`Pocket observed GENERATION_ENDED: relay=${relay.id} generation=${generationId || "unknown"} status=${relay.status} message=${messageId || "none"}`);
      }
      if (reference) {
        const injectionMatched = Boolean(reference.injectedAt && (generationId && reference.injectedGenerationId === generationId || endedBoundUserMessageId && reference.boundUserMessageId === endedBoundUserMessageId));
        if (payload?.error || !messageId) {
          reference.status = "failed";
          reference.error = text2(payload?.error, 500) || "The roleplay generation did not produce a message. The reference was not consumed.";
        } else if (!injectionMatched) {
          reference.status = "failed";
          reference.error = "The generation completed without a confirmed matching Pocket reference injection.";
        } else {
          reference.status = "consumed";
          reference.consumedAt = nowIso();
          reference.consumedMessageId = messageId;
          reference.error = undefined;
        }
        changed = true;
        spindle.log.info(`Pocket observed GENERATION_ENDED: reference=${reference.id} generation=${generationId || "unknown"} status=${reference.status} message=${messageId || "none"}`);
      }
      if (messageId && state.sceneSnapshot && state.sceneSnapshot.sourceMessageId !== messageId) {
        state.sceneSnapshot.stale = true;
        changed = true;
      }
      if (!changed)
        return;
      await saveState(state, userId);
      const reason = relay ? relay.status === "consumed" ? "relay_consumed" : "relay_failed" : reference ? reference.status === "consumed" ? "reference_consumed" : "reference_failed" : "scene_stale";
      await sendState(state, userId, reason);
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
      const reference = referenceForGeneration(state, generationId);
      if (!relay && !reference)
        return;
      if (relay)
        relay.continuation = { ...relay.continuation, state: "stopped", error: "Generation was stopped. The relay remains pending." };
      if (reference) {
        reference.status = "failed";
        reference.error = "Generation was stopped. The reference was not consumed.";
      }
      await saveState(state, userId);
      await sendState(state, userId, relay ? "relay_stopped" : "reference_failed");
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
    refreshNarrativeSeed(chatId, characterId, userId);
    considerAmbientMessage(chatId, characterId, "turn", userId);
  } catch {}
});
spindle.log.info("Pocket backend loaded.");
