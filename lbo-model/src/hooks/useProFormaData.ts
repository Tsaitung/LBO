import {
  useBusinessMetrics,
  useMnaDeal,
  useAssumptions,
  useScenarios,
  useCurrentScenario,
} from './typed-hooks';
import { FinancingPlan, EquityInjection, PaymentScheduleItem } from '../types/financial';

interface SelectedAsset {
  id: string;
  name: string;
  bookValue: number;
  fairValue: number;
  selected: boolean;
}

/**
 * 共享的 ProForma 數據計算 Hook
 * 確保 DividendPolicyTable 和 ProFormaFinancials 使用相同的數據
 */
export const useProFormaData = () => {
  const businessMetrics = useBusinessMetrics();
  const mnaDealDesign = useMnaDeal();
  const futureAssumptions = useAssumptions();
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  const currentScenarioData = (scenarios || {})[currentScenarioKey];

  // 統一計算企業價值
  const entryMultiple = currentScenarioData?.entryEvEbitdaMultiple || 0;
  const acquisitionEBITDA = businessMetrics.ebitda / 1000;
  const globalEnterpriseValue = acquisitionEBITDA * entryMultiple;
  
  // 判斷是否為資產收購（移到函數外層）
  const isAssetDeal = mnaDealDesign.dealType === 'assetAcquisition';

  // 計算函數（簡化版，僅包含現金相關數據）
  const calculateProFormaData = () => {
    const years = Array.from({ length: mnaDealDesign.planningHorizon }, (_, i) => i + 1);
    const baseRevenue = businessMetrics.revenue / 1000;
    
    if (!entryMultiple) {
      return [];
    }
    
    // 獲取Year 0的融資總額
    const year0Debt = mnaDealDesign.financingPlans
      .filter((plan: FinancingPlan) => !plan.entryTiming || plan.entryTiming === 0)
      .reduce((sum: number, plan: FinancingPlan) => sum + plan.amount, 0) / 1000;
    const year0Equity = mnaDealDesign.equityInjections
      .filter((inj: EquityInjection) => !inj.entryTiming || inj.entryTiming === 0)
      .reduce((sum: number, inj: EquityInjection) => sum + inj.amount, 0) / 1000;
    
    // 從目標公司獲得的現金（資產收購時為0）
    const targetCashAcquired = isAssetDeal ? 0 : (businessMetrics.cashAndCashEquivalents / 1000);
    
    // 獲取選定資產總額（資產收購時使用）
    const getSelectedAssetsValue = () => {
      if (!isAssetDeal) return 0;
      
      // 從 assetDealSettings 中獲取選定資產
      const selectedAssets = mnaDealDesign.assetDealSettings?.selectedAssets || [];
      return selectedAssets.reduce((sum: number, asset: SelectedAsset) => 
        sum + (asset.fairValue || asset.bookValue || 0), 0
      ) / 1000; // 轉換為百萬
    };
    
    const selectedAssetsValue = getSelectedAssetsValue();
    
    // 計算Year 0現金支出
    const paymentSchedule = mnaDealDesign.assetDealSettings?.paymentSchedule?.schedule || [];
    const year0CashPayments = paymentSchedule.filter((s: PaymentScheduleItem) => 
      s.period === 1 && s.paymentMethod === 'cash'
    );
    const year0CashAmount = year0CashPayments.reduce((sum: number, p: PaymentScheduleItem) => 
      sum + (globalEnterpriseValue * (p.percentage || 0) / 100), 0
    );
    
    // Year 0 數據
    const year0Data = {
      year: 0,
      revenue: 0,
      ebitda: 0,
      endingCash: (year0Equity + year0Debt + targetCashAcquired - year0CashAmount).toFixed(1),
      debtBalance: year0Debt.toFixed(1),
      totalAssets: isAssetDeal ? 
        selectedAssetsValue.toFixed(1) :  // 資產收購：只有選定資產
        (businessMetrics.totalAssets / 1000).toFixed(1), // 股權收購：所有資產
      selectedAssets: selectedAssetsValue.toFixed(1), // 新增：選定資產價值
    };
    
    // 初始現金餘額
    let previousYearEndingCash = parseFloat(year0Data.endingCash);
    let currentDebtBalance = year0Debt;
    
    // Year 1-N 的簡化數據（主要為了現金計算）
    const yearlyData = years.map(year => {
      const revenue = baseRevenue * Math.pow(1 + futureAssumptions.revenueGrowthRate / 100, year);
      const ebitda = revenue * (futureAssumptions.ebitdaMargin / 100);
      const depreciation = businessMetrics.depreciationAmortization / 1000;
      const ebit = ebitda - depreciation;
      
      // 計算債務還款
      let principalPayment = 0;
      let interestExpense = 0;
      
      mnaDealDesign.financingPlans.forEach((plan: FinancingPlan) => {
        if (!plan || (plan.amount || 0) <= 0) return;
        if (plan.entryTiming && plan.entryTiming > year) return;
        
        const planAmount = plan.amount / 1000;
        const maturity = Math.max(plan.maturity || 0, 1);
        const rate = plan.interestRate / 100;
        const loanYear = year - (plan.entryTiming || 0);
        
        if (loanYear < 0 || loanYear > maturity) return;
        
        if (plan.repaymentMethod === 'equalPrincipal') {
          if (loanYear <= maturity) {
            principalPayment += planAmount / maturity;
            interestExpense += (planAmount - (planAmount / maturity) * (loanYear - 1)) * rate;
          }
        } else if (plan.repaymentMethod === 'equalPayment') {
          if (loanYear <= maturity) {
            const pmt = planAmount * rate * Math.pow(1 + rate, maturity) / (Math.pow(1 + rate, maturity) - 1);
            const remainingBalance = planAmount * (Math.pow(1 + rate, maturity) - Math.pow(1 + rate, loanYear - 1)) / (Math.pow(1 + rate, maturity) - 1);
            const interestPortion = remainingBalance * rate;
            principalPayment += pmt - interestPortion;
            interestExpense += interestPortion;
          }
        } else if (plan.repaymentMethod === 'bullet' || plan.repaymentMethod === 'interestOnly') {
          interestExpense += planAmount * rate;
          if (loanYear === maturity) {
            principalPayment += planAmount;
          }
        } else if (plan.repaymentMethod === 'revolving') {
          interestExpense += planAmount * rate;
        }
      });
      
      // 更新債務餘額
      currentDebtBalance = Math.max(0, currentDebtBalance - principalPayment);
      
      // 計算營運現金流
      const taxes = Math.max(0, (ebit - interestExpense) * (futureAssumptions.taxRate / 100));
      // 以營運資本天數與銷貨成本比例計算 NWC 變動
      const cogsPct = futureAssumptions.cogsAsPercentageOfRevenue / 100;
      const prevRevenue = year === 1
        ? baseRevenue
        : baseRevenue * Math.pow(1 + futureAssumptions.revenueGrowthRate / 100, year - 1);
      const cogs = revenue * cogsPct;
      const prevCogs = prevRevenue * cogsPct;
      const ar = revenue * (futureAssumptions.accountsReceivableDays / 365);
      const prevAr = prevRevenue * (futureAssumptions.accountsReceivableDays / 365);
      const inv = cogs * (futureAssumptions.inventoryDays / 365);
      const prevInv = prevCogs * (futureAssumptions.inventoryDays / 365);
      const ap = cogs * (futureAssumptions.accountsPayableDays / 365);
      const prevAp = prevCogs * (futureAssumptions.accountsPayableDays / 365);
      const nwc = ar + inv - ap;
      const prevNwc = prevAr + prevInv - prevAp;
      const workingCapitalChange = nwc - prevNwc;
      const operatingCashFlow = ebitda - taxes - workingCapitalChange;
      
      // 投資活動
      const capex = revenue * (futureAssumptions.capexAsPercentageOfRevenue / 100);
      
      // 新增融資
      const newDebtThisYear = mnaDealDesign.financingPlans
        .filter((plan: FinancingPlan) => plan.entryTiming === year && (plan.amount || 0) > 0)
        .reduce((sum: number, plan: FinancingPlan) => sum + plan.amount / 1000, 0);
      const newEquityThisYear = mnaDealDesign.equityInjections
        .filter((inj: EquityInjection) => inj.entryTiming === year)
        .reduce((sum: number, inj: EquityInjection) => sum + inj.amount / 1000, 0);
      
      // 計算期末現金（簡化版）
      const endingCash = previousYearEndingCash + operatingCashFlow - capex + newEquityThisYear + newDebtThisYear - principalPayment - interestExpense;
      previousYearEndingCash = endingCash;
      
      return {
        year,
        revenue: revenue.toFixed(1),
        ebitda: ebitda.toFixed(1),
        endingCash: endingCash.toFixed(1),
        debtBalance: currentDebtBalance.toFixed(1),
        principalPayment: principalPayment.toFixed(1),
        interestExpense: interestExpense.toFixed(1),
        fcff: (operatingCashFlow - capex).toFixed(1),
      };
    });
    
    return [year0Data, ...yearlyData];
  };

  const proFormaData = calculateProFormaData();
  
  // 計算選定資產價值
  const getSelectedAssetsValueForReturn = () => {
    if (!isAssetDeal) return 0;
    const selectedAssets = mnaDealDesign.assetDealSettings?.selectedAssets || [];
    return selectedAssets.reduce((sum: number, asset: SelectedAsset) => 
      sum + (asset.fairValue || asset.bookValue || 0), 0
    ) / 1000;
  };
  
  const finalSelectedAssetsValue = getSelectedAssetsValueForReturn();
  const currentScenario = currentScenarioKey || 'base';

  return {
    proFormaData,
    globalEnterpriseValue,
    entryMultiple,
    currentScenario,
    currentScenarioData,
    selectedAssetsValue: finalSelectedAssetsValue,
    isAssetDeal,
  };
};
