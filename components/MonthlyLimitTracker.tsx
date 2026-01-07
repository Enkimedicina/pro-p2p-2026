
import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface MonthlyLimitTrackerProps {
  spentThisMonth: number;
  transactions: Transaction[];
}

// Fixed typo: Changed MonthlyLimitTrackerTrackerProps to MonthlyLimitTrackerProps
export const MonthlyLimitTracker: React.FC<MonthlyLimitTrackerProps> = ({ spentThisMonth, transactions }) => {
  const MONTHLY_LIMIT = 291853.13;
  const remaining = Math.max(0, MONTHLY_LIMIT - spentThisMonth);
  const percentage = Math.min(100, (spentThisMonth / MONTHLY_LIMIT) * 100);
  
  // Filter and sort transactions of the current month
  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === TransactionType.BUY)
      .filter(t => {
        const d = new Date(t.date);
        return d.getUTCMonth() === now.getUTCMonth() && d.getUTCFullYear() === now.getUTCFullYear();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  const maxTxAmount = useMemo(() => {
    if (monthTransactions.length === 0) return 0;
    return Math.max(...monthTransactions.map(t => t.amountPesos));
  }, [monthTransactions]);

  // SVG Gauge constants
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusColor = () => {
    if (percentage > 90) return '#ef4444'; // red-500
    if (percentage > 70) return '#f59e0b'; // amber-500
    return '#3b82f6'; // blue-500
  };

  const getStatusBg = () => {
    if (percentage > 90) return 'text-red-400';
    if (percentage > 70) return 'text-amber-400';
    return 'text-blue-400';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className={`p-1.5 rounded-lg bg-gray-950 border border-gray-800 ${getStatusBg()}`}>
          <ShieldCheck className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Cupo Mensual P2P</h3>
      </div>

      <div className="flex items-center justify-around gap-6 mb-6">
        {/* Circular Chart */}
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-gray-800"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getStatusColor()}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-out' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-mono font-bold text-white">{percentage.toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Gastado (MXN)</p>
            <p className="text-lg font-mono font-bold text-white leading-none">
              {formatCurrency(spentThisMonth)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Disponible</p>
            <p className={`text-sm font-mono font-bold leading-none ${remaining < 25000 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-1.5 text-gray-500">
             <BarChart3 className="w-3 h-3" />
             <span className="text-[9px] font-bold uppercase tracking-wider">Historial de Compras (Mes)</span>
           </div>
           <span className="text-[9px] text-gray-600 font-mono">{monthTransactions.length} txs</span>
        </div>
        
        <div className="bg-gray-950/50 rounded-xl p-3 border border-gray-800/50">
          <div className="h-12 flex items-end gap-1 overflow-hidden">
            {monthTransactions.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 italic">Sin actividad este mes</div>
            ) : (
              monthTransactions.map((tx, idx) => {
                const barHeight = maxTxAmount > 0 ? (tx.amountPesos / maxTxAmount) * 100 : 0;
                return (
                  <div 
                    key={tx.id} 
                    className="flex-1 min-w-[4px] bg-blue-500/20 hover:bg-blue-500/50 rounded-t-sm transition-all group relative cursor-pointer"
                    style={{ height: `${Math.max(10, barHeight)}%` }}
                  >
                    {/* Tooltip simple */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 border border-gray-700 text-[9px] text-white px-2 py-1 rounded shadow-xl whitespace-nowrap z-10">
                      {formatCurrency(tx.amountPesos)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 px-1">
           <div className="flex items-center gap-2">
              <TrendingDown className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-400">Límite: {formatCurrency(MONTHLY_LIMIT)}</span>
           </div>
           {percentage > 85 && (
              <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" />
           )}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};
