import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assetsDir = fileURLToPath(new URL("../dist/assets", import.meta.url));
const maxChunkBytes = 500 * 1024;
const jsAssets = readdirSync(assetsDir)
  .filter((name) => name.endsWith(".js"))
  .map((name) => {
    const size = statSync(join(assetsDir, name)).size;
    return { name, size };
  });

for (const asset of jsAssets) {
  assert.ok(
    asset.size <= maxChunkBytes,
    `${asset.name} is ${asset.size} bytes; expected <= ${maxChunkBytes}`,
  );
}

console.log(`ok - ${jsAssets.length} JS chunks are below 500 KiB`);
