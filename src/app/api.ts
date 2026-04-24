export interface AskRequest {
  question: string;
  refinement_trace?: Array<Record<string, string>>;
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
}

export interface AskClarificationResponse {
  status: "clarification_needed";
  question: string;
  confidence: ConfidencePayload;
  clarification: ClarificationPayload;
  recommended_actions?: string[];
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
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

  return data as AskResponse;
}
