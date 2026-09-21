import { shell, type WebContents } from "electron";

export const TANKI_URL = "https://tankionline.com/play/";

export function isTankiDestination(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "tankionline.com" || url.hostname.endsWith(".tankionline.com"));
  } catch {
    return false;
  }
}

function isExternalWebLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function protectTankiNavigation(contents: WebContents): void {
  const rejectUnexpectedNavigation = (details: Electron.Event & { url: string; isMainFrame: boolean }) => {
    if (!details.isMainFrame || isTankiDestination(details.url)) return;
    details.preventDefault();
    if (isExternalWebLink(details.url)) void shell.openExternal(details.url);
  };

  contents.on("will-navigate", rejectUnexpectedNavigation);
  contents.on("will-redirect", rejectUnexpectedNavigation);
  contents.setWindowOpenHandler(({ url }) => {
    if (isExternalWebLink(url) && !isTankiDestination(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
}
