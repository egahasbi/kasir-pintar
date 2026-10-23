import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, Bot, ShoppingCart, LogIn, User, ShieldCheck, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import PosPage from './pages/PosPage';
import Login from './pages/Login';
import AiSetup from './pages/AiSetup';
import AiAssistantDrawer from './components/ai/AiAssistantDrawer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';


function Navigation() {
  const location = useLocation();
  const { isAdmin, switchMockRole } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to={isAdmin ? '/' : '/pos'} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                K
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                Kasir Pintar <span className="text-emerald-600">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {isAdmin && (
                <>
                  <Link
                    to="/"
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      location.pathname === '/'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/inventory"
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      location.pathname === '/inventory'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Inventaris
                  </Link>
                  <Link
                    to="/setup-ai"
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      location.pathname === '/setup-ai'
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Setup AI
                  </Link>
                </>
              )}

              <Link
                to="/pos"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  location.pathname === '/pos'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Kasir POS
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => switchMockRole('admin')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                  isAdmin
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                onClick={() => switchMockRole('cashier')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                  !isAdmin
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Kasir
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAiOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium shadow-sm hover:from-emerald-700 hover:to-teal-700 transition"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Tanya AI</span>
              </button>
            )}

            <Link
              to="/login"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="Ganti Mode / Login"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {isAdmin && <AiAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />}
    </>
  );
}

function RoleGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAdmin } = useAuth();
  if (adminOnly && !isAdmin) {
    return <Navigate to="/pos" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                <Route
                  path="/"
                  element={
                    <RoleGuard adminOnly>
                      <Dashboard />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <RoleGuard adminOnly>
                      <Inventory />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/setup-ai"
                  element={
                    <RoleGuard adminOnly>
                      <AiSetup />
                    </RoleGuard>
                  }
                />
                <Route path="/pos" element={<PosPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
