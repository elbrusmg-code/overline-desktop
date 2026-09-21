(() => {
  "use strict";

  const KEY = "overlineNicknameStyleV1";
  // Native selectors are intentionally limited to the local UID and native TAB.
  const SELECTORS = Object.freeze({
    uid: ".ClientInfoComponentStyle-parameterText",
    tab: ".BattleTabStatisticComponentStyle-container",
    row: "tbody tr",
    nick: ".BattleTabStatisticComponentStyle-nicknameCell",
    text: "span.-whiteSpaceNoWrap"
  });
  const COLOURS = [
    ["default", "Default", ""], ["gold", "Gold", "#e4cf9b"], ["amber", "Amber", "#eab97b"],
    ["flame", "Flame", "#ee987c"], ["blood", "Blood", "#e994a0"], ["pink", "Pink", "#e7b4c9"],
    ["fuchsia", "Fuchsia", "#d7a7d8"], ["violet", "Violet", "#baaee8"], ["indigo", "Indigo", "#a3b7e8"],
    ["sky", "Sky", "#9ccde7"], ["ice", "Ice", "#b6dce8"], ["teal", "Teal", "#83d1c8"],
    ["mint", "Mint", "#9fe0be"], ["lime", "Lime", "#c5dd9d"], ["khaki", "Khaki", "#c5c59a"],
    ["sand", "Sand", "#dcc6a4"], ["copper", "Copper", "#d2ab92"], ["steel", "Steel", "#adbfca"],
    ["silver", "Silver", "#d8e0e2"], ["white", "White", "#f3f7f6"], ["graphite", "Graphite", "#a9b6bd"]
  ];
  const FONTS = [
    ["default", "Default", ""], ["compact", "Compact", "Arial Narrow, Arial, sans-serif"],
    ["technical", "Technical", "Consolas, Lucida Console, monospace"],
    ["square", "Square", "Tahoma, Geneva, sans-serif"],
    ["classic", "Classic", "Georgia, Times New Roman, serif"],
    ["heavy", "Heavy", "Arial Black, Impact, sans-serif"],
    ["wide", "Wide", "Trebuchet MS, Verdana, sans-serif"]
  ];
  const OUTLINES = [
    ["none", "None", ""], ["black", "Black", "#111923"], ["white", "White", "#edf4f5"],
    ["gold", "Gold", "#a7986f"], ["blood", "Blood", "#a45d68"], ["violet", "Violet", "#78699f"],
    ["sky", "Sky", "#5b91ad"], ["mint", "Mint", "#5d9d88"], ["steel", "Steel", "#6c8591"]
  ];
  const BACKGROUNDS = [
    ["none", "None", ""],
    ["gold", "Gold", "linear-gradient(112deg,#544733 0%,#a98b57 35%,#e3c884 48%,#6d5b40 68%,#3b342b 100%)"],
    ["ember", "Ember", "radial-gradient(circle at 37% 90%,#a44e39 0%,transparent 31%),linear-gradient(110deg,#252a30,#794137 58%,#303138)"],
    ["crimson", "Crimson", "linear-gradient(115deg,#322a32 0%,#8f394b 49%,#5b2937 70%,#282b33 100%)"],
    ["sunset", "Sunset", "linear-gradient(180deg,#574765 0%,#9d6470 52%,#d6946b 72%,#454653 100%)"],
    ["desert", "Desert", "linear-gradient(110deg,#55463b,#b19262 50%,#685845 78%,#333b3b)"],
    ["forest", "Forest", "linear-gradient(110deg,#253b34,#3f7556 48%,#315947 75%,#243834)"],
    ["mint", "Mint", "linear-gradient(110deg,#284a48,#62ae91 48%,#3c867c 78%,#294448)"],
    ["depth", "Depth", "linear-gradient(110deg,#132a3b,#285a81 44%,#1d455e 72%,#182d3b)"],
    ["frost", "Frost", "linear-gradient(110deg,#3a5969,#9dcbd3 47%,#6fa5b7 76%,#334c5b)"],
    ["twilight", "Twilight", "linear-gradient(110deg,#27354f,#555080 47%,#394970 76%,#253247)"],
    ["neon", "Neon", "linear-gradient(112deg,#182e39 0%,#1d6973 48%,#398e8c 52%,#253e52 77%,#192b36 100%)"],
    ["steel", "Steel", "linear-gradient(110deg,#34454e,#829ba6 38%,#4a6470 60%,#33434b)"],
    ["shadow", "Shadow", "linear-gradient(110deg,#151e27,#3a4351 40%,#252b35 65%,#111b24)"],
    ["glow", "Glow", "radial-gradient(ellipse at 54% 50%,#72c9aa 0%,#458e8e 30%,#2c535b 58%,#23383f 100%)"],
    ["azerbaijan", "Azerbaijan", "local-flag-asset"]
  ];
  // Small original vector accents shared by the preview and native TAB row.
  const MOTIFS = {
    gold: ["#f5e2ae", '<path d="M12 20l4-12 10 7 10-7 4 12z"/><path d="M18 23h16"/><circle cx="26" cy="8" r="2" fill="#f5e2ae"/>'],
    ember: ["#f0ad84", '<circle cx="11" cy="19" r="1.6" fill="#f0ad84"/><circle cx="27" cy="8" r="1" fill="#f0ad84"/><path d="M37 21l2-5 2 5"/>'],
    crimson: ["#bd6370", '<path d="M8 8h18M15 13h19" opacity=".55"/><path d="M39 7c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z" fill="#9c4654" stroke="none"/>'],
    sunset: ["#e6b79d", '<path d="M5 19h42M18 19a8 8 0 0 1 16 0"/><path d="M9 23h33" opacity=".55"/>'],
    desert: ["#d3bb91", '<path d="M3 22c9-10 13-10 22 0M19 22c10-8 18-8 30 0"/>'],
    forest: ["#88ba9c", '<path d="M11 22c3-12 12-16 21-17-1 12-7 19-21 17z"/><path d="M11 22L31 6"/>'],
    mint: ["#a0dbc5", '<path d="M10 21c4-8 9-11 16-11-1 7-7 12-16 11zM25 18c3-7 8-10 16-10-2 8-7 12-16 10z"/>'],
    depth: ["#87c1c6", '<path d="M3 10c7 5 11 5 18 0s11-5 18 0M10 18c7 5 11 5 18 0s11-5 18 0"/>'],
    frost: ["#c8e5e8", '<path d="M27 3v22M16 8l22 12M16 20L38 8M23 6l4 3 4-3M23 22l4-3 4 3"/>'],
    twilight: ["#c4bce5", '<path d="M30 5a10 10 0 1 0 8 15 9 9 0 0 1-8-15z"/><path d="M12 5v5m-2-2h5"/>'],
    neon: ["#71d9d1", '<path d="M6 6h26l-9 16h22"/><path d="M8 23h10" opacity=".6"/>'],
    steel: ["#b5c7ce", '<path d="M6 6h39M6 22h39M10 6v16M42 6v16"/><circle cx="13" cy="10" r="1" fill="#b5c7ce"/><circle cx="39" cy="18" r="1" fill="#b5c7ce"/>'],
    shadow: ["#8295a0", '<path d="M5 23L21 4l12 19M20 23L40 7l8 16" opacity=".68"/>'],
    glow: ["#9cddd1", '<circle cx="26" cy="14" r="9"/><circle cx="26" cy="14" r="5" opacity=".65"/><path d="M26 1v4m0 18v4M13 14h4m18 0h4"/>']
  };
  function backgroundVisual(id) {
    const gradient = value(BACKGROUNDS, id);
    if (!gradient) return null;
    if (id === "azerbaijan") return [
      `url("${globalThis.OverlinePlatform.resources.getURL("src/assets/nickname-backgrounds/azerbaijan.svg")}")`
    ];
    const motif = MOTIFS[id];
    if (!motif) return [gradient];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="48" viewBox="0 0 800 48" fill="none" stroke="${motif[0]}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity=".8"><g transform="translate(716 10) scale(1.2)">${motif[1]}</g></svg>`;
    return [`url("data:image/svg+xml,${encodeURIComponent(svg)}")`, gradient];
  }
  const FLAGS = [
    ["none", "None"], ["ru", "Russia"], ["ua", "Ukraine"], ["de", "Germany"],
    ["fr", "France"], ["it", "Italy"], ["es", "Spain"], ["pl", "Poland"],
    ["nl", "Netherlands"], ["be", "Belgium"], ["at", "Austria"], ["ch", "Switzerland"],
    ["ie", "Ireland"], ["ro", "Romania"], ["hu", "Hungary"], ["bg", "Bulgaria"],
    ["lt", "Lithuania"], ["lv", "Latvia"], ["ee", "Estonia"], ["se", "Sweden"],
    ["no", "Norway"], ["dk", "Denmark"], ["fi", "Finland"], ["is", "Iceland"],
    ["am", "Armenia"], ["jp", "Japan"], ["id", "Indonesia"], ["bd", "Bangladesh"],
    ["co", "Colombia"], ["pe", "Peru"], ["ng", "Nigeria"], ["pw", "Palau"],
    ["us", "USA"], ["gb", "United Kingdom"], ["tr", "Turkey"], ["ar", "Argentina"],
    ["kz", "Kazakhstan"], ["az", "Azerbaijan"]
  ];
  const DECORATIONS = [
    ["none", "None", ""], ["petals", "Petals", "✿"], ["hearts", "Hearts", "♥"],
    ["skull", "Skull", "☠"], ["stars", "Stars", "✦"], ["flame", "Flame", "♨"],
    ["leaves", "Leaves", "❧"], ["lightning", "Lightning", "ϟ"], ["snow", "Snow", "❄"],
    ["crown", "Crown", "♛"], ["gears", "Gears", "⚙"], ["crosshairs", "Crosshairs", "⊕"],
    ["shells", "Shells", "◈"], ["sparks", "Sparks", "✧"], ["drops", "Drops", "◌"],
    ["bubbles", "Bubbles", "◦"], ["crystals", "Crystals", "◇"], ["moons", "Moons", "☾"],
    ["clover", "Clover", "♣"], ["notes", "Notes", "♫"]
  ];
  const DEFAULTS = Object.freeze({ colour: "default", typeface: "default", outline: "none",
    background: "none", flag: "none", decoration: "none" });
  const options = { colour: COLOURS, typeface: FONTS, outline: OUTLINES,
    background: BACKGROUNDS, flag: FLAGS, decoration: DECORATIONS };
  const value = (list, id, index = 2) => list.find((item) => item[0] === id)?.[index] || "";
  const emoji = (code) => code === "none" ? "" : [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
  const ownName = (text) => String(text || "").trim().replace(/^\[[^\]]{1,24}\]\s*/, "").toLowerCase();

  function normalize(source) {
    const input = source && typeof source === "object" ? source : {};
    const result = { ...DEFAULTS };
    for (const [key, list] of Object.entries(options))
      if (list.some((item) => item[0] === input[key])) result[key] = input[key];
    return result;
  }

  // One artwork coordinate system paints the native TAB row and the full-row preview.
  function artwork(style, width, height) {
    const w = Math.max(1, width), h = Math.max(1, height);
    const preset = backgroundVisual(style.background);
    if (!preset) return null;
    const veil = style.background === "azerbaijan" ? 0.18 : 0.24;
    const images = [`linear-gradient(rgb(10 17 24 / ${veil}),rgb(10 17 24 / ${veil}))`];
    const sizes = [`${w}px ${h}px`];
    const origins = [[0, 0]];
    for (const layer of preset) {
      images.push(layer);
      sizes.push(`${w}px ${h}px`);
      origins.push([0, 0]);
    }
    return { image: images.join(", "), size: sizes.join(", "),
      repeat: images.map(() => "no-repeat").join(", "),
      position(offset) { return origins.map(([x, y]) =>
        `${Math.round((x - offset) * 100) / 100}px ${Math.round(y * 100) / 100}px`).join(", "); } };
  }

  function create(shadow, editor) {
    let applied = normalize();
    let draft = normalize();
    let revision = 0;
    let pending = false;
    let status = "";
    let frame = 0;
    let appliedVersion = 0;
    let ownUid = "";
    let ownDisplayName = "";
    const styled = new Set();
    let observedRow = null;
    const rowResize = typeof ResizeObserver === "function" ? new ResizeObserver(schedulePaint) : null;
    const panelCss = new CSSStyleSheet();
    panelCss.replaceSync(globalThis.OverlinePlatform.resources.getText("src/features/nickname-style.css"));
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, panelCss];
    globalThis.OverlinePlatform.styles.mount("overline-nickname-native-css", "src/features/nickname-native.css");

    function uid() {
      for (const node of document.querySelectorAll(SELECTORS.uid)) {
        const match = /^\s*UID\s*:\s*(.+?)\s*$/i.exec(node.textContent || "");
        if (match && /\D/.test(match[1]))
          return { key: ownName(match[1]), display: match[1].trim() };
      }
      return { key: "", display: "" };
    }
    function clearBackground(row) {
      row.removeAttribute("data-overline-nickname-style");
      row.removeAttribute("data-overline-nickname-layout");
      for (const property of ["image", "size", "repeat", "position"]) row.style.removeProperty("--overline-ns-bg-" + property);
      for (const item of row.children) if (item.tagName === "TD") {
        item.removeAttribute("data-overline-nickname-background");
        item.style.removeProperty("--overline-ns-bg-position");
      }
      if (observedRow === row) { rowResize?.unobserve(row); observedRow = null; }
    }
    function clearCell(cell) {
      const row = cell.closest("tr");
      if (row) clearBackground(row);
      const text = cell.querySelector(SELECTORS.text);
      text?.classList.remove("overline-nick-text", "overline-nick-colour", "overline-nick-font", "overline-nick-outline");
      for (const key of ["colour", "font", "outline"]) text?.style.removeProperty("--overline-nick-" + key);
      cell.querySelectorAll(":scope > .overline-nick-layer, :scope > .overline-nick-symbols").forEach((node) => node.remove());
      cell.removeAttribute("data-overline-nickname-style");
      cell.removeAttribute("data-overline-nickname-applied");
      styled.delete(cell);
    }
    function decorate(cell, text, signature) {
      if (cell.dataset.overlineNicknameApplied === signature && text.classList.contains("overline-nick-text")) return;
      clearCell(cell);
      cell.dataset.overlineNicknameStyle = "v1";
      cell.dataset.overlineNicknameApplied = signature;
      styled.add(cell);
      text.classList.add("overline-nick-text");
      if (applied.colour !== "default") {
        text.classList.add("overline-nick-colour");
        text.style.setProperty("--overline-nick-colour", value(COLOURS, applied.colour));
      }
      if (applied.typeface !== "default") {
        text.classList.add("overline-nick-font");
        text.style.setProperty("--overline-nick-font", value(FONTS, applied.typeface));
      }
      if (applied.outline !== "none") {
        text.classList.add("overline-nick-outline");
        text.style.setProperty("--overline-nick-outline", value(OUTLINES, applied.outline));
      }
      if (applied.flag !== "none" || applied.decoration !== "none") {
        const symbols = document.createElement("span");
        symbols.className = "overline-nick-symbols";
        if (applied.flag !== "none") {
          const flag = document.createElement("span");
          flag.className = "overline-nick-flag";
          flag.textContent = emoji(applied.flag);
          symbols.append(flag);
        }
        if (applied.decoration !== "none") {
          const mark = document.createElement("span");
          mark.className = "overline-nick-decoration";
          mark.textContent = value(DECORATIONS, applied.decoration);
          symbols.append(mark);
        }
        cell.append(symbols);
      }
    }
    function paintRowBackground(row) {
      if (applied.background === "none") {
        if (row.hasAttribute("data-overline-nickname-style")) clearBackground(row);
        return;
      }
      const bounds = row.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;
      const layout = ["row", appliedVersion,
        bounds.width.toFixed(2), bounds.height.toFixed(2)].join("|");
      if (row.dataset.overlineNicknameLayout === layout) return;
      const art = artwork(applied, bounds.width, bounds.height);
      if (!art) { clearBackground(row); return; }
      row.dataset.overlineNicknameStyle = "v1";
      row.dataset.overlineNicknameLayout = layout;
      row.style.setProperty("--overline-ns-bg-image", art.image);
      row.style.setProperty("--overline-ns-bg-size", art.size);
      row.style.setProperty("--overline-ns-bg-repeat", art.repeat);
      row.style.setProperty("--overline-ns-bg-position", art.position(0));
      // Clear V1.2 cell paint if this row survived an extension reload.
      for (const cell of row.children) if (cell.tagName === "TD") {
        cell.removeAttribute("data-overline-nickname-background");
        cell.style.removeProperty("--overline-ns-bg-position");
      }
      if (observedRow !== row) {
        if (observedRow) rowResize?.unobserve(observedRow);
        observedRow = row;
        rowResize?.observe(row);
      }
    }
    function paint() {
      frame = 0;
      const nextUid = uid();
      if (nextUid.key !== ownUid) {
        for (const cell of [...styled]) if (cell.isConnected) clearCell(cell);
        ownUid = nextUid.key;
      }
      if (nextUid.display !== ownDisplayName) {
        ownDisplayName = nextUid.display;
        preview();
      }
      for (const cell of [...styled]) if (!cell.isConnected) styled.delete(cell);
      if (!ownUid) return;
      const root = document.querySelector(SELECTORS.tab);
      if (!root) return;
      const signature = String(appliedVersion);
      const found = new Set();
      for (const row of root.querySelectorAll(SELECTORS.row)) {
        const cell = row.querySelector(SELECTORS.nick);
        const text = cell?.querySelector(SELECTORS.text);
        if (!cell || !text) continue;
        if (ownName(text.textContent) !== ownUid) continue;
        found.add(cell);
        decorate(cell, text, signature);
        paintRowBackground(row);
      }
      for (const cell of [...styled]) if (!found.has(cell) && cell.isConnected) clearCell(cell);
    }
    function schedulePaint() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        if (target?.closest?.(SELECTORS.tab + "," + SELECTORS.uid) ||
            [...record.addedNodes].some((node) => node.nodeType === 1 &&
              (node.matches?.(SELECTORS.tab + "," + SELECTORS.uid) ||
               node.querySelector?.(SELECTORS.tab + "," + SELECTORS.uid))) ||
            [...record.removedNodes].some((node) => node.nodeType === 1 &&
              (node.matches?.(SELECTORS.tab + "," + SELECTORS.uid) ||
               node.querySelector?.(SELECTORS.tab + "," + SELECTORS.uid)))) {
          schedulePaint();
          return;
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    const onResize = () => { preview(); schedulePaint(); };
    window.addEventListener("resize", onResize);

    function preview() {
      const sample = editor.querySelector(".overline-ns-preview");
      const card = editor.querySelector(".overline-ns-preview-card");
      if (!sample || !card) return;
      card.style.setProperty("--ns-colour", value(COLOURS, draft.colour) || "var(--ov-text-primary)");
      card.style.setProperty("--ns-font", value(FONTS, draft.typeface) || "Arial, Helvetica, sans-serif");
      card.style.setProperty("--ns-outline", value(OUTLINES, draft.outline) || "transparent");
      const art = artwork(draft, sample.clientWidth, sample.clientHeight);
      sample.style.backgroundImage = art?.image || "none";
      sample.style.backgroundSize = art?.size || "auto";
      sample.style.backgroundPosition = art?.position(0) || "center";
      sample.style.backgroundRepeat = art?.repeat || "no-repeat";
      card.querySelector(".overline-ns-preview-flag").textContent = emoji(draft.flag);
      card.querySelector(".overline-ns-preview-name").textContent = ownDisplayName || "YourNickname";
      card.querySelector(".overline-ns-preview-decoration").textContent = value(DECORATIONS, draft.decoration);
      card.classList.toggle("has-outline", draft.outline !== "none");
    }
    function choiceButtons(field, list, kind) {
      return list.map(([id, label, colour]) => {
        const selected = draft[field] === id;
        const marker = kind === "swatch" ? `<span class="overline-ns-swatch" style="background:${colour || "transparent"}"></span>`
          : kind === "font" ? '<span class="overline-ns-aa">Aa</span>'
          : kind === "background" ? '<span class="overline-ns-background-thumb"></span>' : "";
        return `<button type="button" class="overline-ns-choice ${kind} ${selected ? "selected" : ""}" data-ns-field="${field}" data-ns-value="${id}" aria-pressed="${selected}" title="${label}">${marker}<span>${label}</span></button>`;
      }).join("");
    }
    function select(field, list) {
      return `<select data-ns-field="${field}">${list.map(([id, label]) =>
        `<option value="${id}" ${draft[field] === id ? "selected" : ""}>${label}</option>`).join("")}</select>`;
    }
    function dirty() { return Object.keys(DEFAULTS).some((key) => draft[key] !== applied[key]); }
    function render() {
      editor.innerHTML = `
        <div class="overline-ns-preview" aria-label="Nickname style preview">
          <span class="overline-ns-preview-rank" aria-hidden="true">◈</span>
          <span class="overline-ns-preview-card">
            <strong class="overline-ns-preview-name"></strong>
            <span class="overline-ns-preview-symbols"><span class="overline-ns-preview-flag"></span><span class="overline-ns-preview-decoration"></span></span>
          </span><span class="overline-ns-preview-gs">GS <b>9477</b></span>
          <span class="overline-ns-preview-equipment" aria-label="Equipment">▣ ◈</span>
          <span class="overline-ns-preview-protection" aria-label="Protection">◇</span>
          <span class="overline-ns-preview-kd">0/0</span>
        </div>
        <h2>Colour</h2><div class="overline-ns-options swatches">${choiceButtons("colour", COLOURS, "swatch")}</div>
        <h2>Typeface</h2><div class="overline-ns-options">${choiceButtons("typeface", FONTS, "font")}</div>
        <h2>Nickname outline</h2><div class="overline-ns-options">${choiceButtons("outline", OUTLINES, "plain")}</div>
        <h2>Card background</h2><div class="overline-ns-backgrounds">${choiceButtons("background", BACKGROUNDS, "background")}</div>
        <div class="overline-ns-selects"><label>Country flag ${select("flag", FLAGS)}</label><label>Decoration ${select("decoration", DECORATIONS)}</label></div>
        <div class="overline-ns-actions"><button type="button" class="primary-action" data-ns-action="apply" ${pending ? "disabled" : ""}>Apply</button>
          <button type="button" data-ns-action="undo" ${pending ? "disabled" : ""}>Undo</button>
          <button type="button" data-ns-action="reset" ${pending ? "disabled" : ""}>Reset defaults</button></div>
        <p class="overline-ns-status" role="status" aria-live="polite">${status || (dirty() ? "Draft changes — press Apply to save." : "Applied settings are current.")}</p>`;
      editor.querySelectorAll('[data-ns-field="background"]').forEach((button) => {
        const thumb = button.querySelector(".overline-ns-background-thumb");
        const visual = backgroundVisual(button.dataset.nsValue);
        if (thumb && visual) thumb.style.backgroundImage = visual.join(", ");
      });
      preview();
    }
    function change(field, next) {
      draft = normalize({ ...draft, [field]: next });
      revision++;
      status = "";
      render();
    }
    function apply() {
      if (pending) return;
      const saved = normalize(draft);
      const atRevision = revision;
      pending = true;
      globalThis.OverlinePlatform.storage.local.set({ [KEY]: saved }, () => {
        pending = false;
        if (globalThis.OverlinePlatform.storage.lastError) {
          status = "Could not save the style. Try again.";
          render();
          return;
        }
        applied = saved;
        appliedVersion++;
        if (revision === atRevision) draft = { ...saved };
        status = "Applied locally. Only you can see this style.";
        schedulePaint();
        render();
      });
      render();
    }
    editor.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !editor.contains(button)) return;
      if (button.dataset.nsField) { change(button.dataset.nsField, button.dataset.nsValue); return; }
      switch (button.dataset.nsAction) {
        case "apply": apply(); break;
        case "undo": draft = { ...applied }; revision++; status = "Draft restored to applied style."; render(); break;
        case "reset": draft = normalize(); revision++; status = "Defaults are in draft. Press Apply to save."; render(); break;
      }
    });
    editor.addEventListener("change", (event) => {
      const input = event.target;
      if (input.dataset.nsField) change(input.dataset.nsField, input.value);
    });

    function storageChanged(changes, area) {
      if (area !== "local" || !changes[KEY] || pending) return;
      applied = normalize(changes[KEY].newValue);
      appliedVersion++;
      draft = { ...applied };
      revision++;
      status = "Applied style updated.";
      schedulePaint();
      render();
    }
    globalThis.OverlinePlatform.storage.onChanged.addListener(storageChanged);
    globalThis.OverlinePlatform.storage.local.get({ [KEY]: DEFAULTS }, (result) => {
      applied = normalize(result[KEY]);
      appliedVersion++;
      draft = { ...applied };
      schedulePaint();
      render();
    });
    schedulePaint();
    render();
    return { refresh: preview, cleanup() {
      observer.disconnect();
      rowResize?.disconnect();
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      globalThis.OverlinePlatform.storage.onChanged.removeListener(storageChanged);
      for (const cell of [...styled]) if (cell.isConnected) clearCell(cell);
      globalThis.OverlinePlatform.styles.unmount("overline-nickname-native-css");
      shadow.adoptedStyleSheets = shadow.adoptedStyleSheets.filter((sheet) => sheet !== panelCss);
    } };
  }

  globalThis.OverlineNicknameStyle = Object.freeze({ create, normalize, defaults: DEFAULTS, selectors: SELECTORS });
})();
