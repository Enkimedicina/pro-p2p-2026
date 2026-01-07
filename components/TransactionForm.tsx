import React, { useState, useEffect } from 'react';
import { PlusCircle, Calculator, TrendingUp, TrendingDown, Info, AlertCircle, Clock, ArrowRightLeft, Wallet, Banknote } from 'lucide-react';
import { TransactionType } from '../types';

interface TransactionFormProps {
  onAddTransaction: (
    type: TransactionType,
    amountPesos: number,
    pricePerUsdt: number,
    date: string
  ) => void;
  currentUsdtBalance: number;
  averageBuyPrice: number;
  portfolioLabel: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAddTransaction, 
  currentUsdtBalance, 
  averageBuyPrice,
  portfolioLabel
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [inputMode, setInputMode] = useState<'MXN' | 'USDT'>(type === TransactionType.BUY ? 'MXN' : 'USDT');
  const [amountPesos, setAmountPesos] = useState<string>('');
  const [amountUsdt, setAmountUsdt] = useState<string>('');
  const [pricePerUsdt, setPricePerUsdt] = useState<string>('');
  
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  });
  
  const [error, setError] = useState<string | null>(null);
  const [projectedPnL, setProjectedPnL] = useState<{ pnl: number, percent: number, totalRevenue: number } | null>(null);
  const [newAverageImpact, setNewAverageImpact] = useState<{ price: number, diff: number } | null>(null);

  // Synchronize inputs based on mode with strict checks to avoid circular updates
  useEffect(() => {
    const price = parseFloat(pricePerUsdt);
    if (isNaN(price) || price <= 0) {
      setError(null);
      return;
    }

    if (inputMode === 'MXN') {
      const pesos = parseFloat(amountPesos);
      if (!isNaN(pesos)) {
        const calculated = (pesos / price).toFixed(4);
        if (calculated !== amountUsdt) setAmountUsdt(calculated);
      } else {
        setAmountUsdt('');
      }
    } else {
      const usdt = parseFloat(amountUsdt);
      if (!isNaN(usdt)) {
        const calculated = (usdt * price).toFixed(2);
        if (calculated !== amountPesos) setAmountPesos(calculated);
      } else {
        setAmountPesos('');
      }
    }
  }, [amountPesos, amountUsdt, pricePerUsdt, inputMode]);

  // Logic for PnL and Averages
  useEffect(() => {
    const usdtVal = parseFloat(amountUsdt);
    const pesosVal = parseFloat(amountPesos);
    const priceVal = parseFloat(pricePerUsdt);

    setError(null);

    if (isNaN(usdtVal) || isNaN(pesosVal) || isNaN(priceVal) || priceVal <= 0) {
      setProjectedPnL(null);
      setNewAverageImpact(null);
      return;
    }

    if (type === TransactionType.SELL) {
      if (usdtVal > currentUsdtBalance + 0.0001) {
        setError(`Saldo insuficiente en "${portfolioLabel}". Solo tienes ${currentUsdtBalance.toFixed(2)} USDT.`);
      }
      const costBasis = usdtVal * averageBuyPrice;
      const pnl = pesosVal - costBasis;
      const percent = averageBuyPrice > 0 ? ((priceVal / averageBuyPrice) - 1) * 100 : 0;
      setProjectedPnL({ pnl, percent, totalRevenue: pesosVal });
    } else {
      const totalUsdtAfter = currentUsdtBalance + usdtVal;
      const totalPesosBasisAfter = (currentUsdtBalance * averageBuyPrice) + pesosVal;
      const newAvg = totalUsdtAfter > 0 ? totalPesosBasisAfter / totalUsdtAfter : priceVal;
      setNewAverageImpact({
        price: newAvg,
        diff: newAvg - averageBuyPrice
      });
    }
  }, [amountUsdt, amountPesos, pricePerUsdt, type, averageBuyPrice, currentUsdtBalance, portfolioLabel]);

  const handleMax = () => {
    setInputMode('USDT');
    setAmountUsdt(currentUsdtBalance.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPesos = parseFloat(amountPesos);
    const finalPrice = parseFloat(pricePerUsdt);
    if (isNaN(finalPesos) || isNaN(finalPrice) || error) return;

    onAddTransaction(type, finalPesos, finalPrice, date);
    setAmountPesos('');
    setAmountUsdt('');
    setPricePerUsdt('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="w-full">
      <header className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-blue-500" />
          Registrar Operación
        </h2>
        <div className="text-[10px] bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700 font-bold uppercase tracking-widest">
          {portfolioLabel}
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-800/50 text-red-400 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle Buy/Sell */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950 border border-gray-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setType(TransactionType.BUY); setInputMode('MXN'); }}
            className={`py-3 text-sm font-bold rounded-lg transition-all ${type === TransactionType.BUY ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            COMPRA (MXN → USDT)
          </button>
          <button
            type="button"
            onClick={() => { setType(TransactionType.SELL); setInputMode('USDT'); }}
            className={`py-3 text-sm font-bold rounded-lg transition-all ${type === TransactionType.SELL ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            VENTA (USDT → MXN)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Principal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                {inputMode === 'MXN' ? 'Inversión en Pesos' : 'Cantidad de USDT'}
                <button 
                  type="button" 
                  onClick={() => setInputMode(inputMode === 'MXN' ? 'USDT' : 'MXN')}
                  className="text-blue-500 hover:text-blue-400 p-1 rounded-md bg-blue-500/10"
                  title="Cambiar modo de entrada"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </label>
              {type === TransactionType.SELL && (
                <button 
                  type="button" 
                  onClick={handleMax}
                  className="text-[10px] font-bold text-gray-400 hover:text-white bg-gray-800 px-2 py-0.5 rounded transition-colors"
                >
                  MÁX: {currentUsdtBalance.toFixed(2)}
                </button>
              )}
            </div>
            
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={inputMode === 'MXN' ? amountPesos : amountUsdt}
                onChange={(e) => inputMode === 'MXN' ? setAmountPesos(e.target.value) : setAmountUsdt(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-950 border border-gray-700 text-white text-2xl font-mono rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">{inputMode}</div>
            </div>

            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase font-bold">Equivalente</span>
              <span className="text-sm font-mono text-gray-300">
                {inputMode === 'MXN' ? `${amountUsdt || '0.00'} USDT` : formatCurrency(parseFloat(amountPesos) || 0)}
              </span>
            </div>
          </div>

          {/* Precio y Fecha */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Precio por USDT (MXN)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={pricePerUsdt}
                  onChange={(e) => setPricePerUsdt(e.target.value)}
                  placeholder="19.50"
                  className="w-full bg-gray-950 border border-gray-700 text-white text-xl font-mono rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">MXN</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Fecha y Hora
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dash de Info Dinámica */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {type === TransactionType.BUY && newAverageImpact && averageBuyPrice > 0 && (
            <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg"><Wallet className="w-5 h-5 text-blue-400" /></div>
                <div>
                  <p className="text-[10px] text-blue-400 uppercase font-bold">Nuevo Precio Promedio</p>
                  <p className="text-lg font-mono font-bold text-white">{formatCurrency(newAverageImpact.price)}</p>
                </div>
              </div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full ${newAverageImpact.diff <= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {newAverageImpact.diff <= 0 ? '▼ Baja' : '▲ Sube'} {formatCurrency(Math.abs(newAverageImpact.diff))}
              </div>
            </div>
          )}

          {type === TransactionType.SELL && projectedPnL && (
            <div className={`border rounded-xl p-5 ${projectedPnL.pnl >= 0 ? 'bg-green-950/30 border-green-800/40' : 'bg-red-950/30 border-red-800/40'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${projectedPnL.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Resultado de la Operación
                  </h4>
                  <p className="text-3xl font-mono font-bold text-white mt-1">
                    {projectedPnL.pnl >= 0 ? '+' : ''}{formatCurrency(projectedPnL.pnl)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg inline-flex items-center gap-1 ${projectedPnL.pnl >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {projectedPnL.pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {projectedPnL.percent.toFixed(2)}%
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1 text-white/80 font-mono text-sm">
                    <Banknote className="w-4 h-4" />
                    Total: {formatCurrency(projectedPnL.totalRevenue)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-800/50">
                 <div className="text-xs">
                    <span className="text-gray-500 block mb-1 uppercase font-bold">Costo Promedio (WAC)</span>
                    <span className="text-gray-300 font-mono">{formatCurrency(averageBuyPrice)}</span>
                 </div>
                 <div className="text-xs text-right">
                    <span className="text-gray-500 block mb-1 uppercase font-bold">Precio de Salida</span>
                    <span className="text-gray-300 font-mono">{formatCurrency(parseFloat(pricePerUsdt) || 0)}</span>
                 </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!!error || !amountPesos || !pricePerUsdt}
          className={`w-full py-5 rounded-2xl text-white font-black text-lg shadow-2xl transition-all active:scale-95 ${
            !!error || !amountPesos || !pricePerUsdt ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 
            type === TransactionType.BUY ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-500 shadow-green-900/20'
          }`}
        >
          {type === TransactionType.BUY ? 'CONFIRMAR COMPRA' : 'CONFIRMAR VENTA'}
        </button>
      </form>
    </div>
  );
};