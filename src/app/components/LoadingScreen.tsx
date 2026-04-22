import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Card } from "./ui/card";
import { Loader2, Brain, Database, CheckCircle } from "lucide-react";
import { store } from "../store";

export function LoadingScreen() {
  const navigate = useNavigate();
  const { queryId } = useParams();

  useEffect(() => {
    const queryText = sessionStorage.getItem('pendingQuery');

    if (!queryText) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      const query = store.processQuery(queryText);
      sessionStorage.removeItem('pendingQuery');

      if (!query.isValid) {
        navigate(`/result/${query.id}`);
      } else {
        navigate(`/result/${query.id}`);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate, queryId]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Обрабатываем запрос
        </h1>
        <p className="text-slate-600">
          Анализируем и формируем результат...
        </p>
      </div>

      <div className="space-y-4">
        <ProcessStep
          icon={<Brain className="w-5 h-5" />}
          title="Интерпретация запроса"
          status="active"
        />
        <ProcessStep
          icon={<Database className="w-5 h-5" />}
          title="Генерация SQL"
          status="pending"
        />
        <ProcessStep
          icon={<CheckCircle className="w-5 h-5" />}
          title="Валидация и проверка"
          status="pending"
        />
      </div>
    </div>
  );
}

function ProcessStep({
  icon,
  title,
  status
}: {
  icon: React.ReactNode;
  title: string;
  status: 'active' | 'pending' | 'complete';
}) {
  return (
    <Card className={`p-4 flex items-center gap-4 transition-all ${
      status === 'active'
        ? 'bg-blue-50 border-blue-200'
        : status === 'complete'
        ? 'bg-green-50 border-green-200'
        : 'bg-white'
    }`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
        status === 'active'
          ? 'bg-blue-100 text-blue-600'
          : status === 'complete'
          ? 'bg-green-100 text-green-600'
          : 'bg-slate-100 text-slate-400'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900">{title}</p>
      </div>
      {status === 'active' && (
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      )}
    </Card>
  );
}
