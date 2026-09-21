# Overline Client

An open-source unofficial companion client for Tanki Online. Overline Client opens the game in one desktop window and adds the Overline visual layer and controls.

## About

The app is an Electron client for Windows. Tanki's own startup screen appears in the client window; Overline does not replace the game or its account system.

## Features

- Overline Theme
- Insert-opened Control Center
- Timer with resize control
- Audio controls
- Appearance controls
- Nickname Style
- About panel and Overline branding

## Installation

Download the Windows `Overline-Client-<version>-Setup.exe` from the [official Releases page](https://github.com/elbrusmg-code/overline-desktop/releases) when a release is available. The installer offers a per-user default location and an optional custom folder. No installer binary is stored in this Git repository. Unsigned releases may prompt Windows SmartScreen.

## Development

Install Node.js and npm, then run:

```powershell
npm ci
npm start
```

`npm run build` compiles the client and packages its active Overline web resources. On Windows, `npm run make:windows` builds the x64 MSI and Burn Setup.exe using WiX Toolset v3. Set `WIX_TOOLSET_BIN` to the folder containing `candle.exe` and `light.exe` if WiX is not on `PATH`. The app identifier remains `com.overline.client`.

The `src/overline/web` directory is a snapshot of active Overline extension resources adapted for the desktop client. Normal builds do not depend on a sibling checkout. `npm run import:overline` deliberately refreshes that snapshot from the extension source.

## Releases

See [docs/RELEASES.md](docs/RELEASES.md) for versioning, update metadata, checksums, Windows upgrade rules and signing plans. The client checks only the pinned official repository for newer stable releases after startup. Update checks do not block the game window.

## Privacy

Overline settings are stored locally in `%APPDATA%\Overline Client\overline-settings.json` and survive normal updates and uninstall. The updater requests release information and installer assets from the official GitHub repository. It does not read Tanki credentials or session data. Tanki authentication stays in the game's own browser session.

## License

MIT. See [LICENSE](LICENSE).

## Disclaimer

Overline Client is an unofficial community project. It is not affiliated with or endorsed by Tanki Online or Alternativa Games.
