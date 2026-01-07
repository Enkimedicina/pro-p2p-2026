import React, { useState, useEffect } from 'react';
import { Bot, Loader2, Sparkles, X, ChevronRight, Zap } from 'lucide-react';
import { Transaction } from '../types';
import { analyzePortfolio } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AiInsightProps {
  transactions: Transaction[];
  portfolioName: string;
}

export const AiInsight: React.FC<AiInsightProps> = ({ transactions, portfolioName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    setAnalysis(null);
  }, [portfolioName, transactions]);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    const result = await analyzePortfolio(transactions, portfolioName);
    setAnalysis(result);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 py-4 shadow-2xl shadow-indigo-900/40 flex items-center gap-3 transition-all hover:scale-105 hover:-translate-y-1 z-50 group"
      >
        <div className="bg-white/20 p-1.5 rounded-lg">
          <Sparkles size={18} />
        </div>
        <span className="font-black text-sm uppercase tracking-wider">Análisis AI</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-white/10 w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-10 border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-900/20">
              <Bot size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Nexus Intelligence</h2>
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                <Zap size={10} fill="currentColor" /> Análisis de Portafolio: {portfolioName}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white bg-white/5 p-3 rounded-full transition-all hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-10 overflow-y-auto flex-1 text-slate-300">
          {!analysis && !loading && (
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                 <Sparkles className="text-indigo-500 w-10 h-10" />
              </div>
              <h4 className="text-white text-xl font-bold mb-4">Potencia tus decisiones</h4>
              <p className="text-slate-500 text-sm leading-relaxed mb-10 font-medium">
                Nuestro motor de IA analizará tu historial en <strong>{portfolioName}</strong> para detectar patrones de rentabilidad y sugerir optimizaciones fiscales y operativas.
              </p>
              <button
                onClick={handleAnalyze}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg shadow-indigo-900/20"
              >
                GENERAR REPORTE ESTRATÉGICO
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-8" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot size={24} className="text-indigo-300" />
                </div>
              </div>
              <p className="text-white font-black text-lg tracking-tight animate-pulse">PROCESANDO DATOS NEXUS...</p>
              <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest">Consultando Gemini 3 Flash Pro</p>
            </div>
          )}

          {analysis && (
            <div className="prose prose-invert prose-indigo max-w-none">
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 mb-8">
                  <ReactMarkdown className="text-slate-300 leading-relaxed space-y-4">
                    {analysis}
                  </ReactMarkdown>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <ChevronRight size={14} className="text-indigo-500" /> 
                  Este informe es generado automáticamente basado en tus transacciones MXN/USDT.
                </div>
            </div>
          )}
        </div>
        
        {analysis && (
           <div className="p-8 border-t border-white/5 bg-gray-950/50 flex justify-between items-center">
             <span className="text-xs text-slate-500 font-medium italic">Nexus Intelligence v1.0 • Motor Gemini</span>
             <button
                onClick={handleAnalyze}
                className="bg-white/5 hover:bg-white/10 text-indigo-400 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Regenerar Informe
              </button>
           </div>
        )}
      </div>
    </div>
  );
};