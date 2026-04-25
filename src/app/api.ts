export interface AskRequest {
  question: string;
  refinement_trace?: Array<Record<string, string>>;
  context?: Record<string, unknown>;
}

export interface ClarificationOption {
  label: string;
  value: string;
  description: string;
}

export interface ClarificationPayload {
  kind: string;
  reason: string;
  question: string;
  options: ClarificationOption[];
  param_name?: string;
  reason_code?: string;
  required?: boolean;
  allow_free_input?: boolean;
  free_input_placeholder?: string;
  default_value?: string | null;
  default_label?: string;
}

export interface ConfidencePayload {
  score: number;
  level: "low" | "medium" | "high";
  reason: string;
}

export type VisualizationType = "line" | "bar" | "table_only";

export interface VisualizationSpec {
  type: VisualizationType;
  x_field?: string;
  y_field?: string;
  series_field?: string;
  reason: string;
  confidence: number;
}

export interface AskSuccessResponse {
  status: "ok";
  question: string;
  generated_sql: string;
  explain: string;
  confidence: ConfidencePayload;
  estimated_total_cost: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  row_count: number;
  report_saved: boolean;
  report_saved_at: string;
  visualization?: VisualizationSpec | null;
  recommended_actions?: string[];
  assumptions?: string[];
  resolved_params?: Record<string, unknown>;
  decision_events?: Array<Record<string, unknown>>;
}

export interface AskClarificationResponse {
  status: "clarification_needed";
  question: string;
  confidence: ConfidencePayload;
  clarification: ClarificationPayload;
  recommended_actions?: string[];
  assumptions?: string[];
  resolved_params?: Record<string, unknown>;
  decision_events?: Array<Record<string, unknown>>;
}

export type AskResponse = AskSuccessResponse | AskClarificationResponse;

export interface PilotKpiSnapshot {
  generated_at: string;
  report_count: number;
  avg_confidence_score: number;
  decision_log_complete_rate: number;
  clarification_rate: number;
  latest_report_at: string;
  sample_question: string;
}

export class AskApiError extends Error {
  status: number;
  errorCode?: string;
  recommendedActions?: string[];

  constructor(
    message: string,
    status: number,
    errorCode?: string,
    recommendedActions?: string[],
  ) {
    super(message);
    this.name = "AskApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.recommendedActions = recommendedActions;
  }
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function getApiUrl(path: string): string {
  const rawBase = import.meta.env.VITE_API_BASE_URL ?? "";
  const base = rawBase.replace(/\/+$/, "");
  return base ? `${base}${path}` : path;
}

function getValidationMessage(detail: unknown): string {
  if (!Array.isArray(detail) || detail.length === 0) {
    return "Некорректный формат запроса.";
  }

  const firstIssue = detail[0] as { msg?: string };
  return firstIssue?.msg ?? "Некорректный формат запроса.";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecordArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every((item) => isObject(item));
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value);
}

function isOptionalRecordArray(
  value: unknown,
): value is Array<Record<string, unknown>> | undefined {
  return value === undefined || isRecordArray(value);
}

/**
 * Проверяет confidence payload из `/api/ask`.
 * Вход: произвольное JSON-значение.
 * Выход: `true`, если UI может безопасно читать score, level и reason.
 */
function isConfidencePayload(value: unknown): value is ConfidencePayload {
  if (!isObject(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.score) &&
    (value.level === "low" || value.level === "medium" || value.level === "high") &&
    typeof value.reason === "string"
  );
}

/**
 * Проверяет spec визуализации из `/api/ask`.
 * Вход: произвольное JSON-значение.
 * Выход: `true`, если chart/table слой может использовать payload без падения.
 */
function isVisualizationSpec(value: unknown): value is VisualizationSpec {
  if (!isObject(value)) {
    return false;
  }

  return (
    (value.type === "line" || value.type === "bar" || value.type === "table_only") &&
    (value.x_field === undefined || typeof value.x_field === "string") &&
    (value.y_field === undefined || typeof value.y_field === "string") &&
    (value.series_field === undefined || typeof value.series_field === "string") &&
    typeof value.reason === "string" &&
    isFiniteNumber(value.confidence)
  );
}

/**
 * Проверяет один вариант уточнения.
 * Вход: произвольное JSON-значение.
 * Выход: `true`, если option можно показывать как кнопку выбора.
 */
function isClarificationOption(value: unknown): value is ClarificationOption {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.label === "string" &&
    typeof value.value === "string" &&
    typeof value.description === "string"
  );
}

/**
 * Проверяет payload уточнения из `/api/ask`.
 * Вход: произвольное JSON-значение.
 * Выход: `true`, если ResultScreen может показать clarification card.
 */
function isClarificationPayload(value: unknown): value is ClarificationPayload {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.kind === "string" &&
    typeof value.reason === "string" &&
    typeof value.question === "string" &&
    Array.isArray(value.options) &&
    value.options.every((option) => isClarificationOption(option)) &&
    (value.param_name === undefined || typeof value.param_name === "string") &&
    (value.reason_code === undefined || typeof value.reason_code === "string") &&
    (value.required === undefined || typeof value.required === "boolean") &&
    (value.allow_free_input === undefined ||
      typeof value.allow_free_input === "boolean") &&
    (value.free_input_placeholder === undefined ||
      typeof value.free_input_placeholder === "string") &&
    (value.default_value === undefined ||
      value.default_value === null ||
      typeof value.default_value === "string") &&
    (value.default_label === undefined || typeof value.default_label === "string")
  );
}

