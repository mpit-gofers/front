import {
  AskApiError,
  askQuestion,
  ClarificationPayload,
  ConfidencePayload,
  VisualizationSpec,
} from "./api";

export interface PreparedQuestion {
  id: string;
  title: string;
  role: "Ops" | "Finance";
  question: string;
  metric: string;
  actionHint: string;
}

export interface PreparedQuestionGroup {
  role: "Ops" | "Finance";
  title: string;
  description: string;
  questions: PreparedQuestion[];
}

export const PRESET_QUESTION_GROUPS: PreparedQuestionGroup[] = [
  {
    role: "Ops",
    title: "Ops",
    description: "Операционные сценарии для быстрых решений по отменам, SLA и сменам.",
    questions: [
      {
        id: "OPS-01",
        title: "Всплеск отмен",
        role: "Ops",
        question: "Почему выросли отмены в конкретном городе и часе?",
        metric: "Cancellation rate по city/hour",
        actionHint: "Перераспределить смену и проверить доступность водителей.",
      },
      {
        id: "OPS-02",
        title: "Конверсия в пик",
        role: "Ops",
        question: "Почему просела конверсия в часы пик?",
        metric: "Conversion rate в peak hours",
        actionHint: "Усилить дежурные смены и проверить задержки ответа.",
      },
      {
        id: "OPS-03",
        title: "Время подачи",
        role: "Ops",
        question: "Почему выросло время подачи заказа?",
        metric: "Median time-to-pickup",
        actionHint: "Усилить покрытие в зоне и пересмотреть распределение заказов.",
      },
      {
        id: "OPS-04",
        title: "Незавершенные заказы",
        role: "Ops",
        question: "Где растет доля незавершенных заказов?",
        metric: "Share of uncompleted orders",
        actionHint: "Проверить сбои приложения, каналы отказа и проблемные зоны.",
      },
      {
        id: "OPS-05",
        title: "Просадка по смене",
        role: "Ops",
        question: "Почему по одной из смен падает число успешных завершений?",
        metric: "Successful completions by shift",
        actionHint: "Сверить состав смены, нагрузку и наличие технических инцидентов.",
      },
      {
        id: "OPS-06",
        title: "SLA-скачок",
        role: "Ops",
        question: "Есть ли локальный SLA-скачок по зоне или часу?",
        metric: "SLA breach rate по zone/hour",
        actionHint: "Ограничить нагрузку в зоне и усилить контроль исполнения.",
      },
    ],
  },
  {
    role: "Finance",
    title: "Finance",
    description: "Финансовые сценарии для выручки, среднего чека и подозрительных отклонений.",
    questions: [
      {
        id: "FIN-01",
        title: "Просадка выручки",
        role: "Finance",
        question: "Почему упала выручка day-over-day или week-over-week?",
        metric: "Revenue по дню и неделе",
        actionHint: "Проверить вклад городов, отмен и сезонных факторов.",
      },
      {
        id: "FIN-02",
        title: "Средний чек",
        role: "Finance",
        question: "Почему снизился средний чек в ключевых городах?",
        metric: "Average order value",
        actionHint: "Пересмотреть скидки, промо и микс заказов по городу.",
      },
      {
        id: "FIN-03",
        title: "Подозрительные поездки",
        role: "Finance",
        question: "Растет ли доля нулевых или подозрительных поездок?",
        metric: "Share of zero-value or suspicious trips",
        actionHint: "Запустить проверку источника аномалии и ограничить сегмент при необходимости.",
      },
      {
        id: "FIN-04",
        title: "Потери от отмен",
        role: "Finance",
        question: "Какой денежный эффект дают отмены?",
        metric: "Cancellation loss amount",
        actionHint: "Приоритизировать меры по снижению отмен в топ-городах.",
      },
      {
        id: "FIN-05",
        title: "Отклонение от плана",
        role: "Finance",
        question: "Где выручка отклоняется от плана?",
        metric: "Plan vs actual revenue variance",
        actionHint: "Поднять разбор по городам, сменам и каналам.",
      },
      {
        id: "FIN-06",
        title: "Чистая выручка",
        role: "Finance",
        question: "Где падает чистая выручка после скидок?",
        metric: "Net revenue after discounts",
        actionHint: "Пересмотреть промо-настройки и ограничить убыточные акции.",
      },
    ],
  },
];

export interface QueryResult {
  columns: string[];
  table: Array<Record<string, unknown>>;
  explanation: string;
  confidence: ConfidencePayload;
  estimatedTotalCost: number;
  rowCount: number;
  reportSaved: boolean;
  reportSavedAt: string;
  visualization: VisualizationSpec;
  recommendedActions?: string[];
}

export interface Query {
  id: string;
  text: string;
  timestamp: number;
  sql?: string;
  isValid: boolean;
  needsClarification?: boolean;
  clarification?: ClarificationPayload;
  confidence?: ConfidencePayload;
  refinementTrace?: Array<Record<string, string>>;
  error?: string;
  suggestion?: string;
  errorCode?: string;
  recommendedActions?: string[];
  result?: QueryResult;
}

