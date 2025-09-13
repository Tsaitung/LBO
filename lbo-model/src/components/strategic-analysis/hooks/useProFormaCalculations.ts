/**
 * ProForma 計算 Hook
 * Linus 原則：專注單一職責 - 數據轉換
 * 從 Redux 狀態提取並格式化 ProForma 數據
 */

import { useMemo } from 'react';
import {
  useBusinessMetrics,
  useAssumptions,
  useMnaDeal,
  useScenarios,
  useCurrentScenario,
  useBalanceSheets,
  useIncomeStatements,
  useCashFlows,
  useIsCalculated,
} from '../../../hooks/typed-hooks';
import { ScenarioAssumptions } from '../../../types/financial';
import { ProFormaDataItem } from './useProFormaData';

/**
 * 使用 ProForma 計算 Hook
 * @returns ProForma 數據、載入狀態和錯誤
 */
export function useProFormaCalculations() {
  // 獲取基礎數據
  const businessMetrics = useBusinessMetrics();
  const futureAssumptions = useAssumptions();
  const mnaDealDesign = useMnaDeal();
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  const balanceSheet = useBalanceSheets();
  const incomeStatement = useIncomeStatements();
  const cashFlow = useCashFlows();
  const isCalculated = useIsCalculated();
  
  // 獲取當前情境數據
  const currentScenarioData = useMemo(() => {
    if (!scenarios) return null;
    return ((scenarios as unknown) as { scenarios?: Record<string, ScenarioAssumptions> })?.scenarios?.[currentScenarioKey] 
      || ((scenarios as unknown) as Record<string, ScenarioAssumptions>)?.[currentScenarioKey] 
      || ((scenarios as unknown) as { base?: ScenarioAssumptions })?.base;
  }, [scenarios, currentScenarioKey]);
  
  // 計算企業價值
  const globalEnterpriseValue = useMemo(() => {
    const entryMultiple = currentScenarioData?.entryEvEbitdaMultiple || 0;
    const acquisitionEBITDA = businessMetrics?.ebitda / 1000 || 0;
    return acquisitionEBITDA * entryMultiple;
  }, [currentScenarioData, businessMetrics]);
  
  // 轉換為 ProForma 數據格式
  const proFormaData = useMemo(() => {
    if (!isCalculated || !balanceSheet || balanceSheet.length === 0) {
      return null;
    }
    
    const toM = (v?: number) => ((v ?? 0) / 1000);
    const data: ProFormaDataItem[] = [];
    
    for (let i = 0; i < balanceSheet.length; i++) {
      const bs = balanceSheet[i];
      const is = incomeStatement?.[i];
      const cf = cashFlow?.[i];
      
      // 計算股利分配相關指標
      const opCFM = toM(cf?.operatingCashFlow);
      const revenueM = toM(is?.revenue);
      const capexM = revenueM * ((futureAssumptions?.capexAsPercentageOfRevenue || 0) / 100);
      const fcffM = opCFM - capexM;
      const prefRedemptionM = toM(cf?.preferredStockRedemption);
      const prefDivM = toM(cf?.preferredDividends);
      const commonDivM = toM(cf?.commonDividends);
      const totalDistM = prefRedemptionM + prefDivM + commonDivM;
      
      data.push({
        year: bs.year,
        // Income Statement
        revenue: bs.year === 0 ? '0.0' : (toM(is?.revenue).toFixed(1) || '0.0'),
        ebitda: bs.year === 0 ? '0.0' : (toM(is?.ebitda).toFixed(1) || '0.0'),
        ebitdaMargin: bs.year === 0 ? '0.0' : (is?.grossMargin?.toFixed(1) || '0.0'),
        ebit: bs.year === 0 ? '0.0' : (toM(is?.ebit).toFixed(1) || '0.0'),
        interestExpense: bs.year === 0 ? '0.0' : (toM(is?.interestExpense).toFixed(1) || '0.0'),
        netIncome: bs.year === 0 ? '0.0' : (toM(is?.netIncome).toFixed(1) || '0.0'),
        // Balance Sheet
        cash: toM(bs.cash).toFixed(1) || '0.0',
        endingCash: (toM(cf?.endingCash) || toM(bs.cash)).toFixed(1) || '0.0',
        accountsReceivable: toM(bs.accountsReceivable).toFixed(1) || '0.0',
        inventory: toM(bs.inventory).toFixed(1) || '0.0',
        fixedAssets: toM(bs.fixedAssets).toFixed(1) || '0.0',
        goodwill: toM(bs.goodwill).toFixed(1) || '0.0',
        totalAssets: toM(bs.totalAssets).toFixed(1) || '0.0',
        accountsPayable: toM(bs.accountsPayable).toFixed(1) || '0.0',
        debt: toM(bs.debt).toFixed(1) || '0.0',
        debtBalance: toM(bs.debt).toFixed(1) || '0.0',
        preferredStock: toM(bs.preferredStock).toFixed(1) || '0.0',
        preferredBalance: toM(bs.preferredStock).toFixed(1) || '0.0',
        equity: toM(bs.equity).toFixed(1) || '0.0',
        totalLiabilitiesEquity: toM(bs.totalLiabilitiesEquity).toFixed(1) || '0.0',
        // Cash Flow
        operatingCashFlow: toM(cf?.operatingCashFlow).toFixed(1) || '0.0',
        investingCashFlow: toM(cf?.investingCashFlow).toFixed(1) || '0.0',
        financingCashFlow: toM(cf?.financingCashFlow).toFixed(1) || '0.0',
        netCashFlow: toM(cf?.netCashFlow).toFixed(1) || '0.0',
        beginningCash: toM(cf?.beginningCash).toFixed(1) || '0.0',
        preferredDividends: toM(cf?.preferredDividends).toFixed(1) || '0.0',
        commonDividends: toM(cf?.commonDividends).toFixed(1) || '0.0',
        principalRepaymentCF: toM(cf?.principalRepayment).toFixed(1) || '0.0',
        newDebtCF: toM(cf?.newDebt).toFixed(1) || '0.0',
        newEquityCF: toM(cf?.newEquity).toFixed(1) || '0.0',
        interestPaidCF: toM(cf?.interestPaid).toFixed(1) || '0.0',
        capexCF: toM(cf?.capex).toFixed(1) || '0.0',
        transactionFeeCF: toM(cf?.transactionFeePaid).toFixed(1) || '0.0',
        acquisitionCashCF: toM(cf?.cashAcquisitionPayment).toFixed(1) || '0.0',
        nwcChangeCF: toM(cf?.nwcChange).toFixed(1) || '0.0',
        // 額外欄位
        fcff: fcffM.toFixed(1),
        capex: capexM.toFixed(1),
        preferredRedemption: prefRedemptionM.toFixed(1),
        commonDividend: (toM(cf?.commonDividends || 0)).toFixed(1),
        totalDistribution: totalDistM.toFixed(1),
        preferredPercentage: bs.preferredStock && globalEnterpriseValue > 0 ? 
          ((toM(bs.preferredStock) / globalEnterpriseValue) * 100).toFixed(1) : '0.0',
        acquirerPreferredDividend: prefDivM.toFixed(1),
        // Missing fields from ProFormaDataItem
        workingCapitalChange: '0.0',
        principalPayment: '0.0',
        plannedRedemption: '0.0',
        sellerSpecialDividend: '0.0',
        minimumCash: '0.0',
        availableCash: '0.0',
        cashShortfall: '0.0',
      });
    }
    
    return data;
  }, [
    isCalculated,
    balanceSheet,
    incomeStatement,
    cashFlow,
    futureAssumptions,
    globalEnterpriseValue
  ]);
  
  return {
    proFormaData,
    isLoading: !isCalculated,
    error: null,
    globalEnterpriseValue,
    currentScenarioData,
    businessMetrics,
    mnaDealDesign,
    futureAssumptions
  };
}