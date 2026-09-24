import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Explicit, reviewable import from the active production manifest. Run only when
// intentionally refreshing the client snapshot; normal builds are standalone.
const source = path.resolve("../overline-extension");
const target = path.resolve("src/overline/web");
const scripts = [
  "src/theme/selector-registry.js",
  "src/theme/index.js",
  "src/content.js"
];
const resources = [
  "src/panel.css", "src/assets/branding/icons/icon-32.png",
  "src/theme/styles/tokens.css", "src/theme/styles/shell/lobby-header.css",
  "src/theme/styles/shell/inner-header.css", "src/theme/styles/shell/lobby.css",
  "src/theme/styles/components/navigation.css", "src/theme/styles/components/controls.css",
  "src/theme/styles/screens/garage.css", "src/theme/styles/screens/containers.css",
  "src/theme/styles/screens/shop.css", "src/theme/styles/screens/settings.css",
  "src/theme/styles/screens/missions.css", "src/theme/styles/screens/battle-modes.css",
  "src/theme/styles/screens/friends.css",
  "src/theme/styles/screens/ranks-profile.css", "src/theme/styles/screens/chat-news.css",
  "src/theme/styles/components/dialogs.css", "src/theme/styles/battle/hud.css",
  "src/theme/styles/battle/chat.css", "src/theme/styles/battle/tab.css",
  "assets/sounds/over-20.mp3"
];
const manifest = JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8"));
const disabledScripts = new Set(["src/features/nickname-style.js"]);
const disabledResources = new Set([
  "src/features/nickname-style.css",
  "src/features/nickname-native.css",
  "src/assets/nickname-backgrounds/azerbaijan.svg"
]);
const importedScripts = manifest.content_scripts?.[0]?.js.filter((file) => !disabledScripts.has(file));
const importedResources = manifest.web_accessible_resources?.[0]?.resources.filter((file) => !disabledResources.has(file));
if (JSON.stringify(importedScripts) !== JSON.stringify(scripts) ||
  importedResources.length !== resources.length ||
  resources.some((file) => !importedResources.includes(file))) {
  throw new Error("Production manifest changed; review the active import list first");
}

function replaceOnce(text, before, after, file) {
  if (!text.includes(before) || text.indexOf(before) !== text.lastIndexOf(before)) {
    throw new Error(`Import pattern changed in ${file}`);
  }
  return text.replace(before, after);
}

for (const file of scripts) {
  let code = (await readFile(path.join(source, file), "utf8")).replace(/\r\n/g, "\n");
  if (file === "src/theme/index.js") {
    code = replaceOnce(code, `    const parent = document.head || document.documentElement;
    for (const [id, path] of LINKS) {
      if (document.getElementById(id)) continue;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = chrome.runtime.getURL(path);
      parent.append(link);
    }`, `    for (const [id, path] of LINKS) globalThis.OverlinePlatform.styles.mount(id, path);`, file);
    code = replaceOnce(code, `    for (const [id] of LINKS) document.getElementById(id)?.remove();`,
      `    for (const [id] of LINKS) globalThis.OverlinePlatform.styles.unmount(id);`, file);
  }
  if (file === "src/content.js") {
    code = replaceOnce(code, `  const sheet = document.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = chrome.runtime.getURL("src/panel.css");
  shadow.append(sheet);`,
      `  const sheet = new CSSStyleSheet();
  sheet.replaceSync(globalThis.OverlinePlatform.resources.getText("src/panel.css"));
  shadow.adoptedStyleSheets = [sheet];`, file);
    code = replaceOnce(code, `          <button type="button" class="close-panel" aria-label="Close Overline panel">×</button>`,
      `          <div class="window-actions"><span class="close-hint"><kbd>Insert</kbd> to close</span><button type="button" class="close-panel" aria-label="Close Overline panel">×</button></div>`, file);
    code = replaceOnce(code, `  "use strict";

  const INSTANCE`, `  "use strict";

  // Nickname Style V1 is temporarily disabled. Remove only artifacts it may
  // have left on native TAB nodes during an in-session client update.
  function cleanupNicknameStyleV1() {
    globalThis.OverlinePlatform.styles.unmount("overline-nickname-native-css");
    document.querySelectorAll(".overline-nick-layer, .overline-nick-symbols").forEach((node) => node.remove());
    document.querySelectorAll("[data-overline-nickname-style], [data-overline-nickname-layout], [data-overline-nickname-background], [data-overline-nickname-applied], .overline-nick-text, .overline-nick-colour, .overline-nick-font, .overline-nick-outline").forEach((node) => {
      node.removeAttribute("data-overline-nickname-style");
      node.removeAttribute("data-overline-nickname-layout");
      node.removeAttribute("data-overline-nickname-background");
      node.removeAttribute("data-overline-nickname-applied");
      node.classList.remove("overline-nick-text", "overline-nick-colour", "overline-nick-font", "overline-nick-outline");
      for (const property of ["--overline-nick-colour", "--overline-nick-font", "--overline-nick-outline",
        "--overline-ns-bg-image", "--overline-ns-bg-size", "--overline-ns-bg-repeat", "--overline-ns-bg-position"])
        node.style.removeProperty(property);
    });
  }
  cleanupNicknameStyleV1();

  const INSTANCE`, file);
    code = replaceOnce(code, `            <button type="button" data-page="nickname-style">Nickname Style</button>
`, "", file);
    code = replaceOnce(code, `          <section class="page hidden" data-content="nickname-style">
            <div class="page-heading"><div><p class="eyebrow">FEATURE / 02</p><h1>Nickname Style</h1></div><p>Customize your local nickname appearance.</p></div>
            <p class="section-note">Local appearance — visible only to you</p>
            <div class="nickname-editor"></div>
          </section>
`, "", file);
    code = replaceOnce(code, `  const nicknameStyle = globalThis.OverlineNicknameStyle.create(shadow, $(".nickname-editor"));
`, "", file);
    code = replaceOnce(code, `    if (name === "nickname-style") nicknameStyle.refresh();
`, "", file);
  }
  code = code.replaceAll("chrome.storage.local", "globalThis.OverlinePlatform.storage.local")
    .replaceAll("chrome.storage.onChanged", "globalThis.OverlinePlatform.storage.onChanged")
    .replaceAll("chrome.runtime.getURL", "globalThis.OverlinePlatform.resources.getURL")
    .replaceAll("chrome.runtime.lastError", "globalThis.OverlinePlatform.storage.lastError");
  if (/\bchrome\./.test(code)) throw new Error(`Unadapted API in ${file}`);
  const output = path.join(target, file);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, code);
}
for (const file of resources) {
  const output = path.join(target, file);
  await mkdir(path.dirname(output), { recursive: true });
  await cp(path.join(source, file), output);
}
manifest.content_scripts[0].js = scripts;
manifest.web_accessible_resources[0].resources = resources;
manifest.description = "Customize Tanki Online with a local interface theme, overtime timer, and companion controls.";
await writeFile(path.join(target, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Imported ${scripts.length} active scripts and ${resources.length} production resources.`);
