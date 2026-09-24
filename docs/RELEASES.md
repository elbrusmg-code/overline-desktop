# Overline Client Windows releases

`package.json` is the canonical client version source. Keep the installed app and release tag at the same semantic version. The published `0.1.1` release remains available for upgrade tests. This release is `0.1.2`; future releases must use higher versions. The packaged Overline web snapshot has its own extension version and does not set the desktop client version.

## v0.1.2

- Completes the restrained Overline Theme V1 redesign across Lobby, Containers, Missions, Garage, Shop, Settings, Play and Battle surfaces while preserving native Tanki structure and semantic colors.
- Adds the **No Theme / Overline** selector with live switching and persistence; No Theme restores Tanki's native visual presentation without disabling companion features.
- Refines the transparent timer HUD, final-ten-second warning, repeating countdown and 50–200% Timer Size control.
- Restores native F11, P and TAB hints and preserves Tanki's FPS, Ping and kill-feed presentation.
- Cleans up Battle TAB styling and Quick Battle queue presentation without creating or caching player rows.
- Preserves native Settings toggle behavior and scrolling, and validates the complete persisted appearance schema including `appearance.theme`.
- Keeps Nickname Style disabled in production.
- Hardens Windows packaging with deterministic installer identities and a guard against the unsafe legacy installer ProductCode.

## Official source

The official public release source is [elbrusmg-code/overline-desktop](https://github.com/elbrusmg-code/overline-desktop). `OFFICIAL_RELEASE_REPOSITORY` in `src/main/updates/release-config.ts` pins that `{ owner, repo }` in the main process. Tanki, command line arguments and IPC cannot choose an update URL. The reference client's update source is separate and is not used.

## Build and publish

1. Bump only `package.json` and its lockfile with `npm version <version> --no-git-tag-version` when a new version is authorized. Keep the WiX upgrade GUIDs stable.
2. On Windows with WiX Toolset v3 available as `candle.exe` and `light.exe`, run `npm run make:windows` (set `WIX_TOOLSET_BIN` if needed). This builds the app, x64 MSI and Burn setup.
3. The command writes `out/release/Overline-Client-<version>-Setup.exe`, `out/release/latest.json` and `out/release/SHA256SUMS.txt`. Metadata is generated **after** linking the final setup binary. Confirm the metadata size and SHA-256 against that exact binary before upload.
4. Create a public GitHub Release tagged `v<version>` in the configured repository and attach the setup EXE and `latest.json` without renaming them. `SHA256SUMS.txt` is optional for users. Do not publish draft or prerelease builds as stable updates.

`latest.json` contains `version`, `platform: "win32"`, `arch: "x64"`, `installer`, `size` in bytes and lowercase hexadecimal `sha256`. It contains no executable instructions or URL. The updater reads GitHub's latest stable release from the pinned repository, requires matching tag and metadata versions, and downloads the named release asset via its GitHub asset ID. It verifies byte count and SHA-256 before offering installation, then checks them again before launch. Redirects are HTTPS and restricted to GitHub release hosts. A mismatch rejects and deletes the partial download. No update check blocks Tanki startup; checks start after 30 seconds and at most once per 24 hours. Offline or invalid releases leave the client running normally. Updater events do not log URLs or personal data.

The release's metadata and installer are both hosted in the same GitHub repository. Hash checking detects corruption and mismatched bytes, but a compromised release account could replace both. SHA-256 is **not** a replacement for Authenticode. Future signing belongs between final MSI/Burn linking and metadata generation: sign the MSI if distributed, sign the final Burn EXE, then hash the signed final EXE. Unsigned builds may trigger Windows SmartScreen.

## Windows upgrade rules

The MSI UpgradeCode is `95FFEB92-CB15-44F4-8DF4-F33B223C0814`; the Burn Bundle UpgradeCode is `622FB613-976E-4D84-B220-158B0CEED2B4`. Both remain stable. The WiX maker creates a fresh MSI ProductCode for each build. `ProductVersion` and Bundle `Version` come from `package.json`. MSI major upgrades reject the same version (`AllowSameVersionUpgrades="no"`), so always raise the version for a release. Burn upgrades to a higher bundle version and its MSI replaces the prior MSI with the stable UpgradeCode. Do not rebuild and publish a different binary under the same version.

The MSI deliberately has no remembered `INSTALLPATH` registry search or `WixRemoveFoldersEx` purge. Uninstall relies on component ownership. The Burn installer passes the chosen folder to the MSI; a custom path must be tested during a real higher-version upgrade before release. Never restore recursive folder cleanup. Settings stay in `%APPDATA%\Overline Client\overline-settings.json`, outside the install directory, and normal uninstall does not target them. Updater state and stale downloads are separate files below the same userData directory; cleanup only unlinks matching installer files older than seven days.

For rollback, publish a **newer** version containing the known-good code. Neither MSI nor Burn should be forced backwards or republished at the same version. Before any public update, manually test default and custom install upgrades, shortcuts, settings preservation, uninstall, and a hash failure case on a disposable test machine.

## Deterministic installer identity

`scripts/installer-identity.cjs` derives UUIDv5 identifiers from the stable Overline Windows-installer namespace. The MSI ProductCode is derived from the application version, so clean rebuilds of the same version produce the same ProductCode while a new version receives a new ProductCode. File component GUIDs are derived from normalized install-relative paths. Registry component GUIDs are derived from their registry resource identity. Start-menu and desktop shortcut components use fixed namespace-derived identities. Do not replace these values with random GUID generation.

The MSI UpgradeCode remains `{95FFEB92-CB15-44F4-8DF4-F33B223C0814}` and the Burn Bundle UpgradeCode remains `{622FB613-976E-4D84-B220-158B0CEED2B4}`.

## Dangerous legacy installation guard

ProductCode `{ED16CEE9-B1F2-461E-BB65-8591A8181B5A}` identifies an incompatible development-era MSI. Its uninstall sequence contains `WixRemoveFoldersEx` and may recover an unsafe remembered install path. It must never be invoked by `msiexec`, Burn, or `RemoveExistingProducts`.

Future MSIs search Windows Installer registration for that exact ProductCode and fail their launch condition before `RemoveExistingProducts`. Keep this targeted guard in every future release. Safe products sharing the UpgradeCode remain eligible for normal major upgrade when the dangerous ProductCode is absent.

The already-published v0.1.1 installer predates this guard and can invoke the dangerous legacy uninstall on affected machines. Do not replace its published assets silently. Recover affected machines with Microsoft's supported Program Install and Uninstall troubleshooter, selecting the exact legacy ProductCode, before running a protected future installer.
