import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/resources/icons", { recursive: true });
await cp("resources/icons/overline.png", "dist/resources/icons/overline.png");
