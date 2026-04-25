import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const apiSource = readFileSync(new URL("../src/app/api.ts", import.meta.url), "utf8");

function test(name, assertion) {
  try {
    assertion();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("ask response has a runtime contract guard", () => {
  assert.match(apiSource, /export function isAskResponse\(value: unknown\): value is AskResponse/);
  assert.match(apiSource, /if \(!isAskResponse\(data\)\)/);
});

test("invalid successful ask payload becomes a controlled API error", () => {
  assert.match(apiSource, /INVALID_API_RESPONSE/);
  assert.match(apiSource, /Некорректный формат ответа API\./);
});
