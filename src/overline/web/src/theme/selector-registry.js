(() => {
  "use strict";

  // Exact semantic roots verified against the current Tanki SPA. A miss never
  // falls back to a broad selector or changes the native DOM.
  const entries = Object.freeze({
    lobby: Object.freeze({ selector: ".MainScreenComponentStyle-containerPanel", required: ".MainScreenComponentStyle-playButtonContainer" }),
    inner: Object.freeze({ selector: ".BreadcrumbsComponentStyle-headerContainer", required: ".BreadcrumbsComponentStyle-breadcrumbs" }),
    battle: Object.freeze({ selector: ".BattleHudComponentStyle-hudContainer", required: ".BattleHudComponentStyle-buttonsContainer" })
  });

  const match = (name) => {
    const entry = entries[name];
    if (!entry) return false;
    const roots = document.querySelectorAll(entry.selector);
    return roots.length === 1 && (name === "lobby"
      ? document.querySelectorAll(entry.required).length === 1
      : roots[0].querySelectorAll(entry.required).length === 1);
  };

  globalThis.OverlineThemeSelectors = Object.freeze({ entries, match });
})();
