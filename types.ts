export enum TransactionType {
  BUY = 'COMPRA',
  SELL = 'VENTA',
  ADJUSTMENT = 'AJUSTE'
}

export interface Transaction {
  id: string;
  portfolioId?: string; // 'main' or 'trading'
  date: string;
  type: TransactionType;
  amountPesos: number;     // Total Pesos involved
  pricePerUsdt: number;    // Exchange rate
  amountUsdt: number;      // Calculated USDT
  
  // Specific for Sales
  realizedPnl?: number;    // Profit/Loss in Pesos
  pnlPercentage?: number;  // Profit/Loss %
  note?: string;           // Optional note for adjustments
}

export interface PortfolioStats {
  totalInvestedPesos: number; // Current active investment (cost basis)
  currentUsdtBalance: number;
  averageBuyPrice: number;
  totalRealizedPnl: number;
  unrealizedPnl: number;      // Profit/Loss of current holdings vs average price
  estimatedValue: number;     // Total value at last buy price or ref
}