/**
 * Pro Forma Data Hook
 * Centralizes all financial data preparation for pro forma statements
 * Following Linus principle: Data structures over algorithms
 */

import { useMemo } from 'react';
import {
  useBusinessMetrics,
  useAssumptions,
  useMnaDeal,
  useScenarioAssumptions,
  useCurrentScenario,
  useBalanceSheets,
  useIncomeStatements,
  useCashFlows,
  useIsCalculated,
} from '../../../hooks/typed-hooks';
import { DealDesignWithPlans } from '../../../types/hooks.types';
import { BusinessMetricsBeforeAcquisition, EquityInjection, FinancingPlan } from '../../../types/financial';

export interface ProFormaDataItem {
  year: number;
  // Income Statement
  revenue: string;
  ebitda: string;
  ebitdaMargin: string;
  ebit: string;
  interestExpense: string;
  netIncome: string;
  // Balance Sheet
  cash: string;
  endingCash: string;
  accountsReceivable: string;
  inventory: string;
  fixedAssets: string;
  goodwill: string;
  totalAssets: string;
  accountsPayable: string;
  debt: string;
  debtBalance: string;
  preferredStock: string;
  preferredBalance: string;
  equity: string;
  totalLiabilitiesEquity: string;
  // Cash Flow
  operatingCashFlow: string;
  investingCashFlow: string;
  financingCashFlow: string;
  netCashFlow: string;
  beginningCash: string;
  preferredDividends: string;
  commonDividends: string;
  principalRepaymentCF: string;
  newDebtCF: string;
  newEquityCF: string;
  interestPaidCF: string;
  capexCF: string;
  transactionFeeCF: string;
  acquisitionCashCF: string;
  nwcChangeCF: string;
  // Additional fields
  fcff: string;
  capex: string;
  workingCapitalChange: string;
  principalPayment: string;
  plannedRedemption: string;
  preferredRedemption: string;
  preferredPercentage: string;
  acquirerPreferredDividend: string;
  sellerSpecialDividend: string;
  commonDividend: string;
  totalDistribution: string;
  minimumCash: string;
  availableCash: string;
  cashShortfall: string;
  // Year 0 special fields
  equityInjection?: string;
  debtFinancing?: string;
  acquisitionPayment?: string;
  targetCashAcquired?: string;
  specialSharesIssued?: string;
}

export interface ProFormaData {
  data: ProFormaDataItem[] | null;
  isLoading: boolean;
  hasData: boolean;
  enterpriseValue: number;
  entryMultiple: number;
  currentScenarioKey: string;
}

