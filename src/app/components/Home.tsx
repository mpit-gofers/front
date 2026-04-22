import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Sparkles, TrendingUp, Users, DollarSign } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Показать продажи по регионам за последний квартал",
  "Сколько новых клиентов появилось в марте 2026?",
  "Выручка по категориям товаров за 2026 год",
  "Средний чек по месяцам с разбивкой по каналам продаж"
];

export function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const queryId = `query-${Date.now()}`;
      sessionStorage.setItem('pendingQuery', query);
      navigate(`/loading/${queryId}`);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Аналитика на естественном языке
        </h1>
        <p className="text-lg text-slate-600">
          Просто опишите, что вы хотите узнать — мы создадим отчет
        </p>
      </div>

      <Card className="p-8 mb-8 bg-white shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ваш запрос
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: Показать продажи по регионам за последний квартал..."
              className="min-h-32 text-base resize-none"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!query.trim()}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Показать результат
          </Button>
        </form>
      </Card>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-700 mb-3">
          Примеры запросов:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXAMPLE_QUERIES.map((example, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => handleExampleClick(example)}
            >
              <p className="text-sm text-slate-700">{example}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Быстрые отчеты</h3>
          <p className="text-sm text-slate-600">
            Получайте данные без написания SQL
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Понятные графики</h3>
          <p className="text-sm text-slate-600">
            Визуализация данных в один клик
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Сохранение</h3>
          <p className="text-sm text-slate-600">
            Создавайте библиотеку отчетов
          </p>
        </Card>
      </div>
    </div>
  );
}
