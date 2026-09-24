const path = require("node:path");
const { version } = require("./package.json");
const { applyDeterministicInstallerIdentity } = require("./scripts/installer-identity.cjs");

const DANGEROUS_LEGACY_PRODUCT_CODE = "ED16CEE9-B1F2-461E-BB65-8591A8181B5A";
const DANGEROUS_LEGACY_PACKED_CODE = "9EEC61DE2F1BE164BB5658198A81B1A5";
const LEGACY_BLOCK_MESSAGE = "An incompatible legacy Overline Client installation was detected. Setup stopped to protect your files. Please follow the Overline legacy installation recovery instructions before continuing.";

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
          applyDeterministicInstallerIdentity(creator, version);
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
          const legacyProtection = `
    <!-- Block ProductCode {${DANGEROUS_LEGACY_PRODUCT_CODE}} before RemoveExistingProducts can invoke its unsafe MSI. -->
    <Property Id="OVERLINE_DANGEROUS_LEGACY">
      <RegistrySearch Id="OverlineDangerousLegacyPerUser"
                      Root="HKCU"
                      Key="Software\\Microsoft\\Installer\\Products\\${DANGEROUS_LEGACY_PACKED_CODE}"
                      Name="ProductName"
                      Type="raw"
                      Win64="yes" />
      <RegistrySearch Id="OverlineDangerousLegacyPerMachine"
                      Root="HKLM"
                      Key="Software\\Classes\\Installer\\Products\\${DANGEROUS_LEGACY_PACKED_CODE}"
                      Name="ProductName"
                      Type="raw"
                      Win64="yes" />
    </Property>
    <Condition Message="${LEGACY_BLOCK_MESSAGE}"><![CDATA[Installed OR NOT OVERLINE_DANGEROUS_LEGACY]]></Condition>`;
          const arpProperty = '<Property Id="ARPSYSTEMCOMPONENT" Value="1" />';
          if (!creator.wixTemplate.includes(arpProperty)) {
            throw new Error("WiX template changed; legacy product protection could not be inserted.");
          }
          creator.wixTemplate = creator.wixTemplate.replace(arpProperty, `${arpProperty}${legacyProtection}`);
          const registryKeys = creator.getRegistryKeys.bind(creator);
          creator.getRegistryKeys = () => registryKeys().filter((entry) => entry.id !== "RegistryInstallPath");
        }
      }
    }
  ]
};
