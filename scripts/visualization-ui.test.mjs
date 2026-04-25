import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const visualizationSource = readFileSync(
  new URL("../src/app/components/QueryVisualization.tsx", import.meta.url),
  "utf8",
);
const storeSource = readFileSync(new URL("../src/app/store.ts", import.meta.url), "utf8");

function test(name, assertion) {
  try {
    assertion();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("query visualization explains chart choice and reliability", () => {
  assert.match(visualizationSource, /spec\.reason/);
  assert.match(visualizationSource, /Над[её]жность визуализации/);
  assert.match(visualizationSource, /Math\.round\(spec\.confidence \* 100\)/);
});

test("frontend fallback keeps visualization field heuristics aligned with backend", () => {
  assert.match(storeSource, /isIdentifierField/);
  assert.match(storeSource, /isNumericDimensionField/);
  assert.doesNotMatch(storeSource, /lowered\.includes\("id"\)/);
});
