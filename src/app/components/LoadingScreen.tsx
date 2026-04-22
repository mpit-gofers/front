import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card } from "./ui/card";
import { Brain, Database, CheckCircle, BarChart3 } from "lucide-react";
import { Progress } from "./ui/progress";
import { store } from "../store";

const STEPS = [
  { icon: Brain, label: "Анализ запроса", duration: 800 },
  { icon: Database, label: "Генерация SQL", duration: 1000 },
  { icon: BarChart3, label: "Подготовка визуализации", duration: 600 },
  { icon: CheckCircle, label: "Валидация завершена", duration: 100 }
];

export function LoadingScreen() {
  const navigate = useNavigate();
  const { queryId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const queryText = sessionStorage.getItem('pendingQuery');

    if (!queryText) {
      navigate('/');
      return;
    }

    let totalTime = 0;
    STEPS.forEach((step, index) => {
      totalTime += step.duration;
      setTimeout(() => {
        setCurrentStep(index);
        setProgress(((index + 1) / STEPS.length) * 100);
      }, totalTime - step.duration);
    });

    setTimeout(() => {
      const query = store.processQuery(queryText);
      sessionStorage.removeItem('pendingQuery');
      navigate(`/result/${query.id}`);
    }, totalTime);
  }, [navigate, queryId]);

  return (
    <div className="max-w-2xl mx-auto pt-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Обрабатываем запрос
        </h1>
        <p className="text-slate-600">
          AI анализирует ваш запрос и готовит результаты
        </p>
      </div>

      <Card className="p-8 mb-6 border-slate-200 shadow-sm">
        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 transition-all duration-300 ${
                  isActive ? 'opacity-100' : isComplete ? 'opacity-60' : 'opacity-30'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                    isComplete
                      ? 'bg-green-100 text-green-600'
                      : isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isActive || isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                </div>
                {isComplete && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {isActive && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="px-1">
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
}
