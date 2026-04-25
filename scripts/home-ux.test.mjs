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

test("home screen does not advertise last-7-days as default period", () => {
  assert.doesNotMatch(homeSource, /Период по умолчанию/);
  assert.doesNotMatch(homeSource, /DEFAULT_DATE_RANGE_PARAM/);
  assert.doesNotMatch(homeSource, /default_params/);
  assert.doesNotMatch(storeSource, /предложенным дефолтом/);
  assert.doesNotMatch(homeSource, /Вопросы для Ops и Finance/);
});

test("prepared business questions use approved March and February 2025 prompts", () => {
  const expectedQuestions = [
    "Покажи количество заказов по статусам с 1 марта по 7 марта 2025 года",
    "Покажи выручку по дням с 10 февраля по 17 февраля 2025 года",
    "Покажи среднюю длительность поездки по дням с 5 января по 12 января 2025 года",
    "Покажи среднюю стоимость заказа по дням с 15 марта по 22 марта 2025 года",
    "Покажи количество отмен пассажирами по дням с 1 марта по 7 марта 2025 года",
    "Покажи количество заказов с тендерами и без с 1 марта по 7 марта 2025 года",
    "Покажи среднюю дистанцию поездки по дням с 1 февраля по 7 февраля 2025 года",
    "Покажи количество завершённых поездок по дням с 1 марта по 7 марта 2025 года",
    "Покажи конверсию из заказа в поездку с 1 марта по 7 марта 2025 года",
  ];

  for (const question of expectedQuestions) {
    assert.match(storeSource, new RegExp(question));
  }

  assert.doesNotMatch(storeSource, /Почему выросли отмены в конкретном городе и часе/);
  assert.doesNotMatch(storeSource, /Почему упала выручка day-over-day или week-over-week/);
});

test("prepared questions rely on explicit dates or backend period clarification", () => {
  assert.doesNotMatch(storeSource, /usesDefaultDateRange/);
  assert.doesNotMatch(homeSource, /usesDefaultDateRange/);
  assert.match(homeSource, /Период: указан в вопросе или будет уточнен/);
});

test("home screen renders a modest pilot KPI panel from optional snapshot", () => {
  assert.match(homeSource, /getPilotKpiSnapshot/);
  assert.match(homeSource, /Technical health/);
  assert.match(homeSource, /Pilot quality/);
  assert.match(homeSource, /historical snapshot/i);
  assert.match(homeSource, /Не удалось загрузить historical snapshot/);
});