export const useProFormaData = (): ProFormaData => {
  // Use unified selectors - prefer memoized selectors for stable references
  const businessMetrics = useBusinessMetrics();
  const futureAssumptions = useAssumptions();
  const mnaDealDesign = useMnaDeal();
  const currentScenarioData = useScenarioAssumptions(); // 直接使用 memoized selector
  const currentScenarioKey = useCurrentScenario();
  const balanceSheet = useBalanceSheets();
  const incomeStatement = useIncomeStatements();
  const cashFlow = useCashFlows();
  const isCalculated = useIsCalculated();

  // Calculate enterprise value
  const entryMultiple = currentScenarioData?.entryEvEbitdaMultiple || 0;
  const acquisitionEBITDA = businessMetrics?.ebitda / 1000 || 0;
  const globalEnterpriseValue = acquisitionEBITDA * entryMultiple;

  // Check if we have Redux data
  const hasReduxData = isCalculated && balanceSheet && balanceSheet.length > 0;

  // Convert to millions
  const toM = (v?: number) => ((v ?? 0) / 1000);

  // Prepare pro forma data from Redux
  const getProFormaDataFromRedux = (): ProFormaDataItem[] | null => {
    if (!hasReduxData) return null;
    
    const data: ProFormaDataItem[] = [];
    for (let i = 0; i < balanceSheet.length; i++) {
      const bs = balanceSheet[i];
      const is = incomeStatement?.[i];
      const cf = cashFlow?.[i];
      
      // Calculate dividend distribution values
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
        // Additional fields
        fcff: fcffM.toFixed(1),
        capex: capexM.toFixed(1),
        workingCapitalChange: '0.0',
        principalPayment: '0.0',
        plannedRedemption: '0.0',
        preferredRedemption: prefRedemptionM.toFixed(1),
        preferredPercentage: bs.preferredStock && globalEnterpriseValue > 0 ? 
          ((toM(bs.preferredStock) / globalEnterpriseValue) * 100).toFixed(1) : '0.0',
        acquirerPreferredDividend: prefDivM.toFixed(1),
        sellerSpecialDividend: '0.0',
        commonDividend: (toM(cf?.commonDividends || 0)).toFixed(1),
        totalDistribution: totalDistM.toFixed(1),
        minimumCash: '0.0',
        availableCash: '0.0',
        cashShortfall: '0.0',
        // Year 0 special fields
        equityInjection: bs.year === 0 ? 
          (mnaDealDesign?.equityInjections
            ?.filter((e: EquityInjection) => !e.entryTiming || e.entryTiming === 0)
            .reduce((sum: number, e: EquityInjection) => sum + e.amount, 0) / 1000).toFixed(1) : undefined,
        debtFinancing: bs.year === 0 ? 
          (mnaDealDesign?.financingPlans
            ?.filter((p: FinancingPlan) => !p.entryTiming || p.entryTiming === 0)
            .reduce((sum: number, p: FinancingPlan) => sum + p.amount, 0) / 1000).toFixed(1) : undefined,
        acquisitionPayment: bs.year === 0 ? 
          (globalEnterpriseValue * ((mnaDealDesign?.paymentStructure?.upfrontPayment ?? 0) / 100)).toFixed(1) : undefined,
        targetCashAcquired: bs.year === 0 && mnaDealDesign?.dealType !== 'assetAcquisition' ? 
          (businessMetrics?.cashAndCashEquivalents / 1000).toFixed(1) : undefined,
        specialSharesIssued: bs.year === 0 && bs.preferredStock ? 
          toM(bs.preferredStock).toFixed(1) : undefined,
      });
    }
    return data;
  };

  // 使用 useMemo 保護整個返回值，避免每次渲染都創建新物件
  return useMemo(() => {
    const proFormaData = getProFormaDataFromRedux();
    return {
      data: proFormaData,
      isLoading: !hasReduxData && !proFormaData,
      hasData: hasReduxData && !!proFormaData && proFormaData.length > 0,
      enterpriseValue: globalEnterpriseValue,
      entryMultiple,
      currentScenarioKey: currentScenarioKey as string,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    balanceSheet,
    incomeStatement,
    cashFlow,
    futureAssumptions,
    mnaDealDesign,
    businessMetrics,
    globalEnterpriseValue,
    entryMultiple,
    currentScenarioKey,
    hasReduxData,
  ]);
};

// Key metrics calculation
// Note: scenarios parameter was removed as it was unused
export const calculateKeyMetrics = (
  proFormaData: ProFormaDataItem[],
  businessMetrics: BusinessMetricsBeforeAcquisition,
  mnaDealDesign: DealDesignWithPlans,
  currentScenarioKey: string,
  entryMultiple: number,
  enterpriseValue: number
) => {
  if (!proFormaData || proFormaData.length === 0) {
    return {
      enterpriseValue: '0',
      entryMultiple: '0',
      currentScenario: 'Base',
      entryLeverage: '0',
      exitLeverage: '0',
      fcffCAGR: 0,
      avgEbitdaMargin: 0,
    };
  }

  const totalDebt = mnaDealDesign?.financingPlans?.reduce((sum: number, plan: FinancingPlan) => sum + plan.amount, 0) / 1000 || 0;
  const lastYearEbitda = parseFloat(proFormaData[proFormaData.length - 1].ebitda);
  const firstYearFCFF = proFormaData.length > 1 ? parseFloat(proFormaData[1].fcff) : 0;
  const lastYearFCFF = parseFloat(proFormaData[proFormaData.length - 1].fcff);
  
  const fcffCAGR = firstYearFCFF !== 0 && proFormaData.length > 2 
    ? Math.pow(lastYearFCFF / firstYearFCFF, 1 / (proFormaData.length - 2)) - 1
    : 0;
  
  const avgEbitdaMargin = proFormaData
    .filter(d => d.year > 0)
    .reduce((sum, d) => sum + parseFloat(d.ebitdaMargin), 0) / (proFormaData.length - 1);

  return {
    enterpriseValue: enterpriseValue.toFixed(1),
    entryMultiple: entryMultiple.toFixed(1),
    currentScenario: currentScenarioKey?.charAt(0).toUpperCase() + currentScenarioKey?.slice(1) || 'Base',
    entryLeverage: (totalDebt / (businessMetrics?.ebitda / 1000)).toFixed(1),
    exitLeverage: (parseFloat(proFormaData[proFormaData.length - 1].debtBalance) / lastYearEbitda).toFixed(1),
    fcffCAGR: (fcffCAGR * 100).toFixed(1),
    avgEbitdaMargin: avgEbitdaMargin.toFixed(1),
  };
};