import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { QueryVisualization } from "./QueryVisualization";
import {
  ArrowLeft,
  Play,
  Calendar,
  AlertCircle,
  ChevronDown,
  Code,
  Lightbulb,
  FileText
} from "lucide-react";
import { store } from "../store";

export function ReportView() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [sqlOpen, setSqlOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const report = store.getReport(reportId!);
  const query = report ? store.getQuery(report.queryId) : null;
  const tableColumns =
    query?.result?.columns ??
    Object.keys((query?.result?.table?.[0] as Record<string, unknown> | undefined) ?? {});

  if (!report || !query) {
    return (
      <div className="max-w-2xl mx-auto pt-24">
        <Card className="p-12 text-center border-slate-200">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Отчет не найден</h2>
          <p className="text-slate-600 mb-6">Этот отчет не существует или был удален.</p>
          <Button onClick={() => navigate('/reports')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            К отчетам
          </Button>
        </Card>
      </div>
    );
  }

  const handleRerun = async () => {
    const newQuery = await store.rerunReport(reportId!);
    if (newQuery) {
      navigate(`/result/${newQuery.id}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <Button variant="ghost" onClick={() => navigate('/reports')} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Все отчеты
          </Button>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{report.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Сохранен {new Date(report.savedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {report.lastRun && (
                  <span>· Последний запуск {new Date(report.lastRun).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={handleRerun} size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Play className="w-4 h-4 mr-2" />
          Запустить заново
        </Button>
      </div>

      <Card className="p-6 mb-8 border-slate-200 bg-slate-50">
        <div className="flex items-start gap-3">
          <div className="text-slate-600 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Исходный запрос</p>
            <p className="text-base text-slate-900">{query.text}</p>
          </div>
        </div>
      </Card>

      {query.refinementTrace && query.refinementTrace.length > 0 && (
        <Card className="p-6 mb-8 border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Цепочка уточнений</h2>
          <div className="space-y-3">
            {query.refinementTrace.map((step, index) => (
              <div
                key={`${step.selected_value}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
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

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Строк</p>
          <p className="text-sm font-medium text-slate-900">{query.result?.rowCount ?? 0}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Колонки</p>
          <p className="text-sm font-medium text-slate-900">{tableColumns.length}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Оценка стоимости</p>
          <p className="text-sm font-medium text-slate-900">
            {query.result?.estimatedTotalCost?.toLocaleString("ru-RU") ?? 0}
          </p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Сохранено в историю</p>
          <p className="text-sm font-medium text-slate-900">
            {query.result?.reportSaved ? "Да" : "Нет"}
          </p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Уверенность</p>
          <p className="text-sm font-medium text-slate-900">
            {query.result ? `${Math.round(query.result.confidence.score * 100)}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {query.result?.confidence.level === "high"
              ? "Высокая"
              : query.result?.confidence.level === "medium"
                ? "Средняя"
                : "Низкая"}
          </p>
        </Card>
      </div>

      {query.result && (
        <div className="space-y-6">
          <Card className="p-6 border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Визуализация</h2>
            <QueryVisualization result={query.result} />
          </Card>

          <Card className="p-6 border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Таблица данных</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    {tableColumns.map((key) => (
                      <TableHead key={key} className="font-semibold text-slate-900">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {query.result.table.map((row, idx) => (
                      <TableRow key={idx}>
                        {tableColumns.map((column, cellIdx) => {
                          const value = row[column];
                          return (
                            <TableCell key={cellIdx} className="text-slate-700">
                              {typeof value === 'number' && value > 1000
                                ? value.toLocaleString('ru-RU')
                                : value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Collapsible open={explainOpen} onOpenChange={setExplainOpen}>
            <Card className="border-slate-200 overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-semibold text-slate-900">Инсайты и объяснение</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${explainOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-2 border-t border-slate-200">
                  <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Почему такая уверенность
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {query.result.confidence.reason}
                    </p>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{query.result.explanation}</p>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={sqlOpen} onOpenChange={setSqlOpen}>
            <Card className="border-slate-200 overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Code className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="font-semibold text-slate-900">SQL запрос</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${sqlOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-2 border-t border-slate-200">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed">
                    <code>{query.sql}</code>
                  </pre>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
