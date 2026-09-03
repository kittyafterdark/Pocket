// src/domain/preferences.ts
var PREFERENCES_VERSION = 5;
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
function wallpaperCss(primary, secondary) {
  return `linear-gradient(145deg, ${safeColor(primary, "#171327")} 0%, ${safeColor(secondary, "#123a4a")} 100%)`;
}

// src/domain/navigation.ts
var APPS = new Set(["home", "messages", "contacts", "gallery", "camera", "notes", "weather", "calendar", "trackers", "notifications", "settings"]);
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
function applyMobilePhoneSurface(widget, _scale = 1) {
  const geometry = calculatePhoneSurface(1);
  if (widget.isFullscreen() !== geometry.fullscreen)
    widget.setFullscreen(geometry.fullscreen);
  if (!geometry.fullscreen) {
    widget.setSize(geometry.width, geometry.height);
    widget.moveTo(geometry.x, geometry.y);
  }
  return geometry;
}
function applyVisualViewportSurface(host) {
  const visual = window.visualViewport;
  const width = Math.max(1, Math.round(visual?.width || window.innerWidth));
  const height = Math.max(1, Math.round(visual?.height || window.innerHeight));
  const offsetLeft = Math.round(visual?.offsetLeft || 0);
  const offsetTop = Math.round(visual?.offsetTop || 0);
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.position = "absolute";
  host.style.left = "0";
  host.style.top = "0";
  host.style.transform = `translate3d(${offsetLeft}px,${offsetTop}px,0)`;
  host.style.margin = "0";
  host.style.setProperty("--lp-visual-height", `${height}px`);
  return { width, height, offsetLeft, offsetTop };
}
function clearVisualViewportSurface(host) {
  for (const property of ["width", "height", "position", "left", "top", "transform", "margin"])
    host.style.removeProperty(property);
  host.style.removeProperty("--lp-visual-height");
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

// src/frontend/components/image-picker.ts
function range(label, value, update) {
  const node = el("label", "lp-wallpaper-range");
  node.append(el("span", "lp-copy", label));
  const input = el("input");
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = ".01";
  input.value = String(value);
  input.addEventListener("input", () => update(Number(input.value)));
  node.appendChild(input);
  return node;
}
function wallpaperImageControl(label, target, wallpaper, resolved, host) {
  const card = el("section", "lp-wallpaper-control");
  card.dataset.imageTarget = target;
  const heading = el("div", "lp-row-between");
  const copy = el("span");
  copy.append(el("strong", "", label), el("span", "lp-copy", resolved.status === "error" ? `${resolved.sourceLabel} · unavailable` : resolved.sourceLabel));
  const clear = button("Clear", "lp-button lp-button-quiet");
  clear.disabled = !wallpaper.source;
  clear.addEventListener("click", () => host.change({ ...wallpaper, source: null }));
  heading.append(copy, clear);
  const preview = el("div", "lp-wallpaper-preview");
  preview.dataset.empty = String(!resolved.url);
  preview.dataset.resolutionStatus = resolved.status;
  preview.style.backgroundImage = resolved.url ? `linear-gradient(rgba(5,4,8,${wallpaper.scrim}),rgba(5,4,8,${wallpaper.scrim})),url(${JSON.stringify(resolved.url)})` : "";
  preview.style.backgroundSize = wallpaper.fit === "stretch" ? "100% 100%" : wallpaper.fit;
  preview.style.backgroundPosition = `${wallpaper.focalX * 100}% ${wallpaper.focalY * 100}%`;
  preview.textContent = resolved.url ? "" : resolved.error || "Theme background";
  const actions = el("div", "lp-wallpaper-actions");
  for (const [mode, text2] of [["gallery", "Gallery"], ["upload", "Upload"], ["url", "Image URL"]]) {
    const choose = button(text2, "lp-button lp-button-quiet");
    choose.addEventListener("click", () => host.choose(target, mode));
    actions.appendChild(choose);
  }
  const fit = el("select", "lp-select");
  for (const value of ["cover", "contain", "stretch"]) {
    const option = el("option", "", value[0].toUpperCase() + value.slice(1));
    option.value = value;
    option.selected = wallpaper.fit === value;
    fit.appendChild(option);
  }
  fit.setAttribute("aria-label", `${label} fit`);
  fit.addEventListener("change", () => host.change({ ...wallpaper, fit: fit.value }));
  const focal = el("div", "lp-wallpaper-focal");
  focal.append(range("Horizontal focus", wallpaper.focalX, (value) => host.change({ ...wallpaper, focalX: value })), range("Vertical focus", wallpaper.focalY, (value) => host.change({ ...wallpaper, focalY: value })), range("Scrim", wallpaper.scrim, (value) => host.change({ ...wallpaper, scrim: value })));
  card.append(heading, preview, actions, fit, focal);
  return card;
}

// src/frontend/apps/settings.ts
function clone(value) {
  return structuredClone(value);
}
function row(label, detail = "") {
  const node = el("div", "lp-row-between");
  const copy = el("span");
  copy.append(el("strong", "", label));
  if (detail)
    copy.append(el("span", "lp-copy", detail));
  node.appendChild(copy);
  return node;
}
function toggle(label, initial, update, detail = "") {
  const node = row(label, detail);
  node.dataset.setting = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const control = button("", "lp-toggle");
  control.setAttribute("aria-pressed", String(initial));
  control.setAttribute("aria-label", label);
  control.addEventListener("click", () => {
    const next = control.getAttribute("aria-pressed") !== "true";
    control.setAttribute("aria-pressed", String(next));
    update(next);
  });
  node.appendChild(control);
  return node;
}
function color(label, value, update) {
  const node = row(label);
  node.dataset.setting = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const control = el("input", "lp-color-input");
  control.type = "color";
  control.value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#8b7dff";
  control.addEventListener("input", () => update(control.value));
  node.appendChild(control);
  return node;
}
function slider(label, value, min, max, step, format, update, detail = "") {
  const node = el("label", "lp-slider-setting");
  const head = el("span", "lp-row-between");
  const display = el("strong", "", format(value));
  node.dataset.setting = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  head.append(el("span", "lp-title", label), display);
  const control = el("input");
  control.type = "range";
  control.min = String(min);
  control.max = String(max);
  control.step = String(step);
  control.value = String(value);
  control.addEventListener("input", () => {
    const next = Number(control.value);
    display.textContent = format(next);
    update(next);
  });
  node.append(head, control);
  if (detail)
    node.append(el("span", "lp-copy", detail));
  return node;
}
function categories(host) {
  const { page, content } = host.page("Settings", "Device-wide preferences");
  const entries = [
    ["appearance", "Appearance", "Themes, scale, motion, custom CSS"],
    ["persona", "Persona & Device", "Optional appearance for the active persona"],
    ["messages", "Messages", "Replies, ambient texts, roleplay context"],
    ["generation", "Pocket Generation", "Model source and connection diagnostics"],
    ["camera", "Camera & Swarm Studio", "Visual profile and macro diagnostics"],
    ["notifications", "Notifications", "Kinds, previews, push, and sound"],
    ["permissions", "Permissions", "Lumiverse capability access"],
    ["data", "Data & Backup", "Export, import, and reset"]
  ];
  for (const [id, label, detail] of entries) {
    const open = button("", "lp-card lp-settings-category");
    open.dataset.settingsCategory = id;
    const copy = el("span");
    copy.append(el("strong", "", label), el("span", "lp-copy", detail));
    open.append(copy, el("span", "lp-settings-chevron", "›"));
    open.addEventListener("click", () => host.navigate(id));
    content.appendChild(open);
  }
  return page;
}
function appearance(host) {
  const settings = host.draft;
  const commit = (mutate, options) => {
    const next = clone(settings);
    mutate(next);
    host.update(normalizePreferences(next), options);
  };
  const { page, content } = host.page("Appearance", "Device defaults");
  const themes = el("section", "lp-card lp-settings-section");
  themes.append(el("div", "lp-eyebrow", "Theme"));
  const themeRow = el("div", "lp-row");
  for (const [name, swatch] of [["midnight", "#201a37"], ["porcelain", "#eeeae6"], ["rose", "#7a294e"], ["forest", "#1d5a41"], ["custom", settings.colors.accent]]) {
    const dot = button("", "lp-theme-dot");
    dot.title = name;
    dot.style.background = swatch;
    dot.setAttribute("aria-pressed", String(settings.theme === name));
    dot.addEventListener("click", () => commit((next) => {
      next.theme = name;
      if (name !== "custom")
        next.colors = themePalette(name);
    }));
    themeRow.appendChild(dot);
  }
  themes.appendChild(themeRow);
  const palette = el("div", "lp-color-grid");
  const colorControl = (label, key) => color(label, settings.colors[key], (value) => commit((next) => {
    next.theme = "custom";
    next.colors[key] = value;
  }));
  palette.append(colorControl("Accent", "accent"), colorControl("Bezel", "bezel"), colorControl("UI background", "background"), colorControl("UI surface", "surface"), colorControl("UI text", "text"), colorControl("Home top", "wallpaperPrimary"), colorControl("Home bottom", "wallpaperSecondary"), colorControl("Chat top", "chatPrimary"), colorControl("Chat bottom", "chatSecondary"));
  const wallpapers = el("section", "lp-card lp-settings-section");
  wallpapers.append(el("div", "lp-eyebrow", "Wallpaper images"), wallpaperImageControl("Home wallpaper", "device-home", settings.homeWallpaper, host.resolvedWallpapers.deviceHome, {
    choose: host.chooseImage,
    change: (wallpaper) => commit((next) => {
      next.homeWallpaper = wallpaper;
    })
  }), wallpaperImageControl("Chat wallpaper", "device-chat", settings.chatWallpaper, host.resolvedWallpapers.deviceChat, {
    choose: host.chooseImage,
    change: (wallpaper) => commit((next) => {
      next.chatWallpaper = wallpaper;
    })
  }));
  const scaleCard = el("section", "lp-card lp-settings-section");
  scaleCard.append(el("div", "lp-eyebrow", "Sizing"));
  const presets = el("div", "lp-row");
  for (const [label, value] of [["Compact", 0.8], ["Default", 1], ["Large", 1.2]]) {
    const preset = button(label, "lp-chip");
    preset.setAttribute("aria-pressed", String(settings.uiScale === value));
    preset.addEventListener("click", () => commit((next) => {
      next.uiScale = value;
    }));
    presets.appendChild(preset);
  }
  scaleCard.append(presets, slider("Interface size", settings.uiScale, 0.7, 1.3, 0.05, (value) => `${Math.round(value * 100)}%`, (value) => commit((next) => {
    next.uiScale = value;
  }), "Scales Pocket primitives and density on desktop and mobile. It never shrinks the mobile viewport."), slider("Desktop phone size", settings.handsetScale, 0.8, 1.25, 0.05, (value) => `${Math.round(value * 100)}%`, (value) => commit((next) => {
    next.handsetScale = value;
  }, { resize: true }), "Controls only the physical 9:16 handset on desktop."));
  const motion = el("section", "lp-card lp-settings-section");
  motion.append(el("div", "lp-eyebrow", "Motion"));
  const animation = el("select", "lp-select");
  for (const value of ["spring", "slide", "fade", "none"]) {
    const option = el("option", "", value[0].toUpperCase() + value.slice(1));
    option.value = value;
    option.selected = settings.animation === value;
    animation.appendChild(option);
  }
  animation.addEventListener("change", () => commit((next) => {
    next.animation = animation.value;
  }));
  motion.append(animation, slider("Animation duration", settings.animationDurationMs, 0, 700, 20, (value) => `${value} ms`, (value) => commit((next) => {
    next.animationDurationMs = value;
  })), toggle("Reduce motion", settings.reducedMotion, (value) => commit((next) => {
    next.reducedMotion = value;
  })));
  const custom = el("section", "lp-card lp-settings-section");
  custom.append(el("div", "lp-eyebrow", "Advanced custom CSS"), el("p", "lp-copy", "Scoped to .lumiphone-shell. Stable hooks include data-pocket-app, data-pocket-thread, data-message-id, data-settings-category, and data-setting."));
  const css = el("textarea", "lp-textarea lp-code-input");
  css.value = settings.customCss;
  css.placeholder = ".lp-bubble { border-radius: 12px; }";
  css.addEventListener("input", () => commit((next) => {
    next.customCss = css.value;
  }, { persist: false }));
  const apply = button("Apply custom CSS", "lp-button");
  apply.addEventListener("click", () => commit((next) => {
    next.customCss = css.value;
  }));
  custom.append(css, apply);
  content.append(themes, palette, wallpapers, scaleCard, motion, custom);
  return page;
}
function persona(host) {
  const profile = host.state.pocketPersona;
  const { page, content } = host.page("Persona & Device", profile.displayName || host.activePersona?.name || "Pocket profile");
  const identity = el("section", "lp-card lp-settings-section");
  identity.append(el("div", "lp-eyebrow", "Who is using this phone?"));
  const source = el("select", "lp-select");
  for (const [value, label] of [["lumiverse", "Follow Lumiverse Persona"], ["manual", "Use Pocket profile"]]) {
    const option = el("option", "", label);
    option.value = value;
    option.selected = profile.source === value || profile.source === "generated" && value === "manual";
    source.appendChild(option);
  }
  const name = el("input", "lp-input");
  name.placeholder = "Display name";
  name.value = profile.displayName;
  const pronouns = el("input", "lp-input");
  pronouns.placeholder = "Pronouns";
  pronouns.value = profile.pronouns;
  const role = el("input", "lp-input");
  role.placeholder = "Role";
  role.value = profile.role;
  const brief = el("textarea", "lp-textarea");
  brief.placeholder = "Stable identity and roleplay facts";
  brief.value = profile.identityBrief;
  const canAppear = toggle("Can appear as phone participant", profile.canAppear, () => {}, "Off by default. The active Persona is never imported as a Contact.");
  const fields = el("div", "lp-fields");
  fields.append(name, pronouns, role, brief, canAppear);
  const syncDisabled = () => {
    const disabled = source.value === "lumiverse";
    for (const control of [name, pronouns, role, brief])
      control.disabled = disabled;
    canAppear.querySelector("button").toggleAttribute("disabled", disabled);
  };
  source.addEventListener("change", syncDisabled);
  syncDisabled();
  const actions = el("div", "lp-row");
  const describe = button("Describe from roleplay", "lp-button lp-button-quiet");
  describe.disabled = !host.capabilities?.generation;
  describe.addEventListener("click", () => host.send("lumiphone:generate_pocket_persona"));
  const save = button("Save profile", "lp-button");
  save.addEventListener("click", () => host.send("lumiphone:save_pocket_persona", {
    followLumiverse: source.value === "lumiverse",
    persona: { ...profile, source: source.value, displayName: name.value.trim(), pronouns: pronouns.value.trim(), role: role.value.trim(), identityBrief: brief.value.trim(), canAppear: canAppear.querySelector("button")?.getAttribute("aria-pressed") === "true" }
  }));
  actions.append(describe, save);
  identity.append(source, fields, actions);
  if (host.personaPreview) {
    const preview = el("section", "lp-card lp-settings-section");
    preview.dataset.pocketPersonaPreview = "true";
    preview.append(el("div", "lp-eyebrow", "Generated preview"), el("strong", "", host.personaPreview.displayName), el("p", "lp-copy", [host.personaPreview.pronouns, host.personaPreview.role].filter(Boolean).join(" · ")), el("p", "lp-copy", host.personaPreview.identityBrief));
    const use = button("Use profile", "lp-button");
    use.addEventListener("click", () => host.send("lumiphone:save_pocket_persona", { persona: host.personaPreview }));
    preview.appendChild(use);
    identity.appendChild(preview);
  }
  content.appendChild(identity);
  if (!host.activePersona)
    return page;
  const active = host.activePersona;
  const current = host.draft.personaAppearance[active.id] || {
    enabled: false,
    theme: host.draft.theme,
    colors: clone(host.draft).colors,
    customCss: "",
    homeWallpaper: { ...structuredClone(host.draft.homeWallpaper), source: null },
    chatWallpaper: { ...structuredClone(host.draft.chatWallpaper), source: null }
  };
  const commit = (mutate, persist = true) => {
    const next = clone(host.draft);
    const value = structuredClone(next.personaAppearance[active.id] || current);
    mutate(value);
    next.personaAppearance[active.id] = value;
    host.update(next, { persist });
  };
  const card = el("section", "lp-card lp-settings-section");
  card.append(el("div", "lp-eyebrow", "Persona appearance"), toggle(`Enable for ${active.name}`, current.enabled, (value) => commit((item) => {
    item.enabled = value;
  }), "Appearance only; connections and notifications remain device-wide."));
  const theme = el("select", "lp-select");
  for (const themeName of ["midnight", "porcelain", "rose", "forest", "custom"]) {
    const option = el("option", "", themeName);
    option.value = themeName;
    option.selected = current.theme === themeName;
    theme.appendChild(option);
  }
  theme.addEventListener("change", () => commit((item) => {
    item.theme = theme.value;
    if (item.theme !== "custom")
      item.colors = themePalette(item.theme);
  }));
  const colors = el("div", "lp-color-grid");
  for (const [label, key] of [["Accent", "accent"], ["Bezel", "bezel"], ["Home top", "wallpaperPrimary"], ["Home bottom", "wallpaperSecondary"], ["Chat top", "chatPrimary"], ["Chat bottom", "chatSecondary"]])
    colors.appendChild(color(label, current.colors[key], (value) => commit((item) => {
      item.theme = "custom";
      item.colors[key] = value;
    })));
  const personaWallpapers = el("section", "lp-settings-section");
  personaWallpapers.append(wallpaperImageControl(`${active.name} home`, "persona-home", current.homeWallpaper, host.resolvedWallpapers.personaHome, {
    choose: host.chooseImage,
    change: (wallpaper) => commit((item) => {
      item.homeWallpaper = wallpaper;
    })
  }), wallpaperImageControl(`${active.name} chat`, "persona-chat", current.chatWallpaper, host.resolvedWallpapers.personaChat, {
    choose: host.chooseImage,
    change: (wallpaper) => commit((item) => {
      item.chatWallpaper = wallpaper;
    })
  }));
  const css = el("textarea", "lp-textarea lp-code-input");
  css.placeholder = "Persona-scoped Pocket CSS";
  css.value = current.customCss;
  css.addEventListener("input", () => commit((item) => {
    item.customCss = css.value;
  }, false));
  const apply = button("Apply persona CSS", "lp-button");
  apply.addEventListener("click", () => commit((item) => {
    item.customCss = css.value;
  }));
  card.append(theme, colors, personaWallpapers, css, apply);
  content.appendChild(card);
  return page;
}
function messages(host) {
  const settings = host.draft;
  const commit = (mutate) => {
    const next = clone(settings);
    mutate(next);
    host.update(next);
  };
  const { page, content } = host.page("Messages", "Generation and context bridge");
  const replies = el("section", "lp-card lp-settings-section");
  replies.append(el("div", "lp-eyebrow", "Reply behavior"), toggle("Decide on a reply after user DMs", settings.autoReplyAfterSend, (value) => commit((next) => {
    next.autoReplyAfterSend = value;
  })));
  const cadence = el("select", "lp-select");
  for (const [value, label] of [["instant", "Instant"], ["quick", "Quick"], ["natural", "Natural"], ["relaxed", "Relaxed"]]) {
    const option = el("option", "", label);
    option.value = value;
    option.selected = settings.replyCadence === value;
    cadence.appendChild(option);
  }
  cadence.addEventListener("change", () => commit((next) => {
    next.replyCadence = cadence.value;
  }));
  replies.append(el("div", "lp-label", "Outgoing message grace"), cadence, el("p", "lp-copy", "Messages sent during this window form one burst and receive one reply decision. Typing or focusing the composer holds the decision."));
  const ambient = el("select", "lp-select");
  for (const [value, label] of [["off", "Off"], ["sparse", "Sparse"], ["normal", "Normal"]]) {
    const option = el("option", "", label);
    option.value = value;
    option.selected = settings.ambientMessaging === value;
    ambient.appendChild(option);
  }
  ambient.addEventListener("change", () => commit((next) => {
    next.ambientMessaging = ambient.value;
  }));
  replies.append(el("div", "lp-label", "Ambient messages"), ambient);
  const context = el("section", "lp-card lp-settings-section");
  context.append(el("div", "lp-eyebrow", "Roleplay context"));
  const mode = el("select", "lp-select");
  for (const [value, label] of [["off", "Off"], ["recent", "Recent RP"], ["story", "Story context"], ["smart", "Smart"]]) {
    const option = el("option", "", label);
    option.value = value;
    option.selected = settings.roleplayContextMode === value;
    mode.appendChild(option);
  }
  mode.addEventListener("change", () => commit((next) => {
    next.roleplayContextMode = mode.value;
  }));
  const explanations = {
    off: "Off — phone replies use only compact actor identity and the Pocket thread.",
    recent: "Recent RP — includes a bounded tail of the committed Lumiverse transcript.",
    story: "Story — includes Pocket timeline, trackers, weather, and pinned notes without transcript lines.",
    smart: "Smart — combines Story with Recent RP when the conversation or current scene makes it relevant."
  };
  const explanation = el("p", "lp-copy", explanations[settings.roleplayContextMode]);
  mode.addEventListener("change", () => {
    explanation.textContent = explanations[mode.value];
  });
  const previewSelect = el("select", "lp-select");
  for (const conversation of host.state.conversations) {
    const option = el("option", "", conversation.title);
    option.value = conversation.id;
    previewSelect.appendChild(option);
  }
  const preview = button("Preview effective context", "lp-button lp-button-quiet");
  preview.disabled = !host.state.conversations.length;
  preview.addEventListener("click", () => host.send("lumiphone:preview_context", { conversationId: previewSelect.value }));
  context.append(mode, explanation, slider("Recent roleplay messages", settings.recentRoleplayMessages, 0, 20, 1, String, (value) => commit((next) => {
    next.recentRoleplayMessages = value;
  }), "Bounded committed host-chat context used by Recent RP and deterministic Smart mode."), previewSelect, preview);
  if (host.contextPreview) {
    const diagnostic = host.contextPreview;
    const details = el("details", "lp-context-preview");
    details.open = true;
    details.appendChild(el("summary", "", `Effective context · ~${diagnostic.estimatedTokens} tokens`));
    const stats = el("div", "lp-context-stats");
    for (const [label, value] of [
      ["Actor identity", `${diagnostic.actorIdentityChars} chars`],
      ["Scene snapshot", `${diagnostic.sceneSnapshot.chars} chars · ${diagnostic.sceneSnapshot.stale ? "stale" : "current"} · turn ${diagnostic.sceneSnapshot.sourceMessageIndex}`],
      ["Phone thread", `${diagnostic.phoneThread.count} messages · ${diagnostic.phoneThread.chars}/${diagnostic.phoneThread.budget} chars`],
      ["Recent RP", `${diagnostic.recentRoleplay.count} messages · ${diagnostic.recentRoleplay.chars}/${diagnostic.recentRoleplay.budget} chars`],
      ["Story", `${diagnostic.story.count} facts · ${diagnostic.story.chars}/${diagnostic.story.budget} chars`],
      ["Total", `${diagnostic.totalChars} chars`]
    ])
      stats.appendChild(row(label, value));
    const anchors = el("p", "lp-copy", `Authoritative latest: ${diagnostic.authoritativeLatest.id || "none"} (#${diagnostic.authoritativeLatest.index}) · Included latest: ${diagnostic.includedLatest.id || "none"} (#${diagnostic.includedLatest.index})`);
    details.append(stats, anchors);
    if (diagnostic.freshnessWarning)
      details.appendChild(el("p", "lp-warning", diagnostic.freshnessWarning));
    const advanced = el("details");
    advanced.append(el("summary", "", "Exact sanitized assembled block"));
    const exact = el("pre", "lp-context-exact", diagnostic.assembled);
    const copy = button("Copy", "lp-button lp-button-quiet");
    copy.addEventListener("click", () => void navigator.clipboard.writeText(diagnostic.assembled));
    advanced.append(exact, copy);
    details.appendChild(advanced);
    context.appendChild(details);
  }
  content.append(replies, context);
  return page;
}
function generation(host) {
  const settings = host.draft;
  const commit = (mutate) => {
    const next = clone(settings);
    mutate(next);
    host.update(next);
  };
  const { page, content } = host.page("Pocket Generation", "Text model source");
  const card = el("section", "lp-card lp-settings-section");
  const mode = el("select", "lp-select");
  for (const [value, label] of [["roleplay", "Follow roleplay model"], ["sidecar", "Pocket sidecar"]]) {
    const option = el("option", "", label);
    option.value = value;
    option.selected = settings.generationMode === value;
    mode.appendChild(option);
  }
  const connections = el("select", "lp-select");
  const none = el("option", "", "Choose a connection");
  none.value = "";
  connections.appendChild(none);
  for (const entry of host.generation?.connections || []) {
    const option = el("option", "", `${entry.name} · ${entry.model || entry.provider}`);
    option.value = entry.id;
    option.selected = settings.sidecarConnectionId === entry.id;
    connections.appendChild(option);
  }
  connections.disabled = settings.generationMode !== "sidecar";
  mode.addEventListener("change", () => {
    commit((next) => {
      next.generationMode = mode.value === "sidecar" ? "sidecar" : "roleplay";
    });
    host.rerender();
  });
  connections.addEventListener("change", () => {
    commit((next) => {
      next.sidecarConnectionId = connections.value;
      next.sidecarModelOverride = "";
    });
    host.rerender();
  });
  const modelMount = el("div", "lp-model-combobox");
  host.mountModelCombobox(modelMount, {
    value: settings.sidecarModelOverride,
    connection: { kind: "llm", id: settings.sidecarConnectionId || undefined },
    disabled: settings.generationMode !== "sidecar" || !settings.sidecarConnectionId,
    onChange: (value) => commit((next) => {
      next.sidecarModelOverride = value;
    })
  });
  const effective = host.generation?.effective;
  const effectiveModel = settings.generationMode === "sidecar" && settings.sidecarModelOverride ? `${settings.sidecarModelOverride} (override)` : effective?.model || "model not set";
  const effectiveCard = el("div", "lp-generation-effective");
  effectiveCard.dataset.pocketGenerationEffective = "true";
  effectiveCard.append(el("strong", "", effective?.name || "No effective connection"), el("span", "lp-copy", effective ? `${effective.provider} · ${effectiveModel}` : "Configure a Lumiverse LLM connection."));
  const test = button("Test Pocket generation", "lp-button");
  test.dataset.pocketGenerationTest = "true";
  test.disabled = !host.capabilities?.generation;
  test.addEventListener("click", () => host.send("lumiphone:test_generation", { generationMode: mode.value, sidecarConnectionId: connections.value, sidecarModelOverride: settings.sidecarModelOverride }));
  const diagnostic = el("p", "lp-copy", "Not tested yet.");
  diagnostic.dataset.pocketGenerationDiagnostic = "true";
  const run = [...host.generation?.history || []].reverse().find((entry) => entry.task === "connection-test");
  if (run)
    diagnostic.textContent = run.status === "started" ? "● Testing…" : run.status === "completed" ? `✓ Success · ${run.latencyMs ?? 0} ms · ${run.connectionName} / ${run.model}` : `Failed · ${run.error || "Unknown provider error"}`;
  card.append(el("div", "lp-label", "Generation mode"), mode, el("div", "lp-label", "Connection profile"), connections, el("div", "lp-label", "Model override"), modelMount, el("p", "lp-copy", "Leave blank to use the model configured on the selected connection profile."), effectiveCard, test, diagnostic);
  content.appendChild(card);
  return page;
}
function camera(host) {
  const settings = host.draft;
  const commit = (mutate, persist = true) => {
    const next = clone(settings);
    mutate(next);
    host.update(next, { persist });
  };
  const { page, content } = host.page("Camera & Swarm Studio", "Visual profile");
  const swarm = el("section", "lp-card lp-settings-section");
  swarm.append(el("div", "lp-eyebrow", "Swarm Studio"), toggle("Sync active profile", settings.useSwarmProfile, (value) => {
    const next = clone(settings);
    next.useSwarmProfile = value;
    host.update(next, { persist: false });
    host.send("lumiphone:save_preferences", { preferences: next });
  }));
  const status = el("p", "lp-copy", host.swarmProfile?.status === "connected" ? `Connected · ${host.swarmProfile.checkpoint || "profile macros resolved"}` : host.swarmProfile?.status === "error" ? `Error · ${host.swarmProfile.error}` : host.swarmProfile?.status === "disabled" ? "Swarm profile sync is disabled." : "Swarm Studio macros were not detected for this character/persona.");
  status.dataset.pocketSwarmStatus = "true";
  status.dataset.status = host.swarmProfile?.status || "not-detected";
  const refresh = button("Refresh profile", "lp-button");
  refresh.addEventListener("click", () => host.send("lumiphone:get_swarm_profile"));
  const diagnostics = el("details", "lp-swarm-diagnostics");
  diagnostics.appendChild(el("summary", "", "Macro diagnostics"));
  for (const name of ["char_base", "persona_base", "swarm_negative", "swarm_preset", "swarm_checkpoint", "swarm_aspect"]) {
    const field = host.swarmProfile?.fields?.[name];
    const row2 = el("div", "lp-generation-run", `${name} · ${field?.detected ? `${field.length} chars · ${field.preview}` : "empty"}`);
    row2.dataset.pocketSwarmMacro = name;
    diagnostics.appendChild(row2);
  }
  swarm.append(status, refresh, diagnostics);
  const manual = el("section", "lp-card lp-settings-section");
  manual.append(el("div", "lp-eyebrow", "Primitive / manual mode"));
  const positive = el("textarea", "lp-textarea");
  positive.placeholder = "Positive / character style";
  positive.value = settings.manualVisualProfile.positive;
  const negative = el("textarea", "lp-textarea");
  negative.placeholder = "Negative prompt";
  negative.value = settings.manualVisualProfile.negative;
  const model = el("input", "lp-input");
  model.placeholder = "Checkpoint override";
  model.value = settings.manualVisualProfile.model;
  const connection = el("input", "lp-input");
  connection.placeholder = "Image connection ID";
  connection.value = settings.manualVisualProfile.connectionId;
  const loras = el("textarea", "lp-textarea");
  loras.placeholder = "LoRA stack: name | weight";
  loras.value = settings.manualVisualProfile.loras.map((item) => `${item.name} | ${item.weight}`).join(`
`);
  const parameters = el("textarea", "lp-textarea lp-code-input");
  parameters.placeholder = "Provider parameters JSON";
  parameters.value = Object.keys(settings.manualVisualProfile.parameters).length ? JSON.stringify(settings.manualVisualProfile.parameters, null, 2) : "";
  for (const control of [positive, negative, model, connection, loras, parameters])
    control.addEventListener("input", () => commit((next) => {
      next.manualVisualProfile.positive = positive.value;
      next.manualVisualProfile.negative = negative.value;
      next.manualVisualProfile.model = model.value;
      next.manualVisualProfile.connectionId = connection.value;
    }, false));
  const apply = button("Apply manual profile", "lp-button");
  apply.addEventListener("click", () => {
    let parsed = {};
    try {
      parsed = parameters.value.trim() ? JSON.parse(parameters.value) : {};
    } catch {
      host.showError("Provider parameters must be valid JSON.");
      return;
    }
    commit((next) => {
      next.manualVisualProfile.positive = positive.value.trim();
      next.manualVisualProfile.negative = negative.value.trim();
      next.manualVisualProfile.model = model.value.trim();
      next.manualVisualProfile.connectionId = connection.value.trim();
      next.manualVisualProfile.loras = loras.value.split(`
`).flatMap((line) => {
        const [name, raw] = line.split("|").map((part) => part.trim());
        if (!name)
          return [];
        const weight = Number(raw);
        return [{ name, weight: Number.isFinite(weight) ? weight : 1 }];
      });
      next.manualVisualProfile.parameters = parsed;
    });
  });
  manual.append(positive, negative, model, connection, loras, parameters, apply);
  content.append(swarm, manual);
  return page;
}
function notifications(host) {
  const settings = host.draft;
  const commit = (mutate) => {
    const next = clone(settings);
    mutate(next);
    host.update(next);
  };
  const { page, content } = host.page("Notifications", "Device-wide behavior");
  const card = el("section", "lp-card lp-settings-section");
  card.append(toggle("Message notifications", settings.notifyMessages, (value) => commit((next) => {
    next.notifyMessages = value;
  })), toggle("Contact notifications", settings.notifyContacts, (value) => commit((next) => {
    next.notifyContacts = value;
  })), toggle("Tracker notifications", settings.notifyTrackers, (value) => commit((next) => {
    next.notifyTrackers = value;
  })), toggle("Show notification previews", settings.notificationPreviews, (value) => commit((next) => {
    next.notificationPreviews = value;
  })), toggle("Notification sounds", settings.notificationSounds, (value) => commit((next) => {
    next.notificationSounds = value;
  }), "Reserved for supported host audio surfaces."), toggle("System push notifications", settings.pushNotifications, (value) => commit((next) => {
    next.pushNotifications = value;
  })));
  content.appendChild(card);
  return page;
}
function permissions(host) {
  const { page, content } = host.page("Permissions", "Lumiverse access");
  const grid = el("div", "lp-permission-grid");
  const caps = host.capabilities;
  for (const [label, granted] of [["Generation", caps?.generation], ["Model tools", caps?.tools], ["Prompt memory", caps?.interceptor], ["Gallery", caps?.images], ["Remote images", caps?.corsProxy], ["Camera", caps?.imageGen], ["Floating phone", caps?.panels], ["Characters", caps?.characters], ["Personas", caps?.personas], ["Scene sync", caps?.sceneSync], ["Push", caps?.push]]) {
    const cell = el("div", "lp-permission", label);
    cell.dataset.granted = String(Boolean(granted));
    grid.appendChild(cell);
  }
  const manage = button("Request or update permissions", "lp-button");
  manage.addEventListener("click", () => host.requestPermissions());
  content.append(grid, manage);
  return page;
}
function data(host) {
  const { page, content } = host.page("Data & Backup", "This roleplay and this device");
  const card = el("section", "lp-card lp-settings-section");
  card.append(el("p", "lp-copy", "Exports include this roleplay phone and device preferences. Imports are validated into the current chat/character scope."));
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
    if (window.confirm("Reset Pocket device preferences? Roleplay data will remain."))
      host.send("lumiphone:reset_preferences");
  });
  card.append(exportButton, importButton, file, resetCurrent, resetAll, resetPrefs);
  content.appendChild(card);
  return page;
}
function renderSettingsView(host) {
  if (!host.section)
    return categories(host);
  if (host.section === "appearance")
    return appearance(host);
  if (host.section === "persona")
    return persona(host);
  if (host.section === "messages")
    return messages(host);
  if (host.section === "generation")
    return generation(host);
  if (host.section === "camera")
    return camera(host);
  if (host.section === "notifications")
    return notifications(host);
  if (host.section === "permissions")
    return permissions(host);
  if (host.section === "data")
    return data(host);
  return categories(host);
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
function toggle2(labelText, initial) {
  const row2 = el("div", "lp-card lp-row-between");
  const copy = el("div");
  copy.appendChild(el("div", "lp-title", labelText));
  const control = button("", "lp-toggle");
  control.setAttribute("aria-pressed", String(initial));
  control.setAttribute("aria-label", labelText);
  control.addEventListener("click", () => control.setAttribute("aria-pressed", String(control.getAttribute("aria-pressed") !== "true")));
  row2.append(copy, control);
  return { row: row2, button: control };
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
  const { page, content } = host.page("Trackers", "Live roleplay state", { label: "Add", callback: () => host.select("__template:9", "config") });
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
  const { page, content } = host.page(tracker.label, targetLabel(tracker.target), { label: "⚙", callback: () => host.select(tracker.id, "config"), ariaLabel: "Tracker settings" });
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
    const row2 = el("div", "lp-tracker-operation-row");
    for (const [operation, label] of [["subtract", "−"], ["add", "+"], ["set", "Set"]]) {
      const control = button(label);
      control.addEventListener("click", () => host.send("lumiphone:action", { action: "tracker", payload: { trackerId: tracker.id, operation, amount: Number(amount.value), reason: "Changed in Pocket" } }));
      row2.appendChild(control);
    }
    const reset = button("Reset", "lp-button lp-button-quiet");
    reset.addEventListener("click", () => host.send("lumiphone:action", { action: "tracker", payload: { trackerId: tracker.id, operation: "reset", reason: "Reset in Pocket" } }));
    operations.append(amount, row2, reset);
  }
  content.appendChild(operations);
  const history = el("section", "lp-tracker-history");
  history.appendChild(el("div", "lp-eyebrow", `History · last ${tracker.history.length}`));
  for (const entry of [...tracker.history].reverse()) {
    const row2 = el("div", "lp-card lp-history-row");
    row2.append(el("strong", "", `${entry.previous} → ${entry.next}`), el("span", "lp-copy", `${entry.operation} · ${entry.source}${entry.reason ? ` · ${entry.reason}` : ""}`), el("time", "lp-copy", entry.roleplayAt || entry.createdAt));
    history.appendChild(row2);
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
  let saveTracker = () => {};
  const { page, content } = host.page(current ? "Tracker Settings" : "New Tracker", "Configuration", { label: "Save", callback: () => saveTracker() });
  if (!current) {
    const templateField = selectField("Template", TRACKER_TEMPLATES.map((entry, index) => [String(index), `${entry.group} · ${entry.name}`]), String(templateIndex));
    templateField.select.addEventListener("change", () => host.select(`__template:${templateField.select.value}`, "config", true));
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
  const color2 = el("input", "lp-color-input");
  color2.type = "color";
  color2.value = /^#[0-9a-f]{6}$/i.test(String(source.color || "")) ? String(source.color) : host.accent;
  const colorRow = el("label", "lp-card lp-row-between");
  colorRow.append(el("span", "lp-title", "Tracker color"), color2);
  const bands = el("textarea", "lp-textarea");
  bands.placeholder = "Semantic bands: min | max | label | #color";
  bands.value = (source.bands || []).map((band) => `${band.min} | ${band.max} | ${band.label} | ${band.color}`).join(`
`);
  const visible = toggle2("Visible in model context", source.visibleToModel !== false);
  const writable = toggle2("Allow model changes", source.allowModelWrite === true);
  const configFields = el("div", "lp-tracker-config-fields");
  configFields.append(label.label, key.label, kind.label, presentation.label, value.label, initial.label, min.label, max.label, unit.label, state.label, states, targetType.label, targetId.label, targetName.label, mode.label, clock.label, rate.label, colorRow, bands, visible.row, writable.row);
  content.appendChild(configFields);
  saveTracker = () => {
    const parsedBands = bands.value.split(`
`).flatMap((line) => {
      const [rawMin, rawMax, bandLabel, bandColor] = line.split("|").map((part) => part.trim());
      if (!bandLabel || !Number.isFinite(Number(rawMin)) || !Number.isFinite(Number(rawMax)))
        return [];
      return [{ min: Number(rawMin), max: Number(rawMax), label: bandLabel, color: /^#[0-9a-f]{6}$/i.test(bandColor) ? bandColor : color2.value }];
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
      color: color2.value,
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
  };
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

// src/domain/contacts.ts
function contactAvatar(contact) {
  return contact.avatarOverrideUrl || contact.sourceAvatarUrl || contact.avatarUrl;
}
function contactAccent(contact) {
  return contact.colorMode === "source" && contact.sourceAccent ? contact.sourceAccent : contact.accent;
}

// src/frontend/apps/messages.ts
var PAUSE_COPY = {
  ended: "stopped responding.",
  busy: "is busy right now.",
  away: "went unavailable.",
  sleeping: "went offline for the night.",
  unknown: "stopped responding."
};
var LOCAL_COPY = {
  in_scene: "is currently with you.",
  arrived: "is here now.",
  took_action: "continued this in the main conversation.",
  continued_in_person: "continued this in person."
};
function conversationTitle(state, conversation) {
  if (conversation.kind === "group")
    return conversation.title || "Group";
  return state.contacts.find((entry) => entry.id === conversation.participantContactIds[0])?.name || conversation.title || conversation.messages.at(-1)?.senderName || "Conversation";
}
function groupEditor(host, conversation) {
  let saveGroup = () => {};
  const { page, content } = host.page(conversation ? "Group Details" : "New Group", "Choose at least two contacts", { label: "Save", callback: () => saveGroup() });
  const title = el("input", "lp-input");
  title.placeholder = "Group name";
  title.value = conversation?.title || "";
  const choices = el("div", "lp-contact-checklist");
  const selected = new Set(conversation?.participantContactIds || []);
  for (const contact of host.state.contacts) {
    const row2 = el("label", "lp-card lp-row-between");
    const copy = el("span");
    copy.append(el("strong", "", contact.name), el("span", "lp-copy", contact.role));
    const checkbox = el("input");
    checkbox.type = "checkbox";
    checkbox.value = contact.id;
    checkbox.checked = selected.has(contact.id);
    row2.append(copy, checkbox);
    choices.appendChild(row2);
  }
  saveGroup = () => {
    const participantContactIds = [...choices.querySelectorAll("input:checked")].map((entry) => entry.value);
    host.send(conversation ? "lumiphone:update_conversation" : "lumiphone:create_conversation", {
      conversationId: conversation?.id,
      title: title.value.trim(),
      participantContactIds
    });
  };
  content.append(title, choices);
  if (conversation) {
    const remove = button("Delete group", "lp-button lp-button-danger");
    remove.addEventListener("click", () => host.send("lumiphone:delete", { kind: "conversation", id: conversation.id }));
    content.appendChild(remove);
  }
  return page;
}
function renderMessagesView(host) {
  const selectedConversation = host.state.conversations.find((item) => item.id === host.selectedConversationId) || null;
  if (host.selectedView === "new-group")
    return groupEditor(host, null);
  if (selectedConversation?.kind === "group" && host.selectedView === "group-detail")
    return groupEditor(host, selectedConversation);
  if (!selectedConversation) {
    const conversations = [...host.state.conversations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const { page: page2, content } = host.page("Messages", `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`, {
      label: "New Group",
      callback: () => host.selectConversation("", "new-group"),
      enabled: host.state.contacts.length >= 2
    });
    for (const conversation2 of conversations) {
      const card = el("div", "lp-card");
      card.dataset.clickable = "true";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      const row2 = el("div", "lp-row");
      const titleText2 = conversationTitle(host.state, conversation2);
      const avatar = el("div", "lp-avatar", conversation2.kind === "group" ? String(conversation2.participantContactIds.length) : titleText2.slice(0, 1).toUpperCase());
      const directContact2 = conversation2.kind === "direct" ? host.state.contacts.find((entry) => entry.id === conversation2.participantContactIds[0]) : null;
      if (directContact2 && contactAvatar(directContact2)) {
        const image = el("img");
        image.src = contactAvatar(directContact2);
        image.alt = "";
        avatar.replaceChildren(image);
      }
      const latest = conversation2.messages.at(-1);
      const copy = el("div", "lp-grow");
      const nameRow = el("div", "lp-row-between");
      nameRow.append(el("h3", "lp-title", titleText2), el("span", "lp-copy", latest ? formatTime(latest.createdAt) : ""));
      copy.append(nameRow, el("p", "lp-copy", latest ? `${conversation2.kind === "group" && latest.sender === "contact" ? `${latest.senderName}: ` : ""}${latest.text}` : "Start a conversation"));
      row2.append(avatar, copy);
      if (conversation2.unread)
        row2.appendChild(el("span", "lp-unread", String(conversation2.unread)));
      card.appendChild(row2);
      const open = () => host.selectConversation(conversation2.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
      content.appendChild(card);
    }
    if (!conversations.length)
      content.appendChild(host.empty("No conversations yet", "Open Contacts to message a character, Council member, or Pocket NPC."));
    return page2;
  }
  const conversation = selectedConversation;
  const titleText = conversationTitle(host.state, conversation);
  const page = el("div", "lp-thread");
  const nav = el("header", "lp-nav");
  const back = button("‹ Back", "lp-nav-action");
  back.addEventListener("click", () => host.back());
  const title = el("div", "lp-nav-title", titleText);
  title.appendChild(el("span", "lp-nav-subtitle", conversation.kind === "group" ? `${conversation.participantContactIds.length} contacts` : "Direct message"));
  const info = button("Info", "lp-nav-action");
  info.addEventListener("click", () => {
    if (conversation.kind === "group")
      host.selectConversation(conversation.id, "group-detail");
    else
      host.openContact(conversation.participantContactIds[0]);
  });
  nav.append(back, title, info);
  const busy = host.busyConversations.get(conversation.id);
  const replyBusy = Boolean(busy);
  const directContact = conversation.kind === "direct" ? host.state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]) : null;
  const scenePresent = Boolean(directContact?.presence.inScene);
  const bubbles = el("div", "lp-bubbles");
  bubbles.dataset.pocketThread = conversation.id;
  for (const message of conversation.messages) {
    const bubble = el("div", "lp-bubble");
    bubble.dataset.messageId = message.id;
    bubble.dataset.selected = String(message.id === host.selectedMessageId);
    bubble.dataset.sender = message.sender;
    if (message.sender === "contact")
      bubble.style.setProperty("--message-accent", message.senderAccent || (directContact ? contactAccent(directContact) : ""));
    if (conversation.kind === "group" && message.sender === "contact")
      bubble.appendChild(el("strong", "lp-bubble-sender", message.senderName));
    bubble.append(document.createTextNode(message.text), el("span", "lp-bubble-time", `${formatTime(message.createdAt)} · ${message.status}`));
    if (message.generation) {
      const retry = button("Retry", "lp-bubble-action");
      retry.type = "button";
      retry.setAttribute("aria-label", `Retry message from ${message.senderName}`);
      retry.addEventListener("click", () => host.send("lumiphone:retry_message", { conversationId: conversation.id, messageId: message.id }));
      const generationInfo = button("Generation info", "lp-bubble-action");
      generationInfo.type = "button";
      generationInfo.addEventListener("click", () => host.showGenerationInfo(message));
      bubble.append(retry, generationInfo);
    }
    bubbles.appendChild(bubble);
  }
  if (busy?.phase === "checking") {
    const checking = el("div", "lp-conversation-status", "Checking for reply…");
    checking.setAttribute("role", "status");
    bubbles.appendChild(checking);
  } else if (replyBusy) {
    const pending = el("div", "lp-bubble lp-bubble-pending");
    pending.dataset.sender = "contact";
    pending.setAttribute("role", "status");
    pending.setAttribute("aria-label", "Contact is typing");
    const dots = el("span", "lp-typing-dots");
    dots.append(el("i"), el("i"), el("i"));
    pending.appendChild(dots);
    bubbles.appendChild(pending);
  }
  const availability = scenePresent && conversation.availability.state !== "local" ? { state: "local", reason: "in_scene" } : conversation.availability;
  if (!replyBusy && (availability.state !== "remote" || conversation.pause)) {
    const reason = availability.state === "local" ? LOCAL_COPY[availability.reason] : availability.state === "arriving" ? "is on the way." : PAUSE_COPY[availability.state === "paused" ? availability.reason : conversation.pause.reason];
    const banner = el("div", "lp-conversation-status", `${directContact?.name || titleText} ${reason}`);
    banner.dataset.pauseReason = availability.state === "local" ? availability.reason : availability.state === "arriving" ? "arriving" : availability.state === "paused" ? availability.reason : conversation.pause.reason;
    bubbles.appendChild(banner);
  }
  if (!conversation.messages.length)
    bubbles.appendChild(host.empty("Say hello", "This thread is private to this Pocket roleplay state."));
  if (availability.state === "local" && !host.manualOverride) {
    const localActions = el("div", "lp-local-actions");
    const relay = [...host.state.relays].reverse().find((entry) => entry.conversationId === conversation.id);
    const pendingRelay = relay?.status === "pending" ? relay : undefined;
    const continuing = pendingRelay?.continuation.state === "launching" || pendingRelay?.continuation.state === "accepted" || pendingRelay?.continuation.state === "started";
    const retrying = pendingRelay?.continuation.state === "blocked" || pendingRelay?.continuation.state === "failed" || pendingRelay?.continuation.state === "stopped";
    const status = continuing ? pendingRelay?.continuation.state === "started" ? "Roleplay generation started…" : pendingRelay?.continuation.state === "accepted" ? "Host accepted the continuation…" : "Requesting roleplay continuation…" : retrying ? pendingRelay?.continuation.error || "Continuation paused — retry when ready." : "Continue in main conversation";
    const roleplay = button(retrying ? "Retry continuation" : "Return to roleplay", "lp-button");
    roleplay.disabled = continuing;
    roleplay.addEventListener("click", () => host.returnToRoleplay());
    const anyway = button("Message anyway", "lp-button lp-button-quiet");
    anyway.addEventListener("click", () => host.messageAnyway(conversation.id));
    localActions.append(el("strong", "", status), roleplay, anyway);
    if (relay?.timelineEventId) {
      const timeline = button("View Timeline handoff", "lp-button lp-button-quiet");
      timeline.addEventListener("click", () => host.openTimeline(relay.timelineEventId));
      localActions.appendChild(timeline);
    }
    if (pendingRelay) {
      const continuation = pendingRelay.continuation;
      const details = el("details", "lp-channel-diagnostic");
      const permissions2 = continuation.permissions ? `chat mutation ${continuation.permissions.chatMutation ? "granted" : "missing"} · generation ${continuation.permissions.generation ? "granted" : "missing"}` : "not checked";
      const rows = [
        `State: ${continuation.state}`,
        `Invoked: ${continuation.invokedAt || "not yet"}`,
        `Permissions: ${permissions2}`,
        `Method: ${continuation.method || "not called"}`,
        `Host accepted: ${continuation.hostAcceptedAt || "no"}`,
        `Generation event: ${continuation.generationStartedAt || "not observed"}`,
        `Generation ID: ${continuation.generationId || "none"}`,
        continuation.error ? `Error: ${continuation.error}` : ""
      ].filter(Boolean);
      const diagnostics = el("div", "lp-settings-section");
      for (const row2 of rows)
        diagnostics.appendChild(el("span", "lp-copy", row2));
      details.append(el("summary", "", "Continuation generation info"), diagnostics);
      localActions.appendChild(details);
    }
    if (conversation.lastDecision) {
      const diagnostic = el("details", "lp-channel-diagnostic");
      const decision = conversation.lastDecision;
      diagnostic.append(el("summary", "", "Channel decision"), el("span", "lp-copy", `${decision.rawAction} → ${decision.normalizedAction}${decision.reason ? ` · ${decision.reason}` : ""}${decision.normalizationReason ? ` · ${decision.normalizationReason}` : ""}`));
      localActions.appendChild(diagnostic);
    }
    page.append(nav, bubbles, localActions);
    return page;
  }
  const compose = el("form", "lp-compose");
  const sparkle = scenePresent || conversation.pause ? button("⋯", "lp-button lp-button-icon lp-manual-reply") : host.iconButton("sparkle", "Generate one contact reply");
  sparkle.setAttribute("aria-label", scenePresent ? "Manually generate a reply while contact is here" : conversation.pause ? "Manually generate a reply in paused conversation" : "Generate one contact reply");
  sparkle.title = scenePresent ? "Manual reply — this contact is currently with you" : conversation.pause ? "Manual reply — conversation is paused" : "Generate one contact reply";
  sparkle.disabled = !host.generationAvailable || replyBusy;
  const speaker = el("select", "lp-speaker-select");
  if (conversation.kind === "group") {
    const auto = el("option", "", "Auto speaker");
    auto.value = "auto";
    speaker.appendChild(auto);
    for (const contactId of conversation.participantContactIds) {
      const contact = host.state.contacts.find((entry) => entry.id === contactId);
      if (!contact)
        continue;
      const option = el("option", "", contact.name);
      option.value = contact.id;
      speaker.appendChild(option);
    }
    speaker.setAttribute("aria-label", "Reply speaker");
  } else
    speaker.hidden = true;
  sparkle.addEventListener("click", () => host.generateReply(conversation.id, conversation.kind === "group" ? speaker.value : conversation.participantContactIds[0]));
  const textarea = el("textarea", "lp-textarea");
  textarea.rows = 1;
  textarea.placeholder = "Message…";
  textarea.value = host.draft;
  textarea.dataset.pocketComposer = conversation.id;
  const resizeComposer = () => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 112 ? "auto" : "hidden";
  };
  textarea.addEventListener("focus", () => host.composerState(conversation.id, true));
  textarea.addEventListener("input", () => {
    host.updateDraft(conversation.id, textarea.value);
    host.composerState(conversation.id, true);
    resizeComposer();
  });
  textarea.addEventListener("blur", () => host.composerState(conversation.id, false));
  const submit = host.iconButton("send", "Send message");
  submit.type = "submit";
  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing)
      return;
    event.preventDefault();
    compose.requestSubmit();
  });
  compose.append(sparkle, speaker, textarea, submit);
  compose.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = inputValue(textarea);
    if (!message)
      return;
    host.send("lumiphone:action", { action: "message", payload: { conversationId: conversation.id, text: message, sender: "persona", explicitRemoteOverride: host.manualOverride } });
    textarea.value = "";
    host.updateDraft(conversation.id, "");
    resizeComposer();
  });
  page.append(nav, bubbles, compose);
  requestAnimationFrame(() => {
    resizeComposer();
    const selected = host.selectedMessageId ? bubbles.querySelector(`[data-message-id="${CSS.escape(host.selectedMessageId)}"]`) : null;
    if (selected)
      selected.scrollIntoView({ block: "center" });
    else
      bubbles.scrollTop = bubbles.scrollHeight;
  });
  return page;
}

// src/frontend/apps/contacts.ts
function avatar(contact) {
  const node = el("div", "lp-avatar", contact.name.slice(0, 1).toUpperCase());
  node.style.setProperty("--contact-accent", contactAccent(contact));
  if (contactAvatar(contact)) {
    const image = el("img");
    image.src = contactAvatar(contact);
    image.alt = "";
    node.replaceChildren(image);
  }
  return node;
}
function contactEditor(host, contact) {
  let saveContact = () => {};
  const { page, content } = host.page(contact ? "Contact Settings" : "New Contact", contact?.source.kind || "Pocket NPC", { label: "Save", callback: () => saveContact() });
  const name = el("input", "lp-input");
  name.placeholder = "Name";
  name.value = contact?.name || "";
  const role = el("input", "lp-input");
  role.placeholder = "Role";
  role.value = contact?.role || "";
  const description = el("textarea", "lp-textarea");
  description.placeholder = "Stable identity brief — role, personality, relationship, enduring traits";
  description.maxLength = 1200;
  description.value = contact?.identityBrief || contact?.description || "";
  const sceneNote = el("textarea", "lp-textarea");
  sceneNote.placeholder = "Current scene note — temporary state, objective, or reason they are here";
  sceneNote.maxLength = 600;
  sceneNote.value = contact?.sceneNote || "";
  const accent = el("input", "lp-color-input");
  accent.type = "color";
  accent.value = /^#[0-9a-f]{6}$/i.test(contact?.accent || "") ? contact.accent : "#8b7dff";
  const colorRow = el("label", "lp-card lp-row-between");
  colorRow.append(el("span", "lp-title", "Contact color"), accent);
  const colorMode = el("select", "lp-select");
  for (const [value, label] of [["pocket", "Pocket color"], ["source", contact?.sourceAccent ? "Inherit source color" : "Inherit source color (unavailable)"]]) {
    const option = el("option", "", label);
    option.value = value;
    option.selected = (contact?.colorMode || "pocket") === value;
    option.disabled = value === "source" && !contact?.sourceAccent;
    colorMode.appendChild(option);
  }
  const colorModeLabel = el("label", "lp-label", "Color source");
  colorModeLabel.appendChild(colorMode);
  const inScene = el("input");
  inScene.type = "checkbox";
  inScene.checked = contact?.presence.inScene || false;
  const sceneRow = el("label", "lp-card lp-row-between");
  sceneRow.append(el("span", "lp-title", "Here in current scene"), inScene);
  const pinned = el("input");
  pinned.type = "checkbox";
  pinned.checked = contact?.contextPolicy.pinned || false;
  const pinRow = el("label", "lp-card lp-row-between");
  pinRow.append(el("span", "lp-title", "Pin compact brief to model context"), pinned);
  const relevant = el("input");
  relevant.type = "checkbox";
  relevant.checked = contact?.generationPolicy.relevant ?? true;
  const relevantRow = el("label", "lp-card lp-row-between");
  relevantRow.append(el("span", "lp-title", "Relevant to Pocket generation"), relevant);
  const remote = el("input");
  remote.type = "checkbox";
  remote.checked = contact?.messagingPolicy.remoteEligible ?? true;
  const remoteRow = el("label", "lp-card lp-row-between");
  remoteRow.append(el("span", "lp-title", "Eligible for remote messages"), remote);
  const ambientHere = el("input");
  ambientHere.type = "checkbox";
  ambientHere.checked = contact?.messagingPolicy.allowAmbientInScene || false;
  const ambientHereRow = el("label", "lp-card lp-row-between");
  ambientHereRow.append(el("span", "lp-title", "Allow ambient texts while in scene"), ambientHere);
  saveContact = () => {
    if (!name.value.trim()) {
      host.showError("A contact needs a name.");
      return;
    }
    host.send("lumiphone:save_contact", { contact: {
      id: contact?.id,
      name: name.value.trim(),
      role: role.value.trim(),
      identityBrief: description.value.trim(),
      description: description.value.trim(),
      sceneNote: sceneNote.value.trim(),
      accent: accent.value,
      colorMode: colorMode.value,
      presence: { inScene: inScene.checked, lastSceneAt: inScene.checked ? new Date().toISOString() : contact?.presence.lastSceneAt || "" },
      contextPolicy: { pinned: pinned.checked },
      generationPolicy: { relevant: relevant.checked },
      messagingPolicy: {
        remoteEligible: remote.checked,
        allowAmbientInScene: ambientHere.checked,
        lastInitiatedMessageAt: contact?.messagingPolicy.lastInitiatedMessageAt || "",
        lastInitiatedRoleplayAt: contact?.messagingPolicy.lastInitiatedRoleplayAt || ""
      }
    } });
    host.select(contact?.id || "", "list");
  };
  content.append(name, role, description, sceneNote, colorRow, colorModeLabel, sceneRow, pinRow, relevantRow, remoteRow, ambientHereRow);
  if (contact) {
    if (contact.avatarOverrideUrl && contact.sourceAvatarUrl) {
      const sourcePhoto = button("Use source photo", "lp-button lp-button-quiet");
      sourcePhoto.addEventListener("click", () => host.send("lumiphone:set_contact_photo", { contactId: contact.id, useSource: true }));
      content.appendChild(sourcePhoto);
    }
    const remove = button("Delete contact", "lp-button lp-button-danger");
    remove.addEventListener("click", () => {
      host.send("lumiphone:delete", { kind: "contact", id: contact.id });
      host.select("", "list");
    });
    content.appendChild(remove);
  }
  return page;
}
function importView(host) {
  const { page, content } = host.page("Add Contact", "Character, Council, or Pocket NPC");
  const manual = el("section", "lp-card lp-contact-import");
  manual.appendChild(el("div", "lp-eyebrow", "Pocket NPC"));
  const description = el("textarea", "lp-textarea");
  description.placeholder = "Describe someone; Pocket will generate one compact contact profile.";
  description.maxLength = 2000;
  const generate = button("Generate NPC");
  const npcOperation = [...host.operations.values()].find((entry) => entry.task === "npc-contact" && entry.phase !== "complete" && entry.phase !== "error");
  generate.disabled = !host.capabilities?.generation || Boolean(npcOperation);
  generate.addEventListener("click", () => {
    if (!description.value.trim()) {
      host.showError("Describe the NPC first.");
      return;
    }
    host.send("lumiphone:generate_contact", { description: description.value.trim() });
  });
  const primitive = button("Create manually", "lp-button lp-button-quiet");
  primitive.addEventListener("click", () => host.select("", "new"));
  manual.append(description, generate, primitive);
  if (npcOperation) {
    const progress = el("div", "lp-operation-progress");
    progress.dataset.operationRequest = npcOperation.requestId;
    progress.dataset.phase = npcOperation.phase;
    progress.setAttribute("role", "status");
    const message = el("strong", "", npcOperation.message || "Generating contact…");
    message.dataset.operationMessage = "true";
    progress.append(el("span", "lp-indeterminate"), message);
    manual.appendChild(progress);
  }
  content.appendChild(manual);
  const grouped = new Map;
  for (const option of host.sources)
    grouped.set(option.kind, [...grouped.get(option.kind) || [], option]);
  for (const [kind, sources] of grouped) {
    const section = el("section", "lp-contact-source-section");
    section.appendChild(el("div", "lp-eyebrow", kind === "character" ? "Lumiverse Characters" : "Active Council"));
    for (const source of sources) {
      const row2 = el("div", "lp-card lp-row-between");
      const copy = el("div");
      copy.append(el("strong", "", source.name), el("span", "lp-copy", source.role));
      const add = button(source.importedContactId ? "Imported" : "Add", "lp-button lp-button-quiet");
      add.disabled = Boolean(source.importedContactId);
      add.addEventListener("click", () => host.send("lumiphone:import_contact", { kind: source.kind, sourceId: source.sourceId, itemId: source.itemId }));
      row2.append(copy, add);
      section.appendChild(row2);
    }
    content.appendChild(section);
  }
  if (!host.sources.length)
    content.appendChild(el("p", "lp-copy", "No importable Characters or active Council members were returned. Manual NPC contacts remain available."));
  return page;
}
function renderContactsView(host) {
  const contact = host.state.contacts.find((entry) => entry.id === host.selectedContactId) || null;
  if (host.selectedView === "import") {
    host.requestSources();
    return importView(host);
  }
  if (host.selectedView === "new")
    return contactEditor(host, null);
  if (contact && host.selectedView === "config")
    return contactEditor(host, contact);
  if (contact && host.selectedView === "detail") {
    const { page: page2, content: content2 } = host.page(contact.name, contact.role, { label: "Edit", callback: () => host.select(contact.id, "config") });
    const hero = el("div", "lp-card lp-contact-detail");
    hero.append(avatar(contact), el("h2", "lp-title", contact.name), el("p", "lp-copy", contact.identityBrief || contact.description || "No compact identity brief."));
    if (contact.sceneNote)
      hero.append(el("p", "lp-scene-note", contact.sceneNote));
    const source = contact.source.kind === "character" ? "Linked Character" : contact.source.kind === "council" ? "Linked Council member" : `Pocket NPC · ${contact.source.origin}`;
    hero.append(el("span", "lp-eyebrow", source));
    const presence = el("div", "lp-card");
    presence.append(el("div", "lp-title", contact.presence.inScene ? "Here now" : "Not in current scene"), el("p", "lp-copy", `${contact.contextPolicy.pinned ? "Pinned to model context" : "Included only while in scene"}${contact.presence.lastSceneAt ? ` · last scene ${formatDate(contact.presence.lastSceneAt)}` : ""}`), el("p", "lp-copy", `${contact.generationPolicy.relevant ? "Generation-relevant" : "Excluded from Pocket generation"} · ${contact.messagingPolicy.remoteEligible ? "Remote-message eligible" : "No remote messages"}${contact.messagingPolicy.allowAmbientInScene ? " · ambient override while here" : ""}`));
    const message = button("Message");
    message.addEventListener("click", () => host.openDirect(contact.id));
    content2.append(hero, presence);
    if (contact.source.kind !== "npc") {
      const profileOperation = [...host.operations.values()].find((entry) => entry.task === "profile-refresh" && entry.phase !== "complete" && entry.phase !== "error");
      const refresh = button("Refresh compact profile ✦", "lp-button lp-button-quiet");
      refresh.disabled = !host.capabilities?.generation || Boolean(profileOperation);
      refresh.addEventListener("click", () => host.send("lumiphone:refresh_contact_profile", { contactId: contact.id }));
      content2.appendChild(refresh);
      if (profileOperation) {
        const progress = el("div", "lp-operation-progress");
        progress.dataset.operationRequest = profileOperation.requestId;
        progress.dataset.phase = profileOperation.phase;
        progress.setAttribute("role", "status");
        const progressMessage = el("strong", "", profileOperation.message);
        progressMessage.dataset.operationMessage = "true";
        progress.append(el("span", "lp-indeterminate"), progressMessage);
        content2.appendChild(progress);
      }
    }
    content2.append(message);
    return page2;
  }
  const { page, content } = host.page("Contacts", `${host.state.contacts.length} people`, { label: "Add", callback: () => host.select("", "import") });
  const search = el("input", "lp-input");
  search.type = "search";
  search.placeholder = "Search contacts";
  const filters = el("div", "lp-chipbar");
  const all = button("All", "lp-chip");
  const here = button("Here", "lp-chip");
  const recent = button("Recent", "lp-chip");
  all.setAttribute("aria-pressed", "true");
  filters.append(all, here, recent);
  const sync = button("Sync current scene", "lp-button lp-button-quiet");
  const sceneOperation = [...host.operations.values()].find((entry) => entry.task === "scene-sync" && entry.phase !== "complete" && entry.phase !== "error");
  sync.disabled = !host.capabilities?.generation || !host.capabilities?.sceneSync || Boolean(sceneOperation);
  sync.addEventListener("click", () => host.send("lumiphone:sync_scene_contacts"));
  const snapshot = host.state.sceneSnapshot;
  const snapshotStatus = el("p", snapshot?.stale ? "lp-warning" : "lp-copy", !snapshot ? "No scene snapshot yet." : `${snapshot.stale ? "Scene snapshot is stale" : "Scene snapshot is current"} · ${snapshot.actors.length} actor${snapshot.actors.length === 1 ? "" : "s"} · source turn ${snapshot.sourceMessageIndex}`);
  const list = el("div", "lp-contact-list");
  const renderList = (filter = "all") => {
    list.replaceChildren();
    const query = search.value.trim().toLocaleLowerCase();
    const contacts = host.state.contacts.filter((entry) => {
      if (query && !`${entry.name} ${entry.role}`.toLocaleLowerCase().includes(query))
        return false;
      if (filter === "here")
        return entry.presence.inScene;
      if (filter === "recent")
        return Boolean(entry.presence.lastSceneAt);
      return true;
    }).sort((a, b) => Number(b.presence.inScene) - Number(a.presence.inScene) || Date.parse(b.presence.lastSceneAt || "0") - Date.parse(a.presence.lastSceneAt || "0"));
    for (const entry of contacts) {
      const row2 = button("", "lp-card lp-contact-row");
      const copy = el("div", "lp-grow");
      copy.append(el("strong", "", entry.name), el("span", "lp-copy", entry.role));
      row2.append(avatar(entry), copy, el("span", entry.presence.inScene ? "lp-presence" : "lp-presence lp-presence-away"));
      row2.addEventListener("click", () => host.select(entry.id, "detail"));
      list.appendChild(row2);
    }
    if (!contacts.length)
      list.appendChild(host.empty("No matching contacts", "Try another search or sync the current scene."));
  };
  let active = "all";
  const useFilter = (next) => {
    active = next;
    for (const chip of [all, here, recent])
      chip.setAttribute("aria-pressed", String(chip === { all, here, recent }[next]));
    renderList(active);
  };
  all.addEventListener("click", () => useFilter("all"));
  here.addEventListener("click", () => useFilter("here"));
  recent.addEventListener("click", () => useFilter("recent"));
  search.addEventListener("input", () => renderList(active));
  renderList();
  content.append(search, filters, sync, snapshotStatus);
  if (sceneOperation) {
    const progress = el("div", "lp-operation-progress");
    progress.dataset.operationRequest = sceneOperation.requestId;
    progress.dataset.phase = sceneOperation.phase;
    progress.setAttribute("role", "status");
    const message = el("strong", "", sceneOperation.message || "Syncing scene…");
    message.dataset.operationMessage = "true";
    progress.append(el("span", "lp-indeterminate"), message);
    content.appendChild(progress);
  }
  content.appendChild(list);
  return page;
}

// src/domain/notifications.ts
function activeNotifications(notifications2) {
  return notifications2.filter((entry) => !entry.dismissedAt);
}

// src/frontend/apps/notifications.ts
function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}
function notificationRow(host, notification) {
  const row2 = el("div", "lp-card lp-notification-row");
  row2.dataset.read = String(notification.read);
  row2.dataset.severity = notification.severity || "info";
  const open = button("", "lp-notification-open");
  const copy = el("span", "lp-grow");
  copy.append(el("strong", "", notification.title), el("span", "lp-copy", notification.body), el("time", "lp-copy", formatTime(notification.createdAt)));
  open.appendChild(copy);
  open.setAttribute("aria-label", `Open ${notification.title}`);
  open.addEventListener("click", () => {
    host.send("lumiphone:notification_mark_read", { notificationId: notification.id });
    host.navigate(notification.route || { app: notification.app });
  });
  const dismiss = button("×", "lp-notification-dismiss");
  dismiss.setAttribute("aria-label", `Dismiss ${notification.title}`);
  dismiss.addEventListener("click", () => host.send("lumiphone:notification_dismiss", { notificationId: notification.id }));
  row2.append(open, dismiss);
  return row2;
}
function renderNotificationsView(host) {
  const notifications2 = activeNotifications(host.notifications).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const unread = notifications2.filter((entry) => !entry.read).length;
  const { page, content } = host.page("Notification Center", unread ? `${unread} unread` : "All caught up", { label: notifications2.length ? "Clear" : "", enabled: Boolean(notifications2.length), callback: () => host.send("lumiphone:notifications_clear", { mode: "all" }) });
  if (notifications2.some((entry) => entry.read)) {
    const clearRead = button("Clear read notifications", "lp-button lp-button-quiet");
    clearRead.addEventListener("click", () => host.send("lumiphone:notifications_clear", { mode: "read" }));
    content.appendChild(clearRead);
  }
  const today = [];
  const earlier = [];
  const now = new Date;
  for (const entry of notifications2)
    (sameDay(new Date(entry.createdAt), now) ? today : earlier).push(entry);
  for (const [label, entries] of [["Today", today], ["Earlier", earlier]]) {
    if (!entries.length)
      continue;
    const group = el("section", "lp-notification-group");
    group.appendChild(el("div", "lp-eyebrow", label));
    for (const entry of entries)
      group.appendChild(notificationRow(host, entry));
    content.appendChild(group);
  }
  if (!notifications2.length)
    content.appendChild(el("p", "lp-notification-empty", "No notifications. Messages, trackers, notes, and timeline data remain in their apps."));
  return page;
}

// src/frontend/router.ts
function sameRoute(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

class PocketRouteHistory {
  entries = [];
  current = { app: "home" };
  navigate(routeInput, replace = false) {
    const route = normalizePocketRoute(routeInput);
    if (sameRoute(route, this.current))
      return this.current;
    if (!replace)
      this.entries.push(this.current);
    this.current = route;
    return route;
  }
  back() {
    this.current = this.entries.pop() || { app: "home" };
    return this.current;
  }
  home() {
    this.entries = [];
    this.current = { app: "home" };
    return this.current;
  }
  reset(route = { app: "home" }) {
    this.entries = [];
    this.current = normalizePocketRoute(route);
    return this.current;
  }
  get canGoBack() {
    return this.entries.length > 0 || this.current.app !== "home";
  }
}

// src/frontend/activity.ts
var ICONS = {
  message: "Message",
  "tracker-change": "Tracker",
  timeline: "Timeline",
  note: "Journal",
  contact: "Contact",
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
var EMPTY_RESOLVED_IMAGE = { url: "", status: "empty", sourceKind: "none", sourceLabel: "Theme gradient" };
var ICONS2 = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5h-5v-6H10v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.6A8 8 0 1 1 20.5 11.5Z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/></svg>',
  contacts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 8h5M18.5 5.5v5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4.5 18 4.7-4.7 3.1 3.1 2.2-2.2 5 5"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/></svg>',
  weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18.5h9a4 4 0 0 0 .4-8A6 6 0 0 0 6 12.5a3 3 0 0 0 2 6Z"/><path d="M8 5V3M4.5 7 3 5.5M11.5 7 13 5.5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3"/></svg>',
  trackers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2H10V21a1.8 1.8 0 0 0-1.1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1L4 17.1l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.9h-.2V10H3a1.8 1.8 0 0 0 1.6-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1L6.9 4l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 3V2.8h4V3a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1L20 6.9l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h.2V14h-.2a1.8 1.8 0 0 0-1.7 1Z"/></svg>',
  notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
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
  { app: "contacts", label: "Contacts", icon: "contacts" },
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
  dockVisibilityCleanup = null;
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
  settingsDraft = null;
  settingsSaveTimer = 0;
  activePersona = null;
  caps = null;
  swarmProfile = null;
  generation = null;
  resolvedWallpapers = {
    deviceHome: { ...EMPTY_RESOLVED_IMAGE },
    deviceChat: { ...EMPTY_RESOLVED_IMAGE },
    personaHome: { ...EMPTY_RESOLVED_IMAGE },
    personaChat: { ...EMPTY_RESOLVED_IMAGE }
  };
  contextPreview = null;
  personaPreview = null;
  operations = new Map;
  router = new PocketRouteHistory;
  gallery = { data: [], total: 0 };
  galleryScope = "chat";
  galleryActionButtons = new Map;
  pendingWallpaperTarget = null;
  selectedContactId = "";
  selectedContactView = "list";
  selectedConversationId = "";
  selectedConversationView = "thread";
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
  messageDrafts = new Map;
  manualMessageOverrides = new Set;
  contactSources = [];
  contactSourcesRequested = false;
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
  notificationTimer = 0;
  notificationIsland;
  customStyle;
  setupModalOpen = false;
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
    const island = button("", "lumiphone-island");
    island.setAttribute("aria-label", "Open Notification Center");
    island.addEventListener("click", () => this.openPocket({ app: "notifications" }));
    this.notificationIsland = island;
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
    this.customStyle = document.createElement("style");
    this.customStyle.dataset.pocketCustomCss = "true";
    this.shell.append(status, this.screen, homebar, this.alert, this.customStyle);
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
        this.home();
      else
        this.close();
    });
    this.installSwipeDismiss(status);
    this.installNotificationPull(status);
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
    window.clearTimeout(this.notificationTimer);
    window.clearTimeout(this.settingsSaveTimer);
    for (const cleanup of this.cleanups.splice(0)) {
      try {
        cleanup();
      } catch {}
    }
    this.widget?.destroy();
    this.mobileWidget?.destroy();
    this.releaseDockPanel();
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
    window.visualViewport?.addEventListener("scroll", resize);
    this.cleanups.push(() => window.visualViewport?.removeEventListener("scroll", resize));
    const focusin = (event) => {
      if (!this.expanded || this.handsetHost.dataset.fullscreen !== "true")
        return;
      this.resizeExpanded();
      const target = event.target instanceof HTMLElement ? event.target : null;
      window.setTimeout(() => {
        this.resizeExpanded();
        target?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }, 60);
    };
    this.shell.addEventListener("focusin", focusin);
    this.cleanups.push(() => this.shell.removeEventListener("focusin", focusin));
    const keydown = (event) => {
      if (!this.expanded)
        return;
      if (event.key === "Escape") {
        if (this.currentApp !== "home")
          this.back();
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
        startCollapsed: true,
        chromeless: true,
        centerContent: true
      });
      this.dockVisibilityCleanup = this.dockPanel.onVisibilityChange((visible) => {
        if (!visible && this.expanded && !calculatePhoneSurface(this.preferences.handsetScale).fullscreen) {
          this.expanded = false;
          this.shell.hidden = true;
          this.launcher.hidden = false;
        }
      });
      return this.dockPanel;
    } catch {
      this.dockPanel = null;
      return null;
    }
  }
  releaseDockPanel() {
    try {
      this.dockVisibilityCleanup?.();
    } catch {}
    this.dockVisibilityCleanup = null;
    try {
      this.dockPanel?.destroy();
    } catch {}
    this.dockPanel = null;
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
      this.releaseDockPanel();
      const mobile = this.ensureMobileWidget();
      if (!mobile)
        return false;
      if (this.handsetHost.parentElement !== mobile.root)
        mobile.root.replaceChildren(this.handsetHost);
      if (this.shell.parentElement !== this.handsetHost)
        this.handsetHost.replaceChildren(this.shell);
      this.handsetHost.dataset.fullscreen = "true";
      applyMobilePhoneSurface(mobile, 1);
      applyVisualViewportSurface(this.handsetHost);
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
    if (this.handsetHost.parentElement !== panel.root)
      panel.root.replaceChildren(this.handsetHost);
    if (this.shell.parentElement !== this.handsetHost)
      this.handsetHost.replaceChildren(this.shell);
    this.handsetHost.dataset.fullscreen = "false";
    clearVisualViewportSurface(this.handsetHost);
    if ("setSize" in panel && typeof panel.setSize === "function") {
      panel.setSize(desktopDockSize(this.preferences.handsetScale));
    }
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
    host.dataset.fullscreen = "false";
    this.drawer.root.appendChild(host);
    host.replaceChildren(this.shell);
    this.launcher.hidden = true;
    this.shell.hidden = false;
    this.expanded = true;
    this.render(true);
  }
  async requestPermissions() {
    try {
      await this.ctx.permissions.request([
        "ui_panels",
        "chats",
        "chat_mutation",
        "characters",
        "personas",
        "generation",
        "tools",
        "interceptor",
        "images",
        "image_gen",
        "push_notification"
      ], { reason: "Pocket uses these permissions for its launcher and handset, per-chat character state, generated text messages, user-requested scene contact sync, model actions, gallery, camera, and optional push notifications." });
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
  installNotificationPull(target) {
    let startY = 0;
    let active = false;
    target.addEventListener("pointerdown", (event) => {
      if (event.target?.closest("button,input,select,textarea,a"))
        return;
      startY = event.clientY;
      active = true;
    });
    target.addEventListener("pointerup", (event) => {
      if (!active)
        return;
      active = false;
      if (event.clientY - startY > 52)
        this.openPocket({ app: "notifications" });
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
  announceView() {
    this.send("lumiphone:view_state", { open: this.expanded, route: this.router.current });
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
      for (const conversationId of this.manualMessageOverrides) {
        const conversation = this.state.conversations.find((entry) => entry.id === conversationId);
        if (!conversation || conversation.availability.state !== "local")
          this.manualMessageOverrides.delete(conversationId);
      }
      this.preferences = normalizePreferences(payload.preferences || this.preferences);
      if (payload.reason === "import" || payload.reason === "reset_preferences" || payload.reason === "preferences")
        this.settingsDraft = structuredClone(this.preferences);
      this.caps = payload.capabilities || this.caps;
      this.swarmProfile = payload.swarmProfile || this.swarmProfile;
      this.generation = payload.generation || this.generation;
      if (payload.resolvedWallpapers)
        this.resolvedWallpapers = payload.resolvedWallpapers;
      if ("activePersona" in payload)
        this.activePersona = payload.activePersona || null;
      for (const activity of this.state.activities || [])
        this.queueActivityReceipt(activity);
      this.applyAppearance();
      this.updateBadge();
      this.announceView();
      if (payload.open)
        this.open();
      if (payload.reason === "chat_switched" && !this.state.setup.initialized && !this.state.setup.dismissed)
        this.showFirstChatSetup();
      const pending = this.pendingRoute;
      this.pendingRoute = null;
      if (pending)
        this.openPocket(pending);
      else if (this.expanded && this.currentApp === "settings")
        this.updateSettingsDiagnostics();
      else if (this.expanded)
        this.render(false);
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
    if (payload.type === "lumiphone:notification" && payload.notification) {
      this.showIncomingNotification(payload.notification);
      return;
    }
    if (payload.type === "lumiphone:generation_status" && payload.run) {
      const history = (this.generation?.history || this.preferences.generationHistory || []).filter((entry) => entry.requestId !== payload.run.requestId);
      history.push(payload.run);
      this.preferences.generationHistory = history.slice(-24);
      if (this.generation)
        this.generation.history = this.preferences.generationHistory;
      if (this.currentApp === "settings")
        this.updateSettingsDiagnostics();
      return;
    }
    if (payload.type === "lumiphone:context_preview" && payload.diagnostics) {
      this.contextPreview = payload.diagnostics;
      if (this.currentApp === "settings")
        this.render(false);
      return;
    }
    if (payload.type === "lumiphone:action_done" && payload.result?.trackerId && this.currentApp === "trackers" && this.selectedTrackerView === "config") {
      this.openPocket({ app: "trackers", trackerId: String(payload.result.trackerId), view: "detail" }, false);
      return;
    }
    if (payload.type === "lumiphone:pocket_persona_preview" && payload.persona) {
      this.personaPreview = payload.persona;
      if (this.currentApp === "settings")
        this.render(false);
      return;
    }
    if (payload.type === "lumiphone:pocket_persona_saved") {
      this.personaPreview = null;
      return;
    }
    if (payload.type === "lumiphone:operation_progress" && payload.requestId) {
      const operation = {
        task: payload.task,
        requestId: payload.requestId,
        phase: payload.phase,
        message: payload.message || "Working…"
      };
      this.operations.set(operation.requestId, operation);
      if (this.currentApp === "contacts" && !this.updateOperationProgress(operation))
        this.render(false);
      if (operation.phase === "complete")
        window.setTimeout(() => {
          this.operations.delete(operation.requestId);
          if (this.currentApp === "contacts")
            this.updateOperationProgress(null, operation.requestId);
        }, 1200);
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
        this.updateSettingsDiagnostics();
      return;
    }
    if (payload.type === "lumiphone:gallery") {
      this.gallery = { data: payload.data || [], total: Number(payload.total) || 0 };
      if (this.currentApp === "gallery")
        this.render(false);
      return;
    }
    if (payload.type === "lumiphone:gallery_action_done" && payload.requestId) {
      const pending = this.galleryActionButtons.get(payload.requestId);
      if (pending) {
        pending.button.disabled = false;
        pending.button.textContent = "✓ Done";
        window.setTimeout(() => {
          pending.button.textContent = pending.idle;
        }, 1400);
        this.galleryActionButtons.delete(payload.requestId);
      }
      this.showFeedback(payload.message || "Gallery action complete.");
      return;
    }
    if (payload.type === "lumiphone:contact_sources") {
      this.contactSources = Array.isArray(payload.sources) ? payload.sources : [];
      this.contactSourcesRequested = true;
      if (this.currentApp === "contacts")
        this.render(false);
      return;
    }
    if (payload.type === "lumiphone:conversation_opened" && payload.conversationId) {
      this.openPocket({ app: "messages", conversationId: payload.conversationId, view: "thread" });
      return;
    }
    if ((payload.type === "lumiphone:contact_created" || payload.type === "lumiphone:contact_saved") && payload.contactId) {
      this.contactSourcesRequested = false;
      this.openPocket({ app: "contacts", contactId: payload.contactId, view: "detail" });
      return;
    }
    if (payload.type === "lumiphone:swarm_profile") {
      this.swarmProfile = payload.profile;
      if (this.currentApp === "settings")
        this.updateSettingsDiagnostics();
      else if (this.currentApp === "camera")
        this.render(false);
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
        this.render(false);
      return;
    }
    if (payload.type === "lumiphone:message_progress") {
      const active = this.activeContext();
      if (payload.chatId !== active.chatId || payload.characterId !== active.characterId)
        return;
      if (payload.phase === "done")
        this.messageRequests.delete(payload.requestId);
      else
        this.messageRequests.set(payload.requestId, { conversationId: payload.conversationId, speakerContactId: payload.speakerContactId || payload.contactId, phase: payload.phase === "checking" ? "checking" : "pending" });
      if (this.currentApp === "messages")
        this.render(false);
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
        this.render(false);
      return;
    }
    if (payload.type === "lumiphone:camera_cancelled") {
      if (payload.requestId !== this.cameraRequestId)
        return;
      this.cameraBusy = false;
      this.cameraProgress = "Cancelled";
      if (this.currentApp === "camera")
        this.render(false);
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
      const operation = this.operations.get(payload.requestId);
      if (operation)
        this.operations.set(payload.requestId, { ...operation, phase: "error", message: payload.error || "Operation failed" });
      const galleryAction = this.galleryActionButtons.get(payload.requestId);
      if (galleryAction) {
        galleryAction.button.disabled = false;
        galleryAction.button.textContent = galleryAction.idle;
        this.galleryActionButtons.delete(payload.requestId);
      }
      this.showError(payload.error || "Pocket could not complete that action.");
      if (this.expanded)
        this.render(false);
    }
  }
  unreadCount() {
    if (!this.state)
      return 0;
    const notifications2 = this.state.notifications.filter((item) => !item.read && !item.dismissedAt).length;
    const messages2 = this.state.conversations.reduce((sum, conversation) => sum + conversation.unread, 0);
    return Math.min(999, Math.max(notifications2, messages2));
  }
  updateBadge() {
    const unread = this.unreadCount();
    this.launcherBadge.hidden = unread === 0;
    this.launcherBadge.textContent = unread > 99 ? "99+" : String(unread);
    this.drawer.setBadge(unread ? unread > 99 ? "99+" : String(unread) : null);
    const notificationUnread = this.state?.notifications.filter((entry) => !entry.read && !entry.dismissedAt).length || 0;
    this.notificationIsland.dataset.unread = String(notificationUnread > 0);
    this.notificationIsland.setAttribute("aria-label", notificationUnread ? `Open Notification Center, ${notificationUnread} unread` : "Open Notification Center");
  }
  updateOperationProgress(operation, requestId2 = operation?.requestId || "") {
    if (!requestId2)
      return false;
    const node = this.screen.querySelector(`[data-operation-request="${CSS.escape(requestId2)}"]`);
    if (!node)
      return false;
    if (!operation) {
      node.remove();
      return true;
    }
    const label = node.querySelector("[data-operation-message]");
    if (label)
      label.textContent = operation.message;
    node.dataset.phase = operation.phase;
    return true;
  }
  updateSettingsDiagnostics() {
    const generationNode = this.screen.querySelector("[data-pocket-generation-diagnostic]");
    if (generationNode) {
      const run = [...this.generation?.history || this.preferences.generationHistory || []].reverse().find((entry) => entry.task === "connection-test");
      generationNode.dataset.status = run?.status || "idle";
      generationNode.textContent = !run ? "Not tested yet." : run.status === "started" ? "● Testing…" : run.status === "completed" ? `✓ Success · ${run.latencyMs ?? 0} ms · ${run.connectionName} / ${run.model}` : `Failed · ${run.error || "Unknown provider error"}`;
      const testButton = this.screen.querySelector("[data-pocket-generation-test]");
      if (testButton)
        testButton.disabled = !this.caps?.generation || run?.status === "started";
    }
    const effectiveNode = this.screen.querySelector("[data-pocket-generation-effective]");
    if (effectiveNode) {
      const effective = this.generation?.effective;
      const title = effectiveNode.querySelector("strong");
      const detail2 = effectiveNode.querySelector("span");
      if (title)
        title.textContent = effective?.name || "No effective connection";
      const model = this.settingsDraft?.generationMode === "sidecar" && this.settingsDraft.sidecarModelOverride || effective?.model || "model not set";
      if (detail2)
        detail2.textContent = effective ? `${effective.provider} · ${model}` : "Configure a Lumiverse LLM connection.";
    }
    const swarmNode = this.screen.querySelector("[data-pocket-swarm-status]");
    if (swarmNode && this.swarmProfile) {
      swarmNode.dataset.status = this.swarmProfile.status;
      swarmNode.textContent = this.swarmProfile.status === "connected" ? `Connected · ${this.swarmProfile.checkpoint || "profile macros resolved"}` : this.swarmProfile.status === "disabled" ? "Swarm profile sync is disabled." : this.swarmProfile.status === "error" ? `Error · ${this.swarmProfile.error}` : "Swarm Studio macros were not detected for this character/persona.";
    }
    for (const row2 of this.screen.querySelectorAll("[data-pocket-swarm-macro]")) {
      const name = row2.dataset.pocketSwarmMacro;
      const field = this.swarmProfile?.fields?.[name];
      row2.textContent = `${name} · ${field?.detected ? `${field.length} chars · ${field.preview}` : "empty"}`;
    }
  }
  updatePreferences(next, options = {}) {
    const normalized = normalizePreferences(next);
    if (this.settingsDraft)
      Object.assign(this.settingsDraft, structuredClone(normalized));
    else
      this.settingsDraft = structuredClone(normalized);
    this.preferences = normalized;
    this.applyAppearance();
    if (options.resize)
      this.resizeExpanded();
    if (options.persist === false)
      return;
    window.clearTimeout(this.settingsSaveTimer);
    this.settingsSaveTimer = window.setTimeout(() => {
      this.send("lumiphone:save_preferences", { preferences: this.settingsDraft || this.preferences });
    }, 240);
  }
  showIncomingNotification(notification) {
    if (!this.expanded) {
      this.launcher.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 360 });
      return;
    }
    window.clearTimeout(this.notificationTimer);
    this.shell.querySelector(".lp-floating-notification")?.remove();
    const toast = button("", "lp-floating-notification");
    toast.setAttribute("role", "status");
    toast.append(icon(notification.app), el("span", "lp-grow", ""), el("span", "lp-home-activity-arrow", "›"));
    const copy = toast.children[1];
    copy.append(el("strong", "", notification.title), el("span", "", notification.body));
    toast.addEventListener("click", () => {
      this.send("lumiphone:notification_mark_read", { notificationId: notification.id });
      this.openPocket(notification.route || { app: notification.app });
      toast.remove();
    });
    this.shell.appendChild(toast);
    this.notificationTimer = window.setTimeout(() => toast.remove(), 6000);
  }
  applyAppearance() {
    const settings = this.settingsDraft || this.preferences;
    const persona2 = this.activePersona ? settings.personaAppearance[this.activePersona.id] : null;
    const appearance2 = persona2?.enabled ? persona2 : settings;
    this.shell.dataset.theme = appearance2.theme;
    this.shell.style.setProperty("--lp-accent", appearance2.colors.accent);
    this.shell.style.setProperty("--lp-bezel", appearance2.colors.bezel);
    this.shell.style.setProperty("--lp-bg", appearance2.colors.background);
    this.shell.style.setProperty("--lp-surface", appearance2.colors.surface);
    this.shell.style.setProperty("--lp-text", appearance2.colors.text);
    const homeWallpaper = wallpaperCss(appearance2.colors.wallpaperPrimary, appearance2.colors.wallpaperSecondary);
    const chatWallpaper = wallpaperCss(appearance2.colors.chatPrimary, appearance2.colors.chatSecondary);
    const homeSetting = persona2?.enabled && persona2.homeWallpaper.source ? persona2.homeWallpaper : settings.homeWallpaper;
    const chatSetting = persona2?.enabled && persona2.chatWallpaper.source ? persona2.chatWallpaper : settings.chatWallpaper;
    const homeImage = (persona2?.enabled && persona2.homeWallpaper.source ? this.resolvedWallpapers.personaHome : this.resolvedWallpapers.deviceHome).url;
    const chatImage = (persona2?.enabled && persona2.chatWallpaper.source ? this.resolvedWallpapers.personaChat : this.resolvedWallpapers.deviceChat).url;
    const imageLayer = (url, setting, gradient) => url ? `linear-gradient(rgba(7,6,11,${setting.scrim}),rgba(7,6,11,${setting.scrim})),url(${JSON.stringify(url)}),${gradient}` : gradient;
    this.shell.style.setProperty("--lp-wallpaper", imageLayer(homeImage, homeSetting, homeWallpaper));
    this.shell.style.setProperty("--lp-chat-wallpaper", imageLayer(chatImage, chatSetting, chatWallpaper));
    this.shell.style.setProperty("--lp-home-wallpaper-size", homeSetting.fit === "stretch" ? "100% 100%" : homeSetting.fit);
    this.shell.style.setProperty("--lp-home-wallpaper-position", `${homeSetting.focalX * 100}% ${homeSetting.focalY * 100}%`);
    this.shell.style.setProperty("--lp-chat-wallpaper-size", chatSetting.fit === "stretch" ? "100% 100%" : chatSetting.fit);
    this.shell.style.setProperty("--lp-chat-wallpaper-position", `${chatSetting.focalX * 100}% ${chatSetting.focalY * 100}%`);
    this.shell.style.setProperty("--pocket-ui-scale", String(settings.uiScale));
    this.shell.style.setProperty("--lp-animation-ms", `${settings.reducedMotion ? 0 : settings.animationDurationMs}ms`);
    this.shell.dataset.reducedMotion = String(settings.reducedMotion);
    const customCss = [settings.customCss, persona2?.enabled ? persona2.customCss : ""].filter(Boolean).join(`
`);
    this.customStyle.textContent = customCss ? `@scope (.lumiphone-shell) { ${customCss} }` : "";
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
    this.render(true);
    this.refresh();
    this.announceView();
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
    this.releaseDockPanel();
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false);
      this.mobileWidget.setVisible(false);
    }
    this.announceView();
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
  back() {
    this.openPocket(this.router.back(), false);
  }
  home() {
    this.openPocket(this.router.home(), false);
  }
  openPocket(routeInput, pushHistory = true) {
    const normalized = normalizePocketRoute(routeInput);
    const route = this.router.navigate(normalized, !pushHistory);
    if (!this.state) {
      this.pendingRoute = route;
      this.open();
      this.refresh();
      return;
    }
    if (!this.expanded)
      this.open();
    if (this.currentApp === "settings" && route.app !== "settings")
      this.settingsDraft = null;
    this.currentApp = route.app;
    if (route.app === "messages") {
      const conversation = (route.conversationId ? this.state.conversations.find((entry) => entry.id === route.conversationId) : null) || (route.contactId ? this.state.conversations.find((entry) => entry.kind === "direct" && entry.participantContactIds[0] === route.contactId) : null);
      this.selectedConversationId = conversation?.id || "";
      this.selectedConversationView = route.view || "thread";
      this.selectedMessageId = conversation && route.messageId && conversation.messages.some((entry) => entry.id === route.messageId) ? route.messageId : "";
      this.send("lumiphone:mark_read", conversation ? { app: "messages", conversationId: conversation.id } : { app: "messages" });
    } else if (route.app === "contacts") {
      const contact = route.contactId ? this.state.contacts.find((entry) => entry.id === route.contactId) : null;
      this.selectedContactId = contact?.id || "";
      this.selectedContactView = contact ? route.view === "config" ? "config" : "detail" : route.view || "list";
      this.send("lumiphone:mark_read", { app: "contacts" });
    } else if (route.app === "trackers") {
      const tracker = route.trackerId ? this.state.trackers.find((entry) => entry.id === route.trackerId) : null;
      this.selectedTrackerId = tracker?.id || (route.trackerId?.startsWith("__template:") ? route.trackerId : "");
      this.selectedTrackerView = route.view || "detail";
      this.send("lumiphone:mark_read", { app: "trackers" });
    } else if (route.app === "calendar") {
      this.selectedEventId = route.eventId === "__new__" || route.eventId && this.state.events.some((entry) => entry.id === route.eventId) ? route.eventId : "";
      this.send("lumiphone:mark_read", { app: "calendar" });
    } else if (route.app === "notes") {
      this.selectedNoteId = route.noteId === "__new__" || route.noteId && this.state.notes.some((entry) => entry.id === route.noteId) ? route.noteId : "";
      this.send("lumiphone:mark_read", { app: "notes" });
    } else if (route.app === "gallery") {
      this.selectedGalleryImageId = route.imageId || "";
      this.requestGallery(this.galleryScope);
      this.send("lumiphone:mark_read", { app: "gallery" });
    } else if (route.app === "settings") {
      this.selectedSettingsSection = route.section || "";
      this.settingsDraft ||= structuredClone(this.preferences);
      this.send("lumiphone:mark_read", { app: "settings" });
    } else if (route.app !== "home") {
      this.send("lumiphone:mark_read", { app: route.app });
    }
    this.announceView();
    this.render(true);
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
  render(transition = false) {
    const oldView = this.screen.querySelector(".lumiphone-app-view");
    const oldViewScroll = oldView?.scrollTop || 0;
    const oldThread = this.screen.querySelector("[data-pocket-thread]");
    const oldThreadScroll = oldThread?.scrollTop;
    const focusedComposer = document.activeElement instanceof HTMLTextAreaElement ? document.activeElement.dataset.pocketComposer : "";
    const selection = document.activeElement instanceof HTMLTextAreaElement ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    for (const cleanup of this.viewCleanups.splice(0))
      cleanup();
    if (!this.state) {
      this.screen.replaceChildren(this.loadingView());
      return;
    }
    this.applyAppearance();
    const view = this.currentApp === "home" ? this.renderHome() : this.currentApp === "messages" ? this.renderMessages() : this.currentApp === "contacts" ? this.renderContacts() : this.currentApp === "gallery" ? this.renderGallery() : this.currentApp === "camera" ? this.renderCamera() : this.currentApp === "notes" ? this.renderNotes() : this.currentApp === "weather" ? this.renderWeather() : this.currentApp === "calendar" ? this.renderCalendar() : this.currentApp === "trackers" ? this.renderTrackers() : this.currentApp === "notifications" ? this.renderNotifications() : this.renderSettings();
    view.classList.add("lumiphone-app-view");
    view.dataset.pocketApp = this.currentApp;
    const animation = this.preferences.reducedMotion ? "none" : this.preferences.animation;
    if (transition && animation !== "none") {
      view.dataset.animate = animation;
      view.addEventListener("animationend", () => view.removeAttribute("data-animate"), { once: true });
    }
    this.screen.replaceChildren(view);
    if (!transition)
      requestAnimationFrame(() => {
        view.scrollTop = oldViewScroll;
        const thread = this.screen.querySelector("[data-pocket-thread]");
        if (thread && oldThreadScroll !== undefined)
          thread.scrollTop = oldThreadScroll;
        if (focusedComposer) {
          const composer = this.screen.querySelector(`[data-pocket-composer="${CSS.escape(focusedComposer)}"]`);
          composer?.focus({ preventScroll: true });
          if (composer && selection)
            composer.setSelectionRange(selection[0], selection[1]);
        }
      });
  }
  loadingView() {
    const node = el("div", "lp-page lp-empty");
    const inner = el("div");
    inner.innerHTML = `${PHONE_ICON}<p>Waking Pocket…</p>`;
    node.appendChild(inner);
    return node;
  }
  page(title, subtitle = "", action) {
    const page = el("div", "lp-page");
    const nav = el("header", "lp-nav");
    const back = button("‹ Back", "lp-nav-action");
    back.addEventListener("click", () => this.back());
    const heading = el("div", "lp-nav-title", title);
    if (subtitle)
      heading.appendChild(el("span", "lp-nav-subtitle", subtitle));
    const right = button(action?.label || "", "lp-nav-action");
    right.disabled = !action || action.enabled === false;
    if (action?.ariaLabel)
      right.setAttribute("aria-label", action.ariaLabel);
    if (action)
      right.addEventListener("click", action.callback);
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
    const recentNotifications = state.notifications.filter((entry) => !entry.dismissedAt && !entry.read).slice(0, 3);
    for (const item of recentNotifications) {
      const receipt = button("", "lp-home-activity-item");
      receipt.append(el("strong", "", item.title), el("span", "", item.body || item.app), el("span", "lp-home-activity-arrow", "›"));
      receipt.setAttribute("aria-label", `Open ${item.title}`);
      receipt.addEventListener("click", () => {
        this.send("lumiphone:notification_mark_read", { notificationId: item.id });
        this.openPocket(item.route || { app: item.app });
      });
      activity.appendChild(receipt);
    }
    if (recentNotifications.length) {
      const all = button("View all notifications", "lp-home-notifications-all");
      all.addEventListener("click", () => this.openPocket({ app: "notifications" }));
      activity.appendChild(all);
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
    const unread = meta.app === "messages" ? this.state.conversations.reduce((sum, conversation) => sum + conversation.unread, 0) : this.state.notifications.filter((item) => !item.read && !item.dismissedAt && item.app === meta.app).length;
    if (unread)
      box.appendChild(el("span", "lp-app-dot", unread > 99 ? "99+" : String(unread)));
    node.append(box, el("span", "lp-app-label", meta.label));
    node.addEventListener("click", () => this.openApp(meta.app));
    return node;
  }
  renderMessages() {
    return renderMessagesView({
      state: this.state,
      selectedConversationId: this.selectedConversationId,
      selectedMessageId: this.selectedMessageId,
      selectedView: this.selectedConversationView,
      generationAvailable: Boolean(this.caps?.generation),
      busyConversations: new Map([...this.messageRequests.values()].map((entry) => [entry.conversationId, { speakerContactId: entry.speakerContactId, phase: entry.phase }])),
      draft: this.messageDrafts.get(this.selectedConversationId) || "",
      updateDraft: (conversationId, value) => {
        if (value)
          this.messageDrafts.set(conversationId, value);
        else
          this.messageDrafts.delete(conversationId);
      },
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      empty: (title, copy) => this.empty("messages", title, copy),
      iconButton,
      selectConversation: (conversationId, view = "thread") => this.openPocket({ app: "messages", conversationId: conversationId || undefined, view }),
      openContact: (contactId) => this.openPocket({ app: "contacts", contactId, view: "detail" }),
      send: (type, payload) => {
        this.send(type, payload);
      },
      generateReply: (conversationId, speakerContactId) => this.generateReply(conversationId, speakerContactId),
      composerState: (conversationId, held) => {
        this.send("lumiphone:composer_state", { conversationId, held });
      },
      messageAnyway: (conversationId) => {
        this.manualMessageOverrides.add(conversationId);
        this.render(false);
      },
      manualOverride: this.manualMessageOverrides.has(this.selectedConversationId),
      returnToRoleplay: () => {
        if (this.state?.relays.some((entry) => entry.conversationId === this.selectedConversationId && entry.status === "pending"))
          this.send("lumiphone:continue_relay", { conversationId: this.selectedConversationId });
        this.close();
      },
      openTimeline: (eventId) => this.openPocket({ app: "calendar", eventId }),
      showGenerationInfo: (message) => this.showMessageGenerationInfo(message),
      back: () => this.back()
    });
  }
  showMessageGenerationInfo(message) {
    const info = message.generation?.info;
    const modal = this.ctx.ui.showModal({ title: "Generation info", width: 460, maxHeight: 620 });
    const content = el("div", "lp-settings-section");
    if (!info) {
      content.appendChild(el("p", "lp-copy", `Request ${message.generation?.requestId || "unknown"} predates detailed diagnostics.`));
    } else {
      for (const [label, value] of [
        ["Speaker", info.speaker],
        ["Source", `${info.source} · ${info.sourceId}`],
        ["Source resolution", info.sourceResolution],
        ["Active character used", `${info.activeCharacterUsed ? "yes" : "no"} · ${info.activeCharacterId}`],
        ["Identity", `${info.identityChars} chars`],
        ["Scene snapshot", info.sceneSnapshotStale ? "stale" : "current"],
        ["Context mode", info.contextMode],
        ["Recent RP", `${info.recentCount} messages · ${info.recentChars} chars`],
        ["Story", `${info.storyCount} facts · ${info.storyChars} chars`],
        ["Phone thread", `${info.threadCount} messages · ${info.threadChars} chars`],
        ["Generation", `${info.generationMode} · ${info.connectionName} · ${info.model}`]
      ]) {
        const row2 = el("div", "lp-row-between");
        row2.append(el("strong", "", label), el("span", "lp-copy", value));
        content.appendChild(row2);
      }
      if (info.replyDecision) {
        const decision = info.replyDecision;
        const row2 = el("div", "lp-row-between");
        row2.append(el("strong", "", "Channel decision"), el("span", "lp-copy", `${decision.rawAction} → ${decision.normalizedAction}${decision.reason ? ` · ${decision.reason}` : ""}${decision.normalizationReason ? ` · ${decision.normalizationReason}` : ""}`));
        content.appendChild(row2);
      }
    }
    modal.root.appendChild(content);
  }
  generateReply(conversationId, speakerContactId = "") {
    if ([...this.messageRequests.values()].some((entry) => entry.conversationId === conversationId))
      return;
    const id = requestId("reply");
    this.messageRequests.set(id, { conversationId, speakerContactId, phase: "pending" });
    this.send("lumiphone:generate_message", { requestId: id, conversationId, speakerContactId });
    this.render();
  }
  renderContacts() {
    return renderContactsView({
      state: this.state,
      selectedContactId: this.selectedContactId,
      selectedView: this.selectedContactView,
      sources: this.contactSources,
      capabilities: this.caps,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      empty: (title, copy) => this.empty("contacts", title, copy),
      operations: this.operations,
      select: (contactId, view = contactId ? "detail" : "list") => this.openPocket({ app: "contacts", contactId: contactId || undefined, view }),
      openDirect: (contactId) => this.send("lumiphone:open_direct", { contactId }),
      requestSources: () => {
        if (this.contactSourcesRequested)
          return;
        this.contactSourcesRequested = true;
        this.send("lumiphone:list_contact_sources");
      },
      send: (type, payload) => {
        this.send(type, payload);
      },
      showError: (message) => this.showError(message)
    });
  }
  requestGallery(scope) {
    this.galleryScope = scope;
    this.send("lumiphone:gallery_list", { scope });
  }
  renderGallery() {
    const { page, content } = this.page("Gallery", `${this.gallery.total} assets`, { label: "Refresh", callback: () => this.requestGallery(this.galleryScope) });
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
      image.src = item.thumbnailUrl || item.url;
      image.alt = item.filename || "Gallery image";
      image.addEventListener("error", () => {
        tile.dataset.missing = "true";
        image.replaceWith(el("span", "lp-gallery-missing", "Image unavailable"));
      }, { once: true });
      tile.append(image, el("span", "lp-gallery-meta", item.filename || formatDate(item.createdAt * 1000)));
      tile.addEventListener("click", () => this.inspectImage(item));
      grid.appendChild(tile);
    }
    content.appendChild(grid);
    if (!this.gallery.data.length)
      content.appendChild(this.empty("gallery", "Nothing here yet", "Take a photo with Camera or switch the gallery filter."));
    return page;
  }
  inspectImage(item) {
    const modal = this.ctx.ui.showModal({ title: item.filename || "Pocket photo", width: 760, maxHeight: 820 });
    const image = el("img");
    image.src = item.fullUrl || item.url;
    image.alt = item.filename || "Pocket photo";
    image.style.cssText = "display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:12px;background:#080808";
    const actions = el("div", "lp-gallery-actions");
    if (this.pendingWallpaperTarget && this.pendingWallpaperTarget !== "contact-avatar") {
      const target = this.pendingWallpaperTarget;
      const use = button("Use this image", "lp-button");
      use.addEventListener("click", () => {
        const personaTarget = target.startsWith("persona-");
        this.runGalleryAction(use, "Applying…", "lumiphone:gallery_set_wallpaper", {
          imageId: item.id,
          target: target.endsWith("chat") ? "chat" : "home",
          personaId: personaTarget ? this.activePersona?.id : undefined
        });
        this.pendingWallpaperTarget = null;
      });
      actions.appendChild(use);
    }
    const open = button("Open image", "lp-button");
    open.addEventListener("click", () => window.open(item.fullUrl || item.url, "_blank", "noopener,noreferrer"));
    const attach = button("Add to current RP chat", "lp-button");
    attach.disabled = !this.caps?.sceneSync;
    attach.addEventListener("click", () => this.runGalleryAction(attach, "Adding…", "lumiphone:gallery_add_to_chat", { imageId: item.id, imageUrl: item.fullUrl || item.url, filename: item.filename }));
    const homeWallpaper = button("Set as home wallpaper", "lp-button lp-button-quiet");
    homeWallpaper.addEventListener("click", () => this.runGalleryAction(homeWallpaper, "Applying…", "lumiphone:gallery_set_wallpaper", { imageId: item.id, imageUrl: item.fullUrl || item.url, target: "home" }));
    const chatWallpaper = button("Set as chat wallpaper", "lp-button lp-button-quiet");
    chatWallpaper.addEventListener("click", () => this.runGalleryAction(chatWallpaper, "Applying…", "lumiphone:gallery_set_wallpaper", { imageId: item.id, imageUrl: item.fullUrl || item.url, target: "chat" }));
    const contact = el("select", "lp-select");
    const choose = el("option", "", "Choose a contact photo…");
    choose.value = "";
    contact.appendChild(choose);
    for (const entry of this.state?.contacts || []) {
      const option = el("option", "", entry.name);
      option.value = entry.id;
      contact.appendChild(option);
    }
    const setPhoto = button("Set contact photo", "lp-button lp-button-quiet");
    setPhoto.addEventListener("click", () => {
      if (!contact.value) {
        this.showError("Choose a contact first.");
        return;
      }
      this.runGalleryAction(setPhoto, "Applying…", "lumiphone:set_contact_photo", { contactId: contact.value, imageUrl: item.fullUrl || item.url });
    });
    actions.append(open, attach, homeWallpaper, chatWallpaper);
    const personaAppearance = this.activePersona ? this.preferences.personaAppearance[this.activePersona.id] : null;
    if (this.activePersona && personaAppearance?.enabled) {
      const personaHome = button(`Set ${this.activePersona.name} home wallpaper`, "lp-button lp-button-quiet");
      personaHome.addEventListener("click", () => this.runGalleryAction(personaHome, "Applying…", "lumiphone:gallery_set_wallpaper", { imageId: item.id, imageUrl: item.fullUrl || item.url, target: "home", personaId: this.activePersona.id }));
      const personaChat = button(`Set ${this.activePersona.name} chat wallpaper`, "lp-button lp-button-quiet");
      personaChat.addEventListener("click", () => this.runGalleryAction(personaChat, "Applying…", "lumiphone:gallery_set_wallpaper", { imageId: item.id, imageUrl: item.fullUrl || item.url, target: "chat", personaId: this.activePersona.id }));
      actions.append(personaHome, personaChat);
    }
    actions.append(contact, setPhoto);
    modal.root.append(image, actions);
  }
  runGalleryAction(buttonNode, progress, type, payload) {
    const idle = buttonNode.textContent || "Action";
    const actionRequestId = requestId("gallery");
    buttonNode.disabled = true;
    buttonNode.textContent = progress;
    this.galleryActionButtons.set(actionRequestId, { button: buttonNode, idle });
    this.send(type, { ...payload, requestId: actionRequestId });
  }
  wallpaperTargetPayload(target) {
    return { target, personaId: target.startsWith("persona-") ? this.activePersona?.id : undefined };
  }
  async chooseImage(target, mode) {
    if (mode === "gallery") {
      this.pendingWallpaperTarget = target;
      this.requestGallery("all");
      this.openPocket({ app: "gallery" });
      return;
    }
    if (mode === "upload") {
      try {
        const files = await this.ctx.uploads.pickFile({ accept: ["image/*", ".png", ".jpg", ".jpeg", ".webp", ".gif"], multiple: false, maxSizeBytes: 8 * 1024 * 1024 });
        const file = files[0];
        if (!file)
          return;
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader;
          reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
          reader.addEventListener("error", () => reject(reader.error || new Error("Could not read the image.")), { once: true });
          reader.readAsDataURL(new Blob([file.bytes.slice().buffer], { type: file.mimeType }));
        });
        this.send("lumiphone:upload_wallpaper_asset", { ...this.wallpaperTargetPayload(target), dataUrl, filename: file.name });
      } catch (error) {
        this.showError(error instanceof Error ? error.message : String(error));
      }
      return;
    }
    const modal = this.ctx.ui.showModal({ title: "Use image URL", width: 460, maxHeight: 320 });
    const content = el("div", "lp-settings-section");
    content.appendChild(el("p", "lp-copy", "Use a durable HTTPS image URL. Pocket stores the URL, never a downloaded base64 copy."));
    const input = el("input", "lp-input");
    input.type = "url";
    input.placeholder = "https://example.com/wallpaper.jpg";
    const apply = button("Use image", "lp-button");
    apply.addEventListener("click", () => {
      const url = input.value.trim();
      if (!/^https:\/\//i.test(url)) {
        this.showError("Enter an HTTPS image URL.");
        return;
      }
      this.send("lumiphone:set_wallpaper", { ...this.wallpaperTargetPayload(target), source: { kind: "url", url } });
      modal.dismiss();
    });
    content.append(input, apply);
    modal.root.appendChild(content);
    input.focus();
  }
  renderCamera() {
    const page = el("div", "lp-camera");
    const nav = el("header", "lp-nav");
    const back = button("‹ Back", "lp-nav-action");
    back.addEventListener("click", () => this.back());
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
    const { page, content } = this.page("Notes", `${state.notes.length} journal entries`, { label: "New", callback: () => this.openPocket({ app: "notes", noteId: "__new__" }) });
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
      card.addEventListener("click", () => this.openPocket({ app: "notes", noteId: note.id }));
      content.appendChild(card);
    }
    if (!state.notes.length)
      content.appendChild(this.empty("notes", "The journal is blank", "You or the character can write the first entry."));
    return page;
  }
  renderNoteEditor(note) {
    const { page, content } = this.page(note ? "Edit Note" : "New Note", note?.mood || "Character journal", { label: "Save", callback: () => save() });
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
      this.back();
    };
    content.append(title, mood, body, pinRow);
    if (note) {
      const remove = button("Delete note", "lp-button lp-button-danger");
      remove.addEventListener("click", () => {
        this.send("lumiphone:delete", { kind: "note", id: note.id });
        this.back();
      });
      content.appendChild(remove);
    }
    return page;
  }
  renderWeather() {
    const weather = this.state.weather;
    const { page, content } = this.page("Weather", weather.location, { label: "Save", callback: () => save() });
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
    const save = () => this.send("lumiphone:action", { action: "weather", payload: {
      location: inputValue(location.input),
      condition: inputValue(condition.input),
      temperature: Number(temperature.input.value),
      unit: unit.value,
      high: Number(high.input.value),
      low: Number(low.input.value),
      details: details.value
    } });
    return page;
  }
  renderCalendar() {
    const state = this.state;
    const selected = state.events.find((item) => item.id === this.selectedEventId);
    if (this.selectedEventId === "__new__" || selected)
      return this.renderEventEditor(selected || null);
    const { page, content } = this.page("Timeline", formatDate(state.roleplayNow, true), { label: "Add", callback: () => this.openPocket({ app: "calendar", eventId: "__new__" }) });
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
      const row2 = el("div", "lp-event");
      row2.dataset.completed = String(event.completed);
      const dot = el("span", "lp-event-dot");
      dot.style.setProperty("--event-color", event.color);
      const card = el("div", "lp-card");
      card.dataset.clickable = "true";
      card.append(el("div", "lp-eyebrow", `${event.lane} · ${event.whenText || formatDate(event.start, true)}`), el("h3", "lp-title", event.title));
      if (event.description)
        card.appendChild(el("p", "lp-copy", event.description));
      card.addEventListener("click", () => this.openPocket({ app: "calendar", eventId: event.id }));
      row2.append(dot, card);
      timeline.appendChild(row2);
    }
    content.appendChild(timeline);
    if (!events.length)
      content.appendChild(this.empty("calendar", "No timeline events", "Schedule story beats, dates, appointments, or alternate-timeline milestones."));
    return page;
  }
  renderEventEditor(event) {
    const { page, content } = this.page(event ? "Edit Event" : "New Event", "Roleplay timeline", { label: "Save", callback: () => save() });
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
    if (event?.kind === "phone-handoff" && event.source) {
      const source = button("Open source conversation", "lp-button lp-button-quiet");
      source.addEventListener("click", () => this.openPocket({ app: "messages", conversationId: event.source.conversationId, messageId: event.source.messageId }));
      content.appendChild(source);
    }
    const save = () => {
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
      this.back();
    };
    if (event) {
      const remove = button("Delete event", "lp-button lp-button-danger");
      remove.addEventListener("click", () => {
        this.send("lumiphone:delete", { kind: "event", id: event.id });
        this.back();
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
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      field: (label, value, type) => this.field(label, value, type),
      send: (type, payload) => {
        this.send(type, payload);
      },
      select: (id, view = "detail", replace = false) => this.openPocket({ app: "trackers", trackerId: id || undefined, view }, !replace),
      back: () => this.back(),
      onCleanup: (cleanup) => this.viewCleanups.push(cleanup)
    });
  }
  renderNotifications() {
    return renderNotificationsView({
      notifications: this.state.notifications,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      navigate: (route) => this.openPocket(route),
      send: (type, payload) => {
        this.send(type, payload);
      }
    });
  }
  renderSettings() {
    this.settingsDraft ||= structuredClone(this.preferences);
    return renderSettingsView({
      draft: this.settingsDraft,
      state: this.state,
      section: this.selectedSettingsSection,
      activePersona: this.activePersona,
      capabilities: this.caps,
      swarmProfile: this.swarmProfile,
      generation: this.generation,
      resolvedWallpapers: this.resolvedWallpapers,
      contextPreview: this.contextPreview,
      personaPreview: this.personaPreview,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      update: (preferences, options) => this.updatePreferences(preferences, options),
      navigate: (section) => this.openPocket({ app: "settings", section }),
      send: (type, payload) => {
        this.send(type, payload);
      },
      requestPermissions: () => {
        this.requestPermissions();
      },
      showError: (message) => this.showError(message),
      rerender: () => this.render(false),
      chooseImage: (target, mode) => {
        this.chooseImage(target, mode);
      },
      mountModelCombobox: (target, options) => {
        const handle = this.ctx.components.mountModelCombobox(target, {
          value: options.value,
          connection: options.connection,
          appearance: "standard",
          placeholder: "Use connection model",
          disabled: options.disabled,
          onChange: options.onChange
        });
        this.viewCleanups.push(() => handle.destroy());
      }
    });
  }
  showFirstChatSetup() {
    if (this.setupModalOpen || !this.state)
      return;
    this.setupModalOpen = true;
    const modal = this.ctx.ui.showModal({ title: "Set up Pocket for this roleplay", width: 430, maxHeight: 560 });
    const copy = el("div", "lp-settings-section");
    copy.append(el("p", "lp-copy", "Pocket keeps its Persona, scene snapshot, contacts, and phone memory scoped to this chat. Choose how this phone should represent you."));
    const follow = button(`Follow ${this.activePersona?.name || "Lumiverse Persona"}`, "lp-button");
    follow.addEventListener("click", () => {
      this.send("lumiphone:save_pocket_persona", { followLumiverse: true, persona: this.state.pocketPersona });
      modal.dismiss();
    });
    const customize = button("Customize Pocket profile", "lp-button lp-button-quiet");
    customize.addEventListener("click", () => {
      this.openPocket({ app: "settings", section: "persona" });
      modal.dismiss();
    });
    const later = button("Not now", "lp-button lp-button-quiet");
    later.addEventListener("click", () => {
      this.send("lumiphone:dismiss_setup");
      modal.dismiss();
    });
    copy.append(follow, customize, later);
    modal.root.appendChild(copy);
    modal.onDismiss(() => {
      this.setupModalOpen = false;
    });
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
    this.showFeedback(message, true);
  }
  showFeedback(message, error = false) {
    window.clearTimeout(this.alertTimer);
    this.alert.textContent = message;
    this.alert.dataset.severity = error ? "error" : "success";
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
    --lp-animation-ms: 280ms; --pocket-ui-scale:1;
    --pocket-font-xs:calc(8px * var(--pocket-ui-scale)); --pocket-font-sm:calc(10px * var(--pocket-ui-scale));
    --pocket-font-md:calc(13px * var(--pocket-ui-scale)); --pocket-control-h:calc(38px * var(--pocket-ui-scale));
    --pocket-gap:calc(10px * var(--pocket-ui-scale)); --pocket-icon:calc(54px * var(--pocket-ui-scale));
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
    appearance:none; padding:0 9px; color:inherit; cursor:pointer;
    width: 92px; height: 23px; border-radius: 999px; background: #050506; border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: flex-end; gap: 6px;
  }
  .lumiphone-island[data-unread="true"] { box-shadow:0 0 0 2px color-mix(in srgb,var(--lp-accent) 70%,transparent); }
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

  .lp-home { min-height:100%; padding: 14px 16px 18px; background-image:var(--lp-wallpaper); background-size:var(--lp-home-wallpaper-size,cover); background-position:var(--lp-home-wallpaper-position,center); background-repeat:no-repeat; color:#fff; display:flex; flex-direction:column; }
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
  .lp-home-notifications-all { appearance:none; min-height:25px; border:0; background:transparent; color:#fff; opacity:.78; font:inherit; font-size:9px; cursor:pointer; }
  .lp-icon-messages { background:linear-gradient(145deg,#4ee580,#12aa4b); }
  .lp-icon-contacts { background:linear-gradient(145deg,#63b8ff,#3468d9); }
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

  .lp-thread { height:100%; min-height:0; overflow:hidden; display:grid; grid-template-rows:auto minmax(0,1fr) auto; background-image:var(--lp-chat-wallpaper); background-color:var(--lp-bg); background-size:var(--lp-chat-wallpaper-size,cover); background-position:var(--lp-chat-wallpaper-position,center); background-repeat:no-repeat; }
  .lp-thread .lp-nav { position:relative; }
  .lp-bubbles { min-height:0; overflow:auto; padding:14px 12px; display:flex; flex-direction:column; gap:7px; }
  .lp-bubble { max-width:79%; padding:8px 10px; border-radius:16px; font-size:11px; line-height:1.42; white-space:pre-wrap; overflow-wrap:anywhere; box-shadow:0 3px 10px rgba(0,0,0,.08); }
  .lp-bubble[data-sender="persona"] { align-self:flex-end; border-bottom-right-radius:5px; background:var(--lp-accent); color:#fff; }
  .lp-bubble[data-sender="contact"] { align-self:flex-start; border-bottom-left-radius:5px; background:var(--lp-surface-2); color:var(--lp-text); }
  .lp-bubble[data-sender="system"] { align-self:center; max-width:90%; background:transparent; color:var(--lp-muted); text-align:center; font-size:9px; box-shadow:none; }
  .lp-bubble-time { display:block; margin-top:4px; opacity:.58; font-size:7px; text-align:right; }
  .lp-bubble-sender { display:block; margin-bottom:2px; color:var(--lp-accent); font-size:8px; }
  .lp-bubble-pending { opacity:.82; min-width:42px; }
  .lp-typing-dots { min-height:12px; display:flex; align-items:center; justify-content:center; gap:3px; }
  .lp-typing-dots i { width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.42; animation:lp-typing 1s ease-in-out infinite; }
  .lp-typing-dots i:nth-child(2) { animation-delay:.14s; }
  .lp-typing-dots i:nth-child(3) { animation-delay:.28s; }
  .lp-compose { padding:8px 9px 10px; display:grid; grid-template-columns:auto minmax(0,78px) minmax(0,1fr) auto; gap:6px; align-items:end; border-top:1px solid var(--lp-border); background:color-mix(in srgb,var(--lp-bg) 90%,transparent); backdrop-filter:blur(18px); }
  .lp-speaker-select { min-width:0; min-height:34px; padding:5px; border:1px solid var(--lp-border); border-radius:11px; background:var(--lp-surface); color:var(--lp-text); font:inherit; font-size:8px; }
  .lp-speaker-select[hidden] { display:none; }
  .lp-compose:has(.lp-speaker-select[hidden]) { grid-template-columns:auto minmax(0,1fr) auto; }
  .lp-compose .lp-textarea { min-height:34px; max-height:96px; padding:8px 10px; resize:none; border-radius:17px; }
  .lp-compose .lp-button-icon { border-radius:50%; }

  .lp-operation-progress { padding:10px; display:grid; gap:7px; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:12px; background:var(--lp-surface); font-size:10px; }
  .lp-indeterminate { display:block; height:4px; overflow:hidden; border-radius:99px; background:color-mix(in srgb,var(--lp-accent) 16%,var(--lp-surface-2)); position:relative; }
  .lp-indeterminate::after { content:""; position:absolute; inset:0 auto 0 -42%; width:42%; border-radius:inherit; background:var(--lp-accent); animation:lp-indeterminate 1.1s ease-in-out infinite; }
  @keyframes lp-indeterminate { to { left:100%; } }

  .lp-notification-group { display:grid; gap:7px; }
  .lp-notification-row { padding:0; display:grid; grid-template-columns:minmax(0,1fr) auto; overflow:hidden; }
  .lp-notification-row[data-read="false"] { border-left:3px solid var(--lp-accent); }
  .lp-notification-row[data-severity="error"] { border-left-color:#ff6a80; }
  .lp-notification-open { appearance:none; min-width:0; padding:11px 8px 11px 12px; border:0; display:flex; text-align:left; background:transparent; color:var(--lp-text); font:inherit; cursor:pointer; }
  .lp-notification-open > span { display:grid; gap:2px; }
  .lp-notification-open strong,.lp-notification-open span { overflow-wrap:anywhere; }
  .lp-notification-dismiss { appearance:none; width:38px; border:0; background:transparent; color:var(--lp-muted); font-size:20px; cursor:pointer; }
  .lp-notification-empty { margin:36px 12px; color:var(--lp-muted); font-size:10px; line-height:1.5; text-align:center; }
  .lp-floating-notification { appearance:none; position:absolute; z-index:45; top:39px; left:10px; right:10px; min-height:54px; padding:8px 10px; border:1px solid color-mix(in srgb,var(--lp-accent) 35%,var(--lp-border)); border-radius:15px; display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:8px; background:color-mix(in srgb,var(--lp-surface) 94%,transparent); color:var(--lp-text); backdrop-filter:blur(22px); box-shadow:0 14px 36px rgba(0,0,0,.28); text-align:left; cursor:pointer; }
  .lp-floating-notification > span:first-child svg { width:20px; height:20px; }
  .lp-floating-notification > .lp-grow { display:grid; gap:2px; }
  .lp-floating-notification > .lp-grow span { color:var(--lp-muted); font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lp-generation-effective,.lp-generation-run { padding:8px 9px; border:1px solid var(--lp-border); border-radius:10px; display:grid; gap:2px; }
  .lp-model-combobox { min-height:40px; }
  .lp-context-preview { border-top:1px solid var(--lp-border); padding-top:8px; }
  .lp-context-stats { display:grid; gap:6px; margin:8px 0; }
  .lp-context-exact { max-height:220px; overflow:auto; white-space:pre-wrap; word-break:break-word; padding:9px; border-radius:9px; background:color-mix(in srgb,var(--lp-bg) 75%,black); font:8px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace; }
  .lp-generation-history { display:grid; gap:5px; }
  .lp-generation-run[data-status="failed"] { border-color:color-mix(in srgb,#ff6a80 42%,var(--lp-border)); }

  .lp-contact-list,.lp-contact-checklist,.lp-contact-source-section,.lp-contact-import { display:grid; gap:7px; }
  .lp-contact-row { width:100%; display:flex; align-items:center; gap:10px; text-align:left; }
  .lp-contact-row .lp-avatar { background:linear-gradient(145deg,color-mix(in srgb,var(--contact-accent,var(--lp-accent)) 82%,white),var(--contact-accent,var(--lp-accent))); }
  .lp-presence { width:9px; height:9px; flex:0 0 9px; border:2px solid var(--lp-surface); border-radius:50%; background:#43d67f; box-shadow:0 0 0 1px color-mix(in srgb,#43d67f 45%,transparent); }
  .lp-presence-away { background:var(--lp-muted); box-shadow:none; opacity:.42; }
  .lp-contact-detail { display:grid; justify-items:center; gap:9px; text-align:center; }
  .lp-contact-detail .lp-avatar { width:72px; height:72px; font-size:24px; }
  .lp-contact-checklist .lp-card span { display:grid; gap:2px; }

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
  @keyframes lp-typing { 0%,60%,100%{transform:translateY(0);opacity:.38} 30%{transform:translateY(-3px);opacity:1} }
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
  .lp-alert[data-severity="success"] { border-color:color-mix(in srgb,#55d69a 42%,var(--lp-border)); background:color-mix(in srgb,#55d69a 13%,var(--lp-surface)); }

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
  .lumiphone-widget-root[data-fullscreen="true"] { width:100%; height:var(--lp-visual-height,100%); max-width:none; overflow:hidden; contain:layout paint; }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-shell { border:0; border-radius:0; box-shadow:none; aspect-ratio:auto; grid-template-rows:calc(34px + env(safe-area-inset-top)) minmax(0,1fr) calc(24px + env(safe-area-inset-bottom)); }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-statusbar { height:calc(34px + env(safe-area-inset-top)); padding-top:calc(5px + env(safe-area-inset-top)); }
  .lumiphone-widget-root[data-fullscreen="true"] .lumiphone-homebar { padding-bottom:env(safe-area-inset-bottom); }
  .lumiphone-widget-root[data-fullscreen="true"] .lp-compose { padding-bottom:max(8px,env(safe-area-inset-bottom)); }
  @media (max-width: 360px) {
    .lp-app-icon-box { width:50px; height:50px; border-radius:15px; }
    .lp-fields { grid-template-columns:1fr; }
    .lp-home { padding-inline:12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .lumiphone-app-view, .lumiphone-launcher, .lp-app-icon-box, .lp-gallery-item img, .lp-progress span, .lp-typing-dots i { animation:none !important; transition:none !important; }
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

  /* Density primitives. These participate in layout; Pocket never transform-scales its fullscreen surface. */
  .lumiphone-shell .lp-content { padding:calc(12px * var(--pocket-ui-scale)); gap:var(--pocket-gap); }
  .lumiphone-shell .lp-card { padding:calc(12px * var(--pocket-ui-scale)); border-radius:calc(17px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-title { font-size:var(--pocket-font-md); }
  .lumiphone-shell .lp-copy { font-size:var(--pocket-font-sm); }
  .lumiphone-shell .lp-eyebrow { font-size:var(--pocket-font-xs); }
  .lumiphone-shell .lp-button { min-height:calc(34px * var(--pocket-ui-scale)); padding:calc(7px * var(--pocket-ui-scale)) calc(11px * var(--pocket-ui-scale)); font-size:var(--pocket-font-sm); }
  .lumiphone-shell .lp-button-icon { width:calc(34px * var(--pocket-ui-scale)); padding:calc(6px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-input,.lumiphone-shell .lp-textarea,.lumiphone-shell .lp-select { min-height:var(--pocket-control-h); padding:calc(9px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); font-size:calc(11px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-label { gap:calc(5px * var(--pocket-ui-scale)); font-size:calc(9px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav { min-height:calc(48px * var(--pocket-ui-scale)); padding:calc(7px * var(--pocket-ui-scale)) calc(12px * var(--pocket-ui-scale)); grid-template-columns:calc(74px * var(--pocket-ui-scale)) minmax(0,1fr) calc(74px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav-title { font-size:calc(14px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav-subtitle { font-size:calc(9px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-nav-action { min-height:calc(30px * var(--pocket-ui-scale)); font-size:calc(11px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-grid { gap:calc(18px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-icon-box { width:var(--pocket-icon); height:var(--pocket-icon); border-radius:calc(16px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-icon-box svg { width:calc(27px * var(--pocket-ui-scale)); height:calc(27px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-app-label { font-size:var(--pocket-font-sm); }
  .lumiphone-shell .lp-avatar { width:calc(42px * var(--pocket-ui-scale)); height:calc(42px * var(--pocket-ui-scale)); flex-basis:calc(42px * var(--pocket-ui-scale)); font-size:calc(15px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-bubbles { padding:calc(14px * var(--pocket-ui-scale)) calc(12px * var(--pocket-ui-scale)); gap:calc(7px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-bubble { padding:calc(8px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); border-radius:calc(16px * var(--pocket-ui-scale)); font-size:calc(11px * var(--pocket-ui-scale)); }
  .lumiphone-shell .lp-compose { padding:calc(8px * var(--pocket-ui-scale)) calc(9px * var(--pocket-ui-scale)) calc(10px * var(--pocket-ui-scale)); gap:calc(6px * var(--pocket-ui-scale)); grid-template-columns:auto minmax(0,calc(78px * var(--pocket-ui-scale))) minmax(0,1fr) auto; }
  .lumiphone-shell .lp-compose .lp-textarea { min-height:calc(34px * var(--pocket-ui-scale)); max-height:calc(112px * var(--pocket-ui-scale)); border-radius:calc(17px * var(--pocket-ui-scale)); }
  .lp-conversation-status { align-self:center; max-width:92%; margin:5px 0; padding:6px 11px; border-top:1px solid var(--lp-border); border-bottom:1px solid var(--lp-border); color:var(--lp-muted); font-size:var(--pocket-font-sm); text-align:center; }
  .lp-local-actions { padding:10px 12px calc(12px + env(safe-area-inset-bottom)); display:grid; grid-template-columns:1fr 1fr; gap:7px; border-top:1px solid var(--lp-border); background:color-mix(in srgb,var(--lp-bg) 90%,transparent); backdrop-filter:blur(18px); }
  .lp-local-actions strong { grid-column:1/-1; color:var(--lp-muted); font-size:var(--pocket-font-sm); text-align:center; }
  .lp-channel-diagnostic { grid-column:1/-1; color:var(--lp-muted); font-size:var(--pocket-font-xs); }
  .lp-channel-diagnostic summary { cursor:pointer; text-align:center; }
  .lp-channel-diagnostic > span { display:block; margin-top:4px; overflow-wrap:anywhere; text-align:center; }
  .lp-manual-reply { color:var(--lp-muted); background:transparent; }
  .lp-bubble-action { appearance:none; margin:5px 0 0 7px; padding:0; border:0; background:transparent; color:inherit; opacity:.58; font:inherit; font-size:var(--pocket-font-xs); cursor:pointer; }
  .lp-bubble-action:hover { opacity:1; text-decoration:underline; }
  .lp-scene-note { margin:0; padding:7px 9px; border-radius:9px; background:color-mix(in srgb,var(--lp-accent) 10%,transparent); color:var(--lp-muted); font-size:var(--pocket-font-sm); }
  .lp-settings-category { width:100%; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:10px; color:var(--lp-text); text-align:left; cursor:pointer; }
  .lp-settings-category > span:first-child { display:grid; gap:2px; }
  .lp-settings-chevron { color:var(--lp-muted); font-size:22px; }
  .lp-code-input { min-height:150px; font-family:ui-monospace,SFMono-Regular,Consolas,monospace; white-space:pre; }
  .lp-swarm-diagnostics { display:grid; gap:6px; }
  .lp-swarm-diagnostics summary { cursor:pointer; color:var(--lp-muted); font-size:var(--pocket-font-sm); }
  .lp-gallery-actions { margin-top:12px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .lp-gallery-actions .lp-select { grid-column:1 / -1; }
  .lp-wallpaper-control { display:grid; gap:9px; padding:10px 0; border-top:1px solid var(--lp-border); }
  .lp-wallpaper-control:first-of-type { border-top:0; }
  .lp-wallpaper-preview { min-height:120px; display:grid; place-items:center; border:1px solid var(--lp-border); border-radius:14px; background-color:var(--lp-bg); background-repeat:no-repeat; color:var(--lp-muted); font-size:var(--pocket-font-sm); overflow:hidden; }
  .lp-wallpaper-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .lp-wallpaper-focal { display:grid; gap:6px; }
  .lp-wallpaper-range { display:grid; grid-template-columns:minmax(100px,auto) 1fr; align-items:center; gap:8px; }
  .lp-wallpaper-range input { width:100%; accent-color:var(--lp-accent); }
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
