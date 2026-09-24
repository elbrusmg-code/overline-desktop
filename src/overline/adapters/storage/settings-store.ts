import { app, type WebContents } from "electron";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

type Settings = Record<string, unknown>;
type Change = { oldValue?: unknown; newValue?: unknown };

const numeric: Record<string, [number, number]> = {
  duration: [1, 59999], addSeconds: [1, 3600], subtractSeconds: [1, 3600],
  warningSeconds: [0, 3600], volume: [0, 1]
};
const booleans = new Set(["showTimer", "timerMovement", "audioEnabled", "severitiumThemeEnabled"]);
const appearanceNumbers: Record<string, [number, number]> = {
  opacity: [0, 100], blur: [0, 30], radius: [0, 30],
  borderWidth: [0, 8], fontSize: [14, 36], timerScale: [0.5, 2]
};
const appearanceColours = new Set(["background", "text", "warningText", "border", "warningBorder"]);
const appearanceThemes = new Set(["none", "overline"]);
const hotkeyNames = new Set(["visibility", "toggle", "reset", "add", "subtract"]);
const nicknameNames = new Set(["colour", "typeface", "outline", "background", "flag", "decoration"]);
const storedKeys = new Set([...Object.keys(numeric), ...booleans, "timerPosition", "hotkeys", "appearance", "overlineNicknameStyleV1"]);
const legacyReadKeys = new Set(["theme", "voice", "minutes", "seconds", "widgetPosition"]);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function valid(value: unknown, key: string): boolean {
  if (booleans.has(key)) return typeof value === "boolean";
  if (key in numeric) return typeof value === "number" && Number.isFinite(value) && value >= numeric[key][0] && value <= numeric[key][1];
  if (key === "timerPosition") return value === null || (record(value) &&
    Object.keys(value).length === 2 && Number.isFinite(value.x) && Number.isFinite(value.y) &&
    Math.abs(value.x as number) <= 100000 && Math.abs(value.y as number) <= 100000);
  if (key === "hotkeys") return record(value) && Object.keys(value).length <= 5 &&
    Object.entries(value).every(([name, hotkey]) => hotkeyNames.has(name) && typeof hotkey === "string" &&
      (/^[A-Z0-9]$/.test(hotkey) || /^F([1-9]|1[0-2])$/.test(hotkey) ||
        ["Delete", "Home", "End", "PageUp", "PageDown"].includes(hotkey)));
  if (key === "appearance") return record(value) && Object.entries(value).every(([name, item]) =>
    name === "theme" ? typeof item === "string" && appearanceThemes.has(item) :
      appearanceColours.has(name) ? typeof item === "string" && /^#[0-9a-fA-F]{6}$/.test(item) :
      name in appearanceNumbers && typeof item === "number" && Number.isFinite(item) &&
      item >= appearanceNumbers[name][0] && item <= appearanceNumbers[name][1]);
  if (key === "overlineNicknameStyleV1") return record(value) && Object.keys(value).length <= 6 &&
    Object.entries(value).every(([name, item]) => nicknameNames.has(name) &&
      typeof item === "string" && /^[a-z0-9_-]{1,32}$/.test(item));
  return false;
}

export class SettingsStore {
  private readonly file = path.join(app.getPath("userData"), "overline-settings.json");
  private readonly ready: Promise<void>;
  private values: Settings = {};
  private pending: Promise<void> = Promise.resolve();
  private sequence = 0;

  constructor(private readonly contents: WebContents) {
    this.ready = this.load();
  }

  private async load(): Promise<void> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.file, "utf8"));
      if (!record(parsed)) return;
      for (const [key, value] of Object.entries(parsed)) {
        if (storedKeys.has(key) && valid(value, key)) this.values[key] = value;
      }
    } catch {
      // A missing or malformed settings file starts with safe defaults.
    }
  }

  async get(keys: unknown): Promise<Settings> {
    await this.ready;
    const names = Array.isArray(keys) ? keys : record(keys) ? Object.keys(keys) : [];
    if (names.length > 32 || names.some((key) => typeof key !== "string" || !storedKeys.has(key) && !legacyReadKeys.has(key))) {
      throw new Error("Unsupported settings key");
    }
    return Object.fromEntries(names.filter((key) => Object.hasOwn(this.values, key))
      .map((key) => [key, this.values[key]]));
  }

  set(patch: unknown): Promise<void> {
    if (!record(patch) || !Object.keys(patch).length || JSON.stringify(patch).length > 16384 ||
      Object.entries(patch).some(([key, value]) => !storedKeys.has(key) || !valid(value, key))) {
      return Promise.reject(new Error("Invalid Overline setting"));
    }
    return this.enqueue(async () => {
      const changes: Record<string, Change> = {};
      const next = { ...this.values };
      for (const [key, value] of Object.entries(patch)) {
        if (JSON.stringify(next[key]) === JSON.stringify(value)) continue;
        changes[key] = { oldValue: next[key], newValue: value };
        next[key] = value;
      }
      if (!Object.keys(changes).length) return;
      await this.persist(next);
      this.values = next;
      if (!this.contents.isDestroyed()) this.contents.send("overline:settings-changed", changes);
    });
  }

  remove(keys: unknown): Promise<void> {
    const names = Array.isArray(keys) ? keys : [keys];
    if (names.length > 32 || names.some((key) => typeof key !== "string" || !storedKeys.has(key) && !legacyReadKeys.has(key))) {
      return Promise.reject(new Error("Unsupported settings key"));
    }
    return this.enqueue(async () => {
      const next = { ...this.values };
      const changes: Record<string, Change> = {};
      for (const key of names) {
        if (!Object.hasOwn(next, key)) continue;
        changes[key] = { oldValue: next[key] };
        delete next[key];
      }
      if (!Object.keys(changes).length) return;
      await this.persist(next);
      this.values = next;
      if (!this.contents.isDestroyed()) this.contents.send("overline:settings-changed", changes);
    });
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const result = this.pending.then(() => this.ready).then(operation);
    this.pending = result.catch(() => {});
    return result;
  }

  private async persist(next: Settings): Promise<void> {
    const temporary = `${this.file}.${process.pid}.${++this.sequence}.tmp`;
    await writeFile(temporary, JSON.stringify(next, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.file);
  }
}
