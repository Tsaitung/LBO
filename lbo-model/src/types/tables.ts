/**
 * Table Data Types
 * Type definitions for financial tables
 * Following Linus principle: Data structures over algorithms
 */

// Sources and Uses table
export interface SourcesUsesItem {
  category: 'sources' | 'uses';
  item: string;
  amount: number;
  percentage: number;
  description?: string;
}

// Dividend distribution row
export interface DividendRow {
  year: number;
  fcf: number;
  dividendAmount: number;
  commonDividend: number;
  preferredDividend: number;
  totalDistribution: number;
  payoutRatio: number;
}

// Debt schedule row
export interface DebtScheduleRow {
  year: number;
  facilityName: string;
  beginningBalance: number;
  interestExpense: number;
  principalRepayment: number;
  endingBalance: number;
  debtType: 'senior' | 'mezz' | 'revolver';
}

// Financial statement row base
export interface FinancialStatementRow {
  year: number;
  [key: string]: number | string;
}

// Income statement specific
export interface IncomeStatementRow extends FinancialStatementRow {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interestExpense: number;
  taxExpense: number;
  netIncome: number;
}

// Balance sheet specific
export interface BalanceSheetRow extends FinancialStatementRow {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  totalCurrentAssets: number;
  fixedAssets: number;
  goodwill: number;
  totalAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  totalLiabilities: number;
  equity: number;
  totalLiabilitiesEquity: number;
}

// Cash flow specific
export interface CashFlowRow extends FinancialStatementRow {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

// Covenant monitoring row
export interface CovenantRow {
  year: number;
  metric: string;
  value: number;
  threshold: number;
  isCompliant: boolean;
  margin: number;
}