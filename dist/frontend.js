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
function applyPhoneSurface(widget, scale) {
  const geometry = calculatePhoneSurface(scale);
  widget.setFullscreen(geometry.fullscreen);
  if (!geometry.fullscreen) {
    widget.setSize(geometry.width, geometry.height);
    widget.moveTo(geometry.x, geometry.y);
  }
  return geometry;
}

// src/frontend/apps/settings.ts
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
function inputValue(input) {
  return input.value.trim();
}
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
  behavior.appendChild(el("div", "lp-eyebrow", "Character actions"));
  behavior.append(toggleSetting("Open phone on model action", settings.autoOpenOnModelAction, (value) => {
    settings.autoOpenOnModelAction = value;
  }), toggleSetting("Push notifications", settings.pushNotifications, (value) => {
    settings.pushNotifications = value;
  }), toggleSetting("Camera scene planner", settings.sceneEnhancer, (value) => {
    settings.sceneEnhancer = value;
  }));
  const visual = el("section", "lp-card lp-settings-section");
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
      host.showError("That file is not valid LumiPhone JSON.");
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
    if (window.confirm("Delete every LumiPhone chat/character state? Device preferences will remain."))
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

// src/frontend/controller.ts
var PHONE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.7" y="2.5" width="10.6" height="19" rx="2.6"/><path d="M10 5h4M10.7 18.7h2.6"/></svg>';
var ICONS = {
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
function el2(tag, className = "", content = "") {
  const node = document.createElement(tag);
  if (className)
    node.className = className;
  if (content)
    node.textContent = content;
  return node;
}
function icon(name) {
  const node = el2("span");
  node.innerHTML = ICONS[name] || ICONS.home;
  return node;
}
function button2(label, className = "lp-button") {
  const node = el2("button", className, label);
  node.type = "button";
  return node;
}
function iconButton(name, label) {
  const node = button2("", "lp-button lp-button-icon");
  node.setAttribute("aria-label", label);
  node.appendChild(icon(name));
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
function inputValue2(input) {
  return input.value.trim();
}
function requestId(prefix = "req") {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

class LumiPhoneController {
  ctx;
  cleanups = [];
  drawer;
  widget = null;
  widgetRoot = null;
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
  selectedNoteId = "";
  selectedEventId = "";
  selectedTrackerId = "";
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
  constructor(ctx) {
    this.ctx = ctx;
    this.drawer = ctx.ui.registerDrawerTab({
      id: "lumiphone",
      title: "LumiPhone",
      shortName: "Phone",
      headerTitle: "LumiPhone",
      description: "Open the character-aware roleplay phone",
      keywords: ["phone", "messages", "camera", "gallery", "journal", "calendar", "timeline", "tracker"],
      iconSvg: PHONE_ICON
    });
    this.launcher = el2("button", "lumiphone-launcher");
    this.launcher.type = "button";
    this.launcher.title = "Open LumiPhone";
    this.launcher.setAttribute("aria-label", "Open LumiPhone");
    this.launcher.innerHTML = PHONE_ICON;
    this.launcherBadge = el2("span", "lumiphone-badge");
    this.launcherBadge.hidden = true;
    this.launcher.appendChild(this.launcherBadge);
    this.shell = el2("div", "lumiphone-shell");
    this.shell.hidden = true;
    const status = el2("div", "lumiphone-statusbar");
    const dismiss = iconButton("back", "Dismiss phone");
    dismiss.className = "lumiphone-dismiss";
    dismiss.addEventListener("click", () => this.close());
    this.clock = el2("span", "lumiphone-time", formatTime(new Date));
    const island = el2("span", "lumiphone-island");
    const signals = el2("span", "lumiphone-signals");
    const bars = el2("span", "lumiphone-signal-bars");
    for (let i = 0;i < 4; i += 1)
      bars.appendChild(el2("i"));
    signals.append(bars, el2("span", "", "5G"), el2("span", "lumiphone-battery"));
    status.append(dismiss, this.clock, island, signals);
    this.screen = el2("main", "lumiphone-screen");
    this.alert = el2("div", "lp-alert");
    this.alert.hidden = true;
    const homebar = el2("div", "lumiphone-homebar");
    const homeButton = button2("");
    homeButton.setAttribute("aria-label", "Home or dismiss phone");
    homebar.appendChild(homeButton);
    this.shell.append(status, this.screen, homebar, this.alert);
    this.launcher.addEventListener("click", () => this.open());
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
    for (const cleanup of this.cleanups.splice(0)) {
      try {
        cleanup();
      } catch {}
    }
    this.widget?.destroy();
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
      label: "Open LumiPhone",
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
    this.cleanups.push(this.ctx.events.on("CHAT_SWITCHED", () => this.refresh()));
    const returned = (event) => {
      const detail = event.detail;
      if (detail?.extensionId === "lumiphone")
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
        tooltip: "LumiPhone",
        chromeless: true,
        resizable: false,
        aspectLock: 9 / 16,
        persistGeometry: false
      });
      this.widgetRoot = el2("div", "lumiphone-widget-root");
      this.widget.root.appendChild(this.widgetRoot);
      this.widgetRoot.append(this.launcher, this.shell);
      this.shell.hidden = true;
      this.launcher.hidden = false;
      this.renderDrawerLanding();
    } catch {
      this.widget = null;
      this.mountPhoneInDrawer();
    }
  }
  renderDrawerLanding() {
    this.drawer.root.replaceChildren();
    const outer = el2("div", "lumiphone-drawer");
    const card = el2("div", "lumiphone-drawer-card");
    const logo = el2("div", "lumiphone-drawer-icon");
    logo.innerHTML = PHONE_ICON;
    const title = el2("h2", "lumiphone-drawer-title", "LumiPhone");
    const copy = el2("p", "lumiphone-drawer-copy", "A persistent phone for each chat and character—messages, photos, journals, roleplay weather, timeline events, and live trackers in one place.");
    const actions = el2("div", "lumiphone-drawer-actions");
    const open = button2("Open phone", "lumiphone-drawer-button");
    open.dataset.primary = "true";
    open.addEventListener("click", () => this.open());
    const permission = button2("Manage access", "lumiphone-drawer-button");
    permission.addEventListener("click", () => this.requestPermissions());
    actions.append(open, permission);
    card.append(logo, title, copy, actions);
    outer.appendChild(card);
    this.drawer.root.appendChild(outer);
  }
  mountPhoneInDrawer() {
    if (this.widget)
      return;
    this.drawer.root.replaceChildren();
    const host = el2("div", "lumiphone-widget-root");
    const viewport = currentViewport();
    const geometry = calculatePhoneSurface(this.preferences.handsetScale, { width: Math.min(viewport.width, 620), height: Math.max(320, viewport.height - 130) }, false);
    host.style.width = geometry.fullscreen ? "100%" : `${geometry.width}px`;
    host.style.height = geometry.fullscreen ? "calc(100dvh - 110px)" : `${geometry.height}px`;
    host.style.aspectRatio = "9 / 16";
    this.drawer.root.appendChild(host);
    host.appendChild(this.shell);
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
      ], { reason: "LumiPhone uses these permissions for its floating phone, per-chat character state, generated text messages, model actions, gallery, camera, and optional push notifications." });
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
      if (this.currentApp === "trackers" && this.expanded)
        this.render();
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
      this.applyAppearance();
      this.updateBadge();
      if (payload.open)
        this.open();
      if (this.expanded)
        this.render();
      if (this.unreadCount() > previousUnread && !this.expanded)
        this.launcher.animate([
          { transform: "scale(1)" },
          { transform: "scale(1.13) rotate(-4deg)" },
          { transform: "scale(1)" }
        ], { duration: 420, easing: "ease-out" });
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
      anchor.download = `lumiphone-${this.state?.chatId || "backup"}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      return;
    }
    if (payload.type === "lumiphone:error") {
      if (payload.requestId === this.cameraRequestId)
        this.cameraBusy = false;
      this.messageRequests.delete(payload.requestId);
      this.showError(payload.error || "LumiPhone could not complete that action.");
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
    if (!this.widget)
      return;
    this.expanded = false;
    if (this.widget.isFullscreen())
      this.widget.setFullscreen(false);
    this.shell.hidden = true;
    this.launcher.hidden = false;
    window.clearTimeout(this.collapseTimer);
    this.collapseTimer = window.setTimeout(() => {
      if (!this.expanded && this.widget)
        this.widget.setSize(58, 58);
      this.launcherFocus?.focus({ preventScroll: true });
      this.launcherFocus = null;
    }, this.preferences.reducedMotion || this.preferences.animation === "none" ? 0 : this.preferences.animationDurationMs);
  }
  resizeExpanded() {
    if (!this.widget)
      return;
    const geometry = applyPhoneSurface(this.widget, this.preferences.handsetScale);
    this.widgetRoot?.setAttribute("data-fullscreen", String(geometry.fullscreen));
  }
  openApp(app) {
    this.currentApp = app;
    if (app === "gallery")
      this.requestGallery(this.galleryScope);
    if (app === "messages")
      this.send("lumiphone:mark_read", { app: "messages" });
    else if (app !== "home")
      this.send("lumiphone:mark_read", { app });
    this.render();
  }
  render() {
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
    const node = el2("div", "lp-page lp-empty");
    const inner = el2("div");
    inner.innerHTML = `${PHONE_ICON}<p>Waking LumiPhone…</p>`;
    node.appendChild(inner);
    return node;
  }
  page(title, subtitle = "", rightLabel = "", onRight) {
    const page = el2("div", "lp-page");
    const nav = el2("header", "lp-nav");
    const back = button2("‹ Home", "lp-nav-action");
    back.addEventListener("click", () => this.openApp("home"));
    const heading = el2("div", "lp-nav-title", title);
    if (subtitle)
      heading.appendChild(el2("span", "lp-nav-subtitle", subtitle));
    const right = button2(rightLabel, "lp-nav-action");
    if (rightLabel && onRight)
      right.addEventListener("click", onRight);
    else
      right.disabled = true;
    nav.append(back, heading, right);
    const content = el2("div", "lp-content");
    page.append(nav, content);
    return { page, content };
  }
  renderHome() {
    const state = this.state;
    const home = el2("div", "lp-home");
    const head = el2("div", "lp-home-head");
    const left = el2("div");
    left.append(el2("div", "lp-home-date", formatDate(state.roleplayNow, false)), el2("div", "lp-home-clock", formatTime(state.roleplayNow)));
    const weather = el2("button", "lp-home-weather");
    weather.type = "button";
    weather.append(icon("weather"), el2("span", "", `${state.weather.temperature}°${state.weather.unit} · ${state.weather.condition}`));
    weather.addEventListener("click", () => this.openApp("weather"));
    head.append(left, weather);
    const grid = el2("div", "lp-app-grid");
    for (const meta of APP_META.filter((entry) => !entry.dock))
      grid.appendChild(this.appIcon(meta));
    const dock = el2("div", "lp-home-dock");
    for (const meta of APP_META.filter((entry) => entry.dock))
      dock.appendChild(this.appIcon(meta));
    home.append(head, grid, dock);
    return home;
  }
  appIcon(meta) {
    const node = el2("button", "lp-app-icon");
    node.type = "button";
    const box = el2("span", `lp-app-icon-box lp-icon-${meta.icon}`);
    box.appendChild(icon(meta.icon));
    const unread = meta.app === "messages" ? this.state.contacts.reduce((sum, contact) => sum + contact.unread, 0) : this.state.notifications.filter((item) => !item.read && item.app === meta.app).length;
    if (unread)
      box.appendChild(el2("span", "lp-app-dot", unread > 99 ? "99+" : String(unread)));
    node.append(box, el2("span", "lp-app-label", meta.label));
    node.addEventListener("click", () => this.openApp(meta.app));
    return node;
  }
  renderMessages() {
    const state = this.state;
    const contact = state.contacts.find((item) => item.id === this.selectedContactId);
    if (contact)
      return this.renderThread(contact);
    const { page, content } = this.page("Messages", `${state.contacts.length} conversation${state.contacts.length === 1 ? "" : "s"}`);
    for (const item of state.contacts) {
      const card = el2("div", "lp-card");
      card.dataset.clickable = "true";
      const row = el2("div", "lp-row");
      const avatar = el2("div", "lp-avatar", item.name.slice(0, 1).toUpperCase());
      if (item.avatarUrl) {
        const image = el2("img");
        image.src = item.avatarUrl;
        image.alt = "";
        avatar.replaceChildren(image);
      }
      const latest = item.messages.at(-1);
      const copy = el2("div", "lp-grow");
      const nameRow = el2("div", "lp-row-between");
      nameRow.append(el2("h3", "lp-title", item.name), el2("span", "lp-copy", latest ? formatTime(latest.createdAt) : ""));
      copy.append(nameRow, el2("p", "lp-copy", latest?.text || item.subtitle || "Start a conversation"));
      row.append(avatar, copy);
      if (item.unread)
        row.appendChild(el2("span", "lp-unread", String(item.unread)));
      card.appendChild(row);
      card.addEventListener("click", () => {
        this.selectedContactId = item.id;
        this.send("lumiphone:mark_read", { app: "messages", contactId: item.id });
        this.render();
      });
      content.appendChild(card);
    }
    if (!state.contacts.length)
      content.appendChild(this.empty("messages", "No conversations yet", "A model phone action or your first message will create one."));
    return page;
  }
  renderThread(contact) {
    const page = el2("div", "lp-thread");
    const nav = el2("header", "lp-nav");
    const back = button2("‹ Back", "lp-nav-action");
    back.addEventListener("click", () => {
      this.selectedContactId = "";
      this.render();
    });
    const title = el2("div", "lp-nav-title", contact.name);
    title.appendChild(el2("span", "lp-nav-subtitle", contact.subtitle || "Messages"));
    const generate = button2("Reply ✦", "lp-nav-action");
    const replyBusy = [...this.messageRequests.values()].includes(contact.id);
    generate.textContent = replyBusy ? "Writing…" : "Reply ✦";
    generate.disabled = !this.caps?.generation || replyBusy;
    generate.addEventListener("click", () => this.generateReply(contact.id));
    nav.append(back, title, generate);
    const bubbles = el2("div", "lp-bubbles");
    for (const message of contact.messages) {
      const bubble = el2("div", "lp-bubble", message.text);
      bubble.dataset.sender = message.sender;
      bubble.appendChild(el2("span", "lp-bubble-time", `${formatTime(message.createdAt)} · ${message.status}`));
      bubbles.appendChild(bubble);
    }
    if (replyBusy) {
      const pending = el2("div", "lp-bubble lp-bubble-pending", "Writing…");
      pending.dataset.sender = "character";
      bubbles.appendChild(pending);
    }
    if (!contact.messages.length)
      bubbles.appendChild(this.empty("messages", "Say hello", `This conversation belongs to ${this.state.characterName} in this chat.`));
    const compose = el2("form", "lp-compose");
    const sparkle = iconButton("sparkle", "Generate character reply");
    sparkle.disabled = !this.caps?.generation || replyBusy;
    sparkle.addEventListener("click", () => this.generateReply(contact.id));
    const textarea = el2("textarea", "lp-textarea");
    textarea.rows = 1;
    textarea.placeholder = "Message…";
    const submit = iconButton("send", "Send message");
    compose.append(sparkle, textarea, submit);
    compose.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = inputValue2(textarea);
      if (!message)
        return;
      this.send("lumiphone:action", { action: "message", payload: { contactId: contact.id, contactName: contact.name, text: message, sender: "user" } });
      textarea.value = "";
    });
    page.append(nav, bubbles, compose);
    requestAnimationFrame(() => {
      bubbles.scrollTop = bubbles.scrollHeight;
    });
    return page;
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
    const chips = el2("div", "lp-chipbar");
    for (const [scope, label] of [["chat", "This chat"], ["character", "Character"], ["phone", "LumiPhone"], ["all", "All"]]) {
      const chip = button2(label, "lp-chip");
      chip.setAttribute("aria-pressed", String(this.galleryScope === scope));
      chip.addEventListener("click", () => this.requestGallery(scope));
      chips.appendChild(chip);
    }
    content.appendChild(chips);
    if (!this.caps?.images) {
      content.appendChild(this.empty("gallery", "Gallery access is off", "Grant Images permission from Settings to browse Lumiverse assets."));
      return page;
    }
    const grid = el2("div", "lp-gallery-grid");
    for (const item of this.gallery.data) {
      const tile = el2("button", "lp-gallery-item");
      tile.type = "button";
      const image = el2("img");
      image.loading = "lazy";
      image.src = item.url;
      image.alt = item.filename || "Gallery image";
      image.addEventListener("error", () => {
        tile.dataset.missing = "true";
        image.replaceWith(el2("span", "lp-gallery-missing", "Image unavailable"));
      }, { once: true });
      tile.append(image, el2("span", "lp-gallery-meta", item.filename || formatDate(item.createdAt * 1000)));
      tile.addEventListener("click", () => this.inspectImage(item.url, item.filename));
      grid.appendChild(tile);
    }
    content.appendChild(grid);
    if (!this.gallery.data.length)
      content.appendChild(this.empty("gallery", "Nothing here yet", "Take a photo with Camera or switch the gallery filter."));
    return page;
  }
  inspectImage(url, title) {
    const modal = this.ctx.ui.showModal({ title: title || "LumiPhone photo", size: "lg" });
    const image = el2("img");
    image.src = url;
    image.alt = title || "LumiPhone photo";
    image.style.cssText = "display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:12px;background:#080808";
    modal.root.appendChild(image);
  }
  renderCamera() {
    const page = el2("div", "lp-camera");
    const nav = el2("header", "lp-nav");
    const back = button2("‹ Home", "lp-nav-action");
    back.addEventListener("click", () => this.openApp("home"));
    const profileLabel = this.swarmProfile?.available ? "Swarm profile linked" : "Manual profile";
    const title = el2("div", "lp-nav-title", "Camera");
    title.appendChild(el2("span", "lp-nav-subtitle", profileLabel));
    const gallery = button2("Gallery", "lp-nav-action");
    gallery.addEventListener("click", () => this.openApp("gallery"));
    nav.append(back, title, gallery);
    const viewfinder = el2("div", "lp-viewfinder");
    if (this.cameraPreview) {
      const image = el2("img");
      image.src = this.cameraPreview;
      image.alt = "Camera preview";
      viewfinder.appendChild(image);
    } else {
      const placeholder = el2("div", "lp-camera-placeholder");
      placeholder.append(icon("camera"), el2("div", "", "Frame an in-world moment. The optional scene planner expands your brief before the image connection develops it."));
      viewfinder.appendChild(placeholder);
    }
    const controls = el2("form", "lp-camera-controls");
    const prompt = el2("textarea", "lp-textarea");
    prompt.placeholder = "Describe the photo or moment…";
    prompt.rows = 2;
    const optionRow = el2("div", "lp-row-between");
    const enhanceLabel = el2("label", "lp-row");
    const enhance = el2("input");
    enhance.type = "checkbox";
    enhance.checked = this.preferences.sceneEnhancer;
    enhanceLabel.append(enhance, el2("span", "lp-copy", "Scene planner sidecar"));
    const source = el2("span", "lp-copy", this.swarmProfile?.source === "swarm_studio" ? "Swarm Studio" : "Primitive/manual");
    optionRow.append(enhanceLabel, source);
    const shutterRow = el2("div", "lp-shutter-row");
    const cancel = button2(this.cameraBusy ? "Cancel" : "", "lp-button");
    cancel.style.visibility = this.cameraBusy ? "visible" : "hidden";
    cancel.addEventListener("click", () => {
      this.send("lumiphone:camera_cancel", { requestId: this.cameraRequestId });
      this.cameraBusy = false;
      this.cameraProgress = "Cancelled";
      this.render();
    });
    const shutter = el2("button", "lp-shutter");
    shutter.type = "submit";
    shutter.disabled = this.cameraBusy || !this.caps?.imageGen;
    const spacer = el2("span");
    shutterRow.append(cancel, shutter, spacer);
    const progress = el2("div", "lp-camera-progress", this.cameraProgress || (!this.caps?.imageGen ? "Grant Image Generation permission in Settings" : ""));
    controls.append(prompt, optionRow, shutterRow, progress);
    controls.addEventListener("submit", (event) => {
      event.preventDefault();
      const scene = inputValue2(prompt);
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
      const card = el2("div", "lp-card lp-note-card");
      card.dataset.clickable = "true";
      card.dataset.pinned = String(note.pinned);
      const head = el2("div", "lp-row-between");
      head.append(el2("h3", "lp-title", note.title), el2("span", "lp-copy", formatDate(note.updatedAt)));
      const preview = el2("p", "lp-copy lp-note-preview", note.body || "Empty note");
      card.append(head, preview);
      card.appendChild(el2("span", "lp-eyebrow", [note.author, note.mood].filter(Boolean).join(" · ")));
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
    const title = el2("input", "lp-input");
    title.placeholder = "Title";
    title.value = note?.title || "";
    const mood = el2("input", "lp-input");
    mood.placeholder = "Mood or tag";
    mood.value = note?.mood || "";
    const body = el2("textarea", "lp-textarea");
    body.style.minHeight = "270px";
    body.placeholder = "Write a memory, thought, or journal entry…";
    body.value = note?.body || "";
    const pinRow = el2("label", "lp-row-between lp-card");
    pinRow.append(el2("span", "lp-title", "Pin for model memory"));
    const pinned = el2("input");
    pinned.type = "checkbox";
    pinned.checked = note?.pinned || false;
    pinRow.appendChild(pinned);
    const save = () => {
      this.send("lumiphone:action", { action: "note", payload: { id: note?.id, title: inputValue2(title), body: body.value, mood: inputValue2(mood), pinned: pinned.checked } });
      this.selectedNoteId = "";
      this.render();
    };
    navSave.addEventListener("click", save);
    content.append(title, mood, body, pinRow);
    if (note) {
      const remove = button2("Delete note", "lp-button lp-button-danger");
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
    const hero = el2("div", "lp-weather-hero");
    const top = el2("div");
    top.append(el2("div", "lp-weather-condition", weather.condition), el2("div", "lp-copy", weather.location));
    const temp = el2("div", "lp-weather-temp", `${weather.temperature}°`);
    const bottom = el2("div", "lp-row-between");
    bottom.append(el2("span", "lp-weather-range", `H:${weather.high}°  L:${weather.low}°`), el2("span", "lp-weather-range", weather.updatedAt ? `Updated ${formatTime(weather.updatedAt)}` : ""));
    hero.append(top, temp, bottom);
    const fields = el2("div", "lp-fields");
    const location = this.field("Location", weather.location);
    const condition = this.field("Condition", weather.condition);
    const temperature = this.field("Temperature", String(weather.temperature), "number");
    const unit = el2("select", "lp-select");
    for (const value of ["C", "F"]) {
      const option = el2("option", "", `°${value}`);
      option.value = value;
      option.selected = weather.unit === value;
      unit.appendChild(option);
    }
    const unitLabel = el2("label", "lp-label", "Unit");
    unitLabel.appendChild(unit);
    const high = this.field("High", String(weather.high), "number");
    const low = this.field("Low", String(weather.low), "number");
    fields.append(location.label, condition.label, temperature.label, unitLabel, high.label, low.label);
    const details = el2("textarea", "lp-textarea");
    details.placeholder = "Atmosphere and roleplay weather details…";
    details.value = weather.details;
    content.append(hero, fields, details);
    const save = page.querySelector(".lp-nav-action:last-child");
    save.addEventListener("click", () => this.send("lumiphone:action", { action: "weather", payload: {
      location: inputValue2(location.input),
      condition: inputValue2(condition.input),
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
    const nowCard = el2("div", "lp-card");
    const nowField = el2("input", "lp-input");
    nowField.type = "datetime-local";
    nowField.value = dateTimeLocal(state.roleplayNow);
    const setNow = button2("Set roleplay now", "lp-button");
    setNow.addEventListener("click", () => {
      const parsed = new Date(nowField.value);
      if (!Number.isNaN(parsed.getTime()))
        this.send("lumiphone:save_roleplay_time", { roleplayNow: parsed.toISOString() });
    });
    nowCard.append(el2("div", "lp-eyebrow", "Roleplay clock"), nowField, setNow);
    content.appendChild(nowCard);
    const timeline = el2("div", "lp-timeline");
    const events = [...state.events].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    for (const event of events) {
      const row = el2("div", "lp-event");
      row.dataset.completed = String(event.completed);
      const dot = el2("span", "lp-event-dot");
      dot.style.setProperty("--event-color", event.color);
      const card = el2("div", "lp-card");
      card.dataset.clickable = "true";
      card.append(el2("div", "lp-eyebrow", `${event.lane} · ${event.whenText || formatDate(event.start, true)}`), el2("h3", "lp-title", event.title));
      if (event.description)
        card.appendChild(el2("p", "lp-copy", event.description));
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
    const whenKindLabel = el2("label", "lp-label", "Time precision");
    const whenKind = el2("select", "lp-select");
    for (const [value, label] of [["exact", "Exact date/time"], ["approximate", "Approximate"], ["relative", "Relative to story"], ["unscheduled", "Unscheduled"]]) {
      const option = el2("option", "", label);
      option.value = value;
      option.selected = (event?.whenKind || "exact") === value;
      whenKind.appendChild(option);
    }
    whenKindLabel.appendChild(whenKind);
    const whenText = this.field("Timeline label", event?.whenText || (event ? formatDate(event.start, true) : ""));
    const start = this.field("Start", event ? dateTimeLocal(event.start) : dateTimeLocal(this.state.roleplayNow), "datetime-local");
    const end = this.field("End", event ? dateTimeLocal(event.end) : dateTimeLocal(this.state.roleplayNow), "datetime-local");
    const description = el2("textarea", "lp-textarea");
    description.placeholder = "What happens?";
    description.value = event?.description || "";
    const completed = el2("input");
    completed.type = "checkbox";
    completed.checked = event?.completed || false;
    const completeRow = el2("label", "lp-card lp-row-between");
    completeRow.append(el2("span", "lp-title", "Completed"), completed);
    content.append(title.label, lane.label, whenKindLabel, whenText.label, start.label, end.label, description, completeRow);
    const save = page.querySelector(".lp-nav-action:last-child");
    save.addEventListener("click", () => {
      const startDate = new Date(start.input.value);
      const endDate = new Date(end.input.value);
      this.send("lumiphone:action", { action: "event", payload: {
        id: event?.id,
        title: inputValue2(title.input),
        lane: inputValue2(lane.input),
        description: description.value,
        start: Number.isNaN(startDate.getTime()) ? this.state.roleplayNow : startDate.toISOString(),
        end: Number.isNaN(endDate.getTime()) ? this.state.roleplayNow : endDate.toISOString(),
        whenKind: whenKind.value,
        whenText: inputValue2(whenText.input),
        completed: completed.checked
      } });
      this.selectedEventId = "";
      this.render();
    });
    if (event) {
      const remove = button2("Delete event", "lp-button lp-button-danger");
      remove.addEventListener("click", () => {
        this.send("lumiphone:delete", { kind: "event", id: event.id });
        this.selectedEventId = "";
        this.render();
      });
      content.appendChild(remove);
    }
    return page;
  }
  materializedTracker(tracker) {
    if (!tracker.ratePerHour)
      return tracker;
    const elapsed = (Date.now() - Date.parse(tracker.lastUpdated)) / 3600000;
    if (!Number.isFinite(elapsed) || elapsed <= 0)
      return tracker;
    return { ...tracker, value: Math.max(tracker.min, Math.min(tracker.max, tracker.value + elapsed * tracker.ratePerHour)) };
  }
  renderTrackers() {
    const trackers = this.state.trackers.map((item) => this.materializedTracker(item));
    const selected = trackers.find((item) => item.id === this.selectedTrackerId);
    if (this.selectedTrackerId === "__new__" || selected)
      return this.renderTrackerEditor(selected || null);
    const { page, content } = this.page("Trackers", "Live roleplay state", "Add", () => {
      this.selectedTrackerId = "__new__";
      this.render();
    });
    for (const tracker of trackers) {
      const card = el2("div", "lp-card");
      card.dataset.clickable = "true";
      const row = el2("div", "lp-row-between");
      const left = el2("div");
      left.append(el2("div", "lp-eyebrow", tracker.visibleToModel ? "Visible to character" : "Private"), el2("h3", "lp-title", tracker.label));
      row.append(left, el2("div", "lp-tracker-value", `${Number(tracker.value.toFixed(2))}${tracker.unit}`));
      const denominator = Math.max(0.00001, tracker.max - tracker.min);
      const percent = Math.max(0, Math.min(100, (tracker.value - tracker.min) / denominator * 100));
      const progress = el2("div", "lp-progress");
      const fill = el2("span");
      fill.style.setProperty("--progress", `${percent}%`);
      fill.style.setProperty("--tracker-color", tracker.color);
      progress.appendChild(fill);
      card.append(row, progress);
      if (tracker.ratePerHour)
        card.appendChild(el2("div", "lp-rate", `${tracker.ratePerHour > 0 ? "+" : ""}${tracker.ratePerHour}${tracker.unit} per in-app hour · updates automatically`));
      card.addEventListener("click", () => {
        this.selectedTrackerId = tracker.id;
        this.render();
      });
      content.appendChild(card);
    }
    if (!trackers.length)
      content.appendChild(this.empty("trackers", "No live trackers", "Track affinity, health, money, time, quest progress, or any self-updating value."));
    return page;
  }
  renderTrackerEditor(tracker) {
    const { page, content } = this.page(tracker ? "Edit Tracker" : "New Tracker", "Live roleplay state", "Save");
    const label = this.field("Label", tracker?.label || "");
    const value = this.field("Value", String(tracker?.value ?? 0), "number");
    const unit = this.field("Unit", tracker?.unit || "");
    const rate = this.field("Change per hour", String(tracker?.ratePerHour ?? 0), "number");
    const min = this.field("Minimum", String(tracker?.min ?? 0), "number");
    const max = this.field("Maximum", String(tracker?.max ?? 100), "number");
    const color = el2("input", "lp-color-input");
    color.type = "color";
    color.value = /^#[0-9a-f]{6}$/i.test(tracker?.color || "") ? tracker.color : this.preferences.colors.accent;
    const colorRow = el2("label", "lp-card lp-row-between");
    colorRow.append(el2("span", "lp-title", "Tracker color"), color);
    const visible = el2("button", "lp-toggle");
    visible.type = "button";
    visible.setAttribute("aria-pressed", String(tracker?.visibleToModel !== false));
    visible.addEventListener("click", () => visible.setAttribute("aria-pressed", String(visible.getAttribute("aria-pressed") !== "true")));
    const visibleRow = el2("div", "lp-card lp-row-between");
    visibleRow.append(el2("div", "", "Visible to the model"), visible);
    content.append(label.label, value.label, unit.label, rate.label, min.label, max.label, colorRow, visibleRow);
    const save = page.querySelector(".lp-nav-action:last-child");
    save.addEventListener("click", () => {
      this.send("lumiphone:action", { action: "tracker", payload: {
        id: tracker?.id,
        label: inputValue2(label.input),
        value: Number(value.input.value),
        unit: inputValue2(unit.input),
        ratePerHour: Number(rate.input.value),
        min: Number(min.input.value),
        max: Number(max.input.value),
        color: color.value,
        visibleToModel: visible.getAttribute("aria-pressed") === "true"
      } });
      this.selectedTrackerId = "";
      this.render();
    });
    if (tracker) {
      const remove = button2("Delete tracker", "lp-button lp-button-danger");
      remove.addEventListener("click", () => {
        this.send("lumiphone:delete", { kind: "tracker", id: tracker.id });
        this.selectedTrackerId = "";
        this.render();
      });
      content.appendChild(remove);
    }
    return page;
  }
  renderSettings() {
    return renderSettingsView({
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
  }
  field(labelText, value = "", type = "text") {
    const label = el2("label", "lp-label", labelText);
    const input = el2("input", "lp-input");
    input.type = type;
    input.value = value;
    label.appendChild(input);
    return { label, input };
  }
  empty(iconName, title, copy) {
    const node = el2("div", "lp-empty");
    const inner = el2("div");
    inner.append(icon(iconName), el2("h3", "lp-title", title), el2("p", "lp-copy", copy));
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
  const controller = new LumiPhoneController(ctx);
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
