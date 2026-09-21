import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("src/overline/web");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
const scripts = manifest.content_scripts[0].js;
const resources = manifest.web_accessible_resources[0].resources;
const assets = {};
for (const resource of resources) {
  const data = await readFile(path.join(root, resource));
  if (resource.endsWith(".css")) {
    assets[resource] = { kind: "text", value: data.toString("utf8") };
  } else {
    const mime = resource.endsWith(".svg") ? "image/svg+xml" :
      resource.endsWith(".png") ? "image/png" : resource.endsWith(".mp3") ? "audio/mpeg" : null;
    if (!mime) throw new Error(`Unsupported resource type: ${resource}`);
    assets[resource] = { kind: "url", value: `data:${mime};base64,${data.toString("base64")}` };
  }
}

const compiled = path.resolve("dist/preload/tanki-preload.js");
const platform = await readFile(compiled, "utf8");
const active = [];
for (const script of scripts) {
  const code = await readFile(path.join(root, script), "utf8");
  if (/\bchrome\./.test(code) || /\b(?:eval|new Function)\s*\(/.test(code)) {
    throw new Error(`Unadapted or dynamic code in ${script}`);
  }
  active.push(`// Production source: ${script}\n${code}`);
}
const output = [
  `const __OVERLINE_RESOURCES__ = Object.freeze(${JSON.stringify(assets)});`,
  platform,
  `function startOverlineWebLayer() {\n${active.join("\n")}\n}`,
  `if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startOverlineWebLayer, { once: true });`,
  `else startOverlineWebLayer();`
].join("\n");
await writeFile(compiled, output);
console.log(`Bundled ${scripts.length} active Overline scripts and ${resources.length} packaged resources.`);
