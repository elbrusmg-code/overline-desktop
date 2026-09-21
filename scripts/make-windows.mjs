import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat, writeFile } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { version } = require(path.join(root, "package.json"));
const wixBin = process.env.WIX_TOOLSET_BIN;
const env = wixBin
  ? { ...process.env, PATH: `${wixBin}${path.delimiter}${process.env.PATH ?? ""}` }
  : process.env;
const msi = path.join(root, "out/make/wix/x64/Overline Client.msi");
const wixSource = path.join(root, "resources/installer/overline-bundle.wxs");
const wixObject = path.join(root, "out/make/burn/x64/overline-bundle.wixobj");
const wixPdb = path.join(root, "out/make/burn/x64/overline-bundle.wixpdb");
const icon = path.join(root, "resources/icons/overline.ico");
const logo = path.join(root, "resources/icons/overline.png");
const releaseDir = path.join(root, "out/release");
const setup = path.join(releaseDir, `Overline-Client-${version}-Setup.exe`);

function run(command, args, stdio = "inherit") {
  execFileSync(command, args, { cwd: root, env, stdio });
}

if (process.platform !== "win32") {
  throw new Error("The Windows release requires Windows and WiX Toolset v3.");
}
run("candle.exe", ["-?", "-nologo"], "ignore");
run("light.exe", ["-?", "-nologo"], "ignore");
if (!process.env.npm_execpath) throw new Error("Run this script with npm run make:windows.");
run(process.execPath, [process.env.npm_execpath, "run", "make", "--", "--platform=win32", "--arch=x64"]);
if (!existsSync(msi)) throw new Error(`WiX MSI missing: ${msi}`);
mkdirSync(path.dirname(wixObject), { recursive: true });
mkdirSync(releaseDir, { recursive: true });
run("candle.exe", [
  "-nologo", "-arch", "x64", "-ext", "WixBalExtension",
  `-dClientVersion=${version}`, `-dOverlineIcon=${icon}`,
  `-dOverlineLogo=${logo}`, `-dOverlineMsi=${msi}`,
  "-out", wixObject, wixSource
]);
run("light.exe", [
  "-nologo", "-ext", "WixBalExtension",
  "-pdbout", wixPdb,
  "-out", setup, wixObject
]);
if (!existsSync(setup)) throw new Error(`Windows setup missing: ${setup}`);
const digest = createHash("sha256");
for await (const chunk of createReadStream(setup)) digest.update(chunk);
const sha256 = digest.digest("hex");
const size = (await stat(setup)).size;
const metadata = { version, platform: "win32", arch: "x64", installer: path.basename(setup), size, sha256 };
await writeFile(path.join(releaseDir, "latest.json"), `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(path.join(releaseDir, "SHA256SUMS.txt"), `${sha256}  ${path.basename(setup)}\n`);
process.stdout.write(`Public Windows installer: ${setup}\n`);
