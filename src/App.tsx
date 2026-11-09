import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Settings as SettingsIcon,
  Tag,
  Users as UsersIcon
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import PosPage from './pages/PosPage';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Discounts from './pages/Discounts';
import Users from './pages/Users';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';

function Navigation() {
  const location = useLocation();
  const { isAdmin, isCashier, isAuthenticated, signOut, switchMockRole } = useAuth();

  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to={isAdmin ? '/' : '/pos'} className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm">
                W
              </div>
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                WE<span className="text-emerald-600">CASH</span>
              </span>
            </Link>

            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {isAdmin && (
                  <>
                    <Link
                      to="/"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/inventory"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/inventory' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      Inventaris
                    </Link>
                    <Link
                      to="/discounts"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/discounts' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      Kupon
                    </Link>
                    <Link
                      to="/users"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/users' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <UsersIcon className="w-4 h-4" />
                      Pengguna
                    </Link>
                    <Link
                      to="/settings"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/settings' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Toko
                    </Link>
                  </>
                )}

                <Link
                  to="/pos"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
                    location.pathname === '/pos'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Kasir POS
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
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
                    type="button"
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

                <div className="sm:hidden px-2 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 border border-slate-200">
                  {isAdmin ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-blue-700 flex items-center gap-1">
                      <User className="w-3 h-3" /> Kasir
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Logout / Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              !isLoginPage && (
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (#3 Mobile UX) */}
      {isAuthenticated && !isLoginPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-1.5 px-2 shadow-lg">
          {isAdmin ? (
            <>
              <Link
                to="/"
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/inventory"
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/inventory' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <Package className="w-4 h-4 mb-0.5" />
                <span>Inventori</span>
              </Link>
              <Link
                to="/pos"
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/pos' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mb-0.5" />
                <span>Kasir</span>
              </Link>
              <Link
                to="/settings"
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/settings' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <SettingsIcon className="w-4 h-4 mb-0.5" />
                <span>Toko</span>
              </Link>
              <Link
                to="/login"
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/login' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <User className="w-4 h-4 mb-0.5" />
                <span>Akun</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/pos"
                className={`flex flex-col items-center py-1.5 px-8 rounded-xl text-xs font-bold ${
                  location.pathname === '/pos' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <ShoppingCart className="w-5 h-5 mb-0.5" />
                <span>Kasir POS</span>
              </Link>
              <Link
                to="/login"
                className={`flex flex-col items-center py-1.5 px-8 rounded-xl text-xs font-bold ${
                  location.pathname === '/login' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <User className="w-5 h-5 mb-0.5" />
                <span>Ganti Akun</span>
              </Link>
            </>
          )}
        </nav>
      )}
    </>
  );
}

function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
              <Navigation />
              <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-8">
                <Routes>
                  <Route path="/" element={<AuthGuard adminOnly><Dashboard /></AuthGuard>} />
                  <Route path="/inventory" element={<AuthGuard adminOnly><Inventory /></AuthGuard>} />
                  <Route path="/discounts" element={<AuthGuard adminOnly><Discounts /></AuthGuard>} />
                  <Route path="/users" element={<AuthGuard adminOnly><Users /></AuthGuard>} />
                  <Route path="/settings" element={<AuthGuard adminOnly><Settings /></AuthGuard>} />
                  <Route path="/pos" element={<AuthGuard><PosPage /></AuthGuard>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
