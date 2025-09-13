/**
 * 統一的契約指標計算 Hook
 * 遵循 Linus 原則：消除特殊情況，單一數據源
 */

import { useMemo } from 'react';
import { 
  useBusinessMetrics, 
  useAssumptions, 
  useMnaDeal,
  useIncomeStatements,
  useBalanceSheets,
  useCashFlows,
  useDebtSchedule
} from './typed-hooks';

export interface CovenantMetrics {
  year: number;
  revenue: string;
  ebitda: string;
  fcff: string;
  dscr: string;
  dscrCompliant: boolean;
  netLeverage: string;
  leverageCompliant: boolean;
  interestCoverage: string;
  coverageCompliant: boolean;
  cashMonths: string;
  cashCompliant: boolean;
  outstandingDebt: string;
  cashBalance: string;
  allCompliant: boolean;
  // 分紅相關字段
  distributableCash?: string;
  distributableRatioToFCFF?: string;
  distributableRatioToEBITDA?: string;
}

export const useCovenantMetrics = (includeDividendCalculation = false) => {
  const businessMetrics = useBusinessMetrics();
  const mnaDealDesign = useMnaDeal();
  const futureAssumptions = useAssumptions();
  const incomeStatements = useIncomeStatements();
  const balanceSheets = useBalanceSheets();
  const cashFlows = useCashFlows();
  const debtSchedule = useDebtSchedule();

  const covenants = useMemo(() => {
    return mnaDealDesign.dividendPolicySettings?.covenants || {
      dscr: { value: 1.25, enabled: true },
      netLeverage: { value: 4.0, enabled: true },
      interestCoverage: { value: 3.0, enabled: true },
      minCashMonths: { value: 3, enabled: true },
    };
  }, [mnaDealDesign.dividendPolicySettings]);

  const calculateMetrics = useMemo((): CovenantMetrics[] => {
    if (!incomeStatements || incomeStatements.length === 0) {
      return [];
    }

    const years = Array.from({ length: mnaDealDesign.planningHorizon }, (_, i) => i + 1);
    
    return years.map(year => {
      // 從計算引擎獲取數據（單一數據源）
      const income = incomeStatements[year];
      const balance = balanceSheets[year];
      const cashFlow = cashFlows[year];
      
      if (!income || !balance || !cashFlow) {
        return {
          year,
          revenue: '0.0',
          ebitda: '0.0',
          fcff: '0.0',
          dscr: '0.00',
          dscrCompliant: false,
          netLeverage: '0.00',
          leverageCompliant: false,
          interestCoverage: '0.00',
          coverageCompliant: false,
          cashMonths: '0.0',
          cashCompliant: false,
          outstandingDebt: '0.0',
          cashBalance: '0.0',
          allCompliant: false,
        };
      }

      // 基礎財務數據（仟元轉百萬）
      const revenue = income.revenue / 1000;
      const ebitda = income.ebitda / 1000;
      const capex = Math.abs(cashFlow.capex || 0) / 1000;
      const fcff = ebitda - capex;
      
      // 債務服務計算
      const yearDebtSchedule = debtSchedule.filter(d => d.year === year);
      const totalInterest = yearDebtSchedule.reduce((sum, d) => sum + d.interestExpense, 0) / 1000;
      const totalPrincipal = yearDebtSchedule.reduce((sum, d) => sum + d.principalRepayment, 0) / 1000;
      const debtService = totalInterest + totalPrincipal;
      
      // 現金稅項（從損益表計算）
      const cashTaxes = (income.taxes || 0) / 1000;
      
      // 修正後的 DSCR 計算：扣除現金稅項
      const dscrNumerator = ebitda - cashTaxes;
      const dscr = debtService > 0 ? dscrNumerator / debtService : 999;
      
      // 債務餘額和現金餘額
      const outstandingDebt = (balance.debt || 0) / 1000;
      const cashBalance = (balance.cash || 0) / 1000;
      
      // 淨槓桿率（考慮現金）
      const netDebt = Math.max(0, outstandingDebt - cashBalance);
      const netLeverage = ebitda > 0 ? netDebt / ebitda : 0;
      
      // 利息覆蓋率
      const interestCoverage = totalInterest > 0 ? ebitda / totalInterest : 999;
      
      // 現金月數計算（修正：排除非現金費用）
      const depreciation = (income.depreciationAmortization || 0) / 1000;
      const cashOperatingExpenses = revenue - ebitda - depreciation; // 排除折舊
      const monthlyOperatingExpenses = cashOperatingExpenses / 12;
      const cashMonths = monthlyOperatingExpenses > 0 ? cashBalance / monthlyOperatingExpenses : 999;
      
      // 檢查合規性
      const dscrCompliant = !covenants.dscr.enabled || dscr >= covenants.dscr.value;
      const leverageCompliant = !covenants.netLeverage.enabled || netLeverage <= covenants.netLeverage.value;
      const coverageCompliant = !covenants.interestCoverage.enabled || interestCoverage >= covenants.interestCoverage.value;
      const cashCompliant = !covenants.minCashMonths.enabled || cashMonths >= covenants.minCashMonths.value;
      
      const allCompliant = dscrCompliant && leverageCompliant && coverageCompliant && cashCompliant;
      
      const result: CovenantMetrics = {
        year,
        revenue: revenue.toFixed(1),
        ebitda: ebitda.toFixed(1),
        fcff: fcff.toFixed(1),
        dscr: dscr > 100 ? '>100' : dscr.toFixed(2) + 'x',
        dscrCompliant,
        netLeverage: netLeverage.toFixed(2) + 'x',
        leverageCompliant,
        interestCoverage: interestCoverage > 100 ? '>100' : interestCoverage.toFixed(2) + 'x',
        coverageCompliant,
        cashMonths: cashMonths > 100 ? '>100' : cashMonths.toFixed(1),
        cashCompliant,
        outstandingDebt: outstandingDebt.toFixed(1),
        cashBalance: cashBalance.toFixed(1),
        allCompliant,
      };
      
      // 如果需要分紅計算，添加分紅相關字段
      if (includeDividendCalculation) {
        // 可分配現金計算（現金瀑布）
        const beginningCash = year === 1 ? (balanceSheets[0]?.cash || 0) / 1000 : (balanceSheets[year - 1]?.cash || 0) / 1000;
        const operatingCashFlow = (cashFlow.operatingCashFlow || 0) / 1000;
        const investingCashFlow = (cashFlow.investingCashFlow || 0) / 1000;
        const mandatoryDebtService = debtService;
        
        // 最低現金保留要求
        const minimumCashReserve = monthlyOperatingExpenses * covenants.minCashMonths.value;
        
        // 可分配現金 = 期末現金 - 最低現金保留
        const availableForDistribution = Math.max(0, cashBalance - minimumCashReserve);
        
        // 分配比例（從設定中獲取或預設50%）
        const payoutRatio = 0.5;
        const distributableCash = allCompliant ? availableForDistribution * payoutRatio : 0;
        
        result.distributableCash = distributableCash.toFixed(1) + 'M';
        result.distributableRatioToFCFF = fcff > 0 ? ((distributableCash / fcff) * 100).toFixed(1) + '%' : '0.0%';
        result.distributableRatioToEBITDA = ebitda > 0 ? ((distributableCash / ebitda) * 100).toFixed(1) + '%' : '0.0%';
      }
      
      return result;
    });
  }, [incomeStatements, balanceSheets, cashFlows, debtSchedule, mnaDealDesign.planningHorizon, covenants, includeDividendCalculation]);

  return {
    metricsData: calculateMetrics,
    covenants,
  };
};