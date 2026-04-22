import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  AlertCircle,
  Save,
  ArrowLeft,
  ChevronDown,
  Code,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { store } from "../store";

export function ResultScreen() {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [sqlOpen, setSqlOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const query = store.getQuery(queryId!);

  if (!query) {
    return (
      <div className="max-w-2xl mx-auto pt-24">
        <Card className="p-12 text-center border-slate-200">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Запрос не найден</h2>
          <p className="text-slate-600 mb-6">Запрос, который вы ищете, не существует.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
        </Card>
      </div>
    );
  }

  if (!query.isValid) {
    return (
      <div className="max-w-2xl mx-auto pt-24">
        <Card className="p-12 border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Не удалось обработать запрос</h2>
            <p className="text-slate-600">{query.error}</p>
          </div>

          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-slate-700">
              <strong>Подсказка:</strong> {query.suggestion}
            </AlertDescription>
          </Alert>

          <Button onClick={() => navigate('/')} className="w-full" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Попробовать другой запрос
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Новый запрос
          </Button>
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Запрос выполнен</h1>
              <p className="text-lg text-slate-600">{query.text}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setSaveDialogOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Сохранить отчет
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Интерпретация</p>
          <p className="text-sm font-medium text-slate-900">{query.interpretation!.understood}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Метрики</p>
          <p className="text-sm font-medium text-slate-900">{query.interpretation!.metrics.join(', ')}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Период</p>
          <p className="text-sm font-medium text-slate-900">{query.interpretation!.period}</p>
        </Card>
        <Card className="p-4 border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Разбивка</p>
          <p className="text-sm font-medium text-slate-900">{query.interpretation!.breakdown}</p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6 border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Визуализация</h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={query.result!.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Таблица данных</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  {Object.keys(query.result!.table[0] || {}).map((key) => (
                    <TableHead key={key} className="font-semibold text-slate-900">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.result!.table.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).map((value, cellIdx) => (
                      <TableCell key={cellIdx} className="text-slate-700">
                        {typeof value === 'number' && value > 1000
                          ? value.toLocaleString('ru-RU')
                          : value}
                      </TableCell>
                    ))}
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
                <p className="text-slate-700 leading-relaxed">{query.result!.explanation}</p>
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
            <Button onClick={handleSave} disabled={!reportName.trim()} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
