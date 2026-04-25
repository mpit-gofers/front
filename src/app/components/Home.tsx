import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getPilotKpiSnapshot, type PilotKpiSnapshot } from "../api";
import {
  PRESET_QUESTION_GROUPS,
  type AnalysisContext,
  type PreparedQuestion,
} from "../store";
import { Textarea } from "./ui/textarea";

const DEFAULT_DATE_RANGE_PARAM = {
  value: "last_7_days",
  label: "последние 7 дней",
  source: "scenario_default",
};

type ScenarioFilter = "business" | "all" | "Ops" | "Finance" | "Safety" | "demo";

const SCENARIO_FILTERS: Array<{ label: string; value: ScenarioFilter }> = [
  { label: "Бизнес", value: "business" },
  { label: "Все", value: "all" },
  { label: "Ops", value: "Ops" },
  { label: "Finance", value: "Finance" },
  { label: "Safety", value: "Safety" },
  { label: "Demo", value: "demo" },
];

/**
 * Форматирует долю из backend snapshot в короткий процент для KPI-карточек.
 * Вход: число от 0 до 1.
 * Выход: строка процента без лишних десятичных знаков.
 */
function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Безопасно берет значение из optional KPI snapshot.
 * Вход: snapshot, функция выборки и fallback.
 * Выход: строка для UI, даже если backend KPI временно недоступен.
 */
function getSnapshotValue(
  snapshot: PilotKpiSnapshot | null,
  selector: (snapshot: PilotKpiSnapshot) => string,
  fallback: string,
): string {
  return snapshot ? selector(snapshot) : fallback;
}

function getGroupHeading(role: PreparedQuestion["role"]): string {
  switch (role) {
    case "Ops":
      return "Операционный контур";
    case "Finance":
      return "Финансовый контур";
    case "Safety":
      return "Контур безопасности";
  }
}

/**
 * Проверяет, должна ли группа сценариев попадать в выбранный фильтр.
 * Вход: группа preset-вопросов и активный фильтр.
 * Выход: `true`, если группу нужно показать на главном экране.
 */
function matchesScenarioFilter(
  group: (typeof PRESET_QUESTION_GROUPS)[number],
  filter: ScenarioFilter,
): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "business") {
    return group.category === "business";
  }
  if (filter === "demo") {
    return group.category === "demo";
  }
  return group.role === filter && group.category === "business";
}

/**
 * Главный экран Decision Room.
 * Вход: нет.
 * Выход: UI для ручного запроса и запуска валидированных сценариев в один клик.
 */
