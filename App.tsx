import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, X, Calculator, Briefcase, Zap, 
  FileSpreadsheet, Layers, AlertTriangle, Target, CheckCircle2,
  LayoutDashboard, Bell, User
} from 'lucide-react';
import { Transaction, TransactionType, PortfolioStats } from './types.ts';
import { StatsCards } from './components/StatsCards.tsx';
import { TransactionForm } from './components/TransactionForm.tsx';
import { HistoryTable } from './components/HistoryTable.tsx';
import { AiInsight } from './components/AiInsight.tsx';
import { SimulationModal } from './components/SimulationModal.tsx';
import { AdjustmentModal } from './components/AdjustmentModal.tsx';
import { MonthlyLimitTracker } from './components/MonthlyLimitTracker.tsx';
import { ProfitScenarioCard } from './components/ProfitScenarioCard.tsx';

const PORTFOLIOS = [
  { id: 'main', label: 'Inversión Principal', icon: Briefcase },
  { id: 'trading', label: 'Trading / P2P', icon: Zap },
  { id: 'all', label: 'Global', icon: Layers }
];

function App() {
  const [activePortfolio, setActivePortfolio] = useState<string>(() => {
    return localStorage.getItem('active_portfolio') || 'main';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('usdt_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
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

  const processedData = useMemo(() => {
    const chronologicalTx = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const states: Record<string, { b: number, cb: number, pnl: number }> = {
      main: { b: 0, cb: 0, pnl: 0 },
      trading: { b: 0, cb: 0, pnl: 0 }
    };

    const enriched = chronologicalTx.map(tx => {
      const pId = tx.portfolioId || 'main';
      const s = states[pId] || { b: 0, cb: 0, pnl: 0 };
      let realizedPnl = undefined;
      let pnlPercentage = undefined;

      const avg = s.b > 0 ? s.cb / s.b : 0;

      if (tx.type === TransactionType.BUY) {
        s.b += tx.amountUsdt;
        s.cb += tx.amountPesos;
      } else if (tx.type === TransactionType.SELL) {
        const cost = tx.amountUsdt * avg;
        realizedPnl = tx.amountPesos - cost;
        pnlPercentage = avg > 0 ? ((tx.pricePerUsdt / avg) - 1) * 100 : 0;
        s.pnl += realizedPnl;
        s.b -= tx.amountUsdt;
        s.cb -= cost;
      } else if (tx.type === TransactionType.ADJUSTMENT) {
        if (tx.amountUsdt > 0) {
          s.b += tx.amountUsdt;
          s.cb += tx.amountUsdt * avg;
        } else {
          const ratio = s.b > 0 ? Math.abs(tx.amountUsdt) / s.b : 0;
          s.cb -= s.cb * ratio;
          s.b -= Math.abs(tx.amountUsdt);
        }
      }

      return { ...tx, realizedPnl, pnlPercentage };
    });

    return enriched.reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return processedData.filter(t => 
      activePortfolio === 'all' ? true : (t.portfolioId || 'main') === activePortfolio
    );
  }, [processedData, activePortfolio]);

  const stats = useMemo(() => {
    let b = 0, cb = 0, pnl = 0;
    const lastPrice = processedData.find(t => t.type !== TransactionType.ADJUSTMENT)?.pricePerUsdt || 19.50;

    [...processedData].reverse().forEach(t => {
       if (activePortfolio !== 'all' && (t.portfolioId || 'main') !== activePortfolio) return;
       const avg = b > 0 ? cb / b : 0;
       if (t.type === TransactionType.BUY) { b += t.amountUsdt; cb += t.amountPesos; }
       else if (t.type === TransactionType.SELL) {
         const cost = t.amountUsdt * avg;
         pnl += (t.amountPesos - cost);
         b -= t.amountUsdt;
         cb -= cost;
       } else if (t.type === TransactionType.ADJUSTMENT) {
         if (t.amountUsdt > 0) { b += t.amountUsdt; cb += t.amountUsdt * avg; }
         else { const r = b > 0 ? Math.abs(t.amountUsdt) / b : 0; cb -= cb * r; b -= Math.abs(t.amountUsdt); }
       }
    });

    return {
      totalInvestedPesos: cb,
      currentUsdtBalance: b,
      averageBuyPrice: b > 0 ? cb / b : 0,
      totalRealizedPnl: pnl,
      unrealizedPnl: (b * lastPrice) - cb,
      estimatedValue: b * lastPrice
    };
  }, [processedData, activePortfolio]);

  const spentThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === TransactionType.BUY && 
        new Date(t.date).getMonth() === now.getMonth() && 
        new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amountPesos, 0);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('active_portfolio', activePortfolio);
    localStorage.setItem('usdt_transactions', JSON.stringify(transactions));
  }, [activePortfolio, transactions]);

  const handleAddTransaction = (type: TransactionType, amountPesos: number, pricePerUsdt: number, date: string) => {
    const tx: Transaction = { 
      id: uuidv4(), 
      portfolioId: activePortfolio === 'all' ? 'main' : activePortfolio, 
      date, type, amountPesos, pricePerUsdt, 
      amountUsdt: amountPesos / pricePerUsdt 
    };
    setTransactions(p => [tx, ...p]);
    setIsTransactionModalOpen(false);
    setAppSuccess("Libro actualizado con éxito.");
    setTimeout(() => setAppSuccess(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-indigo-500 font-black text-xl tracking-tighter">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><LayoutDashboard size={18} /></div>
              <span>NEXUS</span>
            </div>
            <div className="hidden md:flex bg-gray-950/50 p-1 rounded-xl border border-white/5">
              {PORTFOLIOS.map(p => (
                <button key={p.id} onClick={() => setActivePortfolio(p.id)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePortfolio === p.id ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Bell size={20} />
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center"><User size={18} /></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Panel de Control</h2>
            <p className="text-slate-500 text-sm font-medium">Análisis de activos en tiempo real</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsSimulationModalOpen(true)} className="h-11 px-4 bg-slate-900 border border-white/5 text-slate-300 rounded-xl font-bold flex items-center gap-2"><Calculator size={16} /> Simular</button>
            <button onClick={() => setIsTransactionModalOpen(true)} className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black flex items-center gap-2 shadow-lg shadow-indigo-900/20"><Plus size={18} /> NUEVA OPERACIÓN</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-12"><StatsCards stats={stats} onEditBalance={() => setIsAdjustmentModalOpen(true)} /></div>
          <div className="lg:col-span-4"><MonthlyLimitTracker transactions={transactions} spentThisMonth={spentThisMonth} /></div>
          <div className="lg:col-span-4"><ProfitScenarioCard currentBalance={stats.currentUsdtBalance} averagePrice={stats.averageBuyPrice} /></div>
          <div className="lg:col-span-4">
             <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col group">
               <div className="flex items-center gap-3 mb-6">
                 <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400"><Target size={20} /></div>
                 <h3 className="text-white font-bold text-lg">Objetivos Nexus</h3>
               </div>
               <p className="text-slate-500 text-sm leading-relaxed mb-8">Utilizando WAC (Weighted Average Cost) para asegurar una rentabilidad precisa en cada salida del mercado mexicano.</p>
               <div className="mt-auto bg-gray-950/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                 <span className="text-slate-500 text-[10px] uppercase font-black">Estado</span>
                 <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs"><CheckCircle2 size={12} /> Óptimo</span>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-1 mb-20">
          <HistoryTable 
            transactions={filteredTransactions} 
            onDelete={id => setTransactions(p => p.filter(t => t.id !== id))} 
            title={activePortfolio === 'all' ? 'Consolidado Global' : `Libro: ${PORTFOLIOS.find(p => p.id === activePortfolio)?.label}`} 
          />
        </div>
      </main>

      <AiInsight transactions={filteredTransactions} portfolioName={PORTFOLIOS.find(p => p.id === activePortfolio)?.label || 'Principal'} />

      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white">Registrar Operación</h3>
              <button onClick={() => setIsTransactionModalOpen(false)} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <TransactionForm 
              onAddTransaction={handleAddTransaction} 
              currentUsdtBalance={stats.currentUsdtBalance} 
              averageBuyPrice={stats.averageBuyPrice} 
              portfolioLabel={PORTFOLIOS.find(p => p.id === activePortfolio)?.label || 'Principal'} 
            />
          </div>
        </div>
      )}

      {isSimulationModalOpen && <SimulationModal onClose={() => setIsSimulationModalOpen(false)} currentUsdtBalance={stats.currentUsdtBalance} averageBuyPrice={stats.averageBuyPrice} />}
      {isAdjustmentModalOpen && (
        <AdjustmentModal 
          onClose={() => setIsAdjustmentModalOpen(false)} 
          currentBalance={stats.currentUsdtBalance} 
          averagePrice={stats.averageBuyPrice} 
          onConfirm={nb => {
            const diff = nb - stats.currentUsdtBalance;
            const tx: Transaction = { id: uuidv4(), portfolioId: activePortfolio === 'all' ? 'main' : activePortfolio, date: new Date().toISOString(), type: TransactionType.ADJUSTMENT, amountUsdt: diff, amountPesos: 0, pricePerUsdt: stats.averageBuyPrice };
            setTransactions(p => [tx, ...p]);
          }} 
          portfolioLabel={PORTFOLIOS.find(p => p.id === activePortfolio)?.label || 'Principal'} 
        />
      )}
    </div>
  );
}

export default App;