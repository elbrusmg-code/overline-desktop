const { createHash } = require("node:crypto");
const path = require("node:path");

const UUID_NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function uuidBytes(uuid) {
  return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

function formatUuid(bytes) {
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function uuidV5(namespace, name) {
  const bytes = createHash("sha1")
    .update(uuidBytes(namespace))
    .update(name, "utf8")
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return formatUuid(bytes);
}

const INSTALLER_NAMESPACE = uuidV5(UUID_NAMESPACE_DNS, "com.overline.client.windows-installer");

function stableId(kind, identity) {
  return `Overline_${kind}_${createHash("sha256").update(identity).digest("hex").slice(0, 32)}`;
}

function replaceEvery(value, before, after) {
  return value.split(before).join(after);
}

function applyDeterministicInstallerIdentity(creator, version) {
  creator.productCode = uuidV5(INSTALLER_NAMESPACE, `product:${version}`).toUpperCase();

  const applicationShortcutGuid = uuidV5(INSTALLER_NAMESPACE, "component:shortcut:start-menu");
  const desktopShortcutGuid = uuidV5(INSTALLER_NAMESPACE, "component:shortcut:desktop");
  creator.wixTemplate = creator.wixTemplate
    .replace("{{ApplicationShortcutGuid}}", applicationShortcutGuid)
    .replace("{{DesktopShortcutGuid}}", desktopShortcutGuid);

  const originalFileComponent = creator.getFileComponent.bind(creator);
  creator.getFileComponent = (file, indent) => {
    const component = originalFileComponent(file, indent);
    const sourceRelative = path.relative(creator.appDirectory, file.path);
    // electron-wix-msi creates the launcher stub and .installInfo.json in a
    // random temporary directory. Their stable identity is their destination
    // name at the application root, not that transient source path.
    const external = sourceRelative.startsWith("..") || path.isAbsolute(sourceRelative);
    const relative = (external ? file.name : sourceRelative).replaceAll("\\", "/").toLowerCase();
    const identity = `${external ? "generated" : "file"}:${relative}`;
    const componentId = stableId("File", identity);
    const guid = uuidV5(INSTALLER_NAMESPACE, `component:${identity}`);
    component.xml = replaceEvery(replaceEvery(component.xml, component.componentId, componentId), component.guid, guid);
    component.componentId = componentId;
    component.guid = guid;
    return component;
  };

  const originalRegistryComponent = creator.getRegistryComponent.bind(creator);
  creator.getRegistryComponent = (registry, indent) => {
    const component = originalRegistryComponent(registry, indent);
    const identity = `registry:${registry.root}:${registry.key}:${registry.name}`.toLowerCase();
    const componentId = stableId("Registry", identity);
    const guid = uuidV5(INSTALLER_NAMESPACE, `component:${identity}`);
    component.xml = replaceEvery(replaceEvery(component.xml, component.componentId, componentId), component.guid, guid);
    component.componentId = componentId;
    component.guid = guid;
    return component;
  };

  return creator.productCode;
}

module.exports = { INSTALLER_NAMESPACE, applyDeterministicInstallerIdentity, uuidV5 };
