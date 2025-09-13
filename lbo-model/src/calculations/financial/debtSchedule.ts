/**
 * 債務明細表計算
 * 統一處理所有貸款類型，消除特殊情況
 * 遵循 Linus 原則：好品味 = 消除特殊情況
 */

import { FinancingPlan, DebtScheduleData, FutureAssumptions } from '../../types/financial';

/**
 * 貸款償還計算介面
 * 統一的計算接口，避免 if-else 地獄
 */
interface LoanPayment {
  year: number;
  beginningBalance: number;
  interestExpense: number;
  principalRepayment: number;
  endingBalance: number;
}

/**
 * 計算等額本息還款
 */
function calculateEqualPayment(
  principal: number,
  rate: number,
  periods: number,
  currentPeriod: number
): LoanPayment {
  if (currentPeriod > periods) {
    return {
      year: currentPeriod,
      beginningBalance: 0,
      interestExpense: 0,
      principalRepayment: 0,
      endingBalance: 0,
    };
  }

  const monthlyRate = rate / 12;
  const totalPayments = periods * 12;
  const currentPaymentNumber = (currentPeriod - 1) * 12 + 1;
  
  // PMT 公式
  const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
              (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  // 計算當期餘額
  const remainingPayments = totalPayments - currentPaymentNumber + 1;
  const beginningBalance = pmt * (1 - Math.pow(1 + monthlyRate, -remainingPayments)) / monthlyRate;
  
  const annualInterest = beginningBalance * rate;
  const annualPrincipal = Math.min(pmt * 12 - annualInterest, beginningBalance);
  
  return {
    year: currentPeriod,
    beginningBalance,
    interestExpense: annualInterest,
    principalRepayment: annualPrincipal,
    endingBalance: Math.max(0, beginningBalance - annualPrincipal),
  };
}

/**
 * 計算等額本金還款
 */
function calculateEqualPrincipal(
  principal: number,
  rate: number,
  periods: number,
  currentPeriod: number
): LoanPayment {
  if (currentPeriod > periods) {
    return {
      year: currentPeriod,
      beginningBalance: 0,
      interestExpense: 0,
      principalRepayment: 0,
      endingBalance: 0,
    };
  }

  const annualPrincipal = principal / periods;
  const beginningBalance = principal - (annualPrincipal * (currentPeriod - 1));
  const interestExpense = beginningBalance * rate;
  
  return {
    year: currentPeriod,
    beginningBalance,
    interestExpense,
    principalRepayment: annualPrincipal,
    endingBalance: Math.max(0, beginningBalance - annualPrincipal),
  };
}

/**
 * 計算到期一次還本
 */
function calculateBullet(
  principal: number,
  rate: number,
  maturity: number,
  currentPeriod: number
): LoanPayment {
  if (currentPeriod > maturity) {
    return {
      year: currentPeriod,
      beginningBalance: 0,
      interestExpense: 0,
      principalRepayment: 0,
      endingBalance: 0,
    };
  }

  const isMaturityYear = currentPeriod === maturity;
  
  return {
    year: currentPeriod,
    beginningBalance: principal,
    interestExpense: principal * rate,
    principalRepayment: isMaturityYear ? principal : 0,
    endingBalance: isMaturityYear ? 0 : principal,
  };
}

/**
 * 計算按期付息到期還本
 */
function calculateInterestOnly(
  principal: number,
  rate: number,
  maturity: number,
  currentPeriod: number
): LoanPayment {
  // 與 bullet 相同
  return calculateBullet(principal, rate, maturity, currentPeriod);
}

/**
 * 計算循環信用
 */
function calculateRevolving(
  principal: number,
  rate: number,
  repaymentRate: number,
  currentPeriod: number
): LoanPayment {
  // 使用配置的年償還率
  const annualRepayment = principal * repaymentRate;
  
  return {
    year: currentPeriod,
    beginningBalance: principal,
    interestExpense: principal * rate,
    principalRepayment: Math.min(annualRepayment, principal),
    endingBalance: Math.max(0, principal - annualRepayment),
  };
}

/**
 * 統一的貸款計算函數
 * 消除特殊情況，使用策略模式
 */
function calculateLoanSchedule(
  plan: FinancingPlan,
  planningHorizon: number,
  assumptions: FutureAssumptions
): DebtScheduleData[] {
  const schedule: DebtScheduleData[] = [];
  const entryYear = plan.entryTiming || 0;
  const maturity = Math.max(plan.maturity || 0, 1);
  const rate = plan.interestRate / 100;
  const principal = plan.amount;
  
  // 確定貸款類型
  const debtType = plan.facilityType === 'mezzanine' ? 'mezz' : 
                   plan.facilityType === 'revolver' || plan.repaymentMethod === 'revolving' ? 'revolver' : 
                   'senior';

  let currentBalance = 0;

  for (let year = 0; year <= planningHorizon; year++) {
    // Year 0: 債務提取（如果 entryTiming 是 0）
    if (year === 0 && entryYear === 0) {
      schedule.push({
        year: 0,
        beginningBalance: 0,
        interestExpense: 0,  // Year 0 無利息
        principalRepayment: 0,  // Year 0 無還款
        endingBalance: principal,  // 全額提取
        debtType,
      });
      currentBalance = principal;
      continue;
    }
    
    // 尚未到進入年份
    if (year < entryYear) {
      continue;
    }

    // 進入當年（非 Year 0）
    if (year === entryYear && entryYear !== 0) {
      // 期末進入：當年只在期末有餘額，不計息不還本
      if (plan.entryTimingType === 'end') {
        schedule.push({
          year,
          beginningBalance: 0,
          interestExpense: 0,
          principalRepayment: 0,
          endingBalance: principal,
          debtType,
        });
        currentBalance = principal;
        continue;
      }
      // 期初進入：當年即為還款第1年
    }

    const loanYear = Math.max(1, year - entryYear); // 期初進入：當年為第1年；期末進入已在上方處理
    
    // 統一計算接口
    let payment: LoanPayment;
    
    switch (plan.repaymentStructure?.type || plan.repaymentMethod) {
      case 'equalPayment':
        payment = calculateEqualPayment(principal, rate, maturity, loanYear);
        break;
        
      case 'equalPrincipal':
        payment = calculateEqualPrincipal(principal, rate, maturity, loanYear);
        break;
        
      case 'bullet':
        payment = calculateBullet(principal, rate, maturity, loanYear);
        break;
        
      case 'interestOnly':
        payment = calculateInterestOnly(principal, rate, maturity, loanYear);
        break;
        
      case 'revolving':
        const repaymentRate = (assumptions.revolvingCreditRepaymentRate) / 100;
        // 若當年前一年未建立餘額，使用全額本金作為起始餘額
        const revolverBalance = currentBalance > 0 ? currentBalance : principal;
        payment = calculateRevolving(revolverBalance, rate, repaymentRate, loanYear);
        currentBalance = payment.endingBalance;
        break;
        
      default:
        // 預設為等額本息
        payment = calculateEqualPayment(principal, rate, maturity, loanYear);
    }

    schedule.push({
      year,
      beginningBalance: payment.beginningBalance,
      interestExpense: payment.interestExpense,
      principalRepayment: payment.principalRepayment,
      endingBalance: payment.endingBalance,
      debtType,
    });

    // 如果貸款已還清，後續年份不再計算
    if (payment.endingBalance === 0 && plan.repaymentStructure?.type !== 'revolving') {
      break;
    }
  }

  return schedule;
}

/**
 * 計算所有債務明細表
 * 主入口函數
 */
export function calculateDebtSchedule(
  financingPlans: FinancingPlan[],
  planningHorizon: number,
  assumptions: FutureAssumptions
): DebtScheduleData[] {
  const allSchedules: DebtScheduleData[] = [];

  // 計算每個貸款的還款計劃
  financingPlans
    .filter(plan => {
      const principal = plan.amount || 0;
      const rate = (plan.interestRate ?? 0) / 100;
      const maturity = plan.repaymentMethod === 'revolving' ? 1 : (plan.maturity || 0);
      // 僅納入完整且有效的計畫：金額>0、利率>=0、年期>=1（非循環）
      return principal > 0 && rate >= 0 && maturity >= 1;
    })
    .forEach(plan => {
      const schedule = calculateLoanSchedule(plan, planningHorizon, assumptions);
      allSchedules.push(...schedule);
    });

  // 按年份和貸款類型排序
  allSchedules.sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    // 優先級：senior > mezz > revolver
    const priority = { senior: 1, mezz: 2, revolver: 3 };
    return (priority[a.debtType] || 4) - (priority[b.debtType] || 4);
  });

  return allSchedules;
}

/**
 * 計算總債務餘額
 */
export function calculateTotalDebt(
  debtSchedule: DebtScheduleData[],
  year: number
): number {
  return debtSchedule
    .filter(d => d.year === year)
    .reduce((sum, d) => sum + d.endingBalance, 0);
}

/**
 * 計算總利息費用
 */
export function calculateTotalInterest(
  debtSchedule: DebtScheduleData[],
  year: number
): number {
  return debtSchedule
    .filter(d => d.year === year)
    .reduce((sum, d) => sum + d.interestExpense, 0);
}

/**
 * 計算總本金償還
 */
export function calculateTotalPrincipalRepayment(
  debtSchedule: DebtScheduleData[],
  year: number
): number {
  return debtSchedule
    .filter(d => d.year === year)
    .reduce((sum, d) => sum + d.principalRepayment, 0);
}
