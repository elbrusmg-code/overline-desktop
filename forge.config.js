const path = require("node:path");

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "Overline Client",
    icon: path.join(__dirname, "resources/icons/overline"),
    win32metadata: {
      CompanyName: "Overline",
      FileDescription: "Overline Client",
      ProductName: "Overline Client",
      InternalName: "Overline Client",
      OriginalFilename: "Overline Client.exe"
    },
    ignore: [
      /^[/\\](?:src|scripts|resources|out)(?:[/\\]|$)/i,
      /^[/\\](?:README\.md|tsconfig\.json|forge\.config\.js|package-lock\.json|\.gitignore)$/i,
      /[/\\]node_modules[/\\]\.package-lock\.json$/i
    ]
  },
  makers: [
    {
      name: "@electron-forge/maker-wix",
      config: {
        name: "Overline Client",
        description: "Overline Client",
        manufacturer: "Overline",
        exe: "Overline Client.exe",
        icon: path.join(__dirname, "resources/icons/overline.ico"),
        appUserModelId: "com.overline.client",
        upgradeCode: "95FFEB92-CB15-44F4-8DF4-F33B223C0814",
        arch: "x64",
        defaultInstallMode: "perUser",
        shortcutFolderName: "Overline",
        shortcutName: "Overline Client",
        features: false,
        ui: {
          chooseDirectory: true,
          images: {
            background: path.join(__dirname, "resources/installer/overline-welcome.jpg"),
            banner: path.join(__dirname, "resources/installer/overline-banner.jpg")
          }
        },
        beforeCreate(creator) {
          // electron-wix-msi's default PurgeOnUninstall recursively removes the
          // remembered install path. A user-selected drive root makes that unsafe.
          const pathSearch = /\s*<!-- Necessary registry search[\s\S]*?-->\s*<Property Id="INSTALLPATH">[\s\S]*?<\/Property>/;
          const recursivePurge = /\s*<!-- Lets cleanup[\s\S]*?-->\s*<DirectoryRef Id="APPLICATIONROOTDIRECTORY">[\s\S]*?<\/DirectoryRef>/;
          const purgeReference = /\s*<ComponentRef Id="PurgeOnUninstall"\s*\/>/;
          const sameVersionUpgrade = /<MajorUpgrade AllowSameVersionUpgrades="yes"/;
          if (![pathSearch, recursivePurge, purgeReference, sameVersionUpgrade].every((pattern) => pattern.test(creator.wixTemplate))) {
            throw new Error("WiX template changed; unsafe recursive cleanup must be reviewed before packaging.");
          }
          creator.wixTemplate = creator.wixTemplate
            .replace(pathSearch, "")
            .replace(recursivePurge, "")
            .replace(purgeReference, "")
            .replace(sameVersionUpgrade, '<MajorUpgrade AllowSameVersionUpgrades="no"')
            .replaceAll("{{ApplicationName}} (Machine - MSI)", "{{ApplicationName}}")
            .replaceAll("{{ApplicationName}} (User - MSI)", "{{ApplicationName}}")
            .replaceAll("{{ApplicationName}} (Machine)", "{{ApplicationName}}")
            .replaceAll("{{ApplicationName}} (User)", "{{ApplicationName}}");
          const registryKeys = creator.getRegistryKeys.bind(creator);
          creator.getRegistryKeys = () => registryKeys().filter((entry) => entry.id !== "RegistryInstallPath");
        }
      }
    }
  ]
};
