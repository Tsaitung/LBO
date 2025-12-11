import { EquityInjection, MnaDealDesign } from '../../../types/financial';
import { ProFormaDataItem } from '../hooks/useProFormaData';

interface EquityReturnsCalculatorProps {
  proFormaData: ProFormaDataItem[];
  mnaDealDesign: MnaDealDesign;
  exitMultiple: number;
  discountRateDecimal: number;
}

export interface EquityAnalysisItem {
  type: string;
  name: string;
  investmentAmount: number;
  exitProceeds: number;
  totalReturn: number;
  moic: number;
  irr: number;
  npv: number;
  cashFlows: number[];
  ownershipPercentage: number;
}

export const calculateEquityReturns = ({
  proFormaData,
  mnaDealDesign,
  exitMultiple,
  discountRateDecimal,
}: EquityReturnsCalculatorProps): EquityAnalysisItem[] | null => {
  const planningHorizon = mnaDealDesign.planningHorizon;
  const exitYear = planningHorizon;
  const exitYearData = proFormaData.find(d => d.year === exitYear);
  
  if (!exitYearData || !exitMultiple) {
    return null;
  }

  // Calculate exit enterprise value
  const exitEBITDA = parseFloat(exitYearData.ebitda);
  const exitEnterpriseValue = exitEBITDA * exitMultiple;
  const exitDebt = parseFloat(exitYearData.debtBalance);
  const exitEquityValue = exitEnterpriseValue - exitDebt;

  const equityAnalysis: EquityAnalysisItem[] = [];
  
  // Analyze each equity investment
  mnaDealDesign.equityInjections.forEach((injection: EquityInjection) => {
    const investmentAmount = injection.amount / 1000;
    const ownershipPercentage = injection.ownershipPercentage || 0;
    
    // Calculate cash flows for each year
    const cashFlows: number[] = [];
    
    // Year 0: Initial investment (negative)
    if (!injection.entryTiming || injection.entryTiming === 0) {
      cashFlows.push(-investmentAmount);
    } else {
      for (let i = 0; i < injection.entryTiming; i++) {
        cashFlows.push(0);
      }
      cashFlows.push(-investmentAmount);
    }
    
    // Years 1 to N-1: Dividend income (使用現金流量表的實際數據)
    for (let year = 1; year < exitYear; year++) {
      const yearData = proFormaData.find(d => d.year === year);
      if (!yearData) {
        cashFlows.push(0);
        continue;
      }

      let dividend = 0;

      if (injection.type === 'preferred') {
        // 使用現金流量表的實際優先股股息（而非理論公式）
        const actualPreferredDividends = parseFloat(yearData.preferredDividends || '0');

        // 計算該投資者佔優先股總額的比例
        const totalPreferredAmount = mnaDealDesign.equityInjections
          .filter((e: EquityInjection) => e.type === 'preferred')
          .reduce((sum: number, e: EquityInjection) => sum + e.amount / 1000, 0);

        if (totalPreferredAmount > 0) {
          dividend = actualPreferredDividends * (investmentAmount / totalPreferredAmount);
        }

        // 若有參與普通股分配權，加入普通股股息分配
        if (injection.specialTerms?.participateInCommonDividend) {
          const commonDividend = parseFloat(yearData.commonDividend || '0');
          const totalParticipatingEquity = mnaDealDesign.equityInjections
            .filter((e: EquityInjection) => e.type === 'common' ||
              (e.type === 'preferred' && e.specialTerms?.participateInCommonDividend))
            .reduce((sum: number, e: EquityInjection) => sum + e.ownershipPercentage, 0);

          if (totalParticipatingEquity > 0) {
            dividend += commonDividend * (ownershipPercentage / totalParticipatingEquity);
          }
        }
      } else if (injection.type === 'common') {
        // 普通股：使用現金流量表的實際普通股股息
        const commonDividend = parseFloat(yearData.commonDividend || '0');
        const totalCommonEquity = mnaDealDesign.equityInjections
          .filter((e: EquityInjection) => e.type === 'common')
          .reduce((sum: number, e: EquityInjection) => sum + e.ownershipPercentage, 0);

        if (totalCommonEquity > 0) {
          dividend = commonDividend * (ownershipPercentage / totalCommonEquity);
        }
      }

      cashFlows.push(dividend);
    }
    
    // Exit year: Final proceeds
    let exitProceeds = 0;
    
    if (injection.type === 'preferred') {
      // Use redemption price or default to 1x
      const redemptionMultiple = injection.specialTerms?.redemptionPrice || 1;
      exitProceeds = investmentAmount * redemptionMultiple;
      
      if (injection.specialTerms?.participateInCommonDividend) {
        const remainingValue = Math.max(0, exitEquityValue - exitProceeds);
        const totalParticipatingEquity = mnaDealDesign.equityInjections
          .filter((e: EquityInjection) => e.type === 'common' || 
            (e.type === 'preferred' && e.specialTerms?.participateInCommonDividend))
          .reduce((sum: number, e: EquityInjection) => sum + e.ownershipPercentage, 0);
        
        if (totalParticipatingEquity > 0) {
          exitProceeds += remainingValue * (ownershipPercentage / totalParticipatingEquity);
        }
      }
    } else {
      const totalPreferredPayout = mnaDealDesign.equityInjections
        .filter((e: EquityInjection) => e.type === 'preferred')
        .reduce((sum: number, e: EquityInjection) => {
          const amount = e.amount / 1000;
          const redemptionMultiple = e.specialTerms?.redemptionPrice || 1;
          return sum + amount * redemptionMultiple;
        }, 0);
      
      const remainingValue = Math.max(0, exitEquityValue - totalPreferredPayout);
      const totalCommonEquity = mnaDealDesign.equityInjections
        .filter((e: EquityInjection) => e.type === 'common')
        .reduce((sum: number, e: EquityInjection) => sum + e.ownershipPercentage, 0);
      
      if (totalCommonEquity > 0) {
        exitProceeds = remainingValue * (ownershipPercentage / totalCommonEquity);
      }
    }
    
    cashFlows.push(exitProceeds);
    
    // Calculate returns
    const totalReturn = cashFlows.reduce((sum, cf) => sum + cf, 0);
    const moic = investmentAmount > 0 ? Math.abs(totalReturn / investmentAmount) : 0;
    
    // IRR calculation
    const irr = calculateIRR(cashFlows);
    
    // NPV calculation
    let npv = 0;
    cashFlows.forEach((cf, t) => {
      npv += cf / Math.pow(1 + discountRateDecimal, t);
    });
    
    equityAnalysis.push({
      type: injection.type,
      name: injection.name,
      investmentAmount,
      exitProceeds,
      totalReturn,
      moic,
      irr,
      npv,
      cashFlows,
      ownershipPercentage,
    });
  });
  
  return equityAnalysis;
};

// IRR calculation helper
function calculateIRR(cashFlows: number[]): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = 0.1;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }
    
    rate = rate - npv / derivative;
    
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return rate * 100;
}