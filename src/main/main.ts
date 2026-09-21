import { app, dialog, ipcMain, type IpcMainInvokeEvent } from "electron";
import { isTankiDestination, TANKI_URL } from "./security/navigation-policy";
import { createClientWindow, type ClientWindow } from "./windows/main-window";
import { SettingsStore } from "../overline/adapters/storage/settings-store";
import { UpdateService } from "./updates/update-service";

app.setAppUserModelId("com.overline.client");

let client: ClientWindow | null = null;
let navigationAttempt = 0;
let failureDialogOpen = false;

function showFailure(message: string): void {
  if (!client || client.window.isDestroyed() || failureDialogOpen) return;
  failureDialogOpen = true;
  const choice = dialog.showMessageBoxSync(client.window, {
    type: "error",
    title: "Overline Client",
    message,
    buttons: ["Retry", "Exit"],
    defaultId: 0,
    cancelId: 1
  });
  failureDialogOpen = false;
  if (choice === 0) void loadTanki();
  else app.quit();
}

async function loadTanki(): Promise<void> {
  if (!client || client.window.isDestroyed()) return;
  const token = ++navigationAttempt;
  try {
    await client.gameView.webContents.loadURL(TANKI_URL);
  } catch {
    if (token === navigationAttempt) {
      showFailure("Unable to load Tanki Online. Check your connection and retry.");
    }
  }
}

function bootstrap(): void {
  client = createClientWindow();
  const store = new SettingsStore(client.gameView.webContents);
  const trusted = (event: IpcMainInvokeEvent): boolean =>
    event.sender === client?.gameView.webContents && isTankiDestination(event.sender.getURL());
  ipcMain.handle("overline:settings-get", (event, keys: unknown) => {
    if (!trusted(event)) throw new Error("Untrusted Overline settings request");
    return store.get(keys);
  });
  ipcMain.handle("overline:settings-set", (event, patch: unknown) => {
    if (!trusted(event)) throw new Error("Untrusted Overline settings request");
    return store.set(patch);
  });
  ipcMain.handle("overline:settings-remove", (event, keys: unknown) => {
    if (!trusted(event)) throw new Error("Untrusted Overline settings request");
    return store.remove(keys);
  });
  client.window.on("closed", () => {
    client = null;
    app.quit();
  });
  client.gameView.webContents.on("render-process-gone", () => {
    ++navigationAttempt;
    showFailure("Tanki stopped unexpectedly.");
  });
  void loadTanki();
  new UpdateService(client.window).start();
}

app.on("window-all-closed", () => app.quit());
app.on("activate", () => {
  if (client && !client.window.isDestroyed()) client.window.show();
});
app.whenReady().then(bootstrap).catch((error) => {
  dialog.showErrorBox("Overline Client", `The client could not start: ${String(error)}`);
  app.quit();
});
