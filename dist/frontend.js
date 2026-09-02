// src/domain/preferences.ts
var PREFERENCES_VERSION = 1;
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
function wallpaperCss(primary, secondary) {
  return `linear-gradient(145deg, ${safeColor(primary, "#171327")} 0%, ${safeColor(secondary, "#123a4a")} 100%)`;
}

// src/domain/navigation.ts
var APPS = new Set(["home", "messages", "gallery", "camera", "notes", "weather", "calendar", "trackers", "settings"]);
function shortId(value) {
  if (typeof value !== "string")
    return;
  const clean = value.trim().slice(0, 180);
  return clean || undefined;
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

// src/frontend/surface.ts
var PHONE_ASPECT = 9 / 16;
var PHONE_BASE_WIDTH = 360;
var PHONE_SCALE_MIN = 0.8;
var PHONE_SCALE_MAX = 1.25;
function currentViewport() {
  const visual = window.visualViewport;
  return {
    width: Math.max(1, Math.floor(visual?.width || window.innerWidth)),
    height: Math.max(1, Math.floor(visual?.height || window.innerHeight))
  };
}
function calculatePhoneSurface(scale, viewport = currentViewport(), allowFullscreen = true) {
  const normalizedScale = Math.max(PHONE_SCALE_MIN, Math.min(PHONE_SCALE_MAX, Number(scale) || 1));
  const fullscreen = allowFullscreen && (viewport.width <= 720 || viewport.height <= 540);
  if (fullscreen)
    return { ...viewport, fullscreen: true, x: 0, y: 0 };
  const margin = 24;
  const desiredWidth = PHONE_BASE_WIDTH * normalizedScale;
  const width = Math.max(240, Math.floor(Math.min(desiredWidth, viewport.width - margin, (viewport.height - margin) * PHONE_ASPECT)));
  const height = Math.floor(width / PHONE_ASPECT);
  return {
    width,
    height,
    fullscreen: false,
    x: Math.max(12, Math.floor(viewport.width - width - 18)),
    y: Math.max(12, Math.floor((viewport.height - height) / 2))
  };
}
function applyMobilePhoneSurface(widget, scale) {
  const geometry = calculatePhoneSurface(scale);
  widget.setFullscreen(geometry.fullscreen);
  if (!geometry.fullscreen) {
    widget.setSize(geometry.width, geometry.height);
    widget.moveTo(geometry.x, geometry.y);
  }
  return geometry;
}
function desktopDockSize(scale, viewport = currentViewport()) {
  const geometry = calculatePhoneSurface(scale, viewport, false);
  return Math.min(viewport.width - 40, Math.max(geometry.width + 32, 292));
}

// src/frontend/shared.ts
function el(tag, className = "", content = "") {
  const node = document.createElement(tag);
  if (className)
    node.className = className;
  if (content)
    node.textContent = content;
  return node;
}
function button(label, className = "lp-button") {
  const node = el("button", className, label);
  node.type = "button";
  return node;
}
function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()))
    return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}
function formatDate(value, detail = false) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()))
    return String(value || "");
  return new Intl.DateTimeFormat(undefined, detail ? { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" }).format(date);
}
function dateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function inputValue(input) {
  return input.value.trim();
}
function requestId(prefix = "req") {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

// src/frontend/apps/settings.ts
function colorSetting(label, value, update) {
  const row = el("div", "lp-row-between");
  row.appendChild(el("span", "lp-title", label));
  const input = el("input", "lp-color-input");
  input.type = "color";
  input.value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#8b7dff";
  input.addEventListener("input", () => update(input.value));
  row.appendChild(input);
  return row;
}
function toggleSetting(label, initial, update) {
  const row = el("div", "lp-row-between");
  row.appendChild(el("span", "lp-title", label));
  const toggle = el("button", "lp-toggle");
  toggle.type = "button";
  toggle.setAttribute("aria-pressed", String(initial));
  toggle.addEventListener("click", () => {
    const next = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", String(next));
    update(next);
  });
  row.appendChild(toggle);
  return row;
}
function renderSettingsView(host) {
  const settings = structuredClone(host.preferences);
  const { page, content } = host.page("Settings", "Device-wide preferences", "Save");
  const appearance = el("section", "lp-card lp-settings-section");
  appearance.dataset.settingsSection = "appearance";
  appearance.appendChild(el("div", "lp-eyebrow", "Appearance"));
  const themes = el("div", "lp-row");
  const themeColors = [["midnight", "#201a37"], ["porcelain", "#eeeae6"], ["rose", "#7a294e"], ["forest", "#1d5a41"], ["custom", settings.colors.accent]];
  for (const [name, color] of themeColors) {
    const dot = el("button", "lp-theme-dot");
    dot.type = "button";
    dot.title = name;
    dot.style.background = color;
    dot.setAttribute("aria-pressed", String(settings.theme === name));
    dot.addEventListener("click", () => {
      settings.theme = name;
      if (name !== "custom")
        settings.colors = themePalette(name);
      host.preview(normalizePreferences(settings), { appearance: true, rerender: true });
    });
    themes.appendChild(dot);
  }
  const palette = el("div", "lp-color-grid");
  const colorControl = (label, key) => colorSetting(label, settings.colors[key], (value) => {
    settings.colors[key] = value;
    settings.theme = "custom";
    host.preview(normalizePreferences(settings), { appearance: true });
  });
  palette.append(colorControl("Accent", "accent"), colorControl("Bezel", "bezel"), colorControl("UI background", "background"), colorControl("UI surface", "surface"), colorControl("UI text", "text"), colorControl("Home top", "wallpaperPrimary"), colorControl("Home bottom", "wallpaperSecondary"), colorControl("Chat top", "chatPrimary"), colorControl("Chat bottom", "chatSecondary"));
  const scaleRow = el("label", "lp-slider-setting");
  const scaleHead = el("span", "lp-row-between");
  const scaleValue = el("strong", "", `${settings.handsetScale.toFixed(2)}×`);
  scaleHead.append(el("span", "lp-title", "Phone size"), scaleValue);
  const scale = el("input");
  scale.type = "range";
  scale.min = "0.8";
  scale.max = "1.25";
  scale.step = "0.05";
  scale.value = String(settings.handsetScale);
  scale.addEventListener("input", () => {
    settings.handsetScale = Number(scale.value);
    scaleValue.textContent = `${settings.handsetScale.toFixed(2)}×`;
    host.preview(normalizePreferences(settings), { resize: true });
  });
  scaleRow.append(scaleHead, scale, el("span", "lp-copy", "A semantic scale; dimensions are recalculated from this viewport."));
  const animationLabel = el("label", "lp-label", "App opening animation");
  const animation = el("select", "lp-select");
  for (const value of ["spring", "slide", "fade", "none"]) {
    const option = el("option", "", value[0].toUpperCase() + value.slice(1));
    option.value = value;
    option.selected = settings.animation === value;
    animation.appendChild(option);
  }
  animationLabel.appendChild(animation);
  const durationRow = el("label", "lp-slider-setting");
  const durationHead = el("span", "lp-row-between");
  const durationValue = el("strong", "", `${settings.animationDurationMs} ms`);
  durationHead.append(el("span", "lp-title", "Animation duration"), durationValue);
  const duration = el("input");
  duration.type = "range";
  duration.min = "0";
  duration.max = "700";
  duration.step = "20";
  duration.value = String(settings.animationDurationMs);
  duration.addEventListener("input", () => {
    settings.animationDurationMs = Number(duration.value);
    durationValue.textContent = `${settings.animationDurationMs} ms`;
  });
  durationRow.append(durationHead, duration);
  const reducedMotion = toggleSetting("Reduce motion", settings.reducedMotion, (value) => {
    settings.reducedMotion = value;
  });
  appearance.append(themes, palette, scaleRow, animationLabel, durationRow, reducedMotion);
  const behavior = el("section", "lp-card lp-settings-section");
  behavior.dataset.settingsSection = "behavior";
  behavior.appendChild(el("div", "lp-eyebrow", "Character actions"));
  behavior.append(toggleSetting("Open phone on model action", settings.autoOpenOnModelAction, (value) => {
    settings.autoOpenOnModelAction = value;
  }), toggleSetting("Push notifications", settings.pushNotifications, (value) => {
    settings.pushNotifications = value;
  }), toggleSetting("Camera scene planner", settings.sceneEnhancer, (value) => {
    settings.sceneEnhancer = value;
  }));
  const visual = el("section", "lp-card lp-settings-section");
  visual.dataset.settingsSection = "camera";
  visual.appendChild(el("div", "lp-eyebrow", "Camera visual profile"));
  const swarm = toggleSetting("Sync active Swarm Studio profile", settings.useSwarmProfile, (value) => {
    settings.useSwarmProfile = value;
  });
  const status = el("div", "lp-copy", host.swarmProfile?.available ? `Linked: ${host.swarmProfile.checkpoint || "active checkpoint"}${host.swarmProfile.presets ? ` · ${host.swarmProfile.presets}` : ""}` : "Swarm Studio profile macros were not detected. Manual fields below remain active.");
  const positive = el("textarea", "lp-textarea");
  positive.placeholder = "Manual positive / character style";
  positive.value = settings.manualVisualProfile.positive;
  const negative = el("textarea", "lp-textarea");
  negative.placeholder = "Manual negative prompt";
  negative.value = settings.manualVisualProfile.negative;
  const model = host.field("Checkpoint / model override", settings.manualVisualProfile.model);
  const connection = host.field("Image connection ID override", settings.manualVisualProfile.connectionId);
  const loras = el("textarea", "lp-textarea");
  loras.placeholder = "LoRA stack, one per line: name | weight";
  loras.value = settings.manualVisualProfile.loras.map((item) => `${item.name} | ${item.weight}`).join(`
`);
  const parameters = el("textarea", "lp-textarea");
  parameters.placeholder = "Provider parameters as JSON";
  parameters.value = Object.keys(settings.manualVisualProfile.parameters).length ? JSON.stringify(settings.manualVisualProfile.parameters, null, 2) : "";
  visual.append(swarm, status, positive, negative, model.label, connection.label, loras, parameters);
  const access = el("section", "lp-card lp-settings-section");
  access.dataset.settingsSection = "access";
  access.appendChild(el("div", "lp-eyebrow", "Lumiverse access"));
  const grid = el("div", "lp-permission-grid");
  const caps = host.capabilities;
  for (const [label, granted] of [
    ["Generation", Boolean(caps?.generation)],
    ["Model tools", Boolean(caps?.tools)],
    ["Prompt memory", Boolean(caps?.interceptor)],
    ["Gallery", Boolean(caps?.images)],
    ["Camera", Boolean(caps?.imageGen)],
    ["Floating phone", Boolean(caps?.panels)],
    ["Characters", Boolean(caps?.characters)],
    ["Personas", Boolean(caps?.personas)],
    ["Push", Boolean(caps?.push)]
  ]) {
    const cell = el("div", "lp-permission", label);
    cell.dataset.granted = String(granted);
    grid.appendChild(cell);
  }
  const manage = button("Request or update permissions");
  manage.addEventListener("click", () => host.requestPermissions());
  access.append(grid, manage);
  const data = el("section", "lp-card lp-settings-section");
  data.dataset.settingsSection = "data";
  data.append(el("div", "lp-eyebrow", "Backup and reset"), el("p", "lp-copy", "Exports include this roleplay phone and device preferences. Imports are validated and forced into the current chat/character scope."));
  const exportButton = button("Export current phone");
  exportButton.addEventListener("click", () => host.send("lumiphone:export_data"));
  const importButton = button("Import into current phone");
  const file = el("input");
  file.type = "file";
  file.accept = "application/json,.json";
  file.hidden = true;
  importButton.addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const selected = file.files?.[0];
    if (!selected)
      return;
    try {
      host.send("lumiphone:import_data", { data: JSON.parse(await selected.text()) });
    } catch {
      host.showError("That file is not valid Pocket JSON.");
    } finally {
      file.value = "";
    }
  });
  const resetCurrent = button("Reset this roleplay phone", "lp-button lp-button-danger");
  resetCurrent.addEventListener("click", () => {
    if (window.confirm("Reset the phone for only this chat and character?"))
      host.send("lumiphone:reset_current");
  });
  const resetAll = button("Reset all roleplay phones", "lp-button lp-button-danger");
  resetAll.addEventListener("click", () => {
    if (window.confirm("Delete every Pocket chat/character state? Device preferences will remain."))
      host.send("lumiphone:reset_all_roleplay");
  });
  const resetPrefs = button("Reset device preferences", "lp-button lp-button-danger");
  resetPrefs.addEventListener("click", () => {
    if (window.confirm("Reset theme, size, animations, notification behavior, and camera profile? Roleplay data will remain."))
      host.send("lumiphone:reset_preferences");
  });
  data.append(exportButton, importButton, file, resetCurrent, resetAll, resetPrefs);
  content.append(appearance, behavior, visual, access, data);
  page.querySelector(".lp-nav-action:last-child").addEventListener("click", () => {
    settings.animation = animation.value;
    settings.animationDurationMs = Number(duration.value);
    settings.manualVisualProfile.positive = positive.value.trim();
    settings.manualVisualProfile.negative = negative.value.trim();
    settings.manualVisualProfile.model = inputValue(model.input);
    settings.manualVisualProfile.connectionId = inputValue(connection.input);
    settings.manualVisualProfile.loras = loras.value.split(`
`).flatMap((line) => {
      const [name, rawWeight] = line.split("|").map((part) => part.trim());
      if (!name)
        return [];
      const weight = Number(rawWeight);
      return [{ name, weight: Number.isFinite(weight) ? weight : 1 }];
    });
    try {
      settings.manualVisualProfile.parameters = parameters.value.trim() ? JSON.parse(parameters.value) : {};
    } catch {
      host.showError("Provider parameters must be valid JSON.");
      return;
    }
    host.send("lumiphone:save_preferences", { preferences: settings });
    host.preview(normalizePreferences(settings), { appearance: true });
    host.openHome();
  });
  return page;
}

