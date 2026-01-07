import React, { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, X, Calculator, Briefcase, Zap, 
  Download, FileSpreadsheet, Layers, AlertTriangle, Target, CheckCircle2,
  LayoutDashboard, History, Settings, Bell, User
} from 'lucide-react';
import { Transaction, TransactionType, PortfolioStats } from './types';
import { StatsCards } from './components/StatsCards';
import { TransactionForm } from './components/TransactionForm';
import { HistoryTable } from './components/HistoryTable';
import { AiInsight } from './components/AiInsight';
import { SimulationModal } from './components/SimulationModal';
import { AdjustmentModal } from './components/AdjustmentModal';
import { MonthlyLimitTracker } from './components/MonthlyLimitTracker';
import { ProfitScenarioCard } from './components/ProfitScenarioCard';

const PORTFOLIOS = [
  { 
    id: 'main', 
    label: 'Inversión Principal', 
    icon: Briefcase, 
    theme: {
      primary: 'bg-indigo-600',
      hover: 'hover:bg-indigo-500',
      text: 'text-indigo-400',
      lightBg: 'bg-indigo-900/20',
      border: 'border-indigo-900/50',
      shadow: 'shadow-indigo-900/20'
    }
  },
  { 
    id: 'trading', 
    label: 'Trading / P2P', 
    icon: Zap, 
    theme: {
      primary: 'bg-emerald-600',
      hover: 'hover:bg-emerald-500',
      text: 'text-emerald-400',
      lightBg: 'bg-emerald-900/20',
      border: 'border-emerald-900/50',
      shadow: 'shadow-emerald-900/20'
    }
  },
  {
    id: 'all',
    label: 'Global',
    icon: Layers,
    theme: {
      primary: 'bg-slate-600',
      hover: 'hover:bg-slate-500',
      text: 'text-slate-400',
      lightBg: 'bg-slate-900/20',
      border: 'border-slate-900/50',
      shadow: 'shadow-slate-900/20'
    }
  }
];

