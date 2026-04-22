import { Outlet, Link, useLocation } from "react-router";
import { Database, Home, FileText } from "lucide-react";

export function RootLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Database className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold text-slate-900">DataQuery AI</span>
            </Link>

            <nav className="flex gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                Главная
              </Link>
              <Link
                to="/reports"
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  location.pathname === '/reports'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Отчеты
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