export interface SavedReport {
  id: string;
  name: string;
  queryId: string;
  savedAt: number;
  lastRun?: number;
}

class Store {
  private queries: Map<string, Query> = new Map();
  private reports: Map<string, SavedReport> = new Map();

  /**
   * Выполняет пользовательский вопрос через backend и сохраняет нормализованный UI-state.
   * Вход: текст вопроса и цепочка уточнений.
   * Выход: объект Query для экрана результата, уточнения или контролируемой ошибки.
   */
  async processQuery(
    queryText: string,
    refinementTrace: Array<Record<string, string>> = [],
  ): Promise<Query> {
    const id = `query-${Date.now()}`;
    const trimmedQuestion = queryText.trim();

    if (trimmedQuestion.length < 3) {
      const query: Query = {
        id,
        text: queryText,
        timestamp: Date.now(),
        isValid: false,
        error: "Запрос слишком короткий.",
        suggestion:
          "Опишите, какие данные вы хотите получить, например: продажи по регионам за месяц.",
        recommendedActions: [
          "Добавьте метрику, например выручку, отмены или средний чек.",
          "Уточните разрез: город, час, день, канал или период сравнения.",
        ],
      };
      this.queries.set(id, query);
      return query;
    }

    try {
      const response = await askQuestion({
        question: trimmedQuestion,
        refinement_trace: refinementTrace,
      });

      if (response.status === "clarification_needed") {
        const query: Query = {
          id,
          text: response.question,
          timestamp: Date.now(),
          isValid: false,
          needsClarification: true,
          clarification: response.clarification,
          confidence: response.confidence,
          refinementTrace,
          suggestion: response.clarification.reason,
          recommendedActions:
            response.recommended_actions ?? [
              "Выберите один из безопасных вариантов ниже, чтобы система не строила SQL вслепую.",
              "Если формулировка все еще не подходит, вернитесь назад и уточните вопрос вручную.",
            ],
        };
        this.queries.set(id, query);
        return query;
      }

      const query: Query = {
        id,
        text: response.question,
        timestamp: Date.now(),
        isValid: true,
        sql: response.generated_sql,
        refinementTrace,
        result: {
          columns: response.columns,
          table: response.rows,
          explanation: response.explain,
          confidence: response.confidence,
          estimatedTotalCost: response.estimated_total_cost,
          rowCount: response.row_count,
          reportSaved: response.report_saved,
          reportSavedAt: response.report_saved_at,
          recommendedActions: response.recommended_actions,
          visualization:
            response.visualization ??
            this.inferVisualizationSpec(
              response.rows,
              response.columns,
              response.question,
            ),
        },
      };

      this.queries.set(id, query);
      return query;
    } catch (error) {
      const apiError = error instanceof AskApiError ? error : null;
      const query: Query = {
        id,
        text: queryText,
        timestamp: Date.now(),
        isValid: false,
        error: apiError?.message ?? "Не удалось выполнить запрос к backend API.",
        errorCode: apiError?.errorCode,
        suggestion: this.getSuggestionForError(apiError?.errorCode),
        recommendedActions:
          apiError?.recommendedActions ??
          this.getRecommendedActionsForError(apiError?.errorCode),
      };
      this.queries.set(id, query);
      return query;
    }
  }

  /**
   * Возвращает короткую подсказку для контролируемого UX ошибки.
   * Вход: доменный error code backend.
   * Выход: одна строка с главным советом пользователю.
   */
  private getSuggestionForError(errorCode?: string): string {
    switch (errorCode) {
      case "SQL_COST_LIMIT_EXCEEDED":
        return "Сузьте период или добавьте фильтры, чтобы уменьшить стоимость запроса.";
      case "SQL_MUTATION_BLOCKED":
      case "SQL_MULTI_STATEMENT_BLOCKED":
        return "Система принимает только безопасные аналитические запросы в режиме read-only.";
      case "SQL_CONTEXT_INSUFFICIENT":
        return "Используйте доступные поля модели: city_id, channel, order_date и метрики выручки/поездок.";
      case "SQL_PARSE_ERROR":
        return "Попробуйте сформулировать вопрос через доступные поля таблицы orders.";
      case "VALIDATION_ERROR":
        return "Проверьте формат вопроса и попробуйте снова.";
      default:
        return "Уточните запрос и попробуйте еще раз. Если ошибка повторяется, проверьте backend.";
    }
  }

