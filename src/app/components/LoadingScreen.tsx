import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Brain, CheckCircle, Database, ShieldCheck } from "lucide-react";
import { store } from "../store";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

const STEPS = [
  { icon: Brain, label: "Анализ запроса", duration: 800 },
  { icon: Database, label: "Генерация SQL", duration: 1000 },
  { icon: BarChart3, label: "Подготовка визуализации", duration: 600 },
  { icon: CheckCircle, label: "Валидация завершена", duration: 100 },
];

/**
 * Нормализует refinement trail из sessionStorage.
 * Вход: сырое JSON-значение trail.
 * Выход: массив уточнений или пустой массив при ошибке парсинга.
 */
function parseRefinementTrace(rawTrail: string | null): Array<Record<string, string>> {
  if (!rawTrail) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawTrail);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Экран загрузки, который сохраняет существующий flow и заранее объясняет trust-контур.
 * Вход: pendingQuery и clarificationTrail из sessionStorage.
 * Выход: переход на ResultScreen после завершения processQuery.
 */
export function LoadingScreen() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [queryPreview, setQueryPreview] = useState("");

  useEffect(() => {
    const queryText = sessionStorage.getItem("pendingQuery");
    const rawTrail = sessionStorage.getItem("clarificationTrail");

    if (!queryText) {
      navigate("/");
      return;
    }

    setQueryPreview(queryText);

    const timers: number[] = [];
    let totalTime = 0;
    STEPS.forEach((step, index) => {
      totalTime += step.duration;
      const timer = window.setTimeout(() => {
        setCurrentStep(index);
        setProgress(((index + 1) / STEPS.length) * 100);
      }, totalTime - step.duration);
      timers.push(timer);
    });

    const run = async () => {
      const refinementTrace = parseRefinementTrace(rawTrail);
      const queryPromise = store.processQuery(queryText, refinementTrace);
      await new Promise((resolve) => window.setTimeout(resolve, totalTime));
      const query = await queryPromise;
      sessionStorage.removeItem("pendingQuery");
      if (query.isValid) {
        sessionStorage.removeItem("clarificationTrail");
      }
      navigate(`/result/${query.id}`);
    };

    void run();

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [navigate]);

  return (
    <div className="mx-auto max-w-2xl pt-24">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Обрабатываем запрос</h1>
        <p className="text-slate-600">
          Decision Room анализирует вопрос, проверяет guardrails и готовит ответ.
        </p>
      </div>

      <Card className="mb-6 border-slate-200 p-8 shadow-sm">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Текущий запрос
          </p>
          <p className="mt-1 text-sm text-slate-800">{queryPreview}</p>
        </div>

        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-4 transition-all duration-300 ${
                  isActive ? "opacity-100" : isComplete ? "opacity-60" : "opacity-30"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                    isComplete
                      ? "bg-green-100 text-green-600"
                      : isActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isActive || isComplete ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
                {isActive && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mb-6 px-1">
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card className="border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Что произойдет, если вопрос рискованный</p>
            <p className="mt-1 text-sm text-slate-700">
              Если формулировка неоднозначна, вы увидите экран уточнения. Если guardrails
              остановят запрос, мы покажем контролируемое объяснение вместо поломанного результата.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
