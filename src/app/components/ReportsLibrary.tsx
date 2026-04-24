import { useState } from "react";
import { useNavigate } from "react-router";
import { type ConfidencePayload } from "../api";
import { store, type Query } from "../store";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  FileText,
  Search,
  Calendar,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface DecisionLogPreview {
  explainSummary: string;
  confidenceLabel: string;
  confidenceScore: string;
  recommendedActions: string[];
  hasDecisionLog: boolean;
}

/**
 * Возвращает локализованную подпись для уровня confidence в превью отчета.
 * Вход: значение `level` из backend confidence payload.
 * Выход: короткий label для badge в карточке библиотеки.
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
 * Сжимает explain до компактного summary, чтобы decision log помещался в карточку.
 * Вход: полный explain из результата запроса.
 * Выход: одна короткая строка или fallback для legacy-отчета.
 */
function summarizeExplanation(explanation?: string): string {
  const normalized = explanation?.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Explain summary недоступен для этого отчета.";
  }

  if (normalized.length <= 160) {
    return normalized;
  }

  return `${normalized.slice(0, 157).trimEnd()}...`;
}

/**
 * Возвращает компактный action layer для карточки отчета.
 * Вход: сохраненный query из store.
 * Выход: не более двух рекомендаций, чтобы не перегружать список отчетов.
 */
function getRecommendedActionsPreview(query?: Query): string[] {
  const actions = query?.result?.recommendedActions ?? query?.recommendedActions ?? [];
  return actions
    .map((action) => action.trim())
    .filter(Boolean)
    .slice(0, 2);
}

/**
 * Собирает безопасный preview decision log из query/result с fallback для старых отчетов.
 * Вход: сохраненный query, связанный с карточкой отчета.
 * Выход: нормализованные поля explain, confidence и actions для UI библиотеки.
 */
function getDecisionLogPreview(query?: Query): DecisionLogPreview {
  const confidence = query?.result?.confidence ?? query?.confidence;
  const recommendedActions = getRecommendedActionsPreview(query);
  const hasDecisionLog = Boolean(
    query?.result?.explanation?.trim() ||
      confidence ||
      recommendedActions.length > 0,
  );

  return {
    explainSummary: summarizeExplanation(query?.result?.explanation),
    confidenceLabel: getConfidenceLabel(confidence?.level),
    confidenceScore: confidence ? `${Math.round(confidence.score * 100)}%` : "—",
    recommendedActions,
    hasDecisionLog,
  };
}

/**
 * Отрисовывает библиотеку сохраненных отчетов с поиском и компактным decision log preview.
 * Вход: данные отчетов и запросов из локального store.
 * Выход: список карточек с навигацией в отчет и видимыми explain/confidence/actions.
 */
export function ReportsLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const reports = store.getAllReports();

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
          Сохраненные отчеты
        </h1>
        <p className="text-lg text-slate-600">
          Ваша библиотека переиспользуемой аналитики
        </p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск отчетов..."
            className="pl-11 border-slate-300"
          />
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="p-16 text-center border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {reports.length === 0 ? 'Пока нет отчетов' : 'Нет подходящих отчетов'}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {reports.length === 0
              ? 'Начните с создания первого запроса. Сохраните результаты, чтобы построить библиотеку аналитики.'
              : 'Попробуйте изменить поисковый запрос.'}
          </p>
          {reports.length === 0 && (
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Создать первый запрос
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const query = store.getQuery(report.queryId);
            const decisionLog = getDecisionLogPreview(query);
            return (
              <Card
                key={report.id}
                className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer border-slate-200 group"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {report.name}
                    </h3>

                    {query && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-1">
                        {query.text}
                      </p>
                    )}

                    <div className="mb-3 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Explain
                        </div>
                        <p
                          className={`text-sm leading-6 ${
                            decisionLog.hasDecisionLog
                              ? "text-slate-700 line-clamp-3"
                              : "text-slate-500"
                          }`}
                        >
                          {decisionLog.explainSummary}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Confidence
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-white text-slate-700 hover:bg-white"
                          >
                            {decisionLog.confidenceLabel}
                          </Badge>
                          <span className="text-sm font-semibold text-slate-900">
                            {decisionLog.confidenceScore}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {query?.result?.confidence?.reason ??
                            query?.confidence?.reason ??
                            "Confidence не была сохранена в этом отчете."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          Recommended actions
                        </div>
                        {decisionLog.recommendedActions.length > 0 ? (
                          <div className="space-y-2">
                            {decisionLog.recommendedActions.map((action, index) => (
                              <p
                                key={`${report.id}-action-${index}`}
                                className="text-sm text-slate-700 line-clamp-2"
                              >
                                {action}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Рекомендованные действия для этого отчета не сохранены.
                          </p>
                        )}
                      </div>
                    </div>

                    {!decisionLog.hasDecisionLog && (
                      <p className="mb-3 text-xs text-slate-500">
                        Decision log недоступен: отчет был сохранен до появления explain,
                        confidence и action layer.
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Сохранен {new Date(report.savedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {report.lastRun && (
                        <span>
                          · Последний запуск {new Date(report.lastRun).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
