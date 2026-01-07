import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, ChevronUp, ChevronDown, ArrowUpDown, Calendar, Clock, ArrowRight } from 'lucide-react';

interface HistoryTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  title?: string;
  showPortfolioColumn?: boolean;
}

type SortField = 'date' | 'amountUsdt' | 'amountPesos' | 'realizedPnl';
type SortOrder = 'asc' | 'desc';

export const HistoryTable: React.FC<HistoryTableProps> = ({ 
  transactions, 
  onDelete, 
  title = "Historial de Operaciones",
  showPortfolioColumn = false
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let valA: any = a[sortField] || 0;
      let valB: any = b[sortField] || 0;

      if (sortField === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortOrder]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN', 
      minimumFractionDigits: 2 
    }).format(val);
  };

  const formatUsdt = (val: number) => {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    }).format(val);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-2 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-2 text-indigo-500" /> : <ChevronDown className="w-3 h-3 ml-2 text-indigo-500" />;
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-white/5">
            {transactions.length} Entradas
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] border-b border-white/5 bg-slate-950/30">
              <th className="px-8 py-5">Estado</th>
              {showPortfolioColumn && <th className="px-8 py-5">Origen</th>}
              <th className="px-8 py-5 cursor-pointer group" onClick={() => handleSort('date')}>
                <div className="flex items-center group-hover:text-white transition-colors">Fecha <SortIcon field="date" /></div>
              </th>
              <th className="px-8 py-5 text-right cursor-pointer group" onClick={() => handleSort('amountUsdt')}>
                <div className="flex items-center justify-end group-hover:text-white transition-colors">USDT <SortIcon field="amountUsdt" /></div>
              </th>
              <th className="px-8 py-5 text-right cursor-pointer group" onClick={() => handleSort('amountPesos')}>
                <div className="flex items-center justify-end group-hover:text-white transition-colors">Total MXN <SortIcon field="amountPesos" /></div>
              </th>
              <th className="px-8 py-5 text-right cursor-pointer group" onClick={() => handleSort('realizedPnl')}>
                <div className="flex items-center justify-end group-hover:text-white transition-colors">PnL <SortIcon field="realizedPnl" /></div>
              </th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={showPortfolioColumn ? 8 : 7} className="px-8 py-20 text-center text-slate-500 font-medium italic">
                  El libro de operaciones está vacío. Comienza registrando una nueva compra.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors border-l-4 border-l-transparent hover:border-l-indigo-500">
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      tx.type === TransactionType.BUY ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50' : 
                      tx.type === TransactionType.SELL ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 
                      'bg-slate-800/40 text-slate-400 border-slate-700/50'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  {showPortfolioColumn && (
                    <td className="px-8 py-5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        {tx.portfolioId === 'trading' ? 'Trading' : 'Inversión'}
                      </span>
                    </td>
                  )}
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-semibold">{new Date(tx.date).toLocaleDateString()}</span>
                      <span className="text-slate-500 text-[10px] font-bold">{new Date(tx.date).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-sm text-slate-300">
                    {formatUsdt(tx.amountUsdt)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-white text-sm font-bold font-mono">{tx.amountPesos > 0 ? formatCurrency(tx.amountPesos) : '—'}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{tx.pricePerUsdt.toFixed(2)} MXN/USDT</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {tx.type === TransactionType.SELL && tx.realizedPnl !== undefined ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black font-mono ${tx.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.realizedPnl >= 0 ? '+' : ''}{formatCurrency(tx.realizedPnl)}
                        </span>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${tx.realizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {tx.pnlPercentage?.toFixed(2)}% <ArrowRight size={10} className={tx.realizedPnl >= 0 ? '-rotate-45' : 'rotate-45'} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => onDelete(tx.id)}
                      className="text-slate-600 hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};