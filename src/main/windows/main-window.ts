import { BaseWindow, screen, session, WebContentsView, type WebContents } from "electron";
import path from "node:path";
import { isTankiDestination, protectTankiNavigation } from "../security/navigation-policy";

export type ClientWindow = {
  window: BaseWindow;
  gameView: WebContentsView;
};

export function createClientWindow(): ClientWindow {
  const gameSession = session.fromPartition("persist:overline-game");

  const window = new BaseWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Overline Client",
    backgroundColor: "#101820",
    icon: path.join(__dirname, "../../resources/icons/overline.png")
  });
  window.setMenuBarVisibility(false);

  const gameView = new WebContentsView({
    webPreferences: {
      partition: "persist:overline-game",
      preload: path.join(__dirname, "../../preload/tanki-preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });
  const allowGameInput = (contents: WebContents | null, permission: string, requestUrl: string, isMainFrame: boolean): boolean =>
    (permission === "pointerLock" || permission === "fullscreen") &&
    contents === gameView.webContents && isMainFrame &&
    isTankiDestination(gameView.webContents.getURL()) && isTankiDestination(requestUrl);
  gameSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(allowGameInput(contents, permission, details.requestingUrl, details.isMainFrame));
  });
  gameSession.setPermissionCheckHandler((contents, permission, requestingOrigin, details) =>
    allowGameInput(contents, permission, requestingOrigin, details.isMainFrame));
  gameView.setBackgroundColor("#101820");
  protectTankiNavigation(gameView.webContents);
  gameView.webContents.on("page-title-updated", (event) => event.preventDefault());

  const fitGame = (): void => {
    if (window.isDestroyed()) return;
    const { width, height } = window.getContentBounds();
    gameView.setBounds({ x: 0, y: 0, width, height });
  };
  const focusGame = (): void => {
    if (!window.isDestroyed() && window.isVisible() && window.isFocused() && !gameView.webContents.isDestroyed()) {
      gameView.webContents.focus();
    }
  };
  window.contentView.addChildView(gameView);
  window.on("resize", fitGame);
  window.on("maximize", fitGame);
  window.on("unmaximize", fitGame);
  window.on("restore", fitGame);
  window.on("enter-full-screen", () => { fitGame(); focusGame(); });
  window.on("leave-full-screen", () => { fitGame(); focusGame(); });
  window.on("focus", focusGame);
  screen.on("display-metrics-changed", fitGame);
  gameView.webContents.on("enter-html-full-screen", fitGame);
  gameView.webContents.on("leave-html-full-screen", fitGame);
  gameView.webContents.on("did-finish-load", focusGame);
  gameView.webContents.on("before-input-event", (event, input) => {
    if (input.key !== "F11" || input.alt || input.control || input.meta || input.shift) return;
    event.preventDefault();
    if (input.type === "keyDown" && !input.isAutoRepeat) window.setFullScreen(!window.isFullScreen());
  });
  fitGame();
  window.on("closed", () => {
    screen.off("display-metrics-changed", fitGame);
    if (!gameView.webContents.isDestroyed()) gameView.webContents.close();
  });

  window.maximize();
  fitGame();
  window.show();
  focusGame();
  return { window, gameView };
}
