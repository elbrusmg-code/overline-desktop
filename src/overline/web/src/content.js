(() => {
  "use strict";

  const INSTANCE = Symbol.for("overline-extension.instance");
  if (globalThis[INSTANCE]) {
    if (!globalThis[INSTANCE].isConnected) (document.body || document.documentElement).append(globalThis[INSTANCE]);
    return;
  }
  if (document.getElementById("overline-extension-root")) return;

  const defaultHotkeys = { visibility: "M", toggle: "K", reset: "I", add: "L", subtract: "J" };
  const defaultAppearance = {
    background: "#151d23", text: "#ffffff", warningText: "#f06d73",
    border: "#536269", warningBorder: "#a94d53", opacity: 86,
    blur: 5, radius: 6, borderWidth: 1, fontSize: 22, timerScale: 1
  };
  const defaults = {
    duration: 100, addSeconds: 5, subtractSeconds: 5, warningSeconds: 10,
    showTimer: true, timerMovement: true, timerPosition: null,
    audioEnabled: true, volume: 0.8, hotkeys: defaultHotkeys, appearance: defaultAppearance
  };
  const settings = { ...defaults, hotkeys: { ...defaultHotkeys }, appearance: { ...defaultAppearance } };
  const host = document.createElement("div");
  host.id = "overline-extension-root";
  const shadow = host.attachShadow({ mode: "closed" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(globalThis.OverlinePlatform.resources.getText("src/panel.css"));
  shadow.adoptedStyleSheets = [sheet];
  const template = document.createElement("template");
  template.innerHTML = `
    <div class="timer-hud" role="timer" aria-label="Overline time remaining" tabindex="0">01:40</div>
    <div class="backdrop hidden">
      <section class="settings-window" role="dialog" aria-modal="true" aria-label="Overline control center" tabindex="-1">
        <header class="topbar">
          <div class="brand"><img class="brand-logo" src="${globalThis.OverlinePlatform.resources.getURL("src/assets/branding/icons/icon-32.png")}" alt=""><span><strong>OVERLINE</strong><small>CONTROL CENTER</small></span></div>
          <button type="button" class="close-panel" aria-label="Close Overline panel">×</button>
        </header>
        <div class="panel-body">
          <nav class="topnav" aria-label="Settings sections">
            <button type="button" data-page="timer" class="selected" aria-current="page">Timer</button>
            <button type="button" data-page="audio">Audio</button>
            <button type="button" data-page="appearance">Appearance</button>
            <button type="button" data-page="nickname-style">Nickname Style</button>
            <button type="button" data-page="about">About</button>
          </nav>
        <main class="content">
          <section class="page" data-content="timer">
            <div class="page-heading"><div><p class="eyebrow">CONTROL / 01</p><h1>Timer</h1></div><p>Manual overtime countdown and keyboard controls.</p></div>
            <div class="timer-console"><div><span class="console-label">TIME REMAINING</span><strong class="timer-readout">01:40</strong><span class="timer-state" role="status">Ready · repeats automatically</span></div><div class="timer-actions"><button type="button" class="timer-toggle primary-action">Start</button><button type="button" class="timer-reset">Reset</button><button type="button" class="timer-subtract">− Time</button><button type="button" class="timer-add">+ Time</button></div></div>
            <h2>General</h2>
            <div class="settings-grid">
              <label class="setting"><span>Show timer</span><input class="show-timer" type="checkbox" checked></label>
              <label class="setting"><span>Initial duration <small>seconds</small></span><input class="duration" type="number" min="1" max="59999" step="1" value="100"></label>
              <label class="setting"><span>Add time <small>seconds</small></span><input class="add-seconds" type="number" min="1" max="3600" step="1" value="5"></label>
              <label class="setting"><span>Subtract time <small>seconds</small></span><input class="subtract-seconds" type="number" min="1" max="3600" step="1" value="5"></label>
              <label class="setting"><span>Final warning <small>seconds</small></span><input class="warning-seconds" type="number" min="0" max="3600" step="1" value="10"></label>
              <label class="setting"><span>Timer movement</span><input class="timer-movement" type="checkbox" checked></label>
            </div>
            <h2>Hotkeys</h2>
            <p class="section-note">Click a shortcut, then press a key. Escape cancels capture.</p>
            <div class="hotkey-grid">
              <div><span>Show / hide timer</span><button type="button" data-hotkey="visibility"></button></div>
              <div><span>Start / pause / continue</span><button type="button" data-hotkey="toggle"></button></div>
              <div><span>Reset timer</span><button type="button" data-hotkey="reset"></button></div>
              <div><span>Add time</span><button type="button" data-hotkey="add"></button></div>
              <div><span>Subtract time</span><button type="button" data-hotkey="subtract"></button></div>
            </div>
            <p class="hotkey-message" role="status" aria-live="polite"></p>
          </section>
          <section class="page hidden" data-content="audio">
            <div class="page-heading"><div><p class="eyebrow">CONTROL / 02</p><h1>Audio</h1></div><p>Local countdown cue.</p></div>
            <div class="audio-controls">
              <label>Audio enabled <input class="audio-enabled" type="checkbox" checked></label>
              <label>Volume <input class="volume" type="range" min="0" max="1" step="0.05" value="0.8"></label>
            </div>
            <div class="sound-slot"><strong>20 seconds remaining</strong><button class="preview-sound" type="button">Preview</button></div>
            <p class="section-note">Bundled sound plays once per timer run when the countdown crosses 20 seconds.</p>
          </section>
          <section class="page hidden" data-content="appearance">
            <div class="page-heading"><div><p class="eyebrow">CONTROL / 03</p><h1>Appearance</h1></div><p>Customize the gameplay timer display.</p></div>
            <div class="appearance-layout">
              <div class="appearance-grid">
                <label>Background color <input type="color" data-appearance="background"></label>
                <label>Text color <input type="color" data-appearance="text"></label>
                <label>Warning text color <input type="color" data-appearance="warningText"></label>
                <label>Border color <input type="color" data-appearance="border"></label>
                <label>Warning border color <input type="color" data-appearance="warningBorder"></label>
                <label>Background opacity <span><input type="range" data-appearance="opacity" min="0" max="100" step="1"><output></output></span></label>
                <label>Background blur <span><input type="number" data-appearance="blur" min="0" max="30" step="1"> px</span></label>
                <label>Corner radius <span><input type="number" data-appearance="radius" min="0" max="30" step="1"> px</span></label>
                <label>Border width <span><input type="number" data-appearance="borderWidth" min="0" max="8" step="1"> px</span></label>
                <label>Font size <span><input type="number" data-appearance="fontSize" min="14" max="36" step="1"> px</span></label>
                <label>Timer Size <span><input type="range" data-appearance="timerScale" min="50" max="200" step="5"><output>100%</output></span></label>
                <label>Timer movement <input class="appearance-movement" type="checkbox" checked></label>
              </div>
              <aside class="preview-area"><span>LIVE PREVIEW</span><div class="timer-preview">01:40</div><button class="reset-position" type="button">Reset timer position</button><button class="restore-appearance" type="button">Restore default appearance</button></aside>
            </div>
          </section>
          <section class="page hidden" data-content="nickname-style">
            <div class="page-heading"><div><p class="eyebrow">FEATURE / 02</p><h1>Nickname Style</h1></div><p>Customize your local nickname appearance.</p></div>
            <p class="section-note">Local appearance — visible only to you</p>
            <div class="nickname-editor"></div>
          </section>
          <section class="page hidden" data-content="about">
            <div class="page-heading"><div><p class="eyebrow">CONTROL / 04</p><h1>About Overline</h1></div><p>Version 0.1.0</p></div>
            <div class="about-copy"><p>Developed by Elbrus Guliyev</p><p>Unofficial companion extension for Tanki Online</p><p>Not affiliated with Tanki Online or Alternativa Games</p><p>Does not automate or modify gameplay</p></div>
          </section>
        </main>
        </div>
      </section>
    </div>`;
  shadow.append(template.content);
  (document.body || document.documentElement).append(host);
  globalThis[INSTANCE] = host;

  const $ = (selector) => shadow.querySelector(selector);
  const $$ = (selector) => [...shadow.querySelectorAll(selector)];
  const hud = $(".timer-hud");
  const backdrop = $(".backdrop");
  const nicknameStyle = globalThis.OverlineNicknameStyle.create(shadow, $(".nickname-editor"));
  let phase = "idle", remainingMs = defaults.duration * 1000, targetTime = 0, tickId = null;
  let cycleDurationMs = defaults.duration * 1000, cycleNumber = 0, warnedCycle = -1;
  let captureAction = null, lastFocus = null;
  let currentAudio = null;
  const soundUrl = globalThis.OverlinePlatform.resources.getURL("assets/sounds/over-20.mp3");
  const save = (value) => globalThis.OverlinePlatform.storage.local.set(value);

  function format(ms) {
    const seconds = Math.ceil(Math.max(0, ms) / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
  }
  function rgba(hex, opacity) {
    const value = hex.slice(1);
    const rgb = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
    return "rgba(" + rgb.join(",") + "," + (opacity / 100) + ")";
  }
  function applyAppearance() {
    const a = settings.appearance;
    host.style.setProperty("--timer-background", rgba(a.background, a.opacity));
    host.style.setProperty("--timer-text", a.text);
    host.style.setProperty("--timer-warning-text", a.warningText);
    host.style.setProperty("--timer-border", a.border);
    host.style.setProperty("--timer-warning-border", a.warningBorder);
    host.style.setProperty("--timer-blur", a.blur + "px");
    host.style.setProperty("--timer-radius", a.radius + "px");
    host.style.setProperty("--timer-border-width", a.borderWidth + "px");
    host.style.setProperty("--timer-font-size", a.fontSize + "px");
    host.style.setProperty("--timer-scale", a.timerScale);
    if (hud.classList.contains("positioned")) clampPosition(parseFloat(hud.style.left), parseFloat(hud.style.top));
    hud.classList.toggle("movable", settings.timerMovement);
    $(".timer-preview").textContent = hud.textContent;
  }
  function render() {
    hud.textContent = format(remainingMs);
    $(".timer-preview").textContent = hud.textContent;
    $(".timer-readout").textContent = hud.textContent;
    $(".timer-state").textContent = (phase === "running" ? "Running" : phase === "paused" ? "Paused" : "Ready") + " · repeats automatically";
    $(".timer-toggle").textContent = phase === "running" ? "Pause" : phase === "paused" ? "Continue" : "Start";
    hud.classList.toggle("hidden", !settings.showTimer);
    const warning = phase !== "idle" && remainingMs <= settings.warningSeconds * 1000;
    hud.classList.toggle("warning", warning);
    $(".timer-preview").classList.toggle("warning", warning);
  }
  function stopAudio() {
    if (!currentAudio) return;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  function playSound() {
    if (!settings.audioEnabled) return;
    stopAudio();
    try {
      const audio = new Audio(soundUrl);
      audio.volume = settings.volume;
      audio.playbackRate = 1;
      currentAudio = audio;
      audio.play().catch(() => { if (currentAudio === audio) currentAudio = null; });
    } catch (_) { currentAudio = null; }
  }
  function warnCurrentCycle() {
    if (remainingMs <= 20000 && warnedCycle !== cycleNumber) {
      warnedCycle = cycleNumber;
      playSound();
    }
  }
  function stopTick() { if (tickId !== null) clearInterval(tickId); tickId = null; }
  function advanceCycle(now) {
    if (now >= targetTime) {
      // Advance from the previous target, not from now, so throttling cannot add drift.
      const cyclesPassed = Math.floor((now - targetTime) / cycleDurationMs) + 1;
      targetTime += cyclesPassed * cycleDurationMs;
      cycleNumber += cyclesPassed;
    }
    remainingMs = targetTime - now;
  }
  function update() {
    if (phase !== "running") return;
    advanceCycle(performance.now());
    warnCurrentCycle();
    render();
  }
  function startPauseContinue() {
    if (phase === "running") {
      update();
      stopTick();
      phase = "paused";
      render();
      return;
    }
    if (remainingMs <= 0) return;
    if (phase === "idle") {
      cycleDurationMs = Math.max(1000, settings.duration * 1000);
      cycleNumber = 0;
      warnedCycle = -1;
      stopAudio();
    }
    targetTime = performance.now() + remainingMs;
    phase = "running";
    update();
    if (tickId === null) tickId = setInterval(update, 100);
  }
  function reset() {
    stopTick();
    stopAudio();
    phase = "idle";
    remainingMs = settings.duration * 1000;
    cycleDurationMs = Math.max(1000, settings.duration * 1000);
    cycleNumber = 0;
    warnedCycle = -1;
    render();
  }
  function adjust(deltaSeconds) {
    if (phase === "running") {
      update();
      targetTime += deltaSeconds * 1000;
      advanceCycle(performance.now());
      warnCurrentCycle();
    } else if (phase === "paused") {
      remainingMs += deltaSeconds * 1000;
      if (remainingMs <= 0) {
        const cyclesPassed = Math.floor(-remainingMs / cycleDurationMs) + 1;
        remainingMs += cyclesPassed * cycleDurationMs;
        cycleNumber += cyclesPassed;
      }
      warnCurrentCycle();
    } else {
      remainingMs = Math.max(0, remainingMs + deltaSeconds * 1000);
    }
    render();
  }
  function selectPage(name) {
    $$(".topnav button").forEach((button) => {
      const selected = button.dataset.page === name;
      button.classList.toggle("selected", selected);
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    $$(".page").forEach((page) => page.classList.toggle("hidden", page.dataset.content !== name));
    $(".content").scrollTop = 0;
    if (name === "nickname-style") nicknameStyle.refresh();
  }
  function openMenu() {
    lastFocus = shadow.activeElement || document.activeElement;
    backdrop.classList.remove("hidden");
    document.addEventListener("keydown", handleOpenKey, true);
    document.addEventListener("focusin", keepPanelFocus, true);
    shadow.addEventListener("keydown", handlePanelKey);
    shadow.addEventListener("keyup", isolatePanelKeyUp);
    $(".topnav button.selected").focus();
  }
  function closeMenu() {
    if (backdrop.classList.contains("hidden")) return;
    document.removeEventListener("keydown", handleOpenKey, true);
    document.removeEventListener("focusin", keepPanelFocus, true);
    shadow.removeEventListener("keydown", handlePanelKey);
    shadow.removeEventListener("keyup", isolatePanelKeyUp);
    backdrop.classList.add("hidden");
    if (captureAction) endCapture();
    if (lastFocus?.isConnected) lastFocus.focus();
    lastFocus = null;
  }
  function toggleMenu() { if (backdrop.classList.contains("hidden")) openMenu(); else closeMenu(); }
  function clampPosition(x, y) {
    const scale = settings.appearance.timerScale;
    hud.style.left = Math.max(8, Math.min(x, window.innerWidth - hud.offsetWidth * scale - 8)) + "px";
    hud.style.top = Math.max(8, Math.min(y, window.innerHeight - hud.offsetHeight * scale - 8)) + "px";
    hud.classList.add("positioned");
  }
  function restorePosition(position) {
    if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) clampPosition(position.x, position.y);
  }
  window.addEventListener("resize", () => {
    if (hud.classList.contains("positioned")) clampPosition(parseFloat(hud.style.left), parseFloat(hud.style.top));
  });
  function setMovement(value) {
    settings.timerMovement = value;
    $(".timer-movement").checked = value;
    $(".appearance-movement").checked = value;
    applyAppearance();
    save({ timerMovement: value });
  }
  function normalizeKey(event) {
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return null;
    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    return /^[A-Z0-9]$/.test(key) || /^F([1-9]|1[0-2])$/.test(key) ||
      ["Insert", "Delete", "Home", "End", "PageUp", "PageDown"].includes(key) ? key : null;
  }
  function renderHotkeys() {
    $$("[data-hotkey]").forEach((button) => {
      button.textContent = button.dataset.hotkey === captureAction ? "Press a key…" : settings.hotkeys[button.dataset.hotkey];
      button.setAttribute("aria-label", button.dataset.hotkey + " shortcut: " + button.textContent);
    });
  }
  function endCapture() { captureAction = null; renderHotkeys(); }
  function captureKey(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Escape") { endCapture(); $(".hotkey-message").textContent = "Shortcut change cancelled."; return; }
    const key = normalizeKey(event);
    if (!key) { $(".hotkey-message").textContent = "Use a letter, number, function key, or supported navigation key without modifiers."; return; }
    const duplicate = Object.entries(settings.hotkeys).find(([action, value]) => action !== captureAction && value === key);
    if (duplicate || key === "Insert") {
      $(".hotkey-message").textContent = key + " is already used by " + (duplicate?.[0] || "the menu") + ". Choose another key.";
      return;
    }
    settings.hotkeys[captureAction] = key;
    save({ hotkeys: settings.hotkeys });
    $(".hotkey-message").textContent = "Shortcut saved: " + key + ".";
    endCapture();
  }
  function typingTarget(event) {
    const target = event.composedPath()[0];
    return target instanceof Element && (target.isContentEditable ||
      Boolean(target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")));
  }
  function panelFocusables() {
    return $$(".settings-window button, .settings-window input, .settings-window select, .settings-window textarea, .settings-window [tabindex]")
      .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
  }
  function keepPanelFocus(event) {
    if (event.target !== host || !$(".settings-window").contains(shadow.activeElement)) {
      ($(".topnav button.selected") || $(".settings-window")).focus();
    }
  }
  function isolatePanelKeyUp(event) { event.stopPropagation(); }
  function handlePanelKey(event) {
    if (captureAction) { captureKey(event); return; }
    event.stopPropagation();
  }
  function handleOpenKey(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const focusables = panelFocusables();
      if (!focusables.length) { $(".settings-window").focus(); return; }
      const current = shadow.activeElement;
      const index = focusables.indexOf(current);
      focusables[event.shiftKey ? (index <= 0 ? focusables.length - 1 : index - 1) : (index < 0 || index === focusables.length - 1 ? 0 : index + 1)].focus();
      return;
    }
    if (!captureAction && (event.key === "Insert" || event.key === "Escape")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMenu();
      return;
    }
    // Ordinary keys reach the focused control, then stop at the shadow boundary.
  }
  function handleKey(event) {
    // The open panel handles Tab; outside it, leave Tab to Tanki.
    if (event.key === "Tab") return;
    if (!backdrop.classList.contains("hidden")) return;
    if (captureAction) { captureKey(event); return; }
    if (event.repeat || typingTarget(event)) return;
    const key = normalizeKey(event);
    if (event.key === "Escape") { closeMenu(); return; }
    if (!key) return;
    if (key === "Insert") { event.preventDefault(); event.stopImmediatePropagation(); toggleMenu(); return; }
    const action = Object.keys(settings.hotkeys).find((name) => settings.hotkeys[name] === key);
    if (!action) return;
    switch (action) {
      case "visibility": settings.showTimer = !settings.showTimer; $(".show-timer").checked = settings.showTimer; save({ showTimer: settings.showTimer }); render(); break;
      case "toggle": startPauseContinue(); break;
      case "reset": reset(); break;
      case "add": adjust(settings.addSeconds); break;
      case "subtract": adjust(-settings.subtractSeconds); break;
    }
  }

  $(".preview-sound").addEventListener("click", playSound);
  $(".close-panel").addEventListener("click", closeMenu);
  for (const type of ["pointerdown", "pointerup", "mousedown", "mouseup", "click"]) {
    backdrop.addEventListener(type, (event) => event.stopPropagation());
  }
  $(".timer-toggle").addEventListener("click", startPauseContinue);
  $(".timer-reset").addEventListener("click", reset);
  $(".timer-add").addEventListener("click", () => adjust(settings.addSeconds));
  $(".timer-subtract").addEventListener("click", () => adjust(-settings.subtractSeconds));

  $$(".topnav button").forEach((button) => button.addEventListener("click", () => selectPage(button.dataset.page)));
  $$("[data-hotkey]").forEach((button) => button.addEventListener("click", () => {
    captureAction = button.dataset.hotkey;
    $(".hotkey-message").textContent = "Press a key for " + captureAction + ".";
    renderHotkeys();
  }));
  document.addEventListener("keydown", handleKey);
  $(".show-timer").addEventListener("change", (event) => { settings.showTimer = event.target.checked; save({ showTimer: settings.showTimer }); render(); });
  $(".timer-movement").addEventListener("change", (event) => setMovement(event.target.checked));
  $(".appearance-movement").addEventListener("change", (event) => setMovement(event.target.checked));
  for (const [selector, key, min, max] of [
    [".duration", "duration", 1, 59999], [".add-seconds", "addSeconds", 1, 3600],
    [".subtract-seconds", "subtractSeconds", 1, 3600], [".warning-seconds", "warningSeconds", 0, 3600]
  ]) {
    $(selector).addEventListener("change", (event) => {
      const value = Math.min(max, Math.max(min, Math.trunc(Number(event.target.value) || min)));
      event.target.value = String(value);
      settings[key] = value;
      save({ [key]: value });
      if (key === "duration" && phase === "idle") remainingMs = value * 1000;
      render();
    });
  }
  $(".audio-enabled").addEventListener("change", (event) => {
    settings.audioEnabled = event.target.checked;
    if (!settings.audioEnabled) stopAudio();
    $(".preview-sound").disabled = !settings.audioEnabled;
    save({ audioEnabled: settings.audioEnabled });
  });
  $(".volume").addEventListener("input", (event) => {
    settings.volume = Number(event.target.value);
    if (currentAudio) currentAudio.volume = settings.volume;
    save({ volume: settings.volume });
  });
  $$("[data-appearance]").forEach((input) => input.addEventListener("input", () => {
    const key = input.dataset.appearance;
    settings.appearance[key] = key === "timerScale" ? Number(input.value) / 100 : input.type === "color" ? input.value : Number(input.value);
    if (key === "opacity") input.parentElement.querySelector("output").textContent = input.value + "%";
    if (key === "timerScale") input.parentElement.querySelector("output").textContent = input.value + "%";
    applyAppearance();
    save({ appearance: settings.appearance });
  }));
  $(".reset-position").addEventListener("click", () => {
    settings.timerPosition = null;
    hud.style.removeProperty("left"); hud.style.removeProperty("top"); hud.classList.remove("positioned");
    save({ timerPosition: null });
  });
  $(".restore-appearance").addEventListener("click", () => {
    settings.appearance = { ...defaultAppearance };
    setMovement(true);
    renderAppearanceInputs();
    applyAppearance();
    render();
    save({ appearance: settings.appearance });
  });
  function renderAppearanceInputs() {
    $$("[data-appearance]").forEach((input) => {
      input.value = String(input.dataset.appearance === "timerScale" ? Math.round(settings.appearance.timerScale * 100) : settings.appearance[input.dataset.appearance]);
      if (input.dataset.appearance === "opacity") input.parentElement.querySelector("output").textContent = input.value + "%";
      if (input.dataset.appearance === "timerScale") input.parentElement.querySelector("output").textContent = input.value + "%";
    });
  }
  hud.addEventListener("pointerdown", (event) => {
    if (!settings.timerMovement || event.button !== 0) return;
    const rect = hud.getBoundingClientRect();
    const offsetX = event.clientX - rect.left, offsetY = event.clientY - rect.top;
    let moved = false;
    hud.setPointerCapture(event.pointerId);
    const move = (point) => {
      if (!moved && Math.hypot(point.clientX - event.clientX, point.clientY - event.clientY) < 4) return;
      moved = true;
      clampPosition(point.clientX - offsetX, point.clientY - offsetY);
    };
    const end = () => {
      hud.removeEventListener("pointermove", move);
      hud.removeEventListener("pointerup", end);
      hud.removeEventListener("pointercancel", end);
      if (moved) {
        settings.timerPosition = { x: parseFloat(hud.style.left), y: parseFloat(hud.style.top) };
        save({ timerPosition: settings.timerPosition });
      }
    };
    hud.addEventListener("pointermove", move);
    hud.addEventListener("pointerup", end);
    hud.addEventListener("pointercancel", end);
  });

  globalThis.OverlinePlatform.storage.local.get([...Object.keys(defaults), "theme", "voice", "minutes", "seconds", "widgetPosition"], (stored) => {
    const savedSettings = { ...stored };
    if (Object.prototype.hasOwnProperty.call(savedSettings, "theme")) {
      delete savedSettings.theme;
      globalThis.OverlinePlatform.storage.local.remove("theme");
    }
    Object.assign(settings, savedSettings);
    // Carry forward settings from the earlier HUD version on first upgrade.
    if (stored.audioEnabled === undefined && typeof stored.voice === "boolean") settings.audioEnabled = stored.voice;
    if (stored.duration === undefined && Number.isFinite(stored.minutes) && Number.isFinite(stored.seconds)) {
      settings.duration = Math.max(1, stored.minutes * 60 + stored.seconds);
    }
    if (stored.timerPosition === undefined && stored.widgetPosition) settings.timerPosition = stored.widgetPosition;
    settings.hotkeys = Object.fromEntries(Object.keys(defaultHotkeys).map((key) => [key, stored.hotkeys?.[key] || defaultHotkeys[key]]));
    if (stored.hotkeys?.menu) save({ hotkeys: settings.hotkeys });
    settings.appearance = { ...defaultAppearance, ...stored.appearance };
    settings.appearance.timerScale = Number.isFinite(settings.appearance.timerScale)
      ? Math.round(Math.min(2, Math.max(0.5, settings.appearance.timerScale)) * 20) / 20 : 1;
    for (const [selector, key] of [
      [".duration", "duration"], [".add-seconds", "addSeconds"],
      [".subtract-seconds", "subtractSeconds"], [".warning-seconds", "warningSeconds"]
    ]) $(selector).value = String(settings[key]);
    $(".show-timer").checked = settings.showTimer;
    $(".audio-enabled").checked = settings.audioEnabled;
    $(".preview-sound").disabled = !settings.audioEnabled;
    $(".volume").value = String(settings.volume);
    $(".timer-movement").checked = settings.timerMovement;
    $(".appearance-movement").checked = settings.timerMovement;
    remainingMs = settings.duration * 1000;
    renderHotkeys();
    renderAppearanceInputs();
    applyAppearance();
    render();
    restorePosition(settings.timerPosition);
  });
})();
