import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Edit2, Activity } from 'lucide-react';
import { PortfolioStats } from '../types';

interface StatsCardsProps {
  stats: PortfolioStats;
  onEditBalance: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(val);
};

const formatUsdt = (val: number) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, onEditBalance }) => {
  const isProfitable = stats.totalRealizedPnl >= 0;
  const isFloatingProfitable = stats.unrealizedPnl >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Current Balance USDT */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Balance Actual</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={onEditBalance}
              className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
              title="Ajustar balance manualmente"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <Wallet className="text-blue-500 w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{formatUsdt(stats.currentUsdtBalance)} <span className="text-sm text-gray-500">USDT</span></div>
        <div className="text-xs text-gray-500 mt-2">
          Precio Promedio: <span className="text-blue-400 font-mono">{formatCurrency(stats.averageBuyPrice)}</span>
        </div>
      </div>

      {/* Floating Profit/Loss (Gain from Price Differences) */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Ganancia Flotante</h3>
          <Activity className={`${isFloatingProfitable ? 'text-green-500' : 'text-red-500'} w-5 h-5`} />
        </div>
        <div className={`text-2xl font-bold ${isFloatingProfitable ? 'text-green-400' : 'text-red-400'}`}>
          {isFloatingProfitable ? '+' : ''}{formatCurrency(stats.unrealizedPnl)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
           Diferencia vs. Precio Promedio
        </div>
        <div className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${isFloatingProfitable ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '100%' }}></div>
      </div>

      {/* Realized PnL (Sales) */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Ganancia Realizada</h3>
          {isProfitable ? (
            <TrendingUp className="text-green-500 w-5 h-5" />
          ) : (
            <TrendingDown className="text-red-500 w-5 h-5" />
          )}
        </div>
        <div className={`text-2xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
          {isProfitable ? '+' : ''}{formatCurrency(stats.totalRealizedPnl)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Ganancia neta en ventas cerradas
        </div>
      </div>
      
       {/* Estimate Total Value */}
       <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">Valor Estimado Hoy</h3>
          <div className="text-blue-500 font-bold text-[10px] bg-blue-900/30 px-2 py-1 rounded">MXN</div>
        </div>
        <div className="text-2xl font-bold text-gray-200">
             {formatCurrency(stats.estimatedValue)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Si vendieras todo ahora
        </div>
      </div>
    </div>
  );
};