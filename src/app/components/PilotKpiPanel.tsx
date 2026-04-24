import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { getPilotKpiSnapshot, type PilotKpiSnapshot } from "../api";

type KpiStatus = "telemetry-pending" | "documented-baseline";

type PilotKpiMetric = {
  id: string;
  title: string;
  baselineValue: string;
  baselineNote: string;
  targetValue: string;
  targetNote: string;
  status: KpiStatus;
  sourceNote: string;
};

/**
 * Документированный набор pilot KPI для продуктового позиционирования.
 * Вход: нет.
 * Выход: неизменяемый список baseline/target метрик с честной маркировкой
 *         там, где runtime telemetry еще не подключена.
 */
const PILOT_KPI_METRICS: readonly PilotKpiMetric[] = [
  {
    id: "time-to-answer",
    title: "Time-to-Answer",
    baselineValue: "Telemetry pending",
    baselineNote: "Runtime telemetry еще не подключена; baseline пока фиксируется вручную.",
    targetValue: "≤ 2 min",
    targetNote: "Медиана времени от вопроса до результата в пилоте.",
    status: "telemetry-pending",
    sourceNote: "Цель зафиксирована в product design и execution plan.",
  },
  {
    id: "time-to-insight",
    title: "Time-to-Insight",
    baselineValue: "Telemetry pending",
    baselineNote: "Доля кейсов 1-2 запроса пока не измеряется автоматически.",
    targetValue: "≥ 80%",
    targetNote: "Ответ получен с первого или второго запроса.",
    status: "telemetry-pending",
    sourceNote: "Метрика нужна, чтобы показать ускорение управленческого цикла, а не только SQL-demo.",
  },
  {
    id: "trust-completeness",
    title: "Trust completeness",
    baselineValue: "Partial trust layer",
    baselineNote: "confidence + explain + SQL уже есть, но пока не подтверждены как доля успешных ответов.",
    targetValue: "≥ 95%",
    targetNote: "Ответов с полным trust-контуром.",
    status: "documented-baseline",
    sourceNote: "Цель подтверждает, что бизнес видит не черный ящик, а проверяемый результат.",
  },
  {
    id: "clarification-rate",
    title: "Correct clarification rate",
    baselineValue: "Clarification-first flow",
    baselineNote: "Режим уточнения реализован, но пилотная точность еще не прогнана на статистике.",
    targetValue: "≥ 90%",
    targetNote: "Корректных уточнений для неоднозначных запросов.",
    status: "documented-baseline",
    sourceNote: "Это защищает бизнес от неверного ответа при ambiguous intent.",
  },
  {
    id: "guardrail-outcome",
    title: "Guardrail outcome rate",
    baselineValue: "Controlled rejections",
    baselineNote: "Read-only guardrails, AST validation и safe UX уже работают.",
    targetValue: "100%",
    targetNote: "Опасные запросы должны завершаться контролируемым отказом.",
    status: "documented-baseline",
    sourceNote: "Отказ должен быть предсказуемым и объяснимым для demo и пилота.",
  },
] as const;

/**
 * Возвращает подпись для статуса KPI без раздувания JSX.
 * Вход: внутренний статус метрики.
 * Выход: короткий text label для Badge.
 */
function getStatusLabel(status: KpiStatus): string {
  return status === "telemetry-pending" ? "Telemetry pending" : "Documented baseline";
}

/**
 * Возвращает визуальный вариант Badge под честность статуса.
 * Вход: внутренний статус метрики.
 * Выход: variant для Badge из существующего UI-кита.
 */
function getStatusVariant(status: KpiStatus) {
  return status === "telemetry-pending" ? "outline" : "secondary";
}

/**
 * Форматирует число отчетов для snapshot-блока.
 * Вход: count из API.
 * Выход: человекочитаемая строка без лишней UI-сложности.
 */
function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Форматирует долю из контракта snapshot в проценты.
 * Вход: значение от 0 до 1.
 * Выход: строка процента, округленная до целого значения.
 */
function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Преобразует ISO timestamp snapshot в компактную подпись.
 * Вход: ISO-строка из API.
 * Выход: локализованная подпись или исходная строка, если дата не распарсилась.
 */
function formatSnapshotTimestamp(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

/**
 * Компактная панель продуктовых KPI для пилота Decision Room.
 * Вход: нет.
 * Выход: карточка с baseline vs target по ключевым метрикам пилота и
 *         исторический snapshot, если GET /api/pilot/kpi доступен.
 */
export function PilotKpiPanel() {
  const [snapshot, setSnapshot] = useState<PilotKpiSnapshot | null>(null);

  useEffect(() => {
    let active = true;

    void getPilotKpiSnapshot()
      .then((data) => {
        if (active) {
          setSnapshot(data);
        }
      })
      .catch(() => {
        if (active) {
          setSnapshot(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="mb-10 overflow-hidden border-slate-200 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />

      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Pilot KPI panel
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Меряем не “SQL-инструмент”, а business effect
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Панель показывает честный current baseline и target для пилота. Когда доступен
              GET /api/pilot/kpi, сверху добавляется historical snapshot; при ошибке или загрузке
              fallback остается baseline-ориентированным и не ломает Home page.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              Ops + Finance
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-700">
              {snapshot ? "Historical snapshot" : "Baseline / target"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        {snapshot ? (
          <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  Historical snapshot
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  GET /api/pilot/kpi returned {formatCount(snapshot.report_count)} reports
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These values are historical snapshot data, not live telemetry.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-blue-200 bg-white/80 text-blue-800">
                  Generated {formatSnapshotTimestamp(snapshot.generated_at)}
                </Badge>
                <Badge variant="outline" className="border-blue-200 bg-white/80 text-blue-800">
                  Latest report {formatSnapshotTimestamp(snapshot.latest_report_at)}
                </Badge>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Report count
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatCount(snapshot.report_count)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Historical sample size from the pilot snapshot.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Avg confidence
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatPercent(snapshot.avg_confidence_score)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Historical confidence score from the backend snapshot.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Decision log completeness
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatPercent(snapshot.decision_log_complete_rate)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Historical coverage of logged decisions in the pilot.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Clarification rate
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatPercent(snapshot.clarification_rate)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Historical ratio of requests that went through clarification-first flow.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sample question
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{snapshot.sample_question}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {PILOT_KPI_METRICS.map((metric) => (
            <article
              key={metric.id}
              className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {metric.title}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {metric.id === "time-to-answer"
                      ? "Скорость первого ответа"
                      : metric.id === "time-to-insight"
                        ? "Скорость получения инсайта"
                        : metric.id === "trust-completeness"
                          ? "Покрытие trust-контура"
                          : metric.id === "clarification-rate"
                            ? "Качество уточнений"
                            : "Контролируемый исход guardrail"}
                  </h3>
                </div>

                <Badge variant={getStatusVariant(metric.status)}>
                  {getStatusLabel(metric.status)}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Baseline
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {metric.baselineValue}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{metric.baselineNote}</p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Target
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {metric.targetValue}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{metric.targetNote}</p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">{metric.sourceNote}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Snapshot values, when available, are historical and not live telemetry. If the API is
          unavailable, this panel keeps showing the baseline/target framing instead of breaking the
          Home page.
        </div>
      </div>
    </Card>
  );
}
