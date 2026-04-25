import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Code,
  Lightbulb,
  Save,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { type ConfidencePayload } from "../api";
import { store, type Query } from "../store";
import { QueryVisualization } from "./QueryVisualization";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";

/**
 * Нормализует label для уровня confidence.
 * Вход: значение уровня confidence из backend.
 * Выход: локализованная подпись для UI.
 */
function getConfidenceLabel(level?: ConfidencePayload["level"]): string {
  switch (level) {
    case "high":
      return "Высокая";
    case "medium":
      return "Средняя";
    case "low":
      return "Низкая";
    default:
      return "Не указана";
  }
}

/**
 * Определяет, относится ли ошибка к trust/guardrail контуру.
 * Вход: доменный error code backend.
 * Выход: `true`, если запрос был остановлен политиками безопасности до результата.
 */
function isGuardrailError(errorCode?: string): boolean {
  return Boolean(
    errorCode &&
      [
        "SQL_COST_LIMIT_EXCEEDED",
        "SQL_MUTATION_BLOCKED",
        "SQL_MULTI_STATEMENT_BLOCKED",
        "SQL_PARSE_ERROR",
        "SQL_CONTEXT_INSUFFICIENT",
      ].includes(errorCode),
  );
}

/**
 * Возвращает UX-подачу контролируемой ошибки.
 * Вход: доменный error code backend.
 * Выход: тексты и стили для guardrail/error карточки.
 */
function getErrorPresentation(errorCode?: string) {
  if (isGuardrailError(errorCode)) {
    return {
      badge: "Guardrails сработали",
      title: "Запрос остановлен до выполнения",
      description:
        "Система не запустила SQL, потому что вопрос нарушал ограничения безопасности или был недостаточно точным.",
      panelClass: "border-amber-200 bg-amber-50",
      iconClass: "bg-amber-100 text-amber-700",
    };
  }

  if (errorCode === "VALIDATION_ERROR") {
    return {
      badge: "Нужна корректная формулировка",
      title: "Запрос не прошел валидацию",
      description:
        "Формулировка не дошла до аналитического сценария. Исправьте вопрос и повторите запуск.",
      panelClass: "border-blue-200 bg-blue-50",
      iconClass: "bg-blue-100 text-blue-700",
    };
  }

  return {
    badge: "Контролируемая ошибка",
    title: "Не удалось завершить запрос",
    description:
      "Поток не сломался: запрос завершился с понятной ошибкой, и ниже показаны следующие шаги.",
    panelClass: "border-red-200 bg-red-50",
    iconClass: "bg-red-100 text-red-700",
  };
}

/**
 * Безопасно читает цепочку уточнений из sessionStorage.
 * Вход: сырое JSON-значение.
 * Выход: массив шагов уточнения или пустой массив.
 */
function parseClarificationTrail(rawTrail: string | null): Array<Record<string, string>> {
  if (!rawTrail) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawTrail);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Превращает короткий ввод параметра в полноценный вопрос для повторного запуска.
 * Вход: исходный вопрос, значение уточнения и имя параметра.
 * Выход: текст запроса, который можно отправить в backend.
 */
function buildClarifiedQuestion(
  baseQuestion: string,
  rawValue: string,
  paramName?: string,
): string {
  const value = rawValue.trim();
  const base = baseQuestion.trim();
  if (!value) {
    return base;
  }

  const loweredValue = value.toLowerCase();
  if (
    loweredValue.includes(base.toLowerCase()) ||
    /^(покажи|почему|какая|какой|где|есть ли|как\s)/i.test(value)
  ) {
    return value;
  }

  if (paramName === "date_range" && !/^(за|с|со|от|до|по)\b/i.test(value)) {
    return `${base} за ${value}`;
  }

  return `${base} ${value}`;
}

/**
 * Формирует подпись optional default из payload, если backend явно его прислал.
 * Вход: label/value из clarification payload.
 * Выход: человекочитаемая фраза для кнопки и повторного запроса.
 */
function getClarificationDefaultLabel(
  defaultLabel?: string,
  defaultValue?: string | null,
): string {
  if (defaultLabel?.trim()) {
    return defaultLabel.trim();
  }

  return defaultValue?.trim() ?? "";
}

/**
 * Формирует action layer для успешного ответа.
 * Вход: сохраненный Query из store.
 * Выход: список шагов для секции “Что делать дальше”.
 */
