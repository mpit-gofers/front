import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  FileText,
  Search,
  Calendar,
  Play,
  Trash2,
  AlertCircle
} from "lucide-react";
import { store } from "../store";
import { Alert, AlertDescription } from "./ui/alert";

export function ReportsLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const reports = store.getAllReports();

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот отчет?')) {
      store.deleteReport(id);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Библиотека отчетов
        </h1>
        <p className="text-slate-600">
          Сохраненные аналитические отчеты и запросы
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по отчетам..."
            className="pl-10"
          />
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {reports.length === 0
              ? "У вас пока нет сохраненных отчетов. Создайте первый запрос на главной странице!"
              : "Ничего не найдено по вашему запросу"}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const query = store.getQuery(report.queryId);
            return (
              <Card
                key={report.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(report.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                  </Button>
                </div>

                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                  {report.name}
                </h3>

                {query && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {query.text}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Создан: {new Date(report.savedAt).toLocaleDateString('ru-RU')}
                  </div>
                  {report.lastRun && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Play className="w-3 h-3" />
                      Последний запуск: {new Date(report.lastRun).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="text-xs">
                  Сохранен
                </Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
