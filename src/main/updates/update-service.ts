import { app, dialog, Notification, type BaseWindow } from "electron";
import { spawn } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, open, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { OFFICIAL_RELEASE_REPOSITORY } from "./release-config";

const CHECK_DELAY_MS = 30_000;
const CHECK_COOLDOWN_MS = 24 * 60 * 60 * 1_000;
const MAX_RELEASE_BYTES = 512_000;
const MAX_METADATA_BYTES = 16_384;
const MAX_INSTALLER_BYTES = 1_000_000_000;
const USER_AGENT = "Overline-Client-Updater";
type ReleaseAsset = { id: number; name: string; size: number; state: string };
type UpdateInfo = { version: string; name: string; size: number; sha256: string; assetId: number };

function log(event: string): void {
  // Deliberately omit URLs, server responses, account data and local paths.
  console.info(`[Overline update] ${event}`);
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validRepository(owner: string, repo: string): boolean {
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner) &&
    /^[A-Za-z0-9_.-]{1,100}$/.test(repo) && repo !== "." && repo !== "..";
}

function apiRoot(): string | null {
  const source = OFFICIAL_RELEASE_REPOSITORY;
  if (!source || !validRepository(source.owner, source.repo)) return null;
  return `https://api.github.com/repos/${source.owner}/${source.repo}`;
}

function allowedRedirect(url: URL): boolean {
  const source = OFFICIAL_RELEASE_REPOSITORY;
  if (!source || url.protocol !== "https:" || url.username || url.password || url.port) return false;
  if (url.hostname === "api.github.com") {
    return url.pathname.startsWith(`/repos/${source.owner}/${source.repo}/releases/`);
  }
  if (url.hostname === "github.com") {
    return url.pathname.startsWith(`/${source.owner}/${source.repo}/releases/download/`);
  }
  return url.hostname === "release-assets.githubusercontent.com" ||
    url.hostname === "objects.githubusercontent.com";
}

async function officialFetch(url: string, accept: string): Promise<Response> {
  let next = new URL(url);
  for (let redirect = 0; redirect < 5; redirect++) {
    if (!allowedRedirect(next)) throw new Error("Untrusted update redirect");
    const response = await fetch(next, {
      redirect: "manual", signal: AbortSignal.timeout(60_000),
      headers: { Accept: accept, "User-Agent": USER_AGENT, "X-GitHub-Api-Version": "2022-11-28" }
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing update redirect");
      next = new URL(location, next);
      continue;
    }
    if (!response.ok) throw new Error("Update source unavailable");
    return response;
  }
  throw new Error("Too many update redirects");
}

async function limitedJson(response: Response, limit: number): Promise<unknown> {
  if (!response.body) throw new Error("Empty update response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("Update response too large");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function asset(value: unknown): value is ReleaseAsset {
  return record(value) && Number.isSafeInteger(value.id) && (value.id as number) > 0 &&
    typeof value.name === "string" && Number.isSafeInteger(value.size) && value.state === "uploaded";
}

function parseRelease(release: unknown): { version: string; assets: ReleaseAsset[] } {
  if (!record(release) || release.draft !== false || release.prerelease !== false ||
      typeof release.tag_name !== "string" || !/^v\d+\.\d+\.\d+$/.test(release.tag_name) ||
      !Array.isArray(release.assets)) throw new Error("Invalid official release");
  const version = release.tag_name.slice(1);
  if (!semver.valid(version) || release.assets.length > 100) throw new Error("Invalid release version");
  return { version, assets: release.assets.filter(asset) };
}

function parseMetadata(raw: unknown, version: string, assets: ReleaseAsset[]): UpdateInfo {
  const name = `Overline-Client-${version}-Setup.exe`;
  if (!record(raw) || raw.version !== version || raw.platform !== "win32" || raw.arch !== "x64" ||
      raw.installer !== name || typeof raw.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(raw.sha256) || !Number.isSafeInteger(raw.size) ||
      (raw.size as number) < 1 || (raw.size as number) > MAX_INSTALLER_BYTES) {
    throw new Error("Invalid update metadata");
  }
  const matches = assets.filter((entry) => entry.name === name && entry.size === raw.size);
  if (matches.length !== 1) throw new Error("Official installer asset missing or ambiguous");
  return { version, name, size: raw.size as number, sha256: raw.sha256, assetId: matches[0].id };
}

async function hashFile(file: string): Promise<{ size: number; sha256: string }> {
  const handle = await open(file, "r");
  const hash = createHash("sha256");
  let size = 0;
  try {
    const stream = handle.createReadStream({ autoClose: false });
    for await (const chunk of stream) {
      hash.update(chunk);
      size += chunk.length;
    }
  } finally {
    await handle.close();
  }
  return { size, sha256: hash.digest("hex") };
}

function matchesHash(actual: string, expected: string): boolean {
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export class UpdateService {
  private readonly directory = path.join(app.getPath("userData"), "updates");
  private readonly stateFile = path.join(app.getPath("userData"), "update-state.json");
  private busy = false;
  private notice: Notification | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly window: BaseWindow) {}

  start(): void {
    if (process.platform !== "win32" || !app.isPackaged || !apiRoot()) {
      log("official source unavailable; automatic checks disabled");
      return;
    }
    this.timer = setTimeout(() => { void this.checkForUpdates(); }, CHECK_DELAY_MS);
    this.timer.unref();
    this.window.on("closed", () => { if (this.timer) clearTimeout(this.timer); });
  }

  async checkForUpdates(): Promise<void> {
    const root = apiRoot();
    if (!root || this.busy || this.window.isDestroyed()) return;
    this.busy = true;
    try {
      const last = await this.lastCheck();
      if (Date.now() - last < CHECK_COOLDOWN_MS) return;
      await this.saveCheck();
      await this.cleanupOldDownloads();
      log("check started");
      const release = parseRelease(await limitedJson(
        await officialFetch(`${root}/releases/latest`, "application/vnd.github+json"), MAX_RELEASE_BYTES));
      const current = semver.valid(app.getVersion());
      if (!current || !semver.gt(release.version, current)) { log("no update"); return; }
      const metadataAssets = release.assets.filter((entry) => entry.name === "latest.json" && entry.size <= MAX_METADATA_BYTES);
      if (metadataAssets.length !== 1) throw new Error("Update metadata missing or ambiguous");
      const metadata = await limitedJson(await officialFetch(
        `${root}/releases/assets/${metadataAssets[0].id}`, "application/octet-stream"), MAX_METADATA_BYTES);
      const info = parseMetadata(metadata, release.version, release.assets);
      log("update available");
      this.notify(`Overline Client ${info.version} is available. Click to review.`, () => {
        void this.offerDownload(info);
      });
    } catch {
      log("updater error");
    } finally {
      this.busy = false;
    }
  }

  private async offerDownload(info: UpdateInfo): Promise<void> {
    if (this.window.isDestroyed() || this.busy) return;
    const choice = await dialog.showMessageBox(this.window, {
      type: "info", title: "Overline Client update",
      message: `Overline Client ${info.version} is available.`,
      detail: "Download the official Windows installer now?",
      buttons: ["Download", "Later"], defaultId: 0, cancelId: 1, noLink: true
    });
    if (choice.response === 0) void this.downloadUpdate(info);
  }

  async downloadUpdate(info: UpdateInfo): Promise<void> {
    const root = apiRoot();
    if (!root || this.busy || this.window.isDestroyed()) return;
    this.busy = true;
    const target = path.join(this.directory, info.name);
    const partial = `${target}.${process.pid}.part`;
    try {
      await mkdir(this.directory, { recursive: true });
      try {
        const existing = await hashFile(target);
        if (existing.size === info.size && matchesHash(existing.sha256, info.sha256)) {
          log("verification success");
          this.notify("Update ready to install. Click to review.", () => { void this.offerInstall(target, info); });
          return;
        }
        await unlink(target);
      } catch {
        // No reusable verified installer is present.
      }
      log("download started");
      const response = await officialFetch(`${root}/releases/assets/${info.assetId}`, "application/octet-stream");
      if (!response.body) throw new Error("Empty installer response");
      const handle = await open(partial, "wx", 0o600);
      const hash = createHash("sha256");
      let size = 0;
      try {
        const reader = response.body.getReader();
        try {
          for (;;) {
            const { done, value: chunk } = await reader.read();
            if (done) break;
            size += chunk.length;
            if (size > MAX_INSTALLER_BYTES || size > info.size) throw new Error("Installer exceeds expected size");
            hash.update(chunk);
            let offset = 0;
            while (offset < chunk.length) {
              const result = await handle.write(chunk, offset, chunk.length - offset);
              if (result.bytesWritten < 1) throw new Error("Installer write failed");
              offset += result.bytesWritten;
            }
          }
        } finally {
          reader.releaseLock();
        }
        await handle.sync();
      } finally {
        await handle.close();
      }
      log("download completed");
      if (size !== info.size || !matchesHash(hash.digest("hex"), info.sha256)) {
        log("verification failure");
        throw new Error("Installer verification failed");
      }
      await rename(partial, target);
      log("verification success");
      this.notify("Update ready to install. Click to review.", () => { void this.offerInstall(target, info); });
    } catch {
      await unlink(partial).catch(() => {});
      log("updater error");
      this.notify("Update download failed. Overline Client will continue normally.", () => {});
    } finally {
      this.busy = false;
    }
  }

  private async offerInstall(file: string, info: UpdateInfo): Promise<void> {
    if (this.window.isDestroyed() || this.busy) return;
    const choice = await dialog.showMessageBox(this.window, {
      type: "info", title: "Overline Client update",
      message: `Overline Client ${info.version} is ready.`,
      detail: "Close Overline Client and start the verified installer?",
      buttons: ["Restart & Update", "Later"], defaultId: 1, cancelId: 1, noLink: true
    });
    if (choice.response === 0) void this.installUpdate(file, info);
  }

  async installUpdate(file: string, info: UpdateInfo): Promise<void> {
    if (this.busy || this.window.isDestroyed() || file !== path.join(this.directory, info.name)) return;
    this.busy = true;
    try {
      const found = await hashFile(file);
      if (found.size !== info.size || !matchesHash(found.sha256, info.sha256)) {
        log("verification failure");
        await unlink(file).catch(() => {});
        return;
      }
      log("install requested");
      app.once("quit", () => {
        try {
          const installer = spawn(file, [], { detached: true, stdio: "ignore", windowsHide: false });
          installer.unref();
        } catch { log("updater error"); }
      });
      app.quit();
    } catch {
      log("updater error");
    } finally {
      this.busy = false;
    }
  }

  async cleanupOldDownloads(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    for (const name of await readdir(this.directory)) {
      if (!/^Overline-Client-\d+\.\d+\.\d+-Setup\.exe(?:\.\d+\.part)?$/.test(name)) continue;
      const file = path.join(this.directory, name);
      const details = await stat(file).catch(() => null);
      if (details?.isFile() && Date.now() - details.mtimeMs > 7 * CHECK_COOLDOWN_MS) {
        await unlink(file).catch(() => {});
      }
    }
  }

  private async lastCheck(): Promise<number> {
    try {
      const state: unknown = JSON.parse(await readFile(this.stateFile, "utf8"));
      return record(state) && typeof state.lastCheck === "number" && Number.isFinite(state.lastCheck) ? state.lastCheck : 0;
    } catch { return 0; }
  }

  private async saveCheck(): Promise<void> {
    await mkdir(path.dirname(this.stateFile), { recursive: true });
    await writeFile(this.stateFile, JSON.stringify({ lastCheck: Date.now() }),
      { encoding: "utf8", mode: 0o600 });
  }

  private notify(body: string, onClick: () => void): void {
    if (!Notification.isSupported()) return;
    this.notice?.close();
    this.notice = new Notification({ title: "Overline Client", body, silent: true });
    this.notice.on("click", onClick);
    this.notice.show();
  }
}
