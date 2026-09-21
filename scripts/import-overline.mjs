import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Explicit, reviewable import from the active production manifest. Run only when
// intentionally refreshing the client snapshot; normal builds are standalone.
const source = path.resolve("../overline-extension");
const target = path.resolve("src/overline/web");
const scripts = [
  "src/theme/selector-registry.js",
  "src/theme/index.js",
  "src/features/nickname-style.js",
  "src/content.js"
];
const resources = [
  "src/panel.css", "src/features/nickname-style.css", "src/features/nickname-native.css",
  "src/assets/nickname-backgrounds/azerbaijan.svg", "src/assets/branding/icons/icon-32.png",
  "src/theme/styles/tokens.css", "src/theme/styles/shell/lobby-header.css",
  "src/theme/styles/shell/inner-header.css", "src/theme/styles/shell/lobby.css",
  "src/theme/styles/components/navigation.css", "src/theme/styles/components/controls.css",
  "src/theme/styles/screens/garage.css", "src/theme/styles/screens/containers.css",
  "src/theme/styles/screens/shop.css", "src/theme/styles/screens/settings.css",
  "src/theme/styles/screens/missions.css", "src/theme/styles/screens/friends.css",
  "src/theme/styles/screens/ranks-profile.css", "src/theme/styles/screens/chat-news.css",
  "src/theme/styles/components/dialogs.css", "src/theme/styles/battle/hud.css",
  "src/theme/styles/battle/chat.css", "src/theme/styles/battle/tab.css",
  "assets/sounds/over-20.mp3"
];
const manifest = JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8"));
if (JSON.stringify(manifest.content_scripts?.[0]?.js) !== JSON.stringify(scripts) ||
  resources.length !== manifest.web_accessible_resources?.[0]?.resources.length ||
  resources.some((file) => !manifest.web_accessible_resources[0].resources.includes(file))) {
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
  }
  if (file === "src/features/nickname-style.js") {
    code = replaceOnce(code, `    const panelCss = document.createElement("link");
    panelCss.rel = "stylesheet";
    panelCss.href = chrome.runtime.getURL("src/features/nickname-style.css");
    shadow.append(panelCss);
    const nativeCss = document.createElement("link");
    nativeCss.rel = "stylesheet";
    nativeCss.href = chrome.runtime.getURL("src/features/nickname-native.css");
    nativeCss.id = "overline-nickname-native-css";
    (document.head || document.documentElement).append(nativeCss);`,
      `    const panelCss = new CSSStyleSheet();
    panelCss.replaceSync(globalThis.OverlinePlatform.resources.getText("src/features/nickname-style.css"));
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, panelCss];
    globalThis.OverlinePlatform.styles.mount("overline-nickname-native-css", "src/features/nickname-native.css");`, file);
    code = replaceOnce(code, `      nativeCss.remove(); panelCss.remove();`,
      `      globalThis.OverlinePlatform.styles.unmount("overline-nickname-native-css");
      shadow.adoptedStyleSheets = shadow.adoptedStyleSheets.filter((sheet) => sheet !== panelCss);`, file);
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
await writeFile(path.join(target, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Imported ${scripts.length} active scripts and ${resources.length} production resources.`);
