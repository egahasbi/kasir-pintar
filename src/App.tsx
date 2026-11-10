import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Settings as SettingsIcon,
  Tag,
  Users as UsersIcon,
  Receipt,
  BarChart3
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import PosPage from './pages/PosPage';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Discounts from './pages/Discounts';
import Users from './pages/Users';
import SuperUser from './pages/SuperUser';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Billing from './pages/Billing';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { supabase } from './lib/supabaseClient';
import { fetchAllProducts } from './lib/productStore';

function Navigation() {
  const location = useLocation();
  const { isAdmin, isCashier, isSuperAdmin, isAuthenticated, profile, signOut } = useAuth();
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAllProducts().then((prods) => {
        const count = prods.filter((p) => p.stock <= (p.min_stock_alert || p.min_stock || 5)).length;
        setLowStockCount(count);
      });
    }
  }, [isAuthenticated, isAdmin, location.pathname]);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to={isAdmin ? '/' : '/pos'} className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm">
                K
              </div>
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                KASIR<span className="text-emerald-700">KITA</span>
              </span>
            </Link>

            {/* Public Landing Navigation Links */}
            {!isAuthenticated && location.pathname === '/' && (
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
                <a href="#fitur" className="hover:text-emerald-600 transition">Fitur</a>
                <a href="#cara-kerja" className="hover:text-emerald-600 transition">Cara Kerja</a>
                <a href="#harga" className="hover:text-emerald-600 transition">Harga</a>
                <a href="#testimoni" className="hover:text-emerald-600 transition">Testimoni</a>
                <a href="#faq" className="hover:text-emerald-600 transition">FAQ</a>
              </nav>
            )}

            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {isAdmin && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/inventory"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition relative ${
                        location.pathname === '/inventory' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>Inventaris</span>
                      {lowStockCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </Link>
                    <Link
                      to="/transactions"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/transactions' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Receipt className="w-4 h-4" />
                      Transaksi
                    </Link>
                    <Link
                      to="/reports"
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/reports' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Laporan
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
                      to={isSuperAdmin ? '/super-admin' : '/users'}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
                        location.pathname === '/users' || location.pathname === '/super-admin'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isSuperAdmin ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-indigo-600" />
                          <span>Super User</span>
                        </>
                      ) : (
                        <>
                          <UsersIcon className="w-4 h-4" />
                          <span>Pengguna</span>
                        </>
                      )}
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
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-800 hidden sm:inline">{profile?.full_name || profile?.email}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      isSuperAdmin
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : isAdmin
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Kasir'}
                  </span>
                </div>

                <Link
                  to={isSuperAdmin ? '/super-admin' : isAdmin ? '/dashboard' : '/pos'}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Buka Aplikasi</span>
                </Link>

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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (#3 Mobile UX) */}
      {isAuthenticated && !isPublicPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-1.5 px-2 shadow-lg">
          {isAdmin ? (
            <>
              <Link
                to="/dashboard"
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/dashboard' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/pos"
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/pos' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mb-0.5" />
                <span>Kasir</span>
              </Link>
              <Link
                to="/transactions"
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/transactions' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <Receipt className="w-4 h-4 mb-0.5" />
                <span>Riwayat</span>
              </Link>
              <Link
                to="/reports"
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/reports' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <BarChart3 className="w-4 h-4 mb-0.5" />
                <span>Laporan</span>
              </Link>
              <Link
                to="/inventory"
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold relative ${
                  location.pathname === '/inventory' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <Package className="w-4 h-4 mb-0.5" />
                <span>Stok</span>
                {lowStockCount > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </Link>
              <Link
                to="/settings"
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold ${
                  location.pathname === '/settings' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <SettingsIcon className="w-4 h-4 mb-0.5" />
                <span>Toko</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/pos"
                className={`flex flex-col items-center py-1.5 px-6 rounded-xl text-xs font-bold ${
                  location.pathname === '/pos' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <ShoppingCart className="w-5 h-5 mb-0.5" />
                <span>Kasir POS</span>
              </Link>
              <Link
                to="/transactions"
                className={`flex flex-col items-center py-1.5 px-6 rounded-xl text-xs font-bold ${
                  location.pathname === '/transactions' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <Receipt className="w-5 h-5 mb-0.5" />
                <span>Riwayat</span>
              </Link>
              <Link
                to="/login"
                className={`flex flex-col items-center py-1.5 px-6 rounded-xl text-xs font-bold ${
                  location.pathname === '/login' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <User className="w-5 h-5 mb-0.5" />
                <span>Akun</span>
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
            <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col">
              <Navigation />
              <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-8">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/dashboard" element={<AuthGuard adminOnly><Dashboard /></AuthGuard>} />
                  <Route path="/inventory" element={<AuthGuard adminOnly><Inventory /></AuthGuard>} />
                  <Route path="/transactions" element={<AuthGuard><Transactions /></AuthGuard>} />
                  <Route path="/reports" element={<AuthGuard adminOnly><Reports /></AuthGuard>} />
                  <Route path="/discounts" element={<AuthGuard adminOnly><Discounts /></AuthGuard>} />
                  <Route path="/users" element={<AuthGuard adminOnly><Users /></AuthGuard>} />
                  <Route path="/super-admin" element={<AuthGuard adminOnly><SuperUser /></AuthGuard>} />
                  <Route path="/settings" element={<AuthGuard adminOnly><Settings /></AuthGuard>} />
                  <Route path="/billing" element={<AuthGuard adminOnly><Billing /></AuthGuard>} />
                  <Route path="/pos" element={<AuthGuard><PosPage /></AuthGuard>} />
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