  /**
   * Готовит следующие шаги для guardrail и validation сценариев, когда backend не прислал action layer.
   * Вход: доменный error code backend.
   * Выход: 1-2 действия, которые можно сразу показать пользователю.
   */
  private getRecommendedActionsForError(errorCode?: string): string[] {
    switch (errorCode) {
      case "SQL_COST_LIMIT_EXCEEDED":
        return [
          "Сузьте период и повторите запрос на более коротком окне.",
          "Добавьте фильтр по городу, смене или каналу, чтобы уменьшить объем выборки.",
        ];
      case "SQL_MUTATION_BLOCKED":
      case "SQL_MULTI_STATEMENT_BLOCKED":
        return [
          "Переформулируйте вопрос как аналитический read-only запрос без изменений данных.",
          "Используйте готовый вопрос из Ops или Finance, если нужен безопасный шаблон.",
        ];
      case "SQL_CONTEXT_INSUFFICIENT":
        return [
          "Назовите целевую метрику и период сравнения прямо в вопросе.",
          "Уточните допустимый разрез: город, час, день, канал или смена.",
        ];
      case "SQL_PARSE_ERROR":
        return [
          "Уберите двусмысленные формулировки и попросите агрегированный срез по orders.",
          "Проверьте, что вопрос не содержит смешанных инструкций и лишних условий.",
        ];
      case "VALIDATION_ERROR":
        return [
          "Проверьте, что вопрос не пустой и описывает конкретную бизнес-метрику.",
          "Используйте один понятный запрос вместо нескольких инструкций в одном тексте.",
        ];
      default:
        return [
          "Попробуйте переформулировать вопрос короче и конкретнее.",
          "Если проблема повторяется, вернитесь на главный экран и запустите готовый сценарий.",
        ];
    }
  }

  private inferVisualizationSpec(
    rows: Array<Record<string, unknown>>,
    columns: string[],
    question: string,
  ): VisualizationSpec {
    if (rows.length === 0 || columns.length === 0) {
      return {
        type: "table_only",
        reason: "В результате нет данных для графика.",
        confidence: 1,
      };
    }

    const numericFields = columns.filter((field) =>
      this.isNumericField(field, rows),
    );
    const timeFields = columns.filter((field) => this.isTimeField(field, rows));
    const categoryFields = columns.filter((field) =>
      this.isCategoryField(field, rows),
    );

    if (
      this.looksTemporalQuestion(question) &&
      timeFields.length > 0 &&
      numericFields.length > 0
    ) {
      return {
        type: "line",
        x_field: timeFields[0],
        y_field: numericFields[0],
        reason: "Fallback: выбран line chart по времени и метрике.",
        confidence: 0.7,
      };
    }

    if (categoryFields.length > 0 && numericFields.length > 0) {
      return {
        type: "bar",
        x_field: categoryFields[0],
        y_field: numericFields[0],
        reason: "Fallback: выбран bar chart по категории и метрике.",
        confidence: 0.6,
      };
    }

    return {
      type: "table_only",
      reason: "Недостаточно надежных полей для корректной визуализации.",
      confidence: 0.5,
    };
  }

  private isNumericField(
    field: string,
    rows: Array<Record<string, unknown>>,
  ): boolean {
    const lowered = field.toLowerCase();
    if (lowered.endsWith("_id") || lowered === "id") {
      return false;
    }
    const sample = rows.slice(0, 100).map((row) => row[field]);
    const numericCount = sample.filter((value) => typeof value === "number").length;
    return numericCount >= Math.max(1, Math.floor(sample.length / 3));
  }

  private isTimeField(
    field: string,
    rows: Array<Record<string, unknown>>,
  ): boolean {
    const lowered = field.toLowerCase();
    if (
      lowered.includes("date") ||
      lowered.includes("time") ||
      lowered.includes("timestamp")
    ) {
      return true;
    }
    for (const row of rows.slice(0, 20)) {
      const value = row[field];
      if (typeof value !== "string") {
        continue;
      }
      const candidate = value.replace("Z", "+00:00");
      if (!Number.isNaN(Date.parse(candidate))) {
        return true;
      }
    }
    return false;
  }

  private isCategoryField(
    field: string,
    rows: Array<Record<string, unknown>>,
  ): boolean {
    const lowered = field.toLowerCase();
    if (lowered.endsWith("_id") || lowered === "id") {
      return false;
    }
    const values = rows.slice(0, 300).map((row) => row[field]).filter((v) => v != null);
    if (values.length === 0 || !values.every((v) => typeof v === "string")) {
      return false;
    }
    const cardinality = new Set(values as string[]).size;
    return cardinality >= 2 && cardinality <= 20;
  }

  private looksTemporalQuestion(question: string): boolean {
    const q = question.toLowerCase();
    const tokens = ["день", "месяц", "год", "недел", "динам", "тренд"];
    return tokens.some((token) => q.includes(token));
  }

  getQuery(id: string): Query | undefined {
    return this.queries.get(id);
  }

  saveReport(name: string, queryId: string): SavedReport {
    const id = `report-${Date.now()}`;
    const report: SavedReport = {
      id,
      name,
      queryId,
      savedAt: Date.now(),
    };
    this.reports.set(id, report);
    return report;
  }

  getReport(id: string): SavedReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): SavedReport[] {
    return Array.from(this.reports.values()).sort((a, b) => b.savedAt - a.savedAt);
  }

  async rerunReport(reportId: string): Promise<Query | null> {
    const report = this.reports.get(reportId);
    if (!report) {
      return null;
    }

    const originalQuery = this.queries.get(report.queryId);
    if (!originalQuery) {
      return null;
    }

    const newQuery = await this.processQuery(
      originalQuery.text,
      originalQuery.refinementTrace ?? [],
    );
    report.lastRun = Date.now();
    return newQuery;
  }

  deleteReport(id: string): void {
    this.reports.delete(id);
  }
}

export const store = new Store();
