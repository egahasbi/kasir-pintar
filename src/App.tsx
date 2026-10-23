import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Bot, ShoppingCart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AiAssistantDrawer from './components/ai/AiAssistantDrawer';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function Navigation() {
  const location = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                K
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                Kasir Pintar <span className="text-emerald-600">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
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
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium shadow-sm hover:from-emerald-700 hover:to-teal-700 transition"
            >
              <Bot className="w-4 h-4" />
              <span>Tanya AI POS</span>
            </button>
          </div>
        </div>
      </header>

      <AiAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
