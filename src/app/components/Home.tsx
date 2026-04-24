import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { PRESET_QUESTION_GROUPS, type PreparedQuestion } from "../store";
import { Textarea } from "./ui/textarea";
import { PilotKpiPanel } from "./PilotKpiPanel";

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
 * Главный экран Decision Room.
 * Вход: нет.
 * Выход: UI для ручного запроса и запуска валидированных сценариев в один клик.
 */
export function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  /**
   * Запускает новый запрос через текущий loading flow.
   * Вход: текст запроса.
   * Выход: переход на экран загрузки с сохранением pendingQuery в sessionStorage.
   */
  const launchQuery = (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const queryId = `query-${Date.now()}`;
    sessionStorage.setItem("pendingQuery", trimmedQuery);
    sessionStorage.removeItem("clarificationTrail");
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
    launchQuery(preset.question);
  };

  return (
    <div className="mx-auto max-w-6xl pt-16 pb-24">
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
          <Sparkles className="h-4 w-4" />
          Selectoria
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900">
          Вопросы для Ops и Finance
          <br />
          с безопасным AI-контуром
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-slate-600">
          Запускайте готовые decision-сценарии в один клик или задайте свой вопрос.
          Ответы остаются проверяемыми: с trust-контуром, SQL и следующими шагами.
        </p>
      </div>

      <PilotKpiPanel />

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

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Готовые вопросы</h2>
          <p className="text-sm text-slate-600">
            Источник: валидированные сценарии из DR-001. Каждый сценарий можно запустить без ручной правки текста.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          1 клик до результата
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {PRESET_QUESTION_GROUPS.map((group) => (
          <Card key={group.role} className="border-slate-200 p-6">
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
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePresetLaunch(preset)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handlePresetLaunch(preset);
                    }
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
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
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Метрика: <span className="font-medium text-slate-800">{preset.metric}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Следующий шаг: {preset.actionHint}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePresetLaunch(preset);
                      }}
                    >
                      Запустить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePresetPreview(preset);
                      }}
                    >
                      Вставить в поле
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
