import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homeSource = readFileSync(new URL("../src/app/components/Home.tsx", import.meta.url), "utf8");
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

test("home screen separates business and demo scenarios", () => {
  assert.match(homeSource, /Бизнес-сценарии/);
  assert.match(homeSource, /Demo \/ Debug/);
  assert.match(storeSource, /category:\s*"business"/);
  assert.match(storeSource, /category:\s*"demo"/);
});

test("home screen exposes lightweight scenario filters", () => {
  for (const label of ["Все", "Ops", "Finance", "Safety", "Demo"]) {
    assert.match(homeSource, new RegExp(`label:\\s*"${label}"`));
  }
});

test("preset cards require explicit launch action", () => {
  assert.doesNotMatch(homeSource, /role="button"/);
  assert.doesNotMatch(homeSource, /tabIndex=\{0\}/);
  assert.doesNotMatch(homeSource, /onKeyDown=\{\(event\) =>/);
});

test("home screen explains preset default period before launch", () => {
  assert.match(homeSource, /Период по умолчанию/);
  assert.doesNotMatch(homeSource, /Вопросы для Ops и Finance/);
});

test("home screen renders a modest pilot KPI panel from optional snapshot", () => {
  assert.match(homeSource, /getPilotKpiSnapshot/);
  assert.match(homeSource, /Technical health/);
  assert.match(homeSource, /Pilot quality/);
  assert.match(homeSource, /historical snapshot/i);
  assert.match(homeSource, /Не удалось загрузить historical snapshot/);
});
