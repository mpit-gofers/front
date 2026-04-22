import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  FileText,
  Search,
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { store } from "../store";

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
