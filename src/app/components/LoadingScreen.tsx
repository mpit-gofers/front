import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Brain, CheckCircle, ShieldCheck } from "lucide-react";
import { store, type AnalysisContext } from "../store";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

const MAX_WAITING_PROGRESS = 90;
const MIN_VISIBLE_MS = 700;
const COMPLETION_PAUSE_MS = 250;
const LONG_WAIT_MS = 8000;

const STEPS = [
  { icon: Brain, label: "Понимаем вопрос", duration: 700 },
  { icon: ShieldCheck, label: "Проверяем ограничения", duration: 900 },
  { icon: BarChart3, label: "Готовим ответ", duration: 900 },
  { icon: CheckCircle, label: "Ждем результат", duration: 600 },
];

/**
 * Делает короткую UI-паузу без привязки к backend-стадиям.
 * Вход: длительность ожидания в миллисекундах.
 * Выход: promise, который завершается после указанного времени.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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
 * Нормализует analysis context из sessionStorage.
 * Вход: сырое JSON-значение pendingAskContext.
 * Выход: объект контекста или пустой объект, если значение невалидно.
 */
function parseAnalysisContext(rawContext: string | null): AnalysisContext {
  if (!rawContext) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawContext);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as AnalysisContext;
    }
  } catch {
    return {};
  }

  return {};
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
  const [longWaitVisible, setLongWaitVisible] = useState(false);

  useEffect(() => {
    const queryText = sessionStorage.getItem("pendingQuery");
    const rawTrail = sessionStorage.getItem("clarificationTrail");
    const rawContext = sessionStorage.getItem("pendingAskContext");

    if (!queryText) {
      navigate("/");
      return;
    }

    setQueryPreview(queryText);
    setCurrentStep(0);
    setProgress(5);
    setLongWaitVisible(false);

    const timers: number[] = [];
    let isActive = true;
    let totalTime = 0;
    STEPS.forEach((step, index) => {
      totalTime += step.duration;
      const timer = window.setTimeout(() => {
        if (!isActive) {
          return;
        }
        setCurrentStep(index);
        setProgress(
          Math.min(
            ((index + 1) / STEPS.length) * MAX_WAITING_PROGRESS,
            MAX_WAITING_PROGRESS,
          ),
        );
      }, totalTime - step.duration);
      timers.push(timer);
    });
    timers.push(
      window.setTimeout(() => {
        if (isActive) {
          setLongWaitVisible(true);
        }
      }, LONG_WAIT_MS),
    );

    const run = async () => {
      const refinementTrace = parseRefinementTrace(rawTrail);
      const analysisContext = parseAnalysisContext(rawContext);
      const startedAt = Date.now();
      const queryPromise = store.processQuery(
        queryText,
        refinementTrace,
        analysisContext,
      );
      const query = await queryPromise;
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < MIN_VISIBLE_MS) {
        await wait(MIN_VISIBLE_MS - elapsedMs);
      }
      if (!isActive) {
        return;
      }
      timers.forEach((timer) => window.clearTimeout(timer));
      setCurrentStep(STEPS.length - 1);
      setProgress(100);
      sessionStorage.removeItem("pendingQuery");
      if (query.isValid) {
        sessionStorage.removeItem("pendingAskContext");
        sessionStorage.removeItem("clarificationTrail");
      }
      await wait(COMPLETION_PAUSE_MS);
      if (!isActive) {
        return;
      }
      navigate(`/result/${query.id}`);
    };

    void run();

    return () => {
      isActive = false;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [navigate]);

  return (
    <div className="mx-auto max-w-2xl pt-24">
      <div className="mb-12 text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Обрабатываем запрос</h1>
        <p className="text-slate-600">
          Decision Room анализирует вопрос, проверяет ограничения безопасности и готовит ответ.
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
        {longWaitVisible && (
          <p className="mt-3 text-sm text-slate-600">
            Ответ занимает больше обычного. Мы все еще ждем безопасный результат и
            не закрываем экран, пока проверка не завершится.
          </p>
        )}
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