function App() {
  const [activePortfolio, setActivePortfolio] = useState<string>(() => {
    return localStorage.getItem('active_portfolio') || 'main';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('usdt_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
          ...t,
          id: t.id || uuidv4(),
          portfolioId: t.portfolioId || 'main'
        }));
      } catch (e) {
        console.error("Error loading transactions", e);
        return [];
      }
    }
    return [];
  });

  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  
  // --- NÚCLEO DE CÁLCULO CONTABLE (WAC) ---
  const processedData = useMemo(() => {
    const chronologicalTx = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime() || 
      (a.type === TransactionType.BUY ? -1 : 1)
    );

    const portfolioStates: Record<string, { balance: number, costBasis: number, totalRealizedPnl: number }> = {
      main: { balance: 0, costBasis: 0, totalRealizedPnl: 0 },
      trading: { balance: 0, costBasis: 0, totalRealizedPnl: 0 }
    };

    const enrichedTransactions = chronologicalTx.map(tx => {
      const pId = tx.portfolioId || 'main';
      const state = portfolioStates[pId] || { balance: 0, costBasis: 0, totalRealizedPnl: 0 };
      let realizedPnl = undefined;
      let pnlPercentage = undefined;

      const currentAvgPrice = state.balance > 0 ? state.costBasis / state.balance : 0;

      if (tx.type === TransactionType.BUY) {
        state.balance += tx.amountUsdt;
        state.costBasis += tx.amountPesos;
      } else if (tx.type === TransactionType.SELL) {
        const costOfSoldUsdt = tx.amountUsdt * currentAvgPrice;
        realizedPnl = tx.amountPesos - costOfSoldUsdt;
        pnlPercentage = currentAvgPrice > 0 ? ((tx.pricePerUsdt / currentAvgPrice) - 1) * 100 : 0;
        
        state.totalRealizedPnl += realizedPnl;
        state.balance -= tx.amountUsdt;
        state.costBasis -= costOfSoldUsdt;
      } else if (tx.type === TransactionType.ADJUSTMENT) {
        const impactUsdt = tx.amountUsdt;
        if (impactUsdt > 0) {
          state.balance += impactUsdt;
          state.costBasis += impactUsdt * currentAvgPrice;
        } else {
          const absImpact = Math.abs(impactUsdt);
          const reductionRatio = state.balance > 0 ? absImpact / state.balance : 0;
          state.costBasis -= state.costBasis * reductionRatio;
          state.balance -= absImpact;
        }
      }

      return { ...tx, realizedPnl, pnlPercentage };
    });

    return enrichedTransactions.reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return processedData.filter(t => 
      activePortfolio === 'all' ? true : (t.portfolioId || 'main') === activePortfolio
    );
  }, [processedData, activePortfolio]);

  const activePortfolioConfig = PORTFOLIOS.find(p => p.id === activePortfolio) || PORTFOLIOS[0];
  const targetPortfolioId = activePortfolio === 'all' ? 'main' : activePortfolio;
  const targetPortfolioLabel = PORTFOLIOS.find(p => p.id === targetPortfolioId)?.label || 'Inversión Principal';

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    let b = 0, cb = 0, pnl = 0;
    const lastPrice = processedData.find(t => t.type !== TransactionType.ADJUSTMENT)?.pricePerUsdt || 19.50;

    [...processedData].reverse().forEach(t => {
       if (activePortfolio !== 'all' && (t.portfolioId || 'main') !== activePortfolio) return;
       const currentAvg = b > 0 ? cb / b : 0;
       if (t.type === TransactionType.BUY) { b += t.amountUsdt; cb += t.amountPesos; }
       else if (t.type === TransactionType.SELL) {
         const cost = t.amountUsdt * currentAvg;
         pnl += (t.amountPesos - cost);
         b -= t.amountUsdt;
         cb -= cost;
       } else if (t.type === TransactionType.ADJUSTMENT) {
         if (t.amountUsdt > 0) { b += t.amountUsdt; cb += t.amountUsdt * currentAvg; }
         else { const ratio = b > 0 ? Math.abs(t.amountUsdt) / b : 0; cb -= cb * ratio; b -= Math.abs(t.amountUsdt); }
       }
    });

    const avgPrice = b > 0 ? cb / b : 0;
    const estValue = b * lastPrice;

    return {
      totalInvestedPesos: cb,
      currentUsdtBalance: b,
      averageBuyPrice: avgPrice,
      totalRealizedPnl: pnl,
      unrealizedPnl: estValue - cb,
      estimatedValue: estValue
    };
  }, [processedData, activePortfolio]);

  const spentThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === TransactionType.BUY)
      .filter(t => {
        const d = new Date(t.date);
        return d.getUTCMonth() === now.getUTCMonth() && d.getUTCFullYear() === now.getUTCFullYear();
      })
      .reduce((sum, t) => sum + t.amountPesos, 0);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('active_portfolio', activePortfolio);
    localStorage.setItem('usdt_transactions', JSON.stringify(transactions));
  }, [activePortfolio, transactions]);

  const handleAddTransaction = (type: TransactionType, amountPesos: number, pricePerUsdt: number, date: string) => {
    const amountUsdt = amountPesos / pricePerUsdt;
    const balanceAtDate = transactions
      .filter(t => (t.portfolioId || 'main') === targetPortfolioId && new Date(t.date) <= new Date(date))
      .reduce((acc, t) => t.type === TransactionType.SELL ? acc - t.amountUsdt : acc + t.amountUsdt, 0);

    if (type === TransactionType.SELL && amountUsdt > (balanceAtDate + 0.0001)) {
      setAppError(`Error: Saldo insuficiente en la fecha seleccionada.`);
      setTimeout(() => setAppError(null), 5000);
      return;
    }
    
    const newTx: Transaction = { id: uuidv4(), portfolioId: targetPortfolioId, date, type, amountPesos, pricePerUsdt, amountUsdt };
    setTransactions(prev => [newTx, ...prev]);
    setIsTransactionModalOpen(false);
    setAppSuccess("Transacción registrada en el libro.");
    setTimeout(() => setAppSuccess(null), 3000);
  };

  const handleAdjustBalance = (newBalance: number) => {
    const diff = newBalance - stats.currentUsdtBalance;
    if (Math.abs(diff) < 0.0001) return;
    
    const adjustmentTx: Transaction = { 
      id: uuidv4(), 
      portfolioId: targetPortfolioId, 
      date: new Date().toISOString(), 
      type: TransactionType.ADJUSTMENT, 
      amountUsdt: diff, 
      amountPesos: 0, 
      pricePerUsdt: stats.averageBuyPrice || 0
    };

    setTransactions(prev => [adjustmentTx, ...prev]);
    setIsAdjustmentModalOpen(false);
    setAppSuccess("Sincronización de balance completada.");
    setTimeout(() => setAppSuccess(null), 3000);
  };

  const exportToExcel = () => {
    let csvContent = "\ufeffFecha,Hora,Portafolio,Operacion,USDT,Precio (MXN),Total (MXN),PnL (MXN),%\n";
    [...filteredTransactions].reverse().forEach(t => {
      const pName = PORTFOLIOS.find(p => p.id === t.portfolioId)?.label || 'Principal';
      const d = new Date(t.date);
      csvContent += `${d.toLocaleDateString()},${d.toLocaleTimeString()},${pName},${t.type},${t.amountUsdt.toFixed(4)},${t.pricePerUsdt.toFixed(2)},${t.amountPesos.toFixed(2)},${(t.realizedPnl || 0).toFixed(2)},${(t.pnlPercentage || 0).toFixed(2)}%\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Nexus_P2P_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      {/* Barra de Navegación Web */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-indigo-500 font-black text-xl tracking-tighter">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <LayoutDashboard size={18} />
                </div>
                <span>NEXUS <span className="text-slate-500 font-light">P2P</span></span>
              </div>
              <div className="hidden md:flex items-center gap-1 bg-gray-950/50 p-1 rounded-xl border border-white/5">
                {PORTFOLIOS.map((p) => (
                  <button 
                    key={p.id} 
                    onClick={() => setActivePortfolio(p.id)} 
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePortfolio === p.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                    <p.icon size={14} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-gray-900"></span>
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
                <User size={18} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Notificaciones de Sistema */}
      <div className="fixed top-20 right-8 z-[100] w-80 space-y-2 pointer-events-none">
        {appError && (
          <div className="bg-rose-950 border border-rose-800 text-rose-100 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right-4 pointer-events-auto">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-xs font-medium">{appError}</p>
          </div>
        )}
        {appSuccess && (
          <div className="bg-emerald-950 border border-emerald-800 text-emerald-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 pointer-events-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-bold">{appSuccess}</p>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1">
        {/* Header de Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">Panel General</h2>
            <p className="text-slate-500 text-sm font-medium">Control total de tus activos en {activePortfolioConfig.label}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportToExcel} className="h-11 px-4 text-slate-300 hover:text-white bg-slate-900 border border-white/5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-sm">
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={() => setIsSimulationModalOpen(true)} className="h-11 px-4 bg-slate-900 border border-white/5 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-sm">
              <Calculator size={16} className="text-indigo-400" /> Simular
            </button>
            <button onClick={() => setIsTransactionModalOpen(true)} className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-black shadow-lg shadow-indigo-900/20 active:scale-95">
              <Plus size={18} /> NUEVA OPERACIÓN
            </button>
          </div>
        </div>

        {/* Grid Principal de Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-12">
            <StatsCards stats={stats} onEditBalance={() => setIsAdjustmentModalOpen(true)} />
          </div>
          
          <div className="lg:col-span-4">
            <MonthlyLimitTracker transactions={transactions} spentThisMonth={spentThisMonth} />
          </div>
          
          <div className="lg:col-span-4">
            <ProfitScenarioCard currentBalance={stats.currentUsdtBalance} averagePrice={stats.averageBuyPrice} />
          </div>

          <div className="lg:col-span-4">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col group hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                  <Target size={20} />
                </div>
                <h3 className="text-white font-bold text-lg">Objetivos Nexus</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Gestión inteligente de activos basada en el Costo Promedio Ponderado (WAC). El sistema ajusta automáticamente tu rentabilidad real con cada movimiento.</p>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-xs p-4 bg-gray-950/50 rounded-2xl border border-white/5">
                  <span className="text-slate-500 uppercase font-black tracking-widest">Estado Nexus</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Óptimo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Datos */}
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-1 mb-20">
          <HistoryTable 
            transactions={filteredTransactions} 
            onDelete={(id) => {
              if (confirm('¿Eliminar este registro permanentemente?')) {
                setTransactions(prev => prev.filter(t => t.id !== id));
                setAppSuccess("Registro removido.");
              }
            }} 
            title={activePortfolio === 'all' ? 'Consolidado Global Nexus' : `Libro: ${activePortfolioConfig.label}`} 
            showPortfolioColumn={activePortfolio === 'all'} 
          />
        </div>
      </main>

      <AiInsight transactions={filteredTransactions} portfolioName={activePortfolioConfig.label} />

      {/* Modales */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-white/5">
               <div>
                 <h3 className="text-xl font-black text-white">Nueva Transacción</h3>
                 <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-wider">{targetPortfolioLabel}</p>
               </div>
               <button onClick={() => setIsTransactionModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 rounded-full p-2 transition-all hover:rotate-90">
                 <X size={20} />
               </button>
            </div>
            <div className="p-8">
               <TransactionForm 
                 onAddTransaction={handleAddTransaction} 
                 currentUsdtBalance={stats.currentUsdtBalance} 
                 averageBuyPrice={stats.averageBuyPrice} 
                 portfolioLabel={targetPortfolioLabel} 
               />
            </div>
          </div>
        </div>
      )}

      {isSimulationModalOpen && <SimulationModal onClose={() => setIsSimulationModalOpen(false)} currentUsdtBalance={stats.currentUsdtBalance} averageBuyPrice={stats.averageBuyPrice} />}
      
      {isAdjustmentModalOpen && (
        <AdjustmentModal 
          onClose={() => setIsAdjustmentModalOpen(false)} 
          currentBalance={stats.currentUsdtBalance} 
          averagePrice={stats.averageBuyPrice} 
          onConfirm={handleAdjustBalance} 
          portfolioLabel={targetPortfolioLabel} 
        />
      )}

      {/* Footer Web */}
      <footer className="bg-gray-900/50 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
          <p>© 2025 Nexus P2P Portal. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;