import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Sparkles } from "lucide-react";

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
    <div className="max-w-3xl mx-auto pt-16 pb-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Аналитика с AI
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Задайте любой вопрос
          <br />
          о ваших данных
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Запросы на естественном языке, мгновенные инсайты. Без SQL.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-12">
        <div className="relative">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: Показать продажи по регионам за последний квартал..."
            className="min-h-[140px] text-base resize-none pr-24 shadow-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            type="submit"
            size="lg"
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 shadow-sm"
            disabled={!query.trim()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Анализировать
          </Button>
        </div>
      </form>

      <div>
        <p className="text-sm font-medium text-slate-500 mb-3">
          Попробуйте пример:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