function getResultActions(query: Query): string[] {
  const backendActions = query.result?.recommendedActions ?? [];
  if (query.result?.confidence.level === "low") {
    return [
      "Уточните вопрос или сузьте фильтр, если этот результат нужен для управленческого решения.",
      "Сверьте explain и SQL ниже, чтобы убедиться, что логика совпадает с вашим кейсом.",
      ...backendActions,
    ];
  }

  return backendActions;
}

/**
 * Отрисовывает универсальный блок следующих шагов.
 * Вход: заголовок и список действий.
 * Выход: компактная карточка с нумерованными CTA.
 */
function NextStepsCard({ title, actions }: { title: string; actions: string[] }) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">
            Короткие действия, чтобы не терять управленческий контекст после ответа.
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
          Action layer
        </Badge>
      </div>
      <div className="grid gap-3">
        {actions.map((action, index) => (
          <div
            key={`${action}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Шаг {index + 1}
            </p>
            <p className="mt-1 text-sm text-slate-800">{action}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Экран результата Decision Room.
 * Вход: `queryId` из route params.
 * Выход: экран успеха, clarification или контролируемой ошибки.
 */
export function ResultScreen() {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [sqlOpen, setSqlOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [customClarificationValue, setCustomClarificationValue] = useState("");

  const query = store.getQuery(queryId!);

  if (!query) {
    return (
      <div className="mx-auto max-w-2xl pt-24">
        <Card className="border-slate-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Запрос не найден</h2>
          <p className="mb-6 text-slate-600">Запрос, который вы ищете, не существует.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </Card>
      </div>
    );
  }

  /**
   * Сохраняет выбранный вариант уточнения и перезапускает flow.
   * Вход: `value` выбранной кнопки clarification.
   * Выход: обновленный trail в sessionStorage и переход на loading screen.
   */
  const handleClarificationClick = (value: string, label?: string) => {
    const clarifiedQuestion = buildClarifiedQuestion(
      query.text,
      value,
      query.clarification?.param_name,
    );
    const rawTrail = sessionStorage.getItem("clarificationTrail");
    const currentTrail = parseClarificationTrail(rawTrail);
    currentTrail.push({
      question: query.clarification?.question ?? "",
      selected_label:
        label ??
        query.clarification?.options.find((option) => option.value === value)?.label ??
        "Свое значение",
      selected_value: clarifiedQuestion,
    });
    sessionStorage.setItem("clarificationTrail", JSON.stringify(currentTrail));
    sessionStorage.setItem("pendingQuery", clarifiedQuestion);
    navigate(`/loading/${query.id}-clarified`);
  };

  /**
   * Возвращает пользователя к ручному редактированию без потери исходного вопроса.
   * Вход: нет.
   * Выход: вопрос попадает в textarea главного экрана.
   */
  const handleManualEdit = () => {
    sessionStorage.setItem("draftQuery", query.text);
    sessionStorage.removeItem("clarificationTrail");
    sessionStorage.removeItem("pendingAskContext");
    navigate("/");
  };

  /**
   * Сохраняет отчет в локальном store и переходит к его просмотру.
   * Вход: нет, используется текущее имя отчета и `queryId`.
   * Выход: переход на route сохраненного отчета.
   */
  const handleSave = () => {
    if (!reportName.trim()) {
      return;
    }

    const report = store.saveReport(reportName, queryId!);
    setSaveDialogOpen(false);
    setReportName("");
    navigate(`/report/${report.id}`);
  };

  if (query.needsClarification && query.clarification) {
    const defaultClarificationLabel = getClarificationDefaultLabel(
      query.clarification.default_label,
      query.clarification.default_value,
    );
    const canUseDefault = Boolean(defaultClarificationLabel);

    return (
      <div className="mx-auto max-w-3xl pt-20">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white p-10">
          <div className="mb-8">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              Clarification-first
            </Badge>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
              <Lightbulb className="h-7 w-7 text-blue-700" />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-slate-950">Нужно уточнение</h2>
            <p className="mb-2 text-slate-700">{query.clarification.reason}</p>
            <p className="text-lg font-semibold text-slate-950">
              {query.clarification.question}
            </p>
          </div>

          <Alert className="mb-6 border-blue-200 bg-white">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            <AlertTitle>Почему это безопасно</AlertTitle>
            <AlertDescription className="text-slate-700">
              Система остановилась до генерации SQL, чтобы не угадывать ответ по неоднозначному вопросу.
            </AlertDescription>
          </Alert>

          {query.confidence && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Уверенность системы
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {getConfidenceLabel(query.confidence.level)} ·{" "}
                {Math.round(query.confidence.score * 100)}%
              </p>
              <p className="mt-1 text-sm text-slate-600">{query.confidence.reason}</p>
            </div>
          )}

          {query.clarification.options.length > 0 ? (
            <div className="grid gap-3">
              {query.clarification.options.map((option) => (
                <button
                  key={`${option.label}-${option.value}`}
                  type="button"
                  onClick={() => handleClarificationClick(option.value, option.label)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-400 hover:shadow-md"
                >
                  <span className="block text-base font-semibold text-slate-950">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Нет вариантов уточнения</AlertTitle>
              <AlertDescription className="text-slate-700">
                Не удалось подготовить безопасные варианты уточнения. Вернитесь назад и
                переформулируйте вопрос вручную.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-5 grid gap-4">
            {canUseDefault && (
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 justify-start whitespace-normal border-emerald-200 bg-emerald-50 py-3 text-left text-emerald-800 hover:bg-emerald-100"
                onClick={() =>
                  handleClarificationClick(
                    defaultClarificationLabel,
                    `Использовать дефолт: ${defaultClarificationLabel}`,
                  )
                }
              >
                Продолжить с дефолтом: {defaultClarificationLabel}
              </Button>
            )}

            {query.clarification.allow_free_input !== false && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <Label
                  htmlFor="custom-clarification"
                  className="text-sm font-semibold text-slate-900"
                >
                  Указать вручную
                </Label>
                <Textarea
                  id="custom-clarification"
                  value={customClarificationValue}
                  onChange={(event) => setCustomClarificationValue(event.target.value)}
                  placeholder={
                    query.clarification.free_input_placeholder ||
                    "Например: последние 14 дней"
                  }
                  className="mt-2 min-h-[96px] resize-none border-slate-300"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    disabled={!customClarificationValue.trim()}
                    onClick={() =>
                      handleClarificationClick(
                        customClarificationValue,
                        "Свое значение",
                      )
                    }
                  >
                    Применить
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <NextStepsCard
              title="Что делать дальше"
              actions={query.recommendedActions ?? []}
            />
            <Button onClick={handleManualEdit} className="w-full" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Изменить вопрос вручную
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!query.isValid) {
    const presentation = getErrorPresentation(query.errorCode);
    const recoveryActions = query.recommendedActions ?? [];

    return (
      <div className="mx-auto max-w-3xl pt-24">
        <Card className={`p-10 ${presentation.panelClass}`}>
          <Badge className="mb-4 bg-white/80 text-slate-700 hover:bg-white/80">
            {presentation.badge}
          </Badge>
          <div className="mb-6 flex items-start gap-4">
            <div
              className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${presentation.iconClass}`}
            >
              {isGuardrailError(query.errorCode) ? (
                <ShieldAlert className="h-8 w-8" />
              ) : (
                <AlertCircle className="h-8 w-8" />
              )}
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">{presentation.title}</h2>
              <p className="text-slate-700">{query.error ?? presentation.description}</p>
              {query.errorCode && (
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Код: {query.errorCode}
                </p>
              )}
            </div>
          </div>

          <Alert className="mb-6 border-white/70 bg-white/70">
            <Lightbulb className="h-4 w-4 text-slate-700" />
            <AlertTitle>Что произошло</AlertTitle>
            <AlertDescription className="text-slate-700">
              {presentation.description}
            </AlertDescription>
          </Alert>

          {query.suggestion && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <ShieldCheck className="h-4 w-4 text-blue-700" />
              <AlertTitle>Подсказка</AlertTitle>
              <AlertDescription className="text-slate-700">
                {query.suggestion}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <NextStepsCard title="Что делать дальше" actions={recoveryActions} />
            <Button onClick={() => navigate("/")} className="w-full" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Попробовать другой запрос
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const result = query.result;
  if (!result) {
    return (
      <div className="mx-auto max-w-2xl pt-24">
        <Card className="border-amber-200 bg-amber-50 p-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <AlertCircle className="h-8 w-8 text-amber-700" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Ответ пришел неполным</h2>
          <p className="mb-6 text-slate-700">
            UI не упал, но backend не прислал результат целиком. Повторите запуск или
            вернитесь к готовым вопросам.
          </p>
          <NextStepsCard
            title="Что делать дальше"
            actions={[
              "Повторите запуск того же запроса, чтобы проверить воспроизводимость.",
              "Если ситуация повторяется, используйте ближайший готовый сценарий из Home.",
            ]}
          />
          <Button onClick={() => navigate("/")} className="mt-6 w-full" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться на главный экран
          </Button>
        </Card>
      </div>
    );
  }

  const tableColumns =
    result.columns ??
    Object.keys((result.table?.[0] as Record<string, unknown> | undefined) ?? {});
  const resultActions = getResultActions(query);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button variant="ghost" onClick={() => navigate("/")} className="-ml-2 mb-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Новый запрос
          </Button>
          <div className="mb-2 flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Ответ готов
                </Badge>
                <Badge variant="outline">
                  Trust: {getConfidenceLabel(result.confidence.level)}
                </Badge>
              </div>
              <h1 className="mb-1 text-3xl font-bold text-slate-900">Запрос выполнен</h1>
              <p className="text-lg text-slate-600">{query.text}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setSaveDialogOpen(true)}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Сохранить отчет
        </Button>
      </div>

      {result.confidence.level === "low" && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <AlertTitle>Низкая уверенность: черновик для проверки</AlertTitle>
          <AlertDescription className="text-slate-700">
            Используйте результат как ориентир. Перед действием уточните вопрос, сузьте
            фильтр или подтвердите вывод вторым срезом.
          </AlertDescription>
        </Alert>
      )}

      {result.assumptions && result.assumptions.length > 0 && (
        <Alert className="mb-6 border-emerald-200 bg-emerald-50">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <AlertTitle>Использовано предположение</AlertTitle>
          <AlertDescription className="text-slate-700">
            {result.assumptions.join(" ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Строк</p>
          <p className="text-sm font-medium text-slate-900">{result.rowCount ?? 0}</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Колонки</p>
          <p className="text-sm font-medium text-slate-900">{tableColumns.length}</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Оценка стоимости</p>
          <p className="text-sm font-medium text-slate-900">
            {result.estimatedTotalCost?.toLocaleString("ru-RU") ?? 0}
          </p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Сохранено в историю</p>
          <p className="text-sm font-medium text-slate-900">
            {result.reportSaved ? "Да" : "Нет"}
          </p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">Уверенность</p>
          <p className="text-sm font-medium text-slate-900">
            {Math.round(result.confidence.score * 100)}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {getConfidenceLabel(result.confidence.level)}
          </p>
        </Card>
      </div>

      {query.refinementTrace && query.refinementTrace.length > 0 && (
        <Card className="mb-8 border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Цепочка уточнений</h2>
          <div className="space-y-3">
            {query.refinementTrace.map((step, index) => (
              <div
                key={`${step.selected_value}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-slate-700">{step.question}</p>
                <p className="mt-1 text-sm text-slate-900">
                  Выбрано: <span className="font-semibold">{step.selected_label}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-6">
        <NextStepsCard title="Что делать дальше" actions={resultActions} />

        <Card className="border-slate-200 p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Визуализация</h2>
          <QueryVisualization result={result} />
        </Card>

        <Card className="border-slate-200 p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">Таблица данных</h2>
          {result.table.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    {tableColumns.map((key) => (
                      <TableHead key={key} className="font-semibold text-slate-900">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.table.map((row, idx) => (
                    <TableRow key={idx}>
                      {tableColumns.map((column, cellIdx) => {
                        const value = row[column];
                        return (
                          <TableCell key={cellIdx} className="text-slate-700">
                            {typeof value === "number" && value > 1000
                              ? value.toLocaleString("ru-RU")
                              : String(value ?? "—")}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert className="border-slate-200 bg-slate-50">
              <AlertCircle className="h-4 w-4 text-slate-600" />
              <AlertTitle>Нет строк для показа</AlertTitle>
              <AlertDescription className="text-slate-700">
                Ответ пришел без строк. Проверьте фильтры или период и повторите запуск.
              </AlertDescription>
            </Alert>
          )}
        </Card>

        <Collapsible open={explainOpen} onOpenChange={setExplainOpen}>
          <Card className="overflow-hidden border-slate-200">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-semibold text-slate-900">Инсайты и объяснение</span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform ${
                  explainOpen ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-slate-200 p-6 pt-2">
                <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Почему такая уверенность
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{result.confidence.reason}</p>
                </div>
                <p className="leading-relaxed text-slate-700">
                  {result.explanation || "Explain не был передан backend."}
                </p>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={sqlOpen} onOpenChange={setSqlOpen}>
          <Card className="overflow-hidden border-slate-200">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Code className="h-4 w-4 text-slate-600" />
                </div>
                <span className="font-semibold text-slate-900">SQL запрос</span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform ${
                  sqlOpen ? "rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-slate-200 p-6 pt-2">
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
                  <code>{query.sql ?? "SQL недоступен для этого ответа."}</code>
                </pre>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить отчет</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="report-name" className="text-sm font-medium text-slate-900">
              Название отчета
            </Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Например: Квартальный отчет по регионам"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={!reportName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
