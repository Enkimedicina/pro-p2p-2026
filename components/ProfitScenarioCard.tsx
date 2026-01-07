import React, { useState } from 'react';
import { Target } from 'lucide-react';

interface ProfitScenarioCardProps {
  currentBalance: number;
  averagePrice: number;
}

export const ProfitScenarioCard: React.FC<ProfitScenarioCardProps> = ({ currentBalance, averagePrice }) => {
  const [customPrice, setCustomPrice] = useState<string>('');
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);
  };

  const calculatePnL = (sellPrice: number) => {
    const costBasis = currentBalance * averagePrice;
    const revenue = currentBalance * sellPrice;
    const pnl = revenue - costBasis;
    const percent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { pnl, percent };
  };

  if (currentBalance <= 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center opacity-50">
        <Target className="w-8 h-8 text-gray-700 mb-2" />
        <p className="text-gray-500 text-sm">Sin inventario para proyectar escenarios de salida.</p>
      </div>
    );
  }

  const scenarios = [
    { label: 'Equilibrio (0%)', price: averagePrice },
    { label: 'Target +2%', price: averagePrice * 1.02 },
    { label: 'Target +5%', price: averagePrice * 1.05 },
    { label: 'Target +10%', price: averagePrice * 1.10 },
  ];

  const customResult = customPrice ? calculatePnL(parseFloat(customPrice)) : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-green-900/30 p-1.5 rounded-lg">
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Escenarios de Salida</h3>
        </div>
        <div className="text-[10px] text-gray-500 font-mono bg-gray-950 px-2 py-1 rounded border border-gray-800">
          WAC: {formatCurrency(averagePrice)}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {scenarios.map((s, idx) => {
          const { pnl, percent } = calculatePnL(s.price);
          return (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-950/50 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{s.label}</p>
                <p className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors">
                  {formatCurrency(s.price)} <span className="text-[10px]">/ USDT</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                </p>
                <p className={`text-[10px] font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pnl >= 0 ? '▲' : '▼'} {percent.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">Calculadora Rápida de Precio</label>
        <div className="relative mb-3">
          <input 
            type="number" 
            placeholder="Introduce precio objetivo..." 
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-xs">MXN</div>
        </div>

        {customResult && !isNaN(parseFloat(customPrice)) && (
          <div className={`p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${customResult.pnl >= 0 ? 'bg-green-950/20 border-green-800/50' : 'bg-red-950/20 border-red-800/50'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Ganancia Estimada</span>
              <span className={`text-lg font-bold ${customResult.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {customResult.pnl >= 0 ? '+' : ''}{formatCurrency(customResult.pnl)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
               <span className="text-[10px] text-gray-500">Rentabilidad</span>
               <span className={`text-xs font-bold ${customResult.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                 {customResult.percent.toFixed(2)}%
               </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};