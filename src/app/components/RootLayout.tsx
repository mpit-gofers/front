import { Outlet, Link, useLocation } from "react-router";
import { Sparkles, Plus, FileText } from "lucide-react";
import { Button } from "./ui/button";

export function RootLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto px-6 py-4" style={{ maxWidth: '1400px' }}>
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">QueryAI</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link to="/">
                <Button
                  variant={location.pathname === '/' ? 'default' : 'ghost'}
                  size="sm"
                  className={location.pathname === '/' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Новый запрос
                </Button>
              </Link>
              <Link to="/reports">
                <Button
                  variant={location.pathname.startsWith('/report') ? 'default' : 'ghost'}
                  size="sm"
                  className={location.pathname.startsWith('/report') ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  Отчеты
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-8" style={{ maxWidth: '1400px' }}>
        <Outlet />
      </main>
    </div>
  );
}