// src/domain/trackers.ts
var TRACKER_HISTORY_LIMIT = 40;
var KINDS = new Set(["meter", "counter", "state", "timer"]);
var CLOCKS = new Set(["real", "roleplay"]);
var MODES = new Set(["manual", "model", "automatic"]);
var PRESENTATIONS = new Set(["relationship", "meter", "vitals", "segmented", "counter", "timer", "state", "compact"]);
var TARGETS = new Set(["character", "persona", "relationship", "scene", "world", "custom"]);
function clean(value, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function trackerId(prefix = "trk") {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`}`;
}
function trackerKey(value, fallback = "tracker") {
  const key = clean(value, 120).toLocaleLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return key || fallback;
}
var TRACKER_TEMPLATES = [
  { group: "Character", name: "Health", values: { kind: "meter", label: "Health", key: "health", value: 100, initialValue: 100, min: 0, max: 100, unit: "%", presentation: "vitals" } },
  { group: "Character", name: "Hunger", values: { kind: "meter", label: "Hunger", key: "hunger", value: 20, initialValue: 20, min: 0, max: 100, unit: "%", updateMode: "automatic", ratePerHour: 3, clock: "roleplay" } },
  { group: "Relationship", name: "Trust", values: { kind: "meter", label: "Trust", key: "trust", value: 50, initialValue: 50, min: 0, max: 100, unit: "%", presentation: "relationship", target: { type: "relationship", id: "", label: "Current relationship" } } },
  { group: "Relationship", name: "Relationship Status", values: { kind: "state", label: "Relationship Status", key: "relationship_status", state: "Acquaintances", initialState: "Acquaintances", states: ["Strangers", "Acquaintances", "Friends", "Close", "Partners"], presentation: "state", target: { type: "relationship", id: "", label: "Current relationship" } } },
  { group: "Scene", name: "Tension", values: { kind: "meter", label: "Scene Tension", key: "scene_tension", value: 10, initialValue: 10, min: 0, max: 100, unit: "%", target: { type: "scene", id: "", label: "Current scene" } } },
  { group: "Resource", name: "Ammo", values: { kind: "counter", label: "Ammo", key: "ammo", value: 12, initialValue: 12, min: 0, max: 999, unit: " rounds", presentation: "counter" } },
  { group: "World", name: "World Alert", values: { kind: "state", label: "World Alert", key: "world_alert", state: "Calm", initialState: "Calm", states: ["Calm", "Watchful", "Alarmed", "Crisis"], target: { type: "world", id: "", label: "Current world" } } },
  { group: "Timer", name: "Countdown", values: { kind: "timer", label: "Countdown", key: "countdown", value: 60, initialValue: 60, min: 0, max: 60, unit: " min", direction: "down", updateMode: "automatic", ratePerHour: -60, clock: "roleplay", presentation: "timer" } },
  { group: "State", name: "Condition", values: { kind: "state", label: "Condition", key: "condition", state: "Stable", initialState: "Stable", states: ["Stable", "Wounded", "Critical", "Recovering"], presentation: "state" } },
  { group: "Blank", name: "Blank meter", values: { kind: "meter", label: "New tracker", key: "new_tracker", value: 0, initialValue: 0, min: 0, max: 100, presentation: "meter" } }
];
function addHistory(tracker, entry) {
  return { ...tracker, history: [...tracker.history, { ...entry, id: trackerId("hist") }].slice(-TRACKER_HISTORY_LIMIT) };
}
function trackerBand(tracker, value = tracker.value) {
  return tracker.bands.find((band, index) => value >= band.min && (value < band.max || index === tracker.bands.length - 1)) || null;
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

// src/frontend/apps/trackers.ts
function selectField(labelText, options, selected) {
  const label = el("label", "lp-label", labelText);
  const select = el("select", "lp-select");
  for (const [value, name] of options) {
    const option = el("option", "", name);
    option.value = value;
    option.selected = selected === value;
    select.appendChild(option);
  }
  label.appendChild(select);
  return { label, select };
}
function toggle(labelText, initial) {
  const row = el("div", "lp-card lp-row-between");
  const copy = el("div");
  copy.appendChild(el("div", "lp-title", labelText));
  const control = button("", "lp-toggle");
  control.setAttribute("aria-pressed", String(initial));
  control.setAttribute("aria-label", labelText);
  control.addEventListener("click", () => control.setAttribute("aria-pressed", String(control.getAttribute("aria-pressed") !== "true")));
  row.append(copy, control);
  return { row, button: control };
}
function displayValue(tracker) {
  return tracker.kind === "state" ? tracker.state : `${Number(tracker.value.toFixed(2))}${tracker.unit}`;
}
function liveTracker(tracker, roleplayNow) {
  return tracker.clock === "real" ? materializeTracker(tracker, roleplayNow).tracker : tracker;
}
function percent(tracker) {
  return Math.max(0, Math.min(100, (tracker.value - tracker.min) / Math.max(0.00001, tracker.max - tracker.min) * 100));
}
function targetLabel(target) {
  return `${target.type[0].toUpperCase()}${target.type.slice(1)} · ${target.label || target.id || "Unassigned"}`;
}
function renderPresentation(tracker, roleplayNow) {
  const current = liveTracker(tracker, roleplayNow);
  const card = el("div", `lp-card lp-tracker-card lp-tracker-${current.presentation}`);
  card.dataset.trackerId = current.id;
  card.dataset.kind = current.kind;
  card.dataset.target = current.target.type;
  const heading = el("div", "lp-row-between");
  const left = el("div");
  left.append(el("div", "lp-eyebrow", targetLabel(current.target)), el("h3", "lp-title", current.label));
  const value = el("div", "lp-tracker-value", displayValue(current));
  value.dataset.trackerLiveValue = current.id;
  heading.append(left, value);
  card.appendChild(heading);
  if (current.kind !== "state" && current.presentation !== "counter" && current.presentation !== "compact") {
    const progress = el("div", current.presentation === "segmented" ? "lp-progress lp-progress-segmented" : "lp-progress");
    const fill = el("span");
    fill.dataset.trackerLiveFill = current.id;
    fill.style.setProperty("--progress", `${percent(current)}%`);
    fill.style.setProperty("--tracker-color", current.color);
    progress.appendChild(fill);
    card.appendChild(progress);
  }
  const band = current.kind === "state" ? null : trackerBand(current);
  const footer = el("div", "lp-tracker-meta");
  footer.append(el("span", "", band?.label || current.kind), el("span", "", current.updateMode === "automatic" ? `${current.clock === "roleplay" ? "Roleplay" : "Human"} clock` : current.updateMode));
  card.appendChild(footer);
  return card;
}
function dashboard(host) {
  const { page, content } = host.page("Trackers", "Live roleplay state", "Add", () => host.select("__template:9", "config"));
  const filters = el("div", "lp-tracker-filters");
  const all = button("All", "lp-chip");
  all.setAttribute("aria-pressed", "true");
  filters.appendChild(all);
  const choices = [...new Set(host.state.trackers.flatMap((tracker) => [tracker.kind, tracker.target.type]))];
  for (const choice of choices) {
    const filter = button(choice[0].toUpperCase() + choice.slice(1), "lp-chip");
    filter.dataset.filter = choice;
    filters.appendChild(filter);
  }
  const applyFilter = (choice = "") => {
    for (const card of content.querySelectorAll(".lp-tracker-card")) {
      card.hidden = Boolean(choice && card.dataset.kind !== choice && card.dataset.target !== choice);
    }
    for (const chip of filters.querySelectorAll(".lp-chip"))
      chip.setAttribute("aria-pressed", String((chip.dataset.filter || "") === choice));
  };
  all.addEventListener("click", () => applyFilter());
  for (const filter of filters.querySelectorAll("[data-filter]"))
    filter.addEventListener("click", () => applyFilter(filter.dataset.filter));
  content.appendChild(filters);
  for (const tracker of host.state.trackers) {
    const card = renderPresentation(tracker, host.state.roleplayNow);
    card.dataset.clickable = "true";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    const open = () => host.select(tracker.id, "detail");
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    content.appendChild(card);
  }
  if (!host.state.trackers.length) {
    const empty = el("div", "lp-empty");
    empty.appendChild(el("p", "lp-copy", "Add Health, Trust, Hunger, Ammo, a roleplay countdown, a state, or a blank custom tracker."));
    content.appendChild(empty);
  }
  const timer = window.setInterval(() => {
    for (const tracker of host.state.trackers) {
      if (tracker.clock !== "real" || tracker.updateMode !== "automatic")
        continue;
      const current = liveTracker(tracker, host.state.roleplayNow);
      const value = content.querySelector(`[data-tracker-live-value="${CSS.escape(tracker.id)}"]`);
      const fill = content.querySelector(`[data-tracker-live-fill="${CSS.escape(tracker.id)}"]`);
      if (value)
        value.textContent = displayValue(current);
      if (fill)
        fill.style.setProperty("--progress", `${percent(current)}%`);
    }
  }, 15000);
  host.onCleanup(() => window.clearInterval(timer));
  return page;
}
function detail(host, tracker) {
  const { page, content } = host.page(tracker.label, targetLabel(tracker.target), "⚙", () => host.select(tracker.id, "config"));
  content.appendChild(renderPresentation(tracker, host.state.roleplayNow));
  const policy = el("div", "lp-card lp-tracker-policy");
  policy.append(el("div", "lp-row-between", ""), el("p", "lp-copy", `${tracker.visibleToModel ? "Visible" : "Hidden"} in model context · ${tracker.allowModelWrite ? "Model may write" : "Model read-only"} · ${tracker.updateMode} updates`));
  if (tracker.pausedReason)
    policy.appendChild(el("p", "lp-warning", tracker.pausedReason));
  content.appendChild(policy);
  const operations = el("section", "lp-card lp-tracker-operations");
  operations.appendChild(el("div", "lp-eyebrow", "Update"));
  if (tracker.kind === "state") {
    const state = selectField("State", tracker.states.map((value) => [value, value]), tracker.state);
    const apply = button("Set state");
    apply.addEventListener("click", () => host.send("lumiphone:action", { action: "tracker", payload: { trackerId: tracker.id, operation: "set_state", state: state.select.value, reason: "Changed in Pocket" } }));
    operations.append(state.label, apply);
  } else {
    const amount = el("input", "lp-input");
    amount.type = "number";
    amount.step = "any";
    amount.value = tracker.kind === "counter" ? String(tracker.step) : "1";
    amount.setAttribute("aria-label", "Tracker amount");
    const row = el("div", "lp-tracker-operation-row");
    for (const [operation, label] of [["subtract", "−"], ["add", "+"], ["set", "Set"]]) {
      const control = button(label);
      control.addEventListener("click", () => host.send("lumiphone:action", { action: "tracker", payload: { trackerId: tracker.id, operation, amount: Number(amount.value), reason: "Changed in Pocket" } }));
      row.appendChild(control);
    }
    const reset = button("Reset", "lp-button lp-button-quiet");
    reset.addEventListener("click", () => host.send("lumiphone:action", { action: "tracker", payload: { trackerId: tracker.id, operation: "reset", reason: "Reset in Pocket" } }));
    operations.append(amount, row, reset);
  }
  content.appendChild(operations);
  const history = el("section", "lp-tracker-history");
  history.appendChild(el("div", "lp-eyebrow", `History · last ${tracker.history.length}`));
  for (const entry of [...tracker.history].reverse()) {
    const row = el("div", "lp-card lp-history-row");
    row.append(el("strong", "", `${entry.previous} → ${entry.next}`), el("span", "lp-copy", `${entry.operation} · ${entry.source}${entry.reason ? ` · ${entry.reason}` : ""}`), el("time", "lp-copy", entry.roleplayAt || entry.createdAt));
    history.appendChild(row);
  }
  if (!tracker.history.length)
    history.appendChild(el("p", "lp-copy", "No changes recorded yet."));
  content.appendChild(history);
  return page;
}
function config(host, current, templateIndex = 9) {
  const template = TRACKER_TEMPLATES[Math.max(0, Math.min(TRACKER_TEMPLATES.length - 1, templateIndex))];
  const source = current || template.values;
  const templateTarget = template.group === "Character" ? { type: "character", id: host.state.characterId, label: host.state.characterName } : template.group === "Scene" ? { type: "scene", id: "", label: "Current scene" } : template.group === "World" ? { type: "world", id: "", label: "Current world" } : { type: "custom", id: "", label: "Unassigned" };
  const selectedTarget = source.target || templateTarget;
  const { page, content } = host.page(current ? "Tracker Settings" : "New Tracker", "Configuration", "Save");
  if (!current) {
    const templateField = selectField("Template", TRACKER_TEMPLATES.map((entry, index) => [String(index), `${entry.group} · ${entry.name}`]), String(templateIndex));
    templateField.select.addEventListener("change", () => host.select(`__template:${templateField.select.value}`, "config"));
    content.appendChild(templateField.label);
  }
  const label = host.field("Label", String(source.label || ""));
  const key = host.field("Stable key", String(source.key || trackerKey(source.label)));
  const kind = selectField("Type", [["meter", "Meter"], ["counter", "Counter"], ["state", "State"], ["timer", "Timer"]], String(source.kind || "meter"));
  const presentation = selectField("Presentation", ["relationship", "meter", "vitals", "segmented", "counter", "timer", "state", "compact"].map((value2) => [value2, value2[0].toUpperCase() + value2.slice(1)]), String(source.presentation || source.kind || "meter"));
  const value = host.field("Current value", String(source.value ?? 0), "number");
  const initial = host.field("Reset value", String(source.initialValue ?? source.value ?? 0), "number");
  const min = host.field("Minimum", String(source.min ?? 0), "number");
  const max = host.field("Maximum", String(source.max ?? 100), "number");
  const unit = host.field("Unit", String(source.unit || ""));
  const state = host.field("Current state", source.kind === "state" ? String(source.state || "") : "");
  const states = el("textarea", "lp-textarea");
  states.placeholder = "Allowed states, one per line";
  states.value = source.kind === "state" ? (source.states || []).join(`
`) : "";
  const targetType = selectField("Target", ["character", "persona", "relationship", "scene", "world", "custom"].map((value2) => [value2, value2[0].toUpperCase() + value2.slice(1)]), selectedTarget.type);
  const targetId = host.field("Target ID", selectedTarget.id);
  const targetName = host.field("Target label", selectedTarget.label);
  const mode = selectField("Update mode", [["manual", "Manual"], ["model", "Model-directed"], ["automatic", "Automatic"]], source.updateMode || (source.ratePerHour ? "automatic" : "manual"));
  const clock = selectField("Automatic clock", [["real", "Human time (real clock)"], ["roleplay", "Roleplay time (timeline clock)"]], source.clock || "roleplay");
  const rate = host.field("Change per hour", String(source.ratePerHour ?? 0), "number");
  const color = el("input", "lp-color-input");
  color.type = "color";
  color.value = /^#[0-9a-f]{6}$/i.test(String(source.color || "")) ? String(source.color) : host.accent;
  const colorRow = el("label", "lp-card lp-row-between");
  colorRow.append(el("span", "lp-title", "Tracker color"), color);
  const bands = el("textarea", "lp-textarea");
  bands.placeholder = "Semantic bands: min | max | label | #color";
  bands.value = (source.bands || []).map((band) => `${band.min} | ${band.max} | ${band.label} | ${band.color}`).join(`
`);
  const visible = toggle("Visible in model context", source.visibleToModel !== false);
  const writable = toggle("Allow model changes", source.allowModelWrite === true);
  const configFields = el("div", "lp-tracker-config-fields");
  configFields.append(label.label, key.label, kind.label, presentation.label, value.label, initial.label, min.label, max.label, unit.label, state.label, states, targetType.label, targetId.label, targetName.label, mode.label, clock.label, rate.label, colorRow, bands, visible.row, writable.row);
  content.appendChild(configFields);
  const save = page.querySelector(".lp-nav-action:last-child");
  save.addEventListener("click", () => {
    const parsedBands = bands.value.split(`
`).flatMap((line) => {
      const [rawMin, rawMax, bandLabel, bandColor] = line.split("|").map((part) => part.trim());
      if (!bandLabel || !Number.isFinite(Number(rawMin)) || !Number.isFinite(Number(rawMax)))
        return [];
      return [{ min: Number(rawMin), max: Number(rawMax), label: bandLabel, color: /^#[0-9a-f]{6}$/i.test(bandColor) ? bandColor : color.value }];
    });
    host.send("lumiphone:action", { action: "tracker", payload: {
      id: current?.id,
      label: label.input.value.trim(),
      key: key.input.value.trim(),
      kind: kind.select.value,
      presentation: presentation.select.value,
      value: Number(value.input.value),
      initialValue: Number(initial.input.value),
      min: Number(min.input.value),
      max: Number(max.input.value),
      unit: unit.input.value.trim(),
      color: color.value,
      state: state.input.value.trim(),
      initialState: current?.kind === "state" ? current.initialState : state.input.value.trim(),
      states: states.value.split(`
`).map((entry) => entry.trim()).filter(Boolean),
      target: { type: targetType.select.value, id: targetId.input.value.trim(), label: targetName.input.value.trim() },
      updateMode: mode.select.value,
      clock: clock.select.value,
      ratePerHour: Number(rate.input.value),
      bands: parsedBands,
      visibleToModel: visible.button.getAttribute("aria-pressed") === "true",
      allowModelWrite: writable.button.getAttribute("aria-pressed") === "true"
    } });
    host.back();
  });
  if (current) {
    const remove = button("Delete tracker", "lp-button lp-button-danger");
    remove.addEventListener("click", () => {
      host.send("lumiphone:delete", { kind: "tracker", id: current.id });
      host.back();
    });
    content.appendChild(remove);
  }
  return page;
}
function renderTrackersView(host) {
  const selected = host.state.trackers.find((tracker) => tracker.id === host.selectedId) || null;
  if (selected && host.selectedView === "config")
    return config(host, selected);
  if (selected)
    return detail(host, selected);
  if (host.selectedId.startsWith("__template:"))
    return config(host, null, Number(host.selectedId.split(":")[1]));
  return dashboard(host);
}

// src/frontend/apps/messages.ts
function renderMessagesView(host) {
  const contact = host.state.contacts.find((item) => item.id === host.selectedContactId);
  if (!contact) {
    const { page: page2, content } = host.page("Messages", `${host.state.contacts.length} conversation${host.state.contacts.length === 1 ? "" : "s"}`);
    for (const item of host.state.contacts) {
      const card = el("div", "lp-card");
      card.dataset.clickable = "true";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      const row = el("div", "lp-row");
      const avatar = el("div", "lp-avatar", item.name.slice(0, 1).toUpperCase());
      if (item.avatarUrl) {
        const image = el("img");
        image.src = item.avatarUrl;
        image.alt = "";
        avatar.replaceChildren(image);
      }
      const latest = item.messages.at(-1);
      const copy = el("div", "lp-grow");
      const nameRow = el("div", "lp-row-between");
      nameRow.append(el("h3", "lp-title", item.name), el("span", "lp-copy", latest ? formatTime(latest.createdAt) : ""));
      copy.append(nameRow, el("p", "lp-copy", latest?.text || item.subtitle || "Start a conversation"));
      row.append(avatar, copy);
      if (item.unread)
        row.appendChild(el("span", "lp-unread", String(item.unread)));
      card.appendChild(row);
      const open = () => host.selectContact(item.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
      content.appendChild(card);
    }
    if (!host.state.contacts.length)
      content.appendChild(host.empty("No conversations yet", "A model phone action or your first message will create one."));
    return page2;
  }
  const page = el("div", "lp-thread");
  const nav = el("header", "lp-nav");
  const back = button("‹ Back", "lp-nav-action");
  back.addEventListener("click", () => host.selectContact(""));
  const title = el("div", "lp-nav-title", contact.name);
  title.appendChild(el("span", "lp-nav-subtitle", contact.subtitle || "Messages"));
  const replyBusy = host.busyContacts.has(contact.id);
  const generate = button(replyBusy ? "Writing…" : "Reply ✦", "lp-nav-action");
  generate.disabled = !host.generationAvailable || replyBusy;
  generate.addEventListener("click", () => host.generateReply(contact.id));
  nav.append(back, title, generate);
  const bubbles = el("div", "lp-bubbles");
  for (const message of contact.messages) {
    const bubble = el("div", "lp-bubble", message.text);
    bubble.dataset.messageId = message.id;
    bubble.dataset.selected = String(message.id === host.selectedMessageId);
    bubble.dataset.sender = message.sender;
    bubble.appendChild(el("span", "lp-bubble-time", `${formatTime(message.createdAt)} · ${message.status}`));
    bubbles.appendChild(bubble);
  }
  if (replyBusy) {
    const pending = el("div", "lp-bubble lp-bubble-pending", "Writing…");
    pending.dataset.sender = "character";
    bubbles.appendChild(pending);
  }
  if (!contact.messages.length)
    bubbles.appendChild(host.empty("Say hello", `This conversation belongs to ${host.state.characterName} in this chat.`));
  const compose = el("form", "lp-compose");
  const sparkle = host.iconButton("sparkle", "Generate character reply");
  sparkle.disabled = !host.generationAvailable || replyBusy;
  sparkle.addEventListener("click", () => host.generateReply(contact.id));
  const textarea = el("textarea", "lp-textarea");
  textarea.rows = 1;
  textarea.placeholder = "Message…";
  const submit = host.iconButton("send", "Send message");
  compose.append(sparkle, textarea, submit);
  compose.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = inputValue(textarea);
    if (!message)
      return;
    host.send("lumiphone:action", { action: "message", payload: { contactId: contact.id, contactName: contact.name, text: message, sender: "user" } });
    textarea.value = "";
  });
  page.append(nav, bubbles, compose);
  requestAnimationFrame(() => {
    const selected = host.selectedMessageId ? bubbles.querySelector(`[data-message-id="${CSS.escape(host.selectedMessageId)}"]`) : null;
    if (selected)
      selected.scrollIntoView({ block: "center" });
    else
      bubbles.scrollTop = bubbles.scrollHeight;
  });
  return page;
}

// src/frontend/activity.ts
var ICONS = {
  message: "Message",
  "tracker-change": "Tracker",
  timeline: "Timeline",
  note: "Journal",
  image: "Photo",
  weather: "Weather",
  system: "Pocket"
};
function activityReceipt(ctx, activity, openRoute) {
  const messageId = activity.source?.messageId;
  if (!messageId)
    return null;
  const bubble = ctx.dom.findMessageElement(messageId);
  if (!bubble)
    return null;
  const wrapper = ctx.dom.inject(bubble, '<span class="pocket-receipt-host"></span>', "beforeend");
  const button2 = document.createElement("button");
  button2.type = "button";
  button2.className = "pocket-receipt";
  button2.setAttribute("aria-label", `Open ${activity.title} in Pocket`);
  const label = document.createElement("span");
  label.className = "pocket-receipt-kind";
  label.textContent = ICONS[activity.kind];
  const copy = document.createElement("span");
  copy.className = "pocket-receipt-copy";
  const title = document.createElement("strong");
  title.textContent = activity.title;
  copy.appendChild(title);
  if (activity.summary) {
    const summary = document.createElement("span");
    summary.textContent = activity.summary;
    copy.appendChild(summary);
  }
  const arrow = document.createElement("span");
  arrow.className = "pocket-receipt-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "›";
  button2.append(label, copy, arrow);
  button2.addEventListener("click", () => openRoute(activity.route));
  wrapper.replaceChildren(button2);
  return wrapper;
}

// src/frontend/controller.ts
var PHONE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.7" y="2.5" width="10.6" height="19" rx="2.6"/><path d="M10 5h4M10.7 18.7h2.6"/></svg>';
var ICONS2 = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5h-5v-6H10v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.6A8 8 0 1 1 20.5 11.5Z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4.5 18 4.7-4.7 3.1 3.1 2.2-2.2 5 5"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/></svg>',
  weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18.5h9a4 4 0 0 0 .4-8A6 6 0 0 0 6 12.5a3 3 0 0 0 2 6Z"/><path d="M8 5V3M4.5 7 3 5.5M11.5 7 13 5.5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3"/></svg>',
  trackers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2H10V21a1.8 1.8 0 0 0-1.1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1L4 17.1l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.9h-.2V10H3a1.8 1.8 0 0 0 1.6-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1L6.9 4l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 3V2.8h4V3a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1L20 6.9l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h.2V14h-.2a1.8 1.8 0 0 0-1.7 1Z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21 3-7.2 18-3.2-7.6L3 10zM10.6 13.4 21 3"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c.5 4.2 2.8 6.5 7 7-4.2.5-6.5 2.8-7 7-.5-4.2-2.8-6.5-7-7 4.2-.5 6.5-2.8 7-7Z"/><path d="M19 16.5c.2 2 1.3 3.1 3 3.3-1.7.2-2.8 1.3-3 3.2-.2-1.9-1.3-3-3-3.2 1.7-.2 2.8-1.3 3-3.3Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>'
};
var APP_META = [
  { app: "messages", label: "Messages", icon: "messages", dock: true },
  { app: "camera", label: "Camera", icon: "camera", dock: true },
  { app: "gallery", label: "Gallery", icon: "gallery", dock: true },
  { app: "notes", label: "Notes", icon: "notes", dock: true },
  { app: "weather", label: "Weather", icon: "weather" },
  { app: "calendar", label: "Timeline", icon: "calendar" },
  { app: "trackers", label: "Trackers", icon: "trackers" },
  { app: "settings", label: "Settings", icon: "settings" }
];
function icon(name) {
  const node = el("span");
  node.innerHTML = ICONS2[name] || ICONS2.home;
  return node;
}
function iconButton(name, label) {
  const node = button("", "lp-button lp-button-icon");
  node.setAttribute("aria-label", label);
  node.appendChild(icon(name));
  return node;
}

class PocketController {
  ctx;
  cleanups = [];
  drawer;
  dockPanel = null;
  widget = null;
  mobileWidget = null;
  widgetRoot = null;
  handsetHost;
  launcher;
  launcherBadge;
  shell;
  screen;
  alert;
  clock;
  expanded = false;
  currentApp = "home";
  state = null;
  preferences = defaultPreferences();
  caps = null;
  swarmProfile = null;
  gallery = { data: [], total: 0 };
  galleryScope = "chat";
  selectedContactId = "";
  selectedMessageId = "";
  selectedNoteId = "";
  selectedEventId = "";
  selectedTrackerId = "";
  selectedGalleryImageId = "";
  selectedSettingsSection = "";
  selectedTrackerView = "detail";
  cameraPreview = "";
  cameraProgress = "";
  cameraBusy = false;
  cameraRequestId = "";
  messageRequests = new Map;
  lastTagKeys = new Set;
  tagKeyOrder = [];
  destroyed = false;
  collapseTimer = 0;
  alertTimer = 0;
  launcherFocus = null;
  suppressLauncherClick = false;
  launcherPointer = null;
  pendingRoute = null;
  injectedActivities = new Map;
  pendingActivities = new Map;
  viewCleanups = [];
  receiptSweepTimer = 0;
  constructor(ctx) {
    this.ctx = ctx;
    this.drawer = ctx.ui.registerDrawerTab({
      id: "lumiphone",
      title: "Pocket",
      shortName: "Pocket",
      headerTitle: "Pocket",
      description: "Open the character-aware roleplay phone",
      keywords: ["phone", "messages", "camera", "gallery", "journal", "calendar", "timeline", "tracker"],
      iconSvg: PHONE_ICON
    });
    this.launcher = el("button", "lumiphone-launcher");
    this.launcher.type = "button";
    this.launcher.title = "Open Pocket";
    this.launcher.setAttribute("aria-label", "Open Pocket");
    this.launcher.innerHTML = PHONE_ICON;
    this.launcherBadge = el("span", "lumiphone-badge");
    this.launcherBadge.hidden = true;
    this.launcher.appendChild(this.launcherBadge);
    this.handsetHost = el("div", "lumiphone-widget-root lumiphone-handset-host");
    this.shell = el("div", "lumiphone-shell");
    this.shell.hidden = true;
    const status = el("div", "lumiphone-statusbar");
    const dismiss = iconButton("back", "Dismiss phone");
    dismiss.className = "lumiphone-dismiss";
    dismiss.addEventListener("click", () => this.close());
    this.clock = el("span", "lumiphone-time", formatTime(new Date));
    const island = el("span", "lumiphone-island");
    const signals = el("span", "lumiphone-signals");
    const bars = el("span", "lumiphone-signal-bars");
    for (let i = 0;i < 4; i += 1)
      bars.appendChild(el("i"));
    signals.append(bars, el("span", "", "5G"), el("span", "lumiphone-battery"));
    status.append(dismiss, this.clock, island, signals);
    this.screen = el("main", "lumiphone-screen");
    this.alert = el("div", "lp-alert");
    this.alert.hidden = true;
    const homebar = el("div", "lumiphone-homebar");
    const homeButton = button("");
    homeButton.setAttribute("aria-label", "Home or dismiss phone");
    homebar.appendChild(homeButton);
    this.shell.append(status, this.screen, homebar, this.alert);
    this.launcher.addEventListener("pointerdown", (event) => {
      this.launcherPointer = { x: event.clientX, y: event.clientY };
    });
    this.launcher.addEventListener("pointermove", (event) => {
      if (!this.launcherPointer)
        return;
      if (Math.hypot(event.clientX - this.launcherPointer.x, event.clientY - this.launcherPointer.y) > 7)
        this.suppressLauncherClick = true;
    });
    this.launcher.addEventListener("pointerup", () => {
      this.launcherPointer = null;
    });
    this.launcher.addEventListener("pointercancel", () => {
      this.launcherPointer = null;
    });
    this.launcher.addEventListener("click", (event) => {
      if (this.suppressLauncherClick) {
        event.preventDefault();
        this.suppressLauncherClick = false;
        return;
      }
      this.open();
    });
    homeButton.addEventListener("click", () => {
      if (this.currentApp !== "home")
        this.openApp("home");
      else
        this.close();
    });
    this.installSwipeDismiss(status);
    this.renderDrawerLanding();
    this.installHostIntegrations();
    this.tickClock();
    this.refresh();
  }
  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.collapseTimer);
    window.clearTimeout(this.alertTimer);
    window.clearInterval(this.receiptSweepTimer);
    for (const cleanup of this.cleanups.splice(0)) {
      try {
        cleanup();
      } catch {}
    }
    this.widget?.destroy();
    this.mobileWidget?.destroy();
    this.dockPanel?.destroy();
    for (const injected of this.injectedActivities.values())
      this.ctx.dom.uninject(injected);
    this.injectedActivities.clear();
    for (const cleanup of this.viewCleanups.splice(0))
      cleanup();
    this.drawer.destroy();
  }
  installHostIntegrations() {
    this.cleanups.push(this.drawer.onActivate(() => {
      if (this.widget)
        this.open();
      else
        this.mountPhoneInDrawer();
    }));
    const action = this.ctx.ui.registerInputBarAction({
      id: "open-lumiphone",
      label: "Open Pocket",
      subtitle: "Open the character-aware roleplay phone",
      iconSvg: PHONE_ICON
    });
    this.cleanups.push(action.onClick(() => this.open()));
    this.cleanups.push(() => action.destroy());
    this.cleanups.push(this.ctx.messages.registerTagInterceptor({ tagName: "lumi-phone", removeFromMessage: true }, (payload) => {
      if (payload.isStreaming)
        return;
      const key = `${payload.messageId || ""}:${payload.fullMatch}`;
      if (this.lastTagKeys.has(key))
        return;
      this.lastTagKeys.add(key);
      this.tagKeyOrder.push(key);
      while (this.tagKeyOrder.length > 120) {
        const old = this.tagKeyOrder.shift();
        if (old)
          this.lastTagKeys.delete(old);
      }
      const active = this.ctx.getActiveChat();
      this.ctx.sendToBackend({
        type: "lumiphone:model_action",
        requestId: requestId("tag"),
        chatId: payload.chatId || active.chatId,
        characterId: active.characterId,
        attrs: payload.attrs,
        content: payload.content,
        messageId: payload.messageId,
        fullMatch: payload.fullMatch,
        idempotencyKey: `tag:${payload.messageId || ""}:${payload.fullMatch}`
      });
    }));
    this.cleanups.push(this.ctx.onBackendMessage((payload) => this.onBackend(payload)));
    this.cleanups.push(this.ctx.events.on("CHAT_SWITCHED", () => {
      this.pendingActivities.clear();
      this.refresh();
      window.setTimeout(() => this.sweepActivityReceipts(), 0);
    }));
    const returned = (event) => {
      const detail2 = event.detail;
      if (detail2?.extensionId === "lumiphone")
        this.refresh();
    };
    window.addEventListener("spindle:desktop-widget-returned", returned);
    this.cleanups.push(() => window.removeEventListener("spindle:desktop-widget-returned", returned));
    const resize = () => {
      if (this.expanded)
        this.resizeExpanded();
    };
    window.addEventListener("resize", resize);
    this.cleanups.push(() => window.removeEventListener("resize", resize));
    window.visualViewport?.addEventListener("resize", resize);
    this.cleanups.push(() => window.visualViewport?.removeEventListener("resize", resize));
    const keydown = (event) => {
      if (!this.expanded)
        return;
      if (event.key === "Escape") {
        if (this.currentApp !== "home")
          this.openApp("home");
        else
          this.close();
        return;
      }
      if (event.key !== "Tab")
        return;
      const focusable = [...this.shell.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter((node) => !node.hidden && node.getClientRects().length > 0);
      if (!focusable.length)
        return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    this.cleanups.push(() => window.removeEventListener("keydown", keydown));
    this.ensureWidget();
  }
  async ensureWidget() {
    if (this.widget)
      return;
    try {
      const granted = await this.ctx.permissions.getGranted();
      if (!granted.includes("ui_panels"))
        return;
      if (this.destroyed)
        return;
      this.widget = this.ctx.ui.createFloatWidget({
        width: 58,
        height: 58,
        initialPosition: { x: Math.max(12, window.innerWidth - 82), y: Math.max(58, window.innerHeight * 0.22) },
        snapToEdge: true,
        tooltip: "Pocket",
        chromeless: true,
        resizable: false,
        aspectLock: 9 / 16,
        persistGeometry: false
      });
      this.widgetRoot = el("div", "lumiphone-widget-root");
      this.widget.root.appendChild(this.widgetRoot);
      this.widgetRoot.append(this.launcher);
      this.cleanups.push(this.widget.onDragEnd(() => {
        this.suppressLauncherClick = true;
        window.setTimeout(() => {
          this.suppressLauncherClick = false;
        }, 180);
      }));
      this.launcher.hidden = false;
      this.renderDrawerLanding();
    } catch {
      this.widget = null;
      this.mountPhoneInDrawer();
    }
  }
  renderDrawerLanding() {
    this.drawer.root.replaceChildren();
    const outer = el("div", "lumiphone-drawer");
    const card = el("div", "lumiphone-drawer-card");
    const logo = el("div", "lumiphone-drawer-icon");
    logo.innerHTML = PHONE_ICON;
    const title = el("h2", "lumiphone-drawer-title", "Pocket");
    const copy = el("p", "lumiphone-drawer-copy", "A persistent phone for each chat and character—messages, photos, journals, roleplay weather, timeline events, and live trackers in one place.");
    const actions = el("div", "lumiphone-drawer-actions");
    const open = button("Open phone", "lumiphone-drawer-button");
    open.dataset.primary = "true";
    open.addEventListener("click", () => this.open());
    const permission = button("Manage access", "lumiphone-drawer-button");
    permission.addEventListener("click", () => this.requestPermissions());
    actions.append(open, permission);
    card.append(logo, title, copy, actions);
    outer.appendChild(card);
    this.drawer.root.appendChild(outer);
  }
  ensureDockPanel() {
    if (this.dockPanel)
      return this.dockPanel;
    try {
      this.dockPanel = this.ctx.ui.requestDockPanel({
        edge: "right",
        title: "Pocket",
        size: desktopDockSize(this.preferences.handsetScale),
        minSize: 292,
        maxSize: 620,
        resizable: false,
        startCollapsed: true
      });
      this.cleanups.push(this.dockPanel.onVisibilityChange((visible) => {
        if (!visible && this.expanded && !calculatePhoneSurface(this.preferences.handsetScale).fullscreen) {
          this.expanded = false;
          this.shell.hidden = true;
          this.launcher.hidden = false;
        }
      }));
      return this.dockPanel;
    } catch {
      this.dockPanel = null;
      return null;
    }
  }
  ensureMobileWidget() {
    if (this.mobileWidget)
      return this.mobileWidget;
    try {
      const viewport = currentViewport();
      this.mobileWidget = this.ctx.ui.createFloatWidget({
        width: viewport.width,
        height: viewport.height,
        initialPosition: { x: 0, y: 0 },
        fullscreen: true,
        chromeless: true,
        snapToEdge: false,
        persistGeometry: false
      });
      this.mobileWidget.setVisible(false);
      return this.mobileWidget;
    } catch {
      this.mobileWidget = null;
      return null;
    }
  }
  mountInteractiveSurface() {
    const geometry = calculatePhoneSurface(this.preferences.handsetScale);
    if (geometry.fullscreen) {
      this.dockPanel?.collapse();
      const mobile = this.ensureMobileWidget();
      if (!mobile)
        return false;
      mobile.root.replaceChildren(this.handsetHost);
      this.handsetHost.replaceChildren(this.shell);
      this.handsetHost.dataset.fullscreen = "true";
      applyMobilePhoneSurface(mobile, this.preferences.handsetScale);
      mobile.setVisible(true);
      return true;
    }
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false);
      this.mobileWidget.setVisible(false);
    }
    const panel = this.ensureDockPanel();
    if (!panel)
      return false;
    panel.root.replaceChildren(this.handsetHost);
    this.handsetHost.replaceChildren(this.shell);
    this.handsetHost.dataset.fullscreen = "false";
    const setSize = panel.setSize;
    if (typeof setSize === "function")
      setSize.call(panel, desktopDockSize(this.preferences.handsetScale));
    panel.expand();
    const desktop = calculatePhoneSurface(this.preferences.handsetScale, currentViewport(), false);
    this.handsetHost.style.width = `${desktop.width}px`;
    this.handsetHost.style.height = `${desktop.height}px`;
    return true;
  }
  mountPhoneInDrawer() {
    if (this.widget && (this.dockPanel || this.mobileWidget))
      return;
    this.drawer.root.replaceChildren();
    const host = this.handsetHost;
    const viewport = currentViewport();
    const geometry = calculatePhoneSurface(this.preferences.handsetScale, { width: Math.min(viewport.width, 620), height: Math.max(320, viewport.height - 130) }, false);
    host.style.width = geometry.fullscreen ? "100%" : `${geometry.width}px`;
    host.style.height = geometry.fullscreen ? "calc(100dvh - 110px)" : `${geometry.height}px`;
    host.style.aspectRatio = "9 / 16";
    this.drawer.root.appendChild(host);
    host.replaceChildren(this.shell);
    this.launcher.hidden = true;
    this.shell.hidden = false;
    this.expanded = true;
    this.render();
  }
  async requestPermissions() {
    try {
      await this.ctx.permissions.request([
        "ui_panels",
        "chats",
        "characters",
        "personas",
        "generation",
        "tools",
        "interceptor",
        "images",
        "image_gen",
        "push_notification"
      ], { reason: "Pocket uses these permissions for its launcher and handset, per-chat character state, generated text messages, model actions, gallery, camera, and optional push notifications." });
      await this.ensureWidget();
      this.refresh();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }
  installSwipeDismiss(target) {
    let startX = 0;
    let startY = 0;
    let active = false;
    target.addEventListener("pointerdown", (event) => {
      if (event.target?.closest("button,input,select,textarea,a"))
        return;
      startX = event.clientX;
      startY = event.clientY;
      active = true;
    });
    target.addEventListener("pointerup", (event) => {
      if (!active)
        return;
      active = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const dismissLeft = dx < -64 && Math.abs(dx) > Math.abs(dy) * 1.35;
      const dismissUp = dy < -64 && Math.abs(dy) > Math.abs(dx) * 1.35;
      if (dismissLeft || dismissUp)
        this.close();
    });
    target.addEventListener("pointercancel", () => {
      active = false;
    });
  }
  tickClock() {
    const timer = window.setInterval(() => {
      this.clock.textContent = formatTime(new Date);
    }, 30000);
    this.cleanups.push(() => window.clearInterval(timer));
  }
  activeContext() {
    const active = this.ctx.getActiveChat();
    return {
      chatId: active.chatId || this.state?.chatId || null,
      characterId: active.characterId || this.state?.characterId || null
    };
  }
  send(type, payload = {}) {
    const context = this.activeContext();
    const id = String(payload.requestId || requestId());
    this.ctx.sendToBackend({ type, requestId: id, chatId: context.chatId, characterId: context.characterId, ...payload });
    return id;
  }
  refresh() {
    this.send("lumiphone:get_state");
  }
  onBackend(payload) {
    if (!payload || typeof payload !== "object" || typeof payload.type !== "string")
      return;
    if (payload.type === "lumiphone:state" && payload.state) {
      const active = this.ctx.getActiveChat();
      if (active.chatId && payload.state.chatId !== active.chatId)
        return;
      if (active.characterId && payload.state.characterId !== active.characterId)
        return;
      const previousUnread = this.unreadCount();
      this.state = payload.state;
      this.preferences = normalizePreferences(payload.preferences || this.preferences);
      this.caps = payload.capabilities || this.caps;
      this.swarmProfile = payload.swarmProfile || this.swarmProfile;
      for (const activity of this.state.activities || [])
        this.queueActivityReceipt(activity);
      this.applyAppearance();
      this.updateBadge();
      if (payload.open)
        this.open();
      const pending = this.pendingRoute;
      this.pendingRoute = null;
      if (pending)
        this.openPocket(pending);
      else if (this.expanded)
        this.render();
      if (this.unreadCount() > previousUnread && !this.expanded)
        this.launcher.animate([
          { transform: "scale(1)" },
          { transform: "scale(1.13) rotate(-4deg)" },
          { transform: "scale(1)" }
        ], { duration: 420, easing: "ease-out" });
      return;
    }
    if (payload.type === "lumiphone:activity" && payload.activity) {
      this.queueActivityReceipt(payload.activity);
      return;
    }
    if (payload.type === "lumiphone:capabilities") {
      this.caps = payload.capabilities;
      if (!this.caps?.panels && this.widget) {
        try {
          this.widget.destroy();
        } catch {}
        this.widget = null;
        this.widgetRoot = null;
        this.expanded = false;
        this.renderDrawerLanding();
      } else {
        this.ensureWidget();
      }
      if (this.currentApp === "settings")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:gallery") {
      this.gallery = { data: payload.data || [], total: Number(payload.total) || 0 };
      if (this.currentApp === "gallery")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:swarm_profile") {
      this.swarmProfile = payload.profile;
      if (this.currentApp === "settings" || this.currentApp === "camera")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:camera_progress") {
      if (payload.requestId !== this.cameraRequestId)
        return;
      this.cameraBusy = true;
      this.cameraProgress = payload.message || (payload.phase === "preview" ? "Preview developing…" : "Working…");
      if (payload.imageDataUrl)
        this.cameraPreview = payload.imageDataUrl;
      if (payload.profile)
        this.swarmProfile = payload.profile;
      if (this.currentApp === "camera")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:message_progress") {
      const active = this.activeContext();
      if (payload.chatId !== active.chatId || payload.characterId !== active.characterId)
        return;
      if (payload.phase === "done")
        this.messageRequests.delete(payload.requestId);
      else
        this.messageRequests.set(payload.requestId, payload.contactId);
      if (this.currentApp === "messages")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:camera_done") {
      if (payload.requestId !== this.cameraRequestId)
        return;
      this.cameraBusy = false;
      this.cameraProgress = "Photo saved to Gallery";
      this.cameraPreview = payload.imageUrl || this.cameraPreview;
      if (payload.profile)
        this.swarmProfile = payload.profile;
      if (this.currentApp === "camera")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:camera_cancelled") {
      if (payload.requestId !== this.cameraRequestId)
        return;
      this.cameraBusy = false;
      this.cameraProgress = "Cancelled";
      if (this.currentApp === "camera")
        this.render();
      return;
    }
    if (payload.type === "lumiphone:export_data" && payload.data) {
      const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pocket-${this.state?.chatId || "backup"}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      return;
    }
    if (payload.type === "lumiphone:error") {
      if (payload.requestId === this.cameraRequestId)
        this.cameraBusy = false;
      this.messageRequests.delete(payload.requestId);
      this.showError(payload.error || "Pocket could not complete that action.");
      if (this.expanded)
        this.render();
    }
  }
  unreadCount() {
    if (!this.state)
      return 0;
    const notifications = this.state.notifications.filter((item) => !item.read).length;
    const messages = this.state.contacts.reduce((sum, contact) => sum + contact.unread, 0);
    return Math.min(999, Math.max(notifications, messages));
  }
  updateBadge() {
    const unread = this.unreadCount();
    this.launcherBadge.hidden = unread === 0;
    this.launcherBadge.textContent = unread > 99 ? "99+" : String(unread);
    this.drawer.setBadge(unread ? unread > 99 ? "99+" : String(unread) : null);
  }
  applyAppearance() {
    const settings = this.preferences;
    this.shell.dataset.theme = settings.theme;
    this.shell.style.setProperty("--lp-accent", settings.colors.accent);
    this.shell.style.setProperty("--lp-bezel", settings.colors.bezel);
    this.shell.style.setProperty("--lp-bg", settings.colors.background);
    this.shell.style.setProperty("--lp-surface", settings.colors.surface);
    this.shell.style.setProperty("--lp-text", settings.colors.text);
    this.shell.style.setProperty("--lp-wallpaper", wallpaperCss(settings.colors.wallpaperPrimary, settings.colors.wallpaperSecondary));
    this.shell.style.setProperty("--lp-chat-wallpaper", wallpaperCss(settings.colors.chatPrimary, settings.colors.chatSecondary));
    this.shell.style.setProperty("--lp-animation-ms", `${settings.reducedMotion ? 0 : settings.animationDurationMs}ms`);
    this.shell.dataset.reducedMotion = String(settings.reducedMotion);
  }
  open() {
    if (!this.widget) {
      this.drawer.activate();
      this.mountPhoneInDrawer();
      return;
    }
    this.expanded = true;
    window.clearTimeout(this.collapseTimer);
    this.launcherFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!this.mountInteractiveSurface()) {
      this.expanded = false;
      this.drawer.activate();
      this.mountPhoneInDrawer();
      return;
    }
    this.launcher.hidden = true;
    this.shell.hidden = false;
    this.resizeExpanded();
    this.render();
    this.refresh();
    requestAnimationFrame(() => {
      this.shell.tabIndex = -1;
      this.shell.focus({ preventScroll: true });
    });
  }
  close() {
    if (!this.widget && !this.dockPanel && !this.mobileWidget)
      return;
    this.expanded = false;
    this.shell.hidden = true;
    this.launcher.hidden = false;
    this.dockPanel?.collapse();
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false);
      this.mobileWidget.setVisible(false);
    }
    window.clearTimeout(this.collapseTimer);
    this.collapseTimer = window.setTimeout(() => {
      this.launcherFocus?.focus({ preventScroll: true });
      this.launcherFocus = null;
    }, this.preferences.reducedMotion || this.preferences.animation === "none" ? 0 : this.preferences.animationDurationMs);
  }
  resizeExpanded() {
    if (!this.expanded)
      return;
    this.mountInteractiveSurface();
  }
  openApp(app) {
    this.openPocket({ app });
  }
  openPocket(routeInput) {
    const route = normalizePocketRoute(routeInput);
    if (!this.state) {
      this.pendingRoute = route;
      this.open();
      this.refresh();
      return;
    }
    if (!this.expanded)
      this.open();
    this.currentApp = route.app;
    if (route.app === "messages") {
      const contact = route.contactId ? this.state.contacts.find((entry) => entry.id === route.contactId) : null;
      this.selectedContactId = contact?.id || "";
      this.selectedMessageId = contact && route.messageId && contact.messages.some((entry) => entry.id === route.messageId) ? route.messageId : "";
      this.send("lumiphone:mark_read", contact ? { app: "messages", contactId: contact.id } : { app: "messages" });
    } else if (route.app === "trackers") {
      const tracker = route.trackerId ? this.state.trackers.find((entry) => entry.id === route.trackerId) : null;
      this.selectedTrackerId = tracker?.id || "";
      this.selectedTrackerView = route.view || "detail";
      this.send("lumiphone:mark_read", { app: "trackers" });
    } else if (route.app === "calendar") {
      this.selectedEventId = route.eventId && this.state.events.some((entry) => entry.id === route.eventId) ? route.eventId : "";
      this.send("lumiphone:mark_read", { app: "calendar" });
    } else if (route.app === "notes") {
      this.selectedNoteId = route.noteId && this.state.notes.some((entry) => entry.id === route.noteId) ? route.noteId : "";
      this.send("lumiphone:mark_read", { app: "notes" });
    } else if (route.app === "gallery") {
      this.selectedGalleryImageId = route.imageId || "";
      this.requestGallery(this.galleryScope);
      this.send("lumiphone:mark_read", { app: "gallery" });
    } else if (route.app === "settings") {
      this.selectedSettingsSection = route.section || "";
      this.send("lumiphone:mark_read", { app: "settings" });
    } else if (route.app !== "home") {
      this.send("lumiphone:mark_read", { app: route.app });
    }
    this.render();
  }
  queueActivityReceipt(activity) {
    const active = this.activeContext();
    if (activity.scope.chatId !== active.chatId || activity.scope.characterId !== active.characterId)
      return;
    if (this.injectedActivities.has(activity.id) || !activity.source?.messageId)
      return;
    this.pendingActivities.set(activity.id, activity);
    this.sweepActivityReceipts();
  }
  sweepActivityReceipts() {
    for (const [activityId, activity] of this.pendingActivities) {
      const injected = activityReceipt(this.ctx, activity, (route) => this.openPocket(route));
      if (!injected)
        continue;
      this.pendingActivities.delete(activityId);
      this.injectedActivities.set(activityId, injected);
    }
    if (this.pendingActivities.size && !this.receiptSweepTimer) {
      this.receiptSweepTimer = window.setInterval(() => {
        if (!this.pendingActivities.size) {
          window.clearInterval(this.receiptSweepTimer);
          this.receiptSweepTimer = 0;
          return;
        }
        this.sweepActivityReceipts();
      }, 1500);
    }
  }
  render() {
    for (const cleanup of this.viewCleanups.splice(0))
      cleanup();
    if (!this.state) {
      this.screen.replaceChildren(this.loadingView());
      return;
    }
    this.applyAppearance();
    const view = this.currentApp === "home" ? this.renderHome() : this.currentApp === "messages" ? this.renderMessages() : this.currentApp === "gallery" ? this.renderGallery() : this.currentApp === "camera" ? this.renderCamera() : this.currentApp === "notes" ? this.renderNotes() : this.currentApp === "weather" ? this.renderWeather() : this.currentApp === "calendar" ? this.renderCalendar() : this.currentApp === "trackers" ? this.renderTrackers() : this.renderSettings();
    view.classList.add("lumiphone-app-view");
    const animation = this.preferences.reducedMotion ? "none" : this.preferences.animation;
    if (animation !== "none") {
      view.dataset.animate = animation;
      view.addEventListener("animationend", () => view.removeAttribute("data-animate"), { once: true });
    }
    this.screen.replaceChildren(view);
  }
  loadingView() {
    const node = el("div", "lp-page lp-empty");
    const inner = el("div");
    inner.innerHTML = `${PHONE_ICON}<p>Waking Pocket…</p>`;
    node.appendChild(inner);
    return node;
  }
  page(title, subtitle = "", rightLabel = "", onRight) {
    const page = el("div", "lp-page");
    const nav = el("header", "lp-nav");
    const back = button("‹ Home", "lp-nav-action");
    back.addEventListener("click", () => this.openApp("home"));
    const heading = el("div", "lp-nav-title", title);
    if (subtitle)
      heading.appendChild(el("span", "lp-nav-subtitle", subtitle));
    const right = button(rightLabel, "lp-nav-action");
    if (rightLabel && onRight)
      right.addEventListener("click", onRight);
    else
      right.disabled = true;
    nav.append(back, heading, right);
    const content = el("div", "lp-content");
    page.append(nav, content);
    return { page, content };
  }
  renderHome() {
    const state = this.state;
    const home = el("div", "lp-home");
    const head = el("div", "lp-home-head");
    const left = el("div");
    left.append(el("div", "lp-home-date", formatDate(state.roleplayNow, false)), el("div", "lp-home-clock", formatTime(state.roleplayNow)));
    const weather = el("button", "lp-home-weather");
    weather.type = "button";
    weather.append(icon("weather"), el("span", "", `${state.weather.temperature}°${state.weather.unit} · ${state.weather.condition}`));
    weather.addEventListener("click", () => this.openApp("weather"));
    head.append(left, weather);
    const grid = el("div", "lp-app-grid");
    for (const meta of APP_META.filter((entry) => !entry.dock))
      grid.appendChild(this.appIcon(meta));
    const activity = el("div", "lp-home-activity");
    for (const item of [...state.activities || []].reverse().slice(0, 2)) {
      const receipt = button("", "lp-home-activity-item");
      receipt.append(el("strong", "", item.title), el("span", "", item.summary || item.kind), el("span", "lp-home-activity-arrow", "›"));
      receipt.setAttribute("aria-label", `Open ${item.title}`);
      receipt.addEventListener("click", () => this.openPocket(item.route));
      activity.appendChild(receipt);
    }
    const dock = el("div", "lp-home-dock");
    for (const meta of APP_META.filter((entry) => entry.dock))
      dock.appendChild(this.appIcon(meta));
    home.append(head, grid);
    if (activity.childElementCount)
      home.appendChild(activity);
    home.appendChild(dock);
    return home;
  }
  appIcon(meta) {
    const node = el("button", "lp-app-icon");
    node.type = "button";
    const box = el("span", `lp-app-icon-box lp-icon-${meta.icon}`);
    box.appendChild(icon(meta.icon));
    const unread = meta.app === "messages" ? this.state.contacts.reduce((sum, contact) => sum + contact.unread, 0) : this.state.notifications.filter((item) => !item.read && item.app === meta.app).length;
    if (unread)
      box.appendChild(el("span", "lp-app-dot", unread > 99 ? "99+" : String(unread)));
    node.append(box, el("span", "lp-app-label", meta.label));
    node.addEventListener("click", () => this.openApp(meta.app));
    return node;
  }
  renderMessages() {
    return renderMessagesView({
      state: this.state,
      selectedContactId: this.selectedContactId,
      selectedMessageId: this.selectedMessageId,
      generationAvailable: Boolean(this.caps?.generation),
      busyContacts: new Set(this.messageRequests.values()),
      page: (title, subtitle) => this.page(title, subtitle),
      empty: (title, copy) => this.empty("messages", title, copy),
      iconButton,
      selectContact: (contactId) => {
        this.selectedContactId = contactId;
        this.selectedMessageId = "";
        if (contactId)
          this.send("lumiphone:mark_read", { app: "messages", contactId });
        this.render();
      },
      send: (type, payload) => {
        this.send(type, payload);
      },
      generateReply: (contactId) => this.generateReply(contactId)
    });
  }
  generateReply(contactId) {
    if ([...this.messageRequests.values()].includes(contactId))
      return;
    const id = requestId("reply");
    this.messageRequests.set(id, contactId);
    this.send("lumiphone:generate_message", { requestId: id, contactId });
    this.render();
  }
  requestGallery(scope) {
    this.galleryScope = scope;
    this.send("lumiphone:gallery_list", { scope });
  }
  renderGallery() {
    const { page, content } = this.page("Gallery", `${this.gallery.total} assets`, "Refresh", () => this.requestGallery(this.galleryScope));
    const chips = el("div", "lp-chipbar");
    for (const [scope, label] of [["chat", "This chat"], ["character", "Character"], ["phone", "Pocket"], ["all", "All"]]) {
      const chip = button(label, "lp-chip");
      chip.setAttribute("aria-pressed", String(this.galleryScope === scope));
      chip.addEventListener("click", () => this.requestGallery(scope));
      chips.appendChild(chip);
    }
    content.appendChild(chips);
    if (!this.caps?.images) {
      content.appendChild(this.empty("gallery", "Gallery access is off", "Grant Images permission from Settings to browse Lumiverse assets."));
      return page;
    }
    const grid = el("div", "lp-gallery-grid");
    for (const item of this.gallery.data) {
      const tile = el("button", "lp-gallery-item");
      tile.type = "button";
      tile.dataset.selected = String(item.id === this.selectedGalleryImageId);
      if (item.id === this.selectedGalleryImageId)
        tile.setAttribute("aria-current", "true");
      const image = el("img");
      image.loading = "lazy";
      image.src = item.url;
      image.alt = item.filename || "Gallery image";
      image.addEventListener("error", () => {
        tile.dataset.missing = "true";
        image.replaceWith(el("span", "lp-gallery-missing", "Image unavailable"));
      }, { once: true });
      tile.append(image, el("span", "lp-gallery-meta", item.filename || formatDate(item.createdAt * 1000)));
      tile.addEventListener("click", () => this.inspectImage(item.url, item.filename));
      grid.appendChild(tile);
    }
    content.appendChild(grid);
    if (!this.gallery.data.length)
      content.appendChild(this.empty("gallery", "Nothing here yet", "Take a photo with Camera or switch the gallery filter."));
    return page;
  }
  inspectImage(url, title) {
    const modal = this.ctx.ui.showModal({ title: title || "Pocket photo", size: "lg" });
    const image = el("img");
    image.src = url;
    image.alt = title || "Pocket photo";
    image.style.cssText = "display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:12px;background:#080808";
    modal.root.appendChild(image);
  }
  renderCamera() {
    const page = el("div", "lp-camera");
    const nav = el("header", "lp-nav");
    const back = button("‹ Home", "lp-nav-action");
    back.addEventListener("click", () => this.openApp("home"));
    const profileLabel = this.swarmProfile?.available ? "Swarm profile linked" : "Manual profile";
    const title = el("div", "lp-nav-title", "Camera");
    title.appendChild(el("span", "lp-nav-subtitle", profileLabel));
    const gallery = button("Gallery", "lp-nav-action");
    gallery.addEventListener("click", () => this.openApp("gallery"));
    nav.append(back, title, gallery);
    const viewfinder = el("div", "lp-viewfinder");
    if (this.cameraPreview) {
      const image = el("img");
      image.src = this.cameraPreview;
      image.alt = "Camera preview";
      viewfinder.appendChild(image);
    } else {
      const placeholder = el("div", "lp-camera-placeholder");
      placeholder.append(icon("camera"), el("div", "", "Frame an in-world moment. The optional scene planner expands your brief before the image connection develops it."));
      viewfinder.appendChild(placeholder);
    }
    const controls = el("form", "lp-camera-controls");
    const prompt = el("textarea", "lp-textarea");
    prompt.placeholder = "Describe the photo or moment…";
    prompt.rows = 2;
    const optionRow = el("div", "lp-row-between");
    const enhanceLabel = el("label", "lp-row");
    const enhance = el("input");
    enhance.type = "checkbox";
    enhance.checked = this.preferences.sceneEnhancer;
    enhanceLabel.append(enhance, el("span", "lp-copy", "Scene planner sidecar"));
    const source = el("span", "lp-copy", this.swarmProfile?.source === "swarm_studio" ? "Swarm Studio" : "Primitive/manual");
    optionRow.append(enhanceLabel, source);
    const shutterRow = el("div", "lp-shutter-row");
    const cancel = button(this.cameraBusy ? "Cancel" : "", "lp-button");
    cancel.style.visibility = this.cameraBusy ? "visible" : "hidden";
    cancel.addEventListener("click", () => {
      this.send("lumiphone:camera_cancel", { requestId: this.cameraRequestId });
      this.cameraBusy = false;
      this.cameraProgress = "Cancelled";
      this.render();
    });
    const shutter = el("button", "lp-shutter");
    shutter.type = "submit";
    shutter.disabled = this.cameraBusy || !this.caps?.imageGen;
    const spacer = el("span");
    shutterRow.append(cancel, shutter, spacer);
    const progress = el("div", "lp-camera-progress", this.cameraProgress || (!this.caps?.imageGen ? "Grant Image Generation permission in Settings" : ""));
    controls.append(prompt, optionRow, shutterRow, progress);
    controls.addEventListener("submit", (event) => {
      event.preventDefault();
      const scene = inputValue(prompt);
      if (!scene || this.cameraBusy)
        return;
      this.cameraRequestId = requestId("camera");
      this.cameraBusy = true;
      this.cameraProgress = "Sending scene to camera…";
      this.send("lumiphone:camera_generate", { requestId: this.cameraRequestId, scene, enhance: enhance.checked });
      this.render();
    });
    page.append(nav, viewfinder, controls);
    return page;
  }
  renderNotes() {
    const state = this.state;
    const selected = state.notes.find((item) => item.id === this.selectedNoteId);
    if (this.selectedNoteId === "__new__" || selected)
      return this.renderNoteEditor(selected || null);
    const { page, content } = this.page("Notes", `${state.notes.length} journal entries`, "New", () => {
      this.selectedNoteId = "__new__";
      this.render();
    });
    const sorted = [...state.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    for (const note of sorted) {
      const card = el("div", "lp-card lp-note-card");
      card.dataset.clickable = "true";
      card.dataset.pinned = String(note.pinned);
      const head = el("div", "lp-row-between");
      head.append(el("h3", "lp-title", note.title), el("span", "lp-copy", formatDate(note.updatedAt)));
      const preview = el("p", "lp-copy lp-note-preview", note.body || "Empty note");
      card.append(head, preview);
      card.appendChild(el("span", "lp-eyebrow", [note.author, note.mood].filter(Boolean).join(" · ")));
      card.addEventListener("click", () => {
        this.selectedNoteId = note.id;
        this.render();
      });
      content.appendChild(card);
    }
    if (!state.notes.length)
      content.appendChild(this.empty("notes", "The journal is blank", "You or the character can write the first entry."));
    return page;
  }
  renderNoteEditor(note) {
    const { page, content } = this.page(note ? "Edit Note" : "New Note", note?.mood || "Character journal", "Save");
    const navSave = page.querySelector(".lp-nav-action:last-child");
    const title = el("input", "lp-input");
    title.placeholder = "Title";
    title.value = note?.title || "";
    const mood = el("input", "lp-input");
    mood.placeholder = "Mood or tag";
    mood.value = note?.mood || "";
    const body = el("textarea", "lp-textarea");
    body.style.minHeight = "270px";
    body.placeholder = "Write a memory, thought, or journal entry…";
    body.value = note?.body || "";
    const pinRow = el("label", "lp-row-between lp-card");
    pinRow.append(el("span", "lp-title", "Pin for model memory"));
    const pinned = el("input");
    pinned.type = "checkbox";
    pinned.checked = note?.pinned || false;
    pinRow.appendChild(pinned);
    const save = () => {
      this.send("lumiphone:action", { action: "note", payload: { id: note?.id, title: inputValue(title), body: body.value, mood: inputValue(mood), pinned: pinned.checked } });
      this.selectedNoteId = "";
      this.render();
    };
    navSave.addEventListener("click", save);
    content.append(title, mood, body, pinRow);
    if (note) {
      const remove = button("Delete note", "lp-button lp-button-danger");
      remove.addEventListener("click", () => {
        this.send("lumiphone:delete", { kind: "note", id: note.id });
        this.selectedNoteId = "";
        this.render();
      });
      content.appendChild(remove);
    }
    return page;
  }
  renderWeather() {
    const weather = this.state.weather;
    const { page, content } = this.page("Weather", weather.location, "Save");
    const hero = el("div", "lp-weather-hero");
    const top = el("div");
    top.append(el("div", "lp-weather-condition", weather.condition), el("div", "lp-copy", weather.location));
    const temp = el("div", "lp-weather-temp", `${weather.temperature}°`);
    const bottom = el("div", "lp-row-between");
    bottom.append(el("span", "lp-weather-range", `H:${weather.high}°  L:${weather.low}°`), el("span", "lp-weather-range", weather.updatedAt ? `Updated ${formatTime(weather.updatedAt)}` : ""));
    hero.append(top, temp, bottom);
    const fields = el("div", "lp-fields");
    const location = this.field("Location", weather.location);
    const condition = this.field("Condition", weather.condition);
    const temperature = this.field("Temperature", String(weather.temperature), "number");
    const unit = el("select", "lp-select");
    for (const value of ["C", "F"]) {
      const option = el("option", "", `°${value}`);
      option.value = value;
      option.selected = weather.unit === value;
      unit.appendChild(option);
    }
    const unitLabel = el("label", "lp-label", "Unit");
    unitLabel.appendChild(unit);
    const high = this.field("High", String(weather.high), "number");
    const low = this.field("Low", String(weather.low), "number");
    fields.append(location.label, condition.label, temperature.label, unitLabel, high.label, low.label);
    const details = el("textarea", "lp-textarea");
    details.placeholder = "Atmosphere and roleplay weather details…";
    details.value = weather.details;
    content.append(hero, fields, details);
    const save = page.querySelector(".lp-nav-action:last-child");
    save.addEventListener("click", () => this.send("lumiphone:action", { action: "weather", payload: {
      location: inputValue(location.input),
      condition: inputValue(condition.input),
      temperature: Number(temperature.input.value),
      unit: unit.value,
      high: Number(high.input.value),
      low: Number(low.input.value),
      details: details.value
    } }));
    return page;
  }
  renderCalendar() {
    const state = this.state;
    const selected = state.events.find((item) => item.id === this.selectedEventId);
    if (this.selectedEventId === "__new__" || selected)
      return this.renderEventEditor(selected || null);
    const { page, content } = this.page("Timeline", formatDate(state.roleplayNow, true), "Add", () => {
      this.selectedEventId = "__new__";
      this.render();
    });
    const nowCard = el("div", "lp-card");
    const nowField = el("input", "lp-input");
    nowField.type = "datetime-local";
    nowField.value = dateTimeLocal(state.roleplayNow);
    const setNow = button("Set roleplay now", "lp-button");
    setNow.addEventListener("click", () => {
      const parsed = new Date(nowField.value);
      if (!Number.isNaN(parsed.getTime()))
        this.send("lumiphone:save_roleplay_time", { roleplayNow: parsed.toISOString() });
    });
    nowCard.append(el("div", "lp-eyebrow", "Roleplay clock"), nowField, setNow);
    content.appendChild(nowCard);
    const timeline = el("div", "lp-timeline");
    const events = [...state.events].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    for (const event of events) {
      const row = el("div", "lp-event");
      row.dataset.completed = String(event.completed);
      const dot = el("span", "lp-event-dot");
      dot.style.setProperty("--event-color", event.color);
      const card = el("div", "lp-card");
      card.dataset.clickable = "true";
      card.append(el("div", "lp-eyebrow", `${event.lane} · ${event.whenText || formatDate(event.start, true)}`), el("h3", "lp-title", event.title));
      if (event.description)
        card.appendChild(el("p", "lp-copy", event.description));
      card.addEventListener("click", () => {
        this.selectedEventId = event.id;
        this.render();
      });
      row.append(dot, card);
      timeline.appendChild(row);
    }
    content.appendChild(timeline);
    if (!events.length)
      content.appendChild(this.empty("calendar", "No timeline events", "Schedule story beats, dates, appointments, or alternate-timeline milestones."));
    return page;
  }
  renderEventEditor(event) {
    const { page, content } = this.page(event ? "Edit Event" : "New Event", "Roleplay timeline", "Save");
    const title = this.field("Title", event?.title || "");
    const lane = this.field("Timeline lane", event?.lane || "Main timeline");
    const whenKindLabel = el("label", "lp-label", "Time precision");
    const whenKind = el("select", "lp-select");
    for (const [value, label] of [["exact", "Exact date/time"], ["approximate", "Approximate"], ["relative", "Relative to story"], ["unscheduled", "Unscheduled"]]) {
      const option = el("option", "", label);
      option.value = value;
      option.selected = (event?.whenKind || "exact") === value;
      whenKind.appendChild(option);
    }
    whenKindLabel.appendChild(whenKind);
    const whenText = this.field("Timeline label", event?.whenText || (event ? formatDate(event.start, true) : ""));
    const start = this.field("Start", event ? dateTimeLocal(event.start) : dateTimeLocal(this.state.roleplayNow), "datetime-local");
    const end = this.field("End", event ? dateTimeLocal(event.end) : dateTimeLocal(this.state.roleplayNow), "datetime-local");
    const description = el("textarea", "lp-textarea");
    description.placeholder = "What happens?";
    description.value = event?.description || "";
    const completed = el("input");
    completed.type = "checkbox";
    completed.checked = event?.completed || false;
    const completeRow = el("label", "lp-card lp-row-between");
    completeRow.append(el("span", "lp-title", "Completed"), completed);
    content.append(title.label, lane.label, whenKindLabel, whenText.label, start.label, end.label, description, completeRow);
    const save = page.querySelector(".lp-nav-action:last-child");
    save.addEventListener("click", () => {
      const startDate = new Date(start.input.value);
      const endDate = new Date(end.input.value);
      this.send("lumiphone:action", { action: "event", payload: {
        id: event?.id,
        title: inputValue(title.input),
        lane: inputValue(lane.input),
        description: description.value,
        start: Number.isNaN(startDate.getTime()) ? this.state.roleplayNow : startDate.toISOString(),
        end: Number.isNaN(endDate.getTime()) ? this.state.roleplayNow : endDate.toISOString(),
        whenKind: whenKind.value,
        whenText: inputValue(whenText.input),
        completed: completed.checked
      } });
      this.selectedEventId = "";
      this.render();
    });
    if (event) {
      const remove = button("Delete event", "lp-button lp-button-danger");
      remove.addEventListener("click", () => {
        this.send("lumiphone:delete", { kind: "event", id: event.id });
        this.selectedEventId = "";
        this.render();
      });
      content.appendChild(remove);
    }
    return page;
  }
  renderTrackers() {
    return renderTrackersView({
      state: this.state,
      selectedId: this.selectedTrackerId,
      selectedView: this.selectedTrackerView,
      accent: this.preferences.colors.accent,
      page: (title, subtitle, rightLabel, onRight) => this.page(title, subtitle, rightLabel, onRight),
      field: (label, value, type) => this.field(label, value, type),
      send: (type, payload) => {
        this.send(type, payload);
      },
      select: (id, view = "detail") => {
        this.selectedTrackerId = id;
        this.selectedTrackerView = view;
        this.render();
      },
      back: () => {
        this.selectedTrackerId = "";
        this.selectedTrackerView = "detail";
        this.render();
      },
      onCleanup: (cleanup) => this.viewCleanups.push(cleanup)
    });
  }
  renderSettings() {
    const view = renderSettingsView({
      preferences: this.preferences,
      capabilities: this.caps,
      swarmProfile: this.swarmProfile,
      page: (title, subtitle, rightLabel) => this.page(title, subtitle, rightLabel),
      field: (label, value, type) => this.field(label, value, type),
      preview: (preferences, options) => {
        this.preferences = preferences;
        if (options?.appearance)
          this.applyAppearance();
        if (options?.resize)
          this.resizeExpanded();
        if (options?.rerender)
          this.render();
      },
      send: (type, payload) => {
        this.send(type, payload);
      },
      requestPermissions: () => {
        this.requestPermissions();
      },
      showError: (message) => this.showError(message),
      openHome: () => this.openApp("home")
    });
    if (this.selectedSettingsSection)
      requestAnimationFrame(() => {
        view.querySelector(`[data-settings-section="${CSS.escape(this.selectedSettingsSection)}"]`)?.scrollIntoView({ block: "start" });
      });
    return view;
  }
  field(labelText, value = "", type = "text") {
    const label = el("label", "lp-label", labelText);
    const input = el("input", "lp-input");
    input.type = type;
    input.value = value;
    label.appendChild(input);
    return { label, input };
  }
  empty(iconName, title, copy) {
    const node = el("div", "lp-empty");
    const inner = el("div");
    inner.append(icon(iconName), el("h3", "lp-title", title), el("p", "lp-copy", copy));
    node.appendChild(inner);
    return node;
  }
  showError(message) {
    window.clearTimeout(this.alertTimer);
    this.alert.textContent = message;
    this.alert.hidden = false;
    this.alertTimer = window.setTimeout(() => {
      this.alert.hidden = true;
    }, 5500);
  }
}
function setupPhone(ctx) {
  const controller = new PocketController(ctx);
  ctx.ready();
  return () => controller.destroy();
}

// src/styles.ts
var PHONE_STYLES = `
  .lumiphone-widget-root, .lumiphone-widget-root *, .lumiphone-drawer, .lumiphone-drawer * { box-sizing: border-box; }
  .lumiphone-widget-root {
    width: 100%; height: 100%; display: grid; place-items: center; overflow: visible;
    color: #f7f5ff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .lumiphone-handset-host { margin:auto; cursor:default; overscroll-behavior:contain; }
  .lumiphone-launcher {
    appearance: none; width: 58px; height: 58px; padding: 0; border: 1px solid rgba(255,255,255,.2);
    border-radius: 19px; display: grid; place-items: center; position: relative; cursor: pointer;
    color: #fff; background: linear-gradient(145deg,#9a8cff,#5746ce 58%,#2b216f);
    box-shadow: 0 18px 42px rgba(16,11,38,.38), inset 0 1px rgba(255,255,255,.28);
    transition: transform .2s ease, box-shadow .2s ease; touch-action: none;
  }
  .lumiphone-launcher:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 22px 48px rgba(16,11,38,.46), inset 0 1px rgba(255,255,255,.32); }
  .lumiphone-launcher:focus-visible { outline: 3px solid color-mix(in srgb,#9a8cff 58%,white); outline-offset: 3px; }
  .lumiphone-launcher svg { width: 27px; height: 27px; }
  .lumiphone-badge {
    position: absolute; top: -5px; right: -5px; min-width: 20px; height: 20px; padding: 0 5px;
    border: 2px solid #1b1722; border-radius: 999px; display: grid; place-items: center;
    background: #ff496d; color: white; font-size: 10px; font-weight: 850; line-height: 1;
  }
  .lumiphone-badge[hidden] { display: none; }

  .lumiphone-shell {
    --lp-accent: #8b7dff; --lp-bezel: #17151d; --lp-wallpaper: linear-gradient(145deg,#171327,#33235f 48%,#123a4a);
    --lp-chat-wallpaper: linear-gradient(180deg,rgba(139,125,255,.16),rgba(19,17,28,.03));
    --lp-bg: #0d0c12; --lp-surface: rgba(31,29,40,.88); --lp-surface-2: rgba(50,47,62,.78);
    --lp-text: #f7f5ff; --lp-muted: #aaa5b6; --lp-border: rgba(255,255,255,.11); --lp-shadow: rgba(0,0,0,.45);
    --lp-animation-ms: 280ms;
    width: 100%; height: 100%; min-width: 0; min-height: 0; aspect-ratio: 9 / 16; overflow: hidden; position: relative; isolation: isolate;
    border: 8px solid var(--lp-bezel); border-radius: 45px; background: var(--lp-bg); color: var(--lp-text);
    box-shadow: 0 36px 90px var(--lp-shadow), 0 0 0 1px rgba(255,255,255,.09) inset;
    display: grid; grid-template-rows: 34px minmax(0,1fr) 24px;
  }
  .lumiphone-shell[hidden], .lumiphone-launcher[hidden] { display: none !important; }
  .lumiphone-shell[data-theme="porcelain"] { --lp-bg:#f2f0ed; --lp-surface:rgba(255,255,255,.9); --lp-surface-2:rgba(226,222,218,.82); --lp-text:#231f2a; --lp-muted:#746e78; --lp-border:rgba(37,30,45,.12); --lp-shadow:rgba(35,28,46,.24); }
  .lumiphone-shell[data-theme="rose"] { --lp-bg:#1b1018; --lp-surface:rgba(53,27,43,.9); --lp-surface-2:rgba(94,43,69,.75); --lp-text:#fff4fa; --lp-muted:#ceaebb; --lp-border:rgba(255,209,229,.13); --lp-shadow:rgba(38,7,24,.5); }
  .lumiphone-shell[data-theme="forest"] { --lp-bg:#0d1713; --lp-surface:rgba(23,48,38,.9); --lp-surface-2:rgba(38,77,59,.76); --lp-text:#effcf5; --lp-muted:#9ebcad; --lp-border:rgba(204,255,224,.12); --lp-shadow:rgba(3,26,16,.54); }
  .lumiphone-statusbar {
    height: 34px; padding: 5px 16px 0; display: grid; grid-template-columns: 24px minmax(28px,1fr) auto minmax(60px,1fr); align-items: start;
    position: relative; z-index: 20; font-size: 10px; font-weight: 760; letter-spacing: .01em; user-select: none;
  }
  .lumiphone-dismiss { appearance:none; width:22px; height:22px; padding:4px; border:0; border-radius:50%; display:grid; place-items:center; background:color-mix(in srgb,var(--lp-surface) 72%,transparent); color:var(--lp-text); cursor:pointer; }
  .lumiphone-dismiss svg { width:14px; height:14px; }
  .lumiphone-time { padding-top: 3px; }
  .lumiphone-island {
    width: 92px; height: 23px; border-radius: 999px; background: #050506; border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: flex-end; gap: 6px; padding: 0 9px;
  }
  .lumiphone-island::before { content:""; width: 31px; height: 5px; border-radius: 99px; background: #111; }
  .lumiphone-island::after { content:""; width: 5px; height: 5px; border-radius: 50%; background: #17203c; box-shadow: inset 0 0 0 1px #253568; }
  .lumiphone-signals { padding-top: 3px; display: flex; justify-content: flex-end; align-items: center; gap: 5px; }
  .lumiphone-signal-bars { display:flex; align-items:flex-end; gap:1px; height:9px; }
  .lumiphone-signal-bars i { display:block; width:2px; border-radius:1px; background:currentColor; }
  .lumiphone-signal-bars i:nth-child(1){height:3px}.lumiphone-signal-bars i:nth-child(2){height:5px}.lumiphone-signal-bars i:nth-child(3){height:7px}.lumiphone-signal-bars i:nth-child(4){height:9px}
  .lumiphone-battery { width:14px; height:7px; border:1px solid currentColor; border-radius:2px; padding:1px; position:relative; opacity:.9; }
  .lumiphone-battery::before { content:""; display:block; width:75%; height:100%; border-radius:1px; background:currentColor; }
  .lumiphone-battery::after { content:""; position:absolute; width:1px; height:3px; top:1px; right:-3px; border-radius:0 1px 1px 0; background:currentColor; }
  .lumiphone-screen { min-height: 0; overflow: hidden; position: relative; background: var(--lp-bg); }
  .lumiphone-app-view { width:100%; height:100%; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:color-mix(in srgb,var(--lp-accent) 42%,transparent) transparent; }
  .lumiphone-app-view[data-animate="spring"] { animation: lp-spring var(--lp-animation-ms) cubic-bezier(.2,.9,.28,1.12); }
  .lumiphone-app-view[data-animate="slide"] { animation: lp-slide var(--lp-animation-ms) cubic-bezier(.2,.8,.2,1); }
  .lumiphone-app-view[data-animate="fade"] { animation: lp-fade var(--lp-animation-ms) ease; }
  @keyframes lp-spring { from{opacity:.25;transform:scale(.88) translateY(16px);filter:blur(4px)} to{opacity:1;transform:none;filter:none} }
  @keyframes lp-slide { from{opacity:.2;transform:translateX(32px)} to{opacity:1;transform:none} }
  @keyframes lp-fade { from{opacity:0} to{opacity:1} }
  .lumiphone-homebar { display:grid; place-items:start center; background:var(--lp-bg); position:relative; z-index:20; }
  .lumiphone-homebar button { appearance:none; width:112px; height:17px; padding:0; border:0; background:transparent; cursor:pointer; position:relative; }
  .lumiphone-homebar button::after { content:""; position:absolute; left:8px; right:8px; top:7px; height:4px; border-radius:99px; background:var(--lp-text); opacity:.88; }

  .lp-home { min-height:100%; padding: 14px 16px 18px; background-image:linear-gradient(rgba(7,6,11,.12),rgba(7,6,11,.34)),var(--lp-wallpaper); background-size:cover; background-position:center; color:#fff; display:flex; flex-direction:column; }
  .lp-home-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:10px 3px 20px; text-shadow:0 2px 12px rgba(0,0,0,.35); }
  .lp-home-date { font-size:11px; font-weight:650; opacity:.82; }
  .lp-home-clock { margin-top:1px; font-size:34px; line-height:1; font-weight:310; letter-spacing:-.045em; }
  .lp-home-weather { display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid rgba(255,255,255,.18); border-radius:15px; background:rgba(15,13,24,.22); backdrop-filter:blur(18px); font-size:11px; }
  .lp-app-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:18px 10px; align-content:start; }
  .lp-app-icon { appearance:none; min-width:0; padding:0; border:0; background:transparent; color:#fff; cursor:pointer; display:grid; justify-items:center; gap:6px; font:inherit; }
  .lp-app-icon:hover .lp-app-icon-box { transform:translateY(-2px) scale(1.035); }
  .lp-app-icon-box { width:54px; height:54px; border-radius:16px; display:grid; place-items:center; position:relative; box-shadow:0 8px 22px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.25); transition:transform .18s ease; }
  .lp-app-icon-box svg { width:27px; height:27px; stroke-width:1.7; }
  .lp-app-label { max-width:76px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10px; font-weight:600; text-shadow:0 1px 6px rgba(0,0,0,.65); }
  .lp-app-dot { position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px; display:grid; place-items:center; border:2px solid rgba(22,17,35,.9); border-radius:99px; background:#ff4164; font-size:9px; font-weight:850; }
  .lp-home-dock { margin-top:auto; min-height:74px; padding:10px; border:1px solid rgba(255,255,255,.18); border-radius:24px; background:rgba(15,13,24,.28); backdrop-filter:blur(24px) saturate(1.3); display:grid; grid-template-columns:repeat(4,1fr); align-items:center; }
  .lp-home-dock .lp-app-icon-box { width:50px; height:50px; }
  .lp-home-dock .lp-app-label { display:none; }
  .lp-home-activity { margin:12px 0; display:grid; gap:5px; }
  .lp-home-activity-item { appearance:none; min-height:38px; padding:7px 9px; border:1px solid rgba(255,255,255,.16); border-radius:13px; display:grid; grid-template-columns:minmax(0,auto) minmax(0,1fr) auto; align-items:center; gap:7px; background:rgba(15,13,24,.28); color:#fff; backdrop-filter:blur(18px); font:inherit; text-align:left; cursor:pointer; }
  .lp-home-activity-item strong,.lp-home-activity-item span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-home-activity-item strong { font-size:10px; }
  .lp-home-activity-item > span:not(.lp-home-activity-arrow) { opacity:.68; font-size:9px; }
  .lp-home-activity-arrow { font-size:17px; }
  .lp-icon-messages { background:linear-gradient(145deg,#4ee580,#12aa4b); }
  .lp-icon-camera { background:linear-gradient(145deg,#74757c,#18191d); }
  .lp-icon-gallery { background:linear-gradient(145deg,#fff,#e9e8ec); color:#6d49da; }
  .lp-icon-notes { background:linear-gradient(#ffd84a 0 24%,#fff7c4 24%); color:#725d00; }
  .lp-icon-weather { background:linear-gradient(145deg,#48b5ff,#4166d7); }
  .lp-icon-calendar { background:linear-gradient(#fff 0 26%,#ff4f68 26%); color:#24212b; }
  .lp-icon-trackers { background:linear-gradient(145deg,#a269ff,#5632d3); }
  .lp-icon-settings { background:linear-gradient(145deg,#a8a9af,#4c4e54); }

  .lp-page { min-height:100%; background:var(--lp-bg); color:var(--lp-text); }
  .lp-nav { min-height:48px; padding:7px 12px 8px; display:grid; grid-template-columns:74px minmax(0,1fr) 74px; align-items:center; gap:4px; position:sticky; top:0; z-index:15; background:color-mix(in srgb,var(--lp-bg) 88%,transparent); border-bottom:1px solid var(--lp-border); backdrop-filter:blur(20px) saturate(1.25); }
  .lp-nav-title { min-width:0; text-align:center; font-size:14px; font-weight:780; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-nav-subtitle { display:block; color:var(--lp-muted); font-size:9px; font-weight:550; margin-top:2px; }
  .lp-nav-action { appearance:none; min-height:30px; padding:5px 4px; border:0; background:transparent; color:var(--lp-accent); font:inherit; font-size:11px; font-weight:680; cursor:pointer; text-align:left; }
  .lp-nav-action:last-child { text-align:right; }
  .lp-content { padding:12px; display:grid; gap:10px; }
  .lp-card { padding:12px; border:1px solid var(--lp-border); border-radius:17px; background:var(--lp-surface); box-shadow:0 8px 24px rgba(0,0,0,.06); }
  .lp-card[data-clickable="true"] { cursor:pointer; transition:transform .18s ease,border-color .18s ease; }
  .lp-card[data-clickable="true"]:hover { transform:translateY(-1px); border-color:color-mix(in srgb,var(--lp-accent) 38%,var(--lp-border)); }
  .lp-row { display:flex; align-items:center; gap:10px; min-width:0; }
  .lp-row-between { display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0; }
  .lp-stack { display:grid; gap:8px; min-width:0; }
  .lp-grow { flex:1; min-width:0; }
  .lp-title { margin:0; font-size:13px; font-weight:760; line-height:1.3; overflow-wrap:anywhere; }
  .lp-copy { margin:0; color:var(--lp-muted); font-size:10px; line-height:1.5; overflow-wrap:anywhere; }
  .lp-eyebrow { color:var(--lp-muted); font-size:8px; line-height:1.2; font-weight:780; letter-spacing:.11em; text-transform:uppercase; }
  .lp-empty { min-height:190px; padding:32px 20px; display:grid; place-items:center; text-align:center; color:var(--lp-muted); }
  .lp-empty svg { width:44px; height:44px; margin-bottom:10px; color:var(--lp-accent); opacity:.8; }
  .lp-button { appearance:none; min-height:34px; padding:7px 11px; border:1px solid var(--lp-border); border-radius:11px; background:var(--lp-surface-2); color:var(--lp-text); font:inherit; font-size:10px; font-weight:720; cursor:pointer; }
  .lp-button:hover { border-color:color-mix(in srgb,var(--lp-accent) 45%,var(--lp-border)); }
  .lp-button:disabled { cursor:not-allowed; opacity:.45; }
  .lp-button-primary { border-color:transparent; background:var(--lp-accent); color:#fff; }
  .lp-button-danger { color:#ff6f87; }
  .lp-button-icon { width:34px; padding:6px; display:grid; place-items:center; }
  .lp-button-icon svg { width:16px; height:16px; }
  .lp-input, .lp-textarea, .lp-select { width:100%; min-height:38px; padding:9px 10px; border:1px solid var(--lp-border); border-radius:11px; outline:none; background:var(--lp-surface); color:var(--lp-text); font:inherit; font-size:11px; }
  .lp-input:focus, .lp-textarea:focus, .lp-select:focus { border-color:color-mix(in srgb,var(--lp-accent) 58%,var(--lp-border)); box-shadow:0 0 0 2px color-mix(in srgb,var(--lp-accent) 16%,transparent); }
  .lp-textarea { min-height:96px; resize:vertical; line-height:1.5; }
  .lp-label { display:grid; gap:5px; color:var(--lp-muted); font-size:9px; font-weight:680; }
  .lp-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .lp-chipbar { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
  .lp-chip { appearance:none; white-space:nowrap; min-height:29px; padding:5px 9px; border:1px solid var(--lp-border); border-radius:99px; background:var(--lp-surface); color:var(--lp-muted); font:inherit; font-size:9px; font-weight:700; cursor:pointer; }
  .lp-chip[aria-pressed="true"] { border-color:transparent; background:var(--lp-accent); color:#fff; }
  .lp-avatar { width:42px; height:42px; flex:0 0 42px; border-radius:50%; overflow:hidden; display:grid; place-items:center; background:linear-gradient(145deg,color-mix(in srgb,var(--lp-accent) 85%,white),var(--lp-accent)); color:#fff; font-size:15px; font-weight:820; }
  .lp-avatar img { width:100%; height:100%; object-fit:cover; }
  .lp-list-separator { height:1px; margin-left:52px; background:var(--lp-border); }
  .lp-unread { min-width:20px; height:20px; padding:0 5px; display:grid; place-items:center; border-radius:99px; background:var(--lp-accent); color:#fff; font-size:9px; font-weight:800; }

  .lp-thread { min-height:100%; display:grid; grid-template-rows:auto minmax(0,1fr) auto; background:var(--lp-chat-wallpaper),var(--lp-bg); }
  .lp-thread .lp-nav { position:relative; }
  .lp-bubbles { min-height:0; overflow:auto; padding:14px 12px; display:flex; flex-direction:column; gap:7px; }
  .lp-bubble { max-width:79%; padding:8px 10px; border-radius:16px; font-size:11px; line-height:1.42; white-space:pre-wrap; overflow-wrap:anywhere; box-shadow:0 3px 10px rgba(0,0,0,.08); }
  .lp-bubble[data-sender="user"] { align-self:flex-end; border-bottom-right-radius:5px; background:var(--lp-accent); color:#fff; }
  .lp-bubble[data-sender="character"] { align-self:flex-start; border-bottom-left-radius:5px; background:var(--lp-surface-2); color:var(--lp-text); }
  .lp-bubble[data-sender="system"] { align-self:center; max-width:90%; background:transparent; color:var(--lp-muted); text-align:center; font-size:9px; box-shadow:none; }
  .lp-bubble-time { display:block; margin-top:4px; opacity:.58; font-size:7px; text-align:right; }
  .lp-bubble-pending { opacity:.72; font-style:italic; animation:lp-pulse 1.2s ease-in-out infinite; }
  .lp-compose { padding:8px 9px 10px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:6px; align-items:end; border-top:1px solid var(--lp-border); background:color-mix(in srgb,var(--lp-bg) 90%,transparent); backdrop-filter:blur(18px); }
  .lp-compose .lp-textarea { min-height:34px; max-height:96px; padding:8px 10px; resize:none; border-radius:17px; }
  .lp-compose .lp-button-icon { border-radius:50%; }

  .lp-gallery-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; }
  .lp-gallery-item { appearance:none; aspect-ratio:1; padding:0; border:0; background:var(--lp-surface); cursor:pointer; overflow:hidden; position:relative; }
  .lp-gallery-item img { width:100%; height:100%; object-fit:cover; transition:transform .25s ease; }
  .lp-gallery-item:hover img { transform:scale(1.04); }
  .lp-gallery-meta { position:absolute; left:0; right:0; bottom:0; padding:14px 5px 4px; background:linear-gradient(transparent,rgba(0,0,0,.68)); color:white; font-size:7px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; }
  .lp-gallery-item[data-missing="true"] { display:grid; place-items:center; border:1px dashed var(--lp-border); }
  .lp-gallery-missing { padding:8px; color:var(--lp-muted); font-size:9px; line-height:1.35; }
  .lp-camera { min-height:100%; background:#050505; color:#fff; display:grid; grid-template-rows:auto minmax(0,1fr) auto; }
  .lp-camera .lp-nav { background:rgba(4,4,4,.82); border-color:rgba(255,255,255,.1); color:#fff; }
  .lp-viewfinder { min-height:0; margin:0 10px; border-radius:20px; overflow:hidden; position:relative; display:grid; place-items:center; background:radial-gradient(circle at 50% 42%,#2c2a31,#0b0b0d 62%); border:1px solid rgba(255,255,255,.1); }
  .lp-viewfinder::before,.lp-viewfinder::after { content:""; position:absolute; background:rgba(255,255,255,.12); pointer-events:none; }
  .lp-viewfinder::before { left:33.33%; top:0; bottom:0; width:1px; box-shadow:calc(33.33vw - 8px) 0 rgba(255,255,255,.12); }
  .lp-viewfinder::after { top:33.33%; left:0; right:0; height:1px; box-shadow:0 calc(33.33vh - 70px) rgba(255,255,255,.12); }
  .lp-viewfinder img { width:100%; height:100%; object-fit:contain; position:relative; z-index:2; background:#050505; }
  .lp-camera-placeholder { max-width:240px; padding:22px; text-align:center; color:rgba(255,255,255,.65); font-size:10px; line-height:1.5; position:relative; z-index:3; }
  .lp-camera-placeholder svg { width:44px; height:44px; margin-bottom:8px; }
  .lp-camera-controls { padding:10px 12px 14px; display:grid; gap:8px; background:#050505; }
  .lp-shutter-row { display:grid; grid-template-columns:1fr 66px 1fr; align-items:center; }
  .lp-shutter { appearance:none; width:58px; height:58px; padding:5px; border:3px solid #fff; border-radius:50%; background:transparent; cursor:pointer; justify-self:center; }
  .lp-shutter::after { content:""; display:block; width:100%; height:100%; border-radius:50%; background:#fff; transition:transform .12s ease; }
  .lp-shutter:active::after { transform:scale(.84); }
  .lp-shutter:disabled { opacity:.45; cursor:not-allowed; }
  .lp-shutter:disabled::after { animation:lp-pulse 1s ease-in-out infinite; }
  @keyframes lp-pulse { 50%{transform:scale(.72);opacity:.65} }
  .lp-camera-progress { color:rgba(255,255,255,.65); font-size:9px; text-align:center; min-height:14px; }

  .lp-note-card[data-pinned="true"] { border-color:color-mix(in srgb,#ffd653 45%,var(--lp-border)); background:color-mix(in srgb,#ffd653 8%,var(--lp-surface)); }
  .lp-note-preview { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; white-space:pre-wrap; }
  .lp-weather-hero { min-height:210px; padding:24px 18px; border-radius:22px; color:#fff; background:linear-gradient(155deg,#4eabf2,#5264c9 58%,#302b72); display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 20px 42px rgba(47,70,151,.28); }
  .lp-weather-temp { font-size:64px; line-height:1; font-weight:240; letter-spacing:-.06em; }
  .lp-weather-condition { font-size:14px; font-weight:720; }
  .lp-weather-range { opacity:.75; font-size:10px; }
  .lp-timeline { position:relative; display:grid; gap:10px; }
  .lp-timeline::before { content:""; position:absolute; left:14px; top:8px; bottom:8px; width:2px; border-radius:99px; background:var(--lp-border); }
  .lp-event { position:relative; padding-left:34px; }
  .lp-event-dot { position:absolute; left:8px; top:15px; width:14px; height:14px; border:3px solid var(--lp-bg); border-radius:50%; background:var(--event-color,var(--lp-accent)); box-shadow:0 0 0 1px var(--lp-border); z-index:2; }
  .lp-event[data-completed="true"] { opacity:.52; }
  .lp-event[data-completed="true"] .lp-title { text-decoration:line-through; }
  .lp-tracker-value { font-size:24px; font-weight:720; letter-spacing:-.035em; }
  .lp-progress { height:7px; overflow:hidden; border-radius:99px; background:var(--lp-surface-2); }
  .lp-progress span { display:block; height:100%; width:var(--progress,0%); border-radius:inherit; background:var(--tracker-color,var(--lp-accent)); transition:width .5s ease; }
  .lp-rate { color:var(--lp-muted); font-size:8px; }
  .lp-toggle { appearance:none; width:40px; height:23px; border:0; border-radius:99px; padding:2px; background:var(--lp-surface-2); cursor:pointer; transition:background .2s ease; }
  .lp-toggle::after { content:""; display:block; width:19px; height:19px; border-radius:50%; background:#fff; box-shadow:0 2px 7px rgba(0,0,0,.28); transition:transform .2s ease; }
  .lp-toggle[aria-pressed="true"] { background:var(--lp-accent); }
  .lp-toggle[aria-pressed="true"]::after { transform:translateX(17px); }
  .lp-color-input { width:42px; height:31px; padding:2px; border:1px solid var(--lp-border); border-radius:9px; background:var(--lp-surface); cursor:pointer; }
  .lp-theme-dot { width:30px; height:30px; border-radius:50%; border:2px solid transparent; box-shadow:0 0 0 1px var(--lp-border); cursor:pointer; }
  .lp-theme-dot[aria-pressed="true"] { border-color:var(--lp-bg); box-shadow:0 0 0 2px var(--lp-accent); }
  .lp-settings-section { display:grid; gap:9px; }
  .lp-color-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 12px; }
  .lp-color-grid > .lp-row-between { min-height:36px; padding:4px 7px; border:1px solid var(--lp-border); border-radius:10px; }
  .lp-slider-setting { display:grid; gap:6px; padding:6px 0; }
  .lp-slider-setting input[type="range"] { width:100%; accent-color:var(--lp-accent); }
  .lp-permission-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }
  .lp-permission { padding:8px; border:1px solid var(--lp-border); border-radius:10px; color:var(--lp-muted); font-size:9px; }
  .lp-permission[data-granted="true"] { color:var(--lp-text); border-color:color-mix(in srgb,#43d17e 34%,var(--lp-border)); }
  .lp-permission::before { content:"○"; margin-right:5px; }
  .lp-permission[data-granted="true"]::before { content:"●"; color:#43d17e; }
  .lp-alert { margin:8px 12px 0; padding:9px 10px; border:1px solid color-mix(in srgb,#ff6a80 42%,var(--lp-border)); border-radius:12px; background:color-mix(in srgb,#ff6a80 10%,var(--lp-surface)); color:var(--lp-text); font-size:9px; line-height:1.4; position:absolute; left:0; right:0; top:34px; z-index:40; box-shadow:0 12px 30px rgba(0,0,0,.22); }
  .lp-alert[hidden] { display:none; }

  .lumiphone-drawer { min-height:100%; padding:18px; color:var(--lumiverse-text,inherit); display:grid; place-items:center; }
  .lumiphone-drawer-card { width:min(100%,500px); padding:22px; border:1px solid var(--lumiverse-border,rgba(127,127,127,.25)); border-radius:20px; background:var(--lumiverse-fill-subtle,rgba(127,127,127,.08)); text-align:center; display:grid; justify-items:center; gap:12px; }
  .lumiphone-drawer-icon { width:62px; height:62px; border-radius:20px; display:grid; place-items:center; color:white; background:linear-gradient(145deg,#9a8cff,#5746ce); box-shadow:0 16px 36px rgba(73,53,168,.3); }
  .lumiphone-drawer-icon svg { width:31px; height:31px; }
  .lumiphone-drawer-title { margin:0; font-size:20px; font-weight:780; }
  .lumiphone-drawer-copy { margin:0; max-width:390px; color:var(--lumiverse-text-muted,currentColor); font-size:12px; line-height:1.55; }
  .lumiphone-drawer-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; }
  .lumiphone-drawer-button { appearance:none; min-height:36px; padding:8px 13px; border:1px solid var(--lumiverse-border,rgba(127,127,127,.3)); border-radius:11px; background:var(--lumiverse-fill,rgba(127,127,127,.14)); color:inherit; font:inherit; font-size:11px; font-weight:720; cursor:pointer; }
  .lumiphone-drawer-button[data-primary="true"] { border-color:transparent; background:var(--lumiverse-primary,#7866e8); color:white; }

  @media (max-width: 720px) {
    .lumiphone-shell { border:0; border-radius:0; box-shadow:none; aspect-ratio:auto; }
    .lp-app-grid { gap:20px 8px; }
    .lp-app-icon-box { width:58px; height:58px; border-radius:17px; }
    .lp-gallery-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
  }
  .lumiphone-widget-root[data-fullscreen="true"] { width:100dvw; height:100dvh; overflow:hidden; }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-shell { border:0; border-radius:0; box-shadow:none; aspect-ratio:auto; grid-template-rows:calc(34px + env(safe-area-inset-top)) minmax(0,1fr) calc(24px + env(safe-area-inset-bottom)); }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-statusbar { height:calc(34px + env(safe-area-inset-top)); padding-top:calc(5px + env(safe-area-inset-top)); }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-homebar { padding-bottom:env(safe-area-inset-bottom); }
  @media (max-width: 360px) {
    .lp-app-icon-box { width:50px; height:50px; border-radius:15px; }
    .lp-fields { grid-template-columns:1fr; }
    .lp-home { padding-inline:12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .lumiphone-app-view, .lumiphone-launcher, .lp-app-icon-box, .lp-gallery-item img, .lp-progress span { animation:none !important; transition:none !important; }
  }
  .lumiphone-shell[data-reduced-motion="true"] *, .lumiphone-shell[data-reduced-motion="true"] *::before, .lumiphone-shell[data-reduced-motion="true"] *::after { animation-duration:0ms !important; transition-duration:0ms !important; }
  .lp-gallery-item[data-selected="true"] { outline:3px solid var(--lp-accent); outline-offset:2px; }
  .lp-bubble[data-selected="true"] { outline:3px solid color-mix(in srgb,var(--lp-accent) 62%,white); outline-offset:2px; }

  .pocket-receipt-host { display:block; margin:8px 0 2px; max-width:min(100%,420px); }
  .pocket-receipt {
    appearance:none; width:100%; min-height:48px; padding:8px 10px; border:1px solid color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 32%,transparent);
    border-radius:13px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:9px;
    background:color-mix(in srgb,var(--lumiverse-fill,#17151d) 92%,var(--lumiverse-primary,#8b7dff) 8%); color:var(--lumiverse-text,#f7f5ff);
    font:inherit; text-align:left; cursor:pointer; box-shadow:0 8px 22px rgba(0,0,0,.12); transition:transform .15s ease,border-color .15s ease;
  }
  .pocket-receipt:hover { transform:translateY(-1px); border-color:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 68%,transparent); }
  .pocket-receipt:focus-visible { outline:3px solid color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 55%,white); outline-offset:2px; }
  .pocket-receipt-kind { padding:4px 7px; border-radius:8px; background:color-mix(in srgb,var(--lumiverse-primary,#8b7dff) 18%,transparent); font-size:10px; font-weight:800; }
  .pocket-receipt-copy { min-width:0; display:grid; gap:1px; }
  .pocket-receipt-copy strong,.pocket-receipt-copy span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pocket-receipt-copy strong { font-size:12px; }
  .pocket-receipt-copy span { opacity:.68; font-size:10px; }
  .pocket-receipt-arrow { font-size:22px; opacity:.7; }
  .lp-tracker-filters { display:flex; gap:6px; overflow:auto; padding-bottom:2px; scrollbar-width:none; }
  .lp-tracker-card { display:grid; gap:9px; border-left:3px solid color-mix(in srgb,var(--lp-accent) 68%,transparent); }
  .lp-tracker-card[role="button"]:focus-visible { outline:3px solid color-mix(in srgb,var(--lp-accent) 52%,white); outline-offset:2px; }
  .lp-tracker-relationship { background:linear-gradient(135deg,color-mix(in srgb,#ec7eb5 12%,var(--lp-surface)),var(--lp-surface)); }
  .lp-tracker-vitals { border-left-color:#ef6b73; }
  .lp-tracker-counter .lp-tracker-value { padding:5px 9px; border-radius:10px; background:color-mix(in srgb,var(--lp-accent) 16%,transparent); }
  .lp-tracker-timer { border-left-color:#62b8e8; }
  .lp-tracker-state { border-left-color:#d59c50; }
  .lp-tracker-compact { padding-block:9px; }
  .lp-progress-segmented { background:repeating-linear-gradient(90deg,var(--lp-surface-2) 0 calc(10% - 2px),transparent calc(10% - 2px) 10%); }
  .lp-tracker-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; color:var(--lp-muted); font-size:9px; font-weight:720; text-transform:capitalize; }
  .lp-tracker-policy { display:grid; gap:5px; }
  .lp-warning { margin:0; color:#f3bd65; font-size:10px; line-height:1.4; }
  .lp-tracker-operations { display:grid; gap:9px; }
  .lp-tracker-operation-row { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
  .lp-tracker-history { display:grid; gap:7px; }
  .lp-history-row { display:grid; gap:3px; }
  .lp-history-row time { overflow-wrap:anywhere; }
  .lp-tracker-config-fields { display:grid; gap:9px; }
`;

// src/frontend.ts
function setup(ctx) {
  const removeStyle = ctx.dom.addStyle(PHONE_STYLES);
  const destroyPhone = setupPhone(ctx);
  return () => {
    destroyPhone();
    removeStyle();
  };
}
export {
  setup
};
