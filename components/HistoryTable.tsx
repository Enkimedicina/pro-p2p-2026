import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, ChevronUp, ChevronDown, ArrowUpDown, Calendar, Clock } from 'lucide-react';

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);
  };

  const formatUnitPrice = (val: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 4 
    }).format(val);
  };

  const formatUsdt = (val: number) => {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const getBadgeStyle = (type: TransactionType) => {
    switch(type) {
      case TransactionType.BUY:
        return 'bg-blue-900/50 text-blue-400 border border-blue-800';
      case TransactionType.SELL:
        return 'bg-green-900/50 text-green-400 border border-green-800';
      case TransactionType.ADJUSTMENT:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
      default:
        return 'bg-gray-900 text-gray-500';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-blue-400" /> : <ChevronDown className="w-3 h-3 ml-1 text-blue-400" />;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <span className="text-xs text-gray-500 font-mono">{transactions.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-wider select-none">
              <th className="p-4 border-b border-gray-800">Tipo</th>
              {showPortfolioColumn && <th className="p-4 border-b border-gray-800">Portafolio</th>}
              <th className="p-4 border-b border-gray-800 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                <div className="flex items-center">Fecha / Hora <SortIcon field="date" /></div>
              </th>
              <th className="p-4 border-b border-gray-800 text-right cursor-pointer hover:text-white" onClick={() => handleSort('amountUsdt')}>
                <div className="flex items-center justify-end">Cant. USDT <SortIcon field="amountUsdt" /></div>
              </th>
              <th className="p-4 border-b border-gray-800 text-right">Precio/USDT</th>
              <th className="p-4 border-b border-gray-800 text-right cursor-pointer hover:text-white" onClick={() => handleSort('amountPesos')}>
                <div className="flex items-center justify-end">Total MXN <SortIcon field="amountPesos" /></div>
              </th>
              <th className="p-4 border-b border-gray-800 text-right cursor-pointer hover:text-white" onClick={() => handleSort('realizedPnl')}>
                <div className="flex items-center justify-end">PnL Realizado <SortIcon field="realizedPnl" /></div>
              </th>
              <th className="p-4 border-b border-gray-800 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={showPortfolioColumn ? 8 : 7} className="p-12 text-center text-gray-500 italic">
                  No hay operaciones registradas.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-800/20 transition-colors text-sm group">
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getBadgeStyle(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  {showPortfolioColumn && (
                    <td className="p-4">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                        {tx.portfolioId === 'trading' ? 'Trading' : 'Inversión'}
                      </span>
                    </td>
                  )}
                  <td className="p-4 font-mono text-xs whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-gray-300 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 opacity-50" /> {formatDate(tx.date)}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 opacity-50" /> {formatTime(tx.date)}
                      </span>
                    </div>
                  </td>
                  <td className={`p-4 text-right font-mono ${tx.type === TransactionType.ADJUSTMENT ? 'text-gray-500' : 'text-gray-300'}`}>
                    {formatUsdt(tx.amountUsdt)}
                  </td>
                  <td className="p-4 text-right text-gray-400 font-mono">
                    {tx.type === TransactionType.ADJUSTMENT ? '---' : formatUnitPrice(tx.pricePerUsdt)}
                  </td>
                  <td className="p-4 text-right font-medium text-white font-mono">
                    {tx.type === TransactionType.ADJUSTMENT ? '---' : formatCurrency(tx.amountPesos)}
                  </td>
                  <td className="p-4 text-right">
                    {tx.type === TransactionType.SELL && tx.realizedPnl !== undefined ? (
                      <div className="flex flex-col items-end">
                        <span className={tx.realizedPnl >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                          {tx.realizedPnl >= 0 ? '+' : ''}{formatCurrency(tx.realizedPnl)}
                        </span>
                        <span className={`text-[10px] ${tx.realizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.pnlPercentage?.toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-600 italic text-xs">---</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(tx.id);
                      }}
                      className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all active:scale-90"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
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