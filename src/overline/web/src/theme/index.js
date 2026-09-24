(() => {
  "use strict";

  const INSTANCE = Symbol.for("overline-extension.theme-v1");
  if (globalThis[INSTANCE]) return;

  const KEY = "appearance";
  const LEGACY_KEY = "severitiumThemeEnabled";
  const LINKS = [
    ["overline-v1-tokens", "src/theme/styles/tokens.css"],
    ["overline-v1-lobby-header", "src/theme/styles/shell/lobby-header.css"],
    ["overline-v1-inner-header", "src/theme/styles/shell/inner-header.css"],
    ["overline-v1-lobby", "src/theme/styles/shell/lobby.css"],
    ["overline-v1-navigation", "src/theme/styles/components/navigation.css"],
    ["overline-v1-controls", "src/theme/styles/components/controls.css"],
    ["overline-v1-garage", "src/theme/styles/screens/garage.css"],
    ["overline-v1-containers", "src/theme/styles/screens/containers.css"],
    ["overline-v1-shop", "src/theme/styles/screens/shop.css"],
    ["overline-v1-settings", "src/theme/styles/screens/settings.css"],
    ["overline-v1-missions", "src/theme/styles/screens/missions.css"],
    ["overline-v1-battle-modes", "src/theme/styles/screens/battle-modes.css"],
    ["overline-v1-friends", "src/theme/styles/screens/friends.css"],
    ["overline-v1-ranks-profile", "src/theme/styles/screens/ranks-profile.css"],
    ["overline-v1-chat-news", "src/theme/styles/screens/chat-news.css"],
    ["overline-v1-dialogs", "src/theme/styles/components/dialogs.css"],
    ["overline-v1-battle-hud", "src/theme/styles/battle/hud.css"],
    ["overline-v1-battle-chat", "src/theme/styles/battle/chat.css"],
    ["overline-v1-battle-tab", "src/theme/styles/battle/tab.css"]
  ];
  const attributes = ["data-overline-theme", "data-overline-screen"];
  let enabled = false;
  let observer = null;
  let pendingFrame = 0;
  let preferenceRevision = 0;
  let initialized = false;

  function update() {
    pendingFrame = 0;
    if (!enabled) return;
    const registry = globalThis.OverlineThemeSelectors;
    // Ambiguous or missing roots leave this context without an activation.
    const matched = ["battle", "inner", "lobby"].filter((name) => {
      try { return registry?.match(name) === true; }
      catch (_) { return false; }
    });
    if (matched.length === 1) document.documentElement.setAttribute("data-overline-screen", matched[0]);
    else document.documentElement.removeAttribute("data-overline-screen");
  }

  function scheduleUpdate() {
    if (enabled && !pendingFrame) pendingFrame = requestAnimationFrame(update);
  }

  function mount() {
    if (enabled) return;
    enabled = true;
    for (const [id, path] of LINKS) globalThis.OverlinePlatform.styles.mount(id, path);
    document.documentElement.setAttribute("data-overline-theme", "v1");
    observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    update();
  }

  function unmount() {
    enabled = false;
    observer?.disconnect();
    observer = null;
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
    for (const attribute of attributes) document.documentElement.removeAttribute(attribute);
    for (const [id] of LINKS) globalThis.OverlinePlatform.styles.unmount(id);
  }

  function normalizeTheme(value) {
    return value === "none" ? "none" : "overline";
  }

  function apply(value) {
    if (normalizeTheme(value) === "none") unmount();
    else mount();
  }

  function onStorageChanged(changes, area) {
    if (area !== "local" || !Object.hasOwn(changes, KEY)) return;
    preferenceRevision++;
    apply(changes[KEY].newValue?.theme);
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    globalThis.OverlinePlatform.storage.onChanged.addListener(onStorageChanged);
    const revision = preferenceRevision;
    globalThis.OverlinePlatform.storage.local.get([KEY, LEGACY_KEY], (values) => {
      if (!initialized || revision !== preferenceRevision) return;
      const storedAppearance = values[KEY] && typeof values[KEY] === "object" ? values[KEY] : {};
      const hasTheme = storedAppearance.theme === "none" || storedAppearance.theme === "overline";
      const theme = hasTheme
        ? storedAppearance.theme
        : values[LEGACY_KEY] === false ? "none" : "overline";
      if (!hasTheme) {
        globalThis.OverlinePlatform.storage.local.set({
          [KEY]: { ...storedAppearance, theme }
        });
      }
      apply(theme);
    });
  }

  function cleanup() {
    if (!initialized) return;
    initialized = false;
    preferenceRevision++;
    globalThis.OverlinePlatform.storage.onChanged.removeListener(onStorageChanged);
    unmount();
    delete globalThis[INSTANCE];
  }

  globalThis[INSTANCE] = Object.freeze({ initialize, apply, mount, update, unmount, cleanup });
  initialize();
})();