/**
 * Проверяет успешный ответ `/api/ask`.
 * Вход: произвольное JSON-значение.
 * Выход: `true`, если payload содержит минимальный стабильный contract для результата.
 */
function isAskSuccessResponse(value: unknown): value is AskSuccessResponse {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.status === "ok" &&
    typeof value.question === "string" &&
    typeof value.generated_sql === "string" &&
    typeof value.explain === "string" &&
    isConfidencePayload(value.confidence) &&
    isFiniteNumber(value.estimated_total_cost) &&
    isStringArray(value.columns) &&
    isRecordArray(value.rows) &&
    isFiniteNumber(value.row_count) &&
    typeof value.report_saved === "boolean" &&
    typeof value.report_saved_at === "string" &&
    (value.visualization === undefined ||
      value.visualization === null ||
      isVisualizationSpec(value.visualization)) &&
    isOptionalStringArray(value.recommended_actions) &&
    isOptionalStringArray(value.assumptions) &&
    (value.resolved_params === undefined || isObject(value.resolved_params)) &&
    isOptionalRecordArray(value.decision_events)
  );
}

/**
 * Проверяет ответ-уточнение `/api/ask`.
 * Вход: произвольное JSON-значение.
 * Выход: `true`, если payload содержит минимальный contract для clarification flow.
 */
function isAskClarificationResponse(value: unknown): value is AskClarificationResponse {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.status === "clarification_needed" &&
    typeof value.question === "string" &&
    isConfidencePayload(value.confidence) &&
    isClarificationPayload(value.clarification) &&
    isOptionalStringArray(value.recommended_actions) &&
    isOptionalStringArray(value.assumptions) &&
    (value.resolved_params === undefined || isObject(value.resolved_params)) &&
    isOptionalRecordArray(value.decision_events)
  );
}

/**
 * Проверяет публичный ответ `/api/ask` перед передачей в store.
 * Вход: произвольное JSON-значение из backend.
 * Выход: `true` только для supported success или clarification payload.
 */
export function isAskResponse(value: unknown): value is AskResponse {
  return isAskSuccessResponse(value) || isAskClarificationResponse(value);
}

/**
 * Проверяет, что backend вернул полный snapshot pilot KPI по контракту.
 * Вход: произвольное JSON-значение из API.
 * Выход: `true` только если все поля присутствуют и имеют ожидаемые типы.
 */
export function isPilotKpiSnapshot(value: unknown): value is PilotKpiSnapshot {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.generated_at === "string" &&
    isFiniteNumber(value.report_count) &&
    isFiniteNumber(value.avg_confidence_score) &&
    isFiniteNumber(value.decision_log_complete_rate) &&
    isFiniteNumber(value.clarification_rate) &&
    typeof value.latest_report_at === "string" &&
    typeof value.sample_question === "string"
  );
}

/**
 * Загружает historical snapshot KPI и отбрасывает невалидный payload.
 * Вход: нет.
 * Выход: snapshot с агрегатами из GET `/api/pilot/kpi`.
 */
export async function getPilotKpiSnapshot(): Promise<PilotKpiSnapshot> {
  const response = await fetch(getApiUrl("/api/pilot/kpi"), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isObject(data) && typeof data.detail === "string"
        ? data.detail
        : `Ошибка API (${response.status}).`;
    throw new Error(stripAnsi(message));
  }

  if (!isPilotKpiSnapshot(data)) {
    throw new Error("Некорректный формат snapshot KPI.");
  }

  return data;
}

/**
 * Нормализует список рекомендованных действий из ответа API.
 * Вход: произвольное значение из JSON payload.
 * Выход: непустой массив строк или `undefined`, если backend поле не прислал.
 */
function getRecommendedActions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const actions = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return actions.length > 0 ? actions : undefined;
}

/**
 * Отправляет вопрос в backend и отбрасывает невалидный успешный payload.
 * Вход: question, refinement trace и analysis context.
 * Выход: валидный success/clarification response или controlled AskApiError.
 */
export async function askQuestion(payload: AskRequest): Promise<AskResponse> {
  const response = await fetch(getApiUrl("/api/ask"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      throw new AskApiError(getValidationMessage(data?.detail), 422, "VALIDATION_ERROR");
    }

    const errorCode = data?.detail?.error_code as string | undefined;
    const recommendedActions = getRecommendedActions(data?.detail?.recommended_actions);
    const message =
      (data?.detail?.message as string | undefined) ??
      `Ошибка API (${response.status}).`;
    throw new AskApiError(
      stripAnsi(message),
      response.status,
      errorCode,
      recommendedActions,
    );
  }

  if (!isAskResponse(data)) {
    throw new AskApiError(
      "Некорректный формат ответа API.",
      response.status,
      "INVALID_API_RESPONSE",
    );
  }

  return data;
}
