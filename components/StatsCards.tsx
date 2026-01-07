import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Edit2, Activity, BarChart3 } from 'lucide-react';
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

  const Card = ({ title, value, subtext, icon: Icon, colorClass, highlight, action }: any) => (
    <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem] shadow-sm hover:border-white/10 transition-all group flex flex-col justify-between h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">{title}</h3>
        <div className={`p-2.5 rounded-xl bg-white/5 ${colorClass} group-hover:scale-110 transition-transform`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tighter mb-2 flex items-baseline gap-2">
          {value}
          {highlight && <span className="text-xs font-bold text-slate-500">{highlight}</span>}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400 font-medium">{subtext}</p>
          {action}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 transition-all duration-700 w-0 group-hover:w-full opacity-30 ${colorClass.replace('text', 'bg')}`}></div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card 
        title="Balance Actual"
        value={formatUsdt(stats.currentUsdtBalance)}
        highlight="USDT"
        subtext={`Promedio: ${formatCurrency(stats.averageBuyPrice)}`}
        icon={Wallet}
        colorClass="text-indigo-400"
        action={
          <button onClick={onEditBalance} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors">
            <Edit2 size={14} />
          </button>
        }
      />

      <Card 
        title="Ganancia Flotante"
        value={`${isFloatingProfitable ? '+' : ''}${formatCurrency(stats.unrealizedPnl)}`}
        subtext="Valor vs. Precio Promedio"
        icon={Activity}
        colorClass={isFloatingProfitable ? 'text-emerald-400' : 'text-rose-400'}
      />

      <Card 
        title="Ganancia Realizada"
        value={`${isProfitable ? '+' : ''}${formatCurrency(stats.totalRealizedPnl)}`}
        subtext="Operaciones cerradas"
        icon={isProfitable ? TrendingUp : TrendingDown}
        colorClass={isProfitable ? 'text-emerald-400' : 'text-rose-400'}
      />
      
      <Card 
        title="Valor Estimado"
        value={formatCurrency(stats.estimatedValue)}
        highlight="MXN"
        subtext="Liquidación inmediata"
        icon={BarChart3}
        colorClass="text-indigo-400"
      />
    </div>
  );
};