import React, { useState, useEffect } from 'react';
import { X, RefreshCcw, AlertCircle, ArrowRight } from 'lucide-react';

interface AdjustmentModalProps {
  onClose: () => void;
  currentBalance: number;
  averagePrice: number;
  onConfirm: (newBalance: number) => void;
  portfolioLabel: string;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ 
  onClose, 
  currentBalance, 
  averagePrice, 
  onConfirm,
  portfolioLabel
}) => {
  // Use string state for the input to handle typing decimals properly
  const [newBalanceStr, setNewBalanceStr] = useState<string>(currentBalance.toFixed(2));
  
  // Sync state if currentBalance prop changes
  useEffect(() => {
    setNewBalanceStr(currentBalance.toFixed(2));
  }, [currentBalance]);

  const parsedNewBalance = parseFloat(newBalanceStr);
  const isValid = !isNaN(parsedNewBalance) && parsedNewBalance >= 0;
  const difference = isValid ? parsedNewBalance - currentBalance : 0;

  const handleSave = () => {
    if (!isValid) return;
    onConfirm(parsedNewBalance);
    onClose();
  };

  const formatUsdt = (val: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/30 p-2 rounded-lg">
              <RefreshCcw className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold leading-tight">Ajustar Balance</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{portfolioLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informational Note */}
          <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded-xl flex gap-3 items-start">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Introduce el balance total que tienes actualmente en tu Exchange. Se creará una transacción de ajuste por la diferencia.
            </p>
          </div>

          {/* Current vs New Visualization */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Balance en App</label>
              <div className="text-xl font-mono text-gray-400">{formatUsdt(currentBalance)} <span className="text-xs">USDT</span></div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 ml-1">Nuevo Balance Real</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={newBalanceStr}
                  onChange={(e) => setNewBalanceStr(e.target.value)}
                  className={`w-full bg-gray-950 border ${!isValid ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl px-4 py-4 text-2xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all`}
                  placeholder="0.00"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">USDT</div>
              </div>
            </div>
          </div>

          {/* Diff Indicator */}
          {isValid && Math.abs(difference) > 0.0001 && (
            <div className="flex items-center justify-center gap-3 py-2 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-gray-500 text-sm font-mono">{formatUsdt(currentBalance)}</span>
              <ArrowRight className="w-4 h-4 text-gray-700" />
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${difference > 0 ? 'bg-green-900/20 text-green-400 border border-green-800/30' : 'bg-red-900/20 text-red-400 border border-red-800/30'}`}>
                {difference > 0 ? '+' : ''}{formatUsdt(difference)} USDT
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-950 border-t border-gray-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!isValid || (Math.abs(difference) < 0.0001)}
            className={`flex-1 px-4 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
              !isValid || (Math.abs(difference) < 0.0001)
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'
            }`}
          >
            APLICAR AJUSTE
          </button>
        </div>
      </div>
    </div>
  );
};