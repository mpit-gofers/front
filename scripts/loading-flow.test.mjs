import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const loadingSource = readFileSync(
  new URL("../src/app/components/LoadingScreen.tsx", import.meta.url),
  "utf8",
);

function test(name, assertion) {
  try {
    assertion();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("loading progress stays below completion until API resolves", () => {
  assert.match(loadingSource, /MAX_WAITING_PROGRESS\s*=\s*90/);
  assert.match(loadingSource, /setProgress\(100\)/);
});

test("loading copy avoids claiming validation is already complete", () => {
  assert.doesNotMatch(loadingSource, /Валидация завершена/);
  assert.match(loadingSource, /Ответ занимает больше обычного/);
});

test("loading preserves context until final successful result", () => {
  assert.match(
    loadingSource,
    /if \(query\.isValid\) \{[\s\S]*sessionStorage\.removeItem\("pendingAskContext"\)/,
  );
});
