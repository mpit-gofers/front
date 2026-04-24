import { Card } from "./ui/card";

type ScorecardEntry = {
  id: string;
  title: string;
  currentScore: string;
  currentLabel: string;
  target: string;
  targetLabel: string;
  evidence: string;
};

/**
 * Документированные KPI и scorecard-метрики для hero-блока Home.
 * Вход: нет.
 * Выход: неизменяемый список current/target пар без runtime-телеметрии.
 */
export const PILOT_SCORECARD_ENTRIES = [
  {
    id: "overall-readiness",
    title: "Готовность продукта",
    currentScore: "79 / 120",
    currentLabel: "Current score по общей оценке MVP",
    target: "93-103 / 120",
    targetLabel: "Target после документированных P0/P1 улучшений",
    evidence: "Показывает, что продукт уже конкурентный и имеет понятный путь к demo-ready уровню.",
  },
  {
    id: "business-value",
    title: "Ценность для бизнеса",
    currentScore: "12 / 15",
    currentLabel: "Current score по критерию ценности для бизнеса",
    target: "<= 2 min TTA",
    targetLabel: "Target медианы Time-to-Answer в пилоте",
    evidence: "Фокус не на SQL-демо, а на сокращении цикла от вопроса до управленческого действия.",
  },
  {
    id: "trust-layer",
    title: "Доверие и контроль",
    currentScore: "13 / 15",
    currentLabel: "Current score по guardrails и безопасности",
    target: ">= 95%",
    targetLabel: "Target ответов с полным trust-контуром",
    evidence: "Полный контур означает confidence, explain и SQL в каждом успешном бизнес-кейсе.",
  },
  {
    id: "clarification-loop",
    title: "Качество уточнений",
    currentScore: "4 / 5",
    currentLabel: "Current score по ambiguity/confidence handling",
    target: ">= 90%",
    targetLabel: "Target корректных уточнений для неоднозначных запросов",
    evidence: "Пилот должен безопасно уводить low-confidence кейсы в clarification-first flow.",
  },
] as const satisfies readonly ScorecardEntry[];

/**
 * Компактный продуктовый scorecard для позиционирования Decision Room на Home.
 * Вход: нет.
 * Выход: блок с документированными current/target KPI для бизнеса.
 */
export function PilotScorecard() {
  return (
    <Card className="mb-10 overflow-hidden border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-sm">
      <div className="border-b border-white/10 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/90">
              Pilot scorecard
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Drivee Decision Room как рабочий слой для бизнес-решений
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
              Current score взят из документированной hackathon evaluation. Target показывает
              цели и forecast пилота на 2-4 недели, а не live telemetry.
            </p>
          </div>
          <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            Для Ops и Finance ценность здесь приземленная: быстрее получить ответ, видеть trust-
            контроль и сразу перейти от KPI к действию.
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 sm:px-8 lg:grid-cols-2 xl:grid-cols-4">
        {PILOT_SCORECARD_ENTRIES.map((entry) => (
          <div
            key={entry.id}
            className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-white">{entry.title}</p>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                Current score
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {entry.currentScore}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-300">{entry.currentLabel}</p>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
                Target
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{entry.target}</p>
              <p className="mt-1 text-sm leading-5 text-slate-300">{entry.targetLabel}</p>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-200/90">{entry.evidence}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-xs leading-5 text-slate-300 sm:px-8">
        Источники: `docs/hackathon-evaluation.md` и
        `docs/superpowers/specs/2026-04-24-ops-finance-decision-room-design.md`.
      </div>
    </Card>
  );
}