export function Home() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ScenarioFilter>("business");
  const [pilotKpiSnapshot, setPilotKpiSnapshot] = useState<PilotKpiSnapshot | null>(
    null,
  );
  const [pilotKpiError, setPilotKpiError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const draftQuery = sessionStorage.getItem("draftQuery");
    if (!draftQuery) {
      return;
    }

    setQuery(draftQuery);
    sessionStorage.removeItem("draftQuery");
  }, []);

  useEffect(() => {
    let isMounted = true;

    getPilotKpiSnapshot()
      .then((snapshot) => {
        if (!isMounted) {
          return;
        }
        setPilotKpiSnapshot(snapshot);
        setPilotKpiError("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setPilotKpiSnapshot(null);
        setPilotKpiError("Не удалось загрузить historical snapshot.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Запускает новый запрос через текущий loading flow.
   * Вход: текст запроса.
   * Выход: переход на экран загрузки с сохранением pendingQuery в sessionStorage.
   */
  const launchQuery = (nextQuery: string, context?: AnalysisContext) => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const queryId = `query-${Date.now()}`;
    sessionStorage.setItem("pendingQuery", trimmedQuery);
    sessionStorage.removeItem("clarificationTrail");
    if (context && Object.keys(context).length > 0) {
      sessionStorage.setItem("pendingAskContext", JSON.stringify(context));
    } else {
      sessionStorage.removeItem("pendingAskContext");
    }
    navigate(`/loading/${queryId}`);
  };

  /**
   * Обрабатывает ручной submit формы.
   * Вход: submit event формы.
   * Выход: отменяет дефолтное поведение и запускает запрос через общий flow.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    launchQuery(query);
  };

  /**
   * Подставляет готовый вопрос в textarea без запуска.
   * Вход: один сценарий из реестра.
   * Выход: обновленное значение локального состояния `query`.
   */
  const handlePresetPreview = (preset: PreparedQuestion) => {
    setQuery(preset.question);
  };

  /**
   * Запускает готовый сценарий без промежуточных шагов.
   * Вход: один сценарий из реестра.
   * Выход: переход в loading flow.
   */
  const handlePresetLaunch = (preset: PreparedQuestion) => {
    setQuery(preset.question);
    launchQuery(preset.question, {
      scenario_id: preset.id,
      role: preset.role,
      action_hint: preset.actionHint,
      default_params: {
        date_range: DEFAULT_DATE_RANGE_PARAM,
      },
    });
  };

  const visibleGroups = PRESET_QUESTION_GROUPS.filter((group) =>
    matchesScenarioFilter(group, activeFilter),
  );
  const businessGroups = visibleGroups.filter(
    (group) => group.category === "business",
  );
  const demoGroups = visibleGroups.filter((group) => group.category === "demo");
  const technicalKpis = [
    {
      label: "Saved reports",
      value: getSnapshotValue(
        pilotKpiSnapshot,
        (snapshot) => snapshot.report_count.toLocaleString("ru-RU"),
        "0",
      ),
      note: "Источник: сохраненная история отчетов.",
    },
    {
      label: "Trust completeness",
      value: getSnapshotValue(
        pilotKpiSnapshot,
        (snapshot) => formatPercent(snapshot.decision_log_complete_rate),
        "0%",
      ),
      note: "SQL + explain + confidence + actions.",
    },
    {
      label: "Clarification rate",
      value: getSnapshotValue(
        pilotKpiSnapshot,
        (snapshot) => formatPercent(snapshot.clarification_rate),
        "0%",
      ),
      note: "Не ниже/выше автоматически: это сигнал неоднозначности.",
    },
    {
      label: "Avg confidence",
      value: getSnapshotValue(
        pilotKpiSnapshot,
        (snapshot) => formatPercent(snapshot.avg_confidence_score),
        "0%",
      ),
      note: "Технический confidence, не ручная оценка правильности.",
    },
  ];
  const pilotQualityKpis = [
    {
      label: "Demo pass rate",
      value: "4/4",
      note: "По последнему demo smoke-log: Ops, Finance, Cross-check, Safety.",
    },
    {
      label: "Time-to-Answer",
      value: "manual",
      note: "Runtime timing еще не инструментирован.",
    },
    {
      label: "Quality source",
      value: "review",
      note: "Проверяется через сценарии и decision log, не только через активность.",
    },
  ];

  /**
   * Рендерит группу готовых вопросов без неявного запуска по клику на карточку.
   * Вход: группа preset-вопросов.
   * Выход: карточка с явными действиями `Запустить` и `Вставить в поле`.
   */
  const renderScenarioGroup = (group: (typeof PRESET_QUESTION_GROUPS)[number]) => (
    <Card
      key={`${group.category}-${group.role}-${group.title}`}
      className="border-slate-200 p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {group.title}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            {getGroupHeading(group.role)}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{group.description}</p>
        </div>
        <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          {group.questions.length} сценариев
        </div>
      </div>

      <div className="grid gap-3">
        {group.questions.map((preset) => (
          <div
            key={preset.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {preset.id}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {preset.question}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Метрика: <span className="font-medium text-slate-800">{preset.metric}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Следующий шаг: {preset.actionHint}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Период по умолчанию: {DEFAULT_DATE_RANGE_PARAM.label}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => handlePresetLaunch(preset)}
              >
                Запустить
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePresetPreview(preset)}
              >
                Вставить в поле
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-6xl pt-16 pb-24">
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
          <Sparkles className="h-4 w-4" />
          Selectoria
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900">
          Вопросы к данным заказов
          <br />
          с безопасным AI-контуром
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-slate-600">
          Запускайте готовые decision-сценарии в один клик или задайте свой вопрос.
          Ответы остаются проверяемыми: с trust-контуром, SQL и следующими шагами.
        </p>
      </div>

      <Card className="mb-10 border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Свободный вопрос</h2>
              <p className="text-sm text-slate-600">
                Используйте свой текст, если нужного сценария нет в списке ниже.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Clarification-first и read-only guardrails
            </div>
          </div>

          <div className="relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: Почему упала выручка day-over-day или week-over-week?"
              className="min-h-[140px] resize-none border-slate-300 pr-28 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              type="submit"
              size="lg"
              className="absolute right-4 bottom-4 bg-blue-600 shadow-sm hover:bg-blue-700"
              disabled={!query.trim()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Запустить
            </Button>
          </div>
        </form>
      </Card>

      <section className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Pilot KPI
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Historical snapshot без лишней telemetry
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Текущие числа показывают technical health по сохраненным отчетам.
              Product quality держим отдельно: через demo pass rate и ручной review
              сценариев, пока нет runtime-замеров TTA.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {pilotKpiSnapshot?.latest_report_at
              ? `Последний отчет: ${pilotKpiSnapshot.latest_report_at}`
              : "История пока пуста"}
          </div>
        </div>

        {pilotKpiError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {pilotKpiError} Показываем baseline/target без ошибки страницы.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Technical health
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {technicalKpis.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-slate-900">
              Pilot quality
            </div>
            <div className="grid gap-3">
              {pilotQualityKpis.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Готовые вопросы</h2>
          <p className="text-sm text-slate-600">
            По умолчанию показаны бизнес-сценарии. Demo / Debug вынесены отдельно,
            чтобы не смешивать технические проверки с рабочими вопросами.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={activeFilter === filter.value ? "default" : "outline"}
              className={
                activeFilter === filter.value
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-white"
              }
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {businessGroups.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Бизнес-сценарии</h3>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Рабочие вопросы
            </span>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {businessGroups.map(renderScenarioGroup)}
          </div>
        </section>
      )}

      {demoGroups.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Demo / Debug</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Проверочные сценарии
            </span>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">{demoGroups.map(renderScenarioGroup)}</div>
        </section>
      )}

      {visibleGroups.length === 0 && (
        <Card className="border-slate-200 p-8 text-center">
          <p className="font-medium text-slate-900">Сценарии не найдены</p>
          <p className="mt-1 text-sm text-slate-600">
            Выберите другой фильтр или задайте вопрос вручную.
          </p>
        </Card>
      )}
    </div>
  );
}
