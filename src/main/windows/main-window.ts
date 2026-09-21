import { BaseWindow, session, WebContentsView } from "electron";
import path from "node:path";
import { protectTankiNavigation } from "../security/navigation-policy";

export type ClientWindow = {
  window: BaseWindow;
  gameView: WebContentsView;
};

export function createClientWindow(): ClientWindow {
  const gameSession = session.fromPartition("persist:overline-game");
  gameSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  gameSession.setPermissionCheckHandler(() => false);

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
  gameView.setBackgroundColor("#101820");
  protectTankiNavigation(gameView.webContents);
  gameView.webContents.on("page-title-updated", (event) => event.preventDefault());

  const fitGame = (): void => {
    const { width, height } = window.getContentBounds();
    gameView.setBounds({ x: 0, y: 0, width, height });
  };
  window.contentView.addChildView(gameView);
  window.on("resize", fitGame);
  fitGame();
  window.on("closed", () => {
    if (!gameView.webContents.isDestroyed()) gameView.webContents.close();
  });

  window.maximize();
  fitGame();
  window.show();
  gameView.webContents.focus();
  return { window, gameView };
}
