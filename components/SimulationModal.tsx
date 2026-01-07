import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface SimulationModalProps {
  onClose: () => void;
  currentUsdtBalance: number;
  averageBuyPrice: number;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({ onClose, currentUsdtBalance, averageBuyPrice }) => {
  const [sellPrice, setSellPrice] = useState<string>('');
  const [amountToSell, setAmountToSell] = useState<string>(currentUsdtBalance.toString());
  
  const [result, setResult] = useState<{ pnl: number, percent: number, totalRec: number } | null>(null);

  useEffect(() => {
    const price = parseFloat(sellPrice);
    const amount = parseFloat(amountToSell);

    if (!isNaN(price) && !isNaN(amount) && amount > 0) {
      const costBasis = amount * averageBuyPrice;
      const estimatedRevenue = amount * price;
      const pnl = estimatedRevenue - costBasis;
      const percent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      setResult({
        pnl,
        percent,
        totalRec: estimatedRevenue
      });
    } else {
      setResult(null);
    }
  }, [sellPrice, amountToSell, averageBuyPrice]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-purple-900/50 p-2 rounded-lg">
              <Calculator className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Simulador de Venta</h2>
              <p className="text-xs text-gray-400">Calcula tu ganancia antes de vender</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-900/50 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cantidad a Vender (USDT)</label>
                <input
                  type="number"
                  value={amountToSell}
                  onChange={(e) => setAmountToSell(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  Máx: {currentUsdtBalance.toFixed(2)}
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Precio de Venta (MXN)</label>
                <input
                  type="number"
                  placeholder="Ej: 18.50"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
             </div>
          </div>

          {/* Current Stats Reference */}
          <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex justify-between text-sm">
             <span className="text-gray-400">Tu precio promedio de compra:</span>
             <span className="text-white font-mono">{formatCurrency(averageBuyPrice)}</span>
          </div>

          {/* Result Card */}
          {result ? (
            <div className={`p-6 rounded-xl border ${result.pnl >= 0 ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'} transition-all`}>
              <div className="flex items-center gap-3 mb-2">
                 {result.pnl >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                 ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                 )}
                 <h3 className={`text-lg font-bold ${result.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.pnl >= 0 ? '¡Tendrías Ganancia!' : 'Tendrías Pérdida'}
                 </h3>
              </div>
              
              <div className="flex flex-col gap-1">
                 <div className="text-3xl font-bold text-white tracking-tight">
                    {result.pnl >= 0 ? '+' : ''}{formatCurrency(result.pnl)}
                 </div>
                 <div className={`text-sm font-medium ${result.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result.pnl >= 0 ? '+' : ''}{result.percent.toFixed(2)}% Rentabilidad
                 </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                 <span className="text-gray-400 text-sm">Total a recibir en pesos:</span>
                 <span className="text-white font-mono font-medium">{formatCurrency(result.totalRec)}</span>
              </div>
            </div>
          ) : (
             <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-gray-500">Ingresa un precio de venta para ver la proyección.</p>
             </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-800 bg-gray-950">
           <button 
             onClick={onClose}
             className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
           >
             Cerrar Simulador
           </button>
        </div>
      </div>
    </div>
  );
};