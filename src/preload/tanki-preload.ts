import { ipcRenderer, webFrame } from "electron";

type Asset = { kind: "text" | "url"; value: string };
type Change = { oldValue?: unknown; newValue?: unknown };
type ChangedListener = (changes: Record<string, Change>, area: "local") => void;
declare const __OVERLINE_RESOURCES__: Record<string, Asset>;

const listeners = new Set<ChangedListener>();
const insertedStyles = new Map<string, string>();
let lastError: { message: string } | null = null;

function resource(path: string, kind: Asset["kind"]): string {
  const item = Object.hasOwn(__OVERLINE_RESOURCES__, path) ? __OVERLINE_RESOURCES__[path] : undefined;
  if (!item || item.kind !== kind) throw new Error("Unknown packaged Overline resource");
  return item.value;
}

function complete(operation: Promise<unknown>, callback?: () => void): void {
  void operation.then(() => {
    lastError = null;
    callback?.();
  }, (error: unknown) => {
    lastError = { message: error instanceof Error ? error.message : "Could not save Overline settings" };
    callback?.();
    lastError = null;
  });
}

ipcRenderer.on("overline:settings-changed", (_event, changes: Record<string, Change>) => {
  for (const listener of listeners) listener(changes, "local");
});

const platform = Object.freeze({
  resources: Object.freeze({
    getText: (path: string) => resource(path, "text"),
    getURL: (path: string) => resource(path, "url")
  }),
  styles: Object.freeze({
    mount(id: string, path: string): void {
      if (insertedStyles.has(id)) return;
      insertedStyles.set(id, webFrame.insertCSS(resource(path, "text"), { cssOrigin: "author" }));
    },
    unmount(id: string): void {
      const key = insertedStyles.get(id);
      if (!key) return;
      webFrame.removeInsertedCSS(key);
      insertedStyles.delete(id);
    }
  }),
  storage: Object.freeze({
    get lastError(): { message: string } | null { return lastError; },
    local: Object.freeze({
      get(query: string[] | Record<string, unknown>, callback: (values: Record<string, unknown>) => void): void {
        void ipcRenderer.invoke("overline:settings-get", query).then((stored: Record<string, unknown>) => {
          callback(Array.isArray(query) ? stored : { ...query, ...stored });
        }, () => callback(Array.isArray(query) ? {} : { ...query }));
      },
      set(patch: Record<string, unknown>, callback?: () => void): void {
        complete(ipcRenderer.invoke("overline:settings-set", patch), callback);
      },
      remove(keys: string | string[], callback?: () => void): void {
        complete(ipcRenderer.invoke("overline:settings-remove", keys), callback);
      }
    }),
    onChanged: Object.freeze({
      addListener: (listener: ChangedListener) => listeners.add(listener),
      removeListener: (listener: ChangedListener) => listeners.delete(listener)
    })
  })
});

// This global exists only in Electron's isolated preload world. It is not
// bridged into Tanki's page world and exposes no Node or Electron capability.
Object.assign(globalThis, { OverlinePlatform: platform });
