import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Edit,
  FileText,
  Database,
  ArrowLeft,
  Calendar,
  Filter,
  TrendingUp
} from "lucide-react";
import { store } from "../store";

export function ResultScreen() {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");

  const query = store.getQuery(queryId!);

  if (!query) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Запрос не найден</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')} className="mt-4">
          Вернуться на главную
        </Button>
      </div>
    );
  }

  if (!query.isValid) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ошибка валидации</h2>
            <p className="text-slate-600">{query.error}</p>
          </div>

          <Alert className="mb-6">
            <AlertDescription className="text-sm">
              <strong>Подсказка:</strong> {query.suggestion}
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => navigate('/')}
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться и изменить запрос
          </Button>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    if (reportName.trim()) {
      const report = store.saveReport(reportName, queryId!);
      setSaveDialogOpen(false);
      setReportName("");
      navigate(`/report/${report.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Новый запрос
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Результаты анализа</h1>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Edit className="w-4 h-4 mr-2" />
            Изменить запрос
          </Button>
          <Button onClick={() => setSaveDialogOpen(true)}>
            <Save className="w-4 h-4 mr-2" />
            Сохранить отчет
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <FileText className="w-4 h-4 mr-2" />
            К отчетам
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Запрос обработан успешно</h3>
            <p className="text-slate-600">{query.text}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <InfoCard
            icon={<Database className="w-5 h-5" />}
            label="Интерпретация"
            value={query.interpretation!.understood}
          />
          <InfoCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Метрики"
            value={query.interpretation!.metrics.join(', ')}
          />
          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            label="Период"
            value={query.interpretation!.period}
          />
          <InfoCard
            icon={<Filter className="w-5 h-5" />}
            label="Разбивка"
            value={query.interpretation!.breakdown}
          />
        </div>
      </Card>

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
              <BarChart data={query.result!.chartData}>
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
                  {Object.keys(query.result!.table[0] || {}).map((key) => (
                    <TableHead key={key} className="font-semibold">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.result!.table.map((row, idx) => (
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
            <p className="text-slate-700 leading-relaxed">{query.result!.explanation}</p>
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

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить отчет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="report-name">Название отчета</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Например: Квартальный отчет по регионам"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!reportName.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
