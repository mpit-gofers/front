import { useParams, useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  ArrowLeft,
  Play,
  Calendar,
  FileText,
  AlertCircle,
  Database,
  TrendingUp,
  Filter
} from "lucide-react";
import { store } from "../store";

export function ReportView() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const report = store.getReport(reportId!);
  const query = report ? store.getQuery(report.queryId) : null;

  if (!report || !query) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Отчет не найден</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/reports')} className="mt-4">
          К библиотеке отчетов
        </Button>
      </div>
    );
  }

  const handleRerun = () => {
    const newQuery = store.rerunReport(reportId!);
    if (newQuery) {
      navigate(`/result/${newQuery.id}`);
    }
  };

  const handleBackToQuery = () => {
    sessionStorage.setItem('pendingQuery', query.text);
    navigate('/');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/reports')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            К отчетам
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{report.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="secondary">Сохранен</Badge>
                <span className="text-sm text-slate-600">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(report.savedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackToQuery}>
            Вернуться к запросу
          </Button>
          <Button onClick={handleRerun}>
            <Play className="w-4 h-4 mr-2" />
            Запустить заново
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-3">История</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="text-blue-600 mt-1">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 mb-1">Последний результат</p>
              <p className="text-sm text-slate-600">{query.text}</p>
              {report.lastRun && (
                <p className="text-xs text-slate-500 mt-2">
                  Последний запуск: {new Date(report.lastRun).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {query.interpretation && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Параметры запроса</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
              icon={<Database className="w-5 h-5" />}
              label="Интерпретация"
              value={query.interpretation.understood}
            />
            <InfoCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Метрики"
              value={query.interpretation.metrics.join(', ')}
            />
            <InfoCard
              icon={<Calendar className="w-5 h-5" />}
              label="Период"
              value={query.interpretation.period}
            />
            <InfoCard
              icon={<Filter className="w-5 h-5" />}
              label="Разбивка"
              value={query.interpretation.breakdown}
            />
          </div>
        </Card>
      )}

      {query.result && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chart">График</TabsTrigger>
            <TabsTrigger value="table">Таблица</TabsTrigger>
            <TabsTrigger value="explain">Объяснение</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Визуализация данных</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={query.result.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Значение" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Табличные данные</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(query.result.table[0] || {}).map((key) => (
                      <TableHead key={key} className="font-semibold">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.result.table.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(row).map((value, cellIdx) => (
                        <TableCell key={cellIdx}>
                          {typeof value === 'number' && value > 1000
                            ? value.toLocaleString('ru-RU')
                            : value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="explain" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Пояснение результатов</h3>
              <p className="text-slate-700 leading-relaxed">{query.result.explanation}</p>
            </Card>
          </TabsContent>

          <TabsContent value="sql" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">SQL запрос</h3>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                <code>{query.sql}</code>
              </pre>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
      <div className="text-blue-600 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-600 mb-1">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
