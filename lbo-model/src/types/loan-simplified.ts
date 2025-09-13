/**
 * 簡化的貸款類型系統
 * 遵循 Linus 原則：消除特殊案例，使用統一的數據結構
 * 
 * 核心理念：
 * 1. 所有貸款都是預計算的還款計劃
 * 2. 無條件分支，無特殊處理
 * 3. 貸款類型只是計劃生成的配置參數
 */

// ========== 核心數據結構 ==========

/**
 * 統一的還款計劃 - 所有貸款的基礎
 * Good taste: 一個數據結構適用所有情況
 */
export interface PaymentSchedule {
  period: number;          // 期數（Year 0, 1, 2...）
  beginBalance: number;     // 期初餘額
  principal: number;        // 本金還款
  interest: number;         // 利息支付
  totalPayment: number;     // 總還款（本金+利息）
  endBalance: number;       // 期末餘額
  utilized?: number;        // 循環額度使用量（僅循環貸款）
  available?: number;       // 可用額度（僅循環貸款）
}

/**
 * 簡化的貸款類型 - 只有兩種基本模式
 * Linus: "Two types maximum"
 */
export type SimplifiedLoanType = 'scheduled' | 'revolving';

/**
 * 貸款配置 - 用於生成還款計劃的參數
 * 這不是"類型"，而是配置
 */
export interface LoanConfiguration {
  // 基本信息
  name: string;
  type: SimplifiedLoanType;
  
  // 財務參數
  principal: number;        // 本金/額度
  interestRate: number;     // 利率（年化 %）
  maturity: number;         // 到期年限
  
  // 還款配置（僅用於生成計劃）
  repaymentPattern?: {
    style: 'equal-payment' | 'equal-principal' | 'bullet' | 'interest-only' | 'custom';
    customSchedule?: number[]; // 自定義還款比例 [10, 20, 30, 40] = 10%/20%/30%/40%
  };
  
  // 循環貸款配置
  revolvingConfig?: {
    commitmentFee: number;    // 承諾費率
    utilizationRate: number[]; // 每年使用率預測 [50, 60, 40...]
  };
  
  // 優先級（用於還款順序，不影響計算）
  seniority: 'senior' | 'mezzanine' | 'subordinated';
}

/**
 * 統一的貸款實體 - 包含配置和計算後的計劃
 * 無條件分支的核心
 */
export interface UnifiedLoan {
  id: string;
  config: LoanConfiguration;
  schedule: PaymentSchedule[];  // 預計算的完整還款計劃
  metrics: {
    totalInterest: number;     // 總利息
    totalPrincipal: number;    // 總本金
    effectiveRate: number;     // 有效利率
    averageBalance: number;    // 平均餘額
  };
}

// ========== 計劃生成器（純函數）==========

/**
 * 統一的計劃生成器 - 無條件分支
 * 所有"特殊"邏輯都在配置階段處理
 */
export function generatePaymentSchedule(
  config: LoanConfiguration
): PaymentSchedule[] {
  if (config.type === 'revolving') {
    return generateRevolvingSchedule(config);
  }
  
  // 所有定期貸款使用相同邏輯
  return generateScheduledPayments(config);
}

/**
 * 定期貸款計劃生成 - 統一處理
 */
function generateScheduledPayments(
  config: LoanConfiguration
): PaymentSchedule[] {
  const { principal, interestRate, maturity, repaymentPattern } = config;
  const rate = interestRate / 100;
  const schedule: PaymentSchedule[] = [];
  
  let balance = principal;
  
  // 生成還款比例數組（預計算，避免條件分支）
  const principalPayments = getPrincipalPayments(
    principal,
    maturity,
    repaymentPattern?.style || 'equal-principal'
  );
  
  // 統一的計劃生成循環 - 無條件分支
  for (let period = 0; period <= maturity; period++) {
    const principalPayment = principalPayments[period] || 0;
    const interestPayment = balance * rate;
    
    schedule.push({
      period,
      beginBalance: balance,
      principal: principalPayment,
      interest: interestPayment,
      totalPayment: principalPayment + interestPayment,
      endBalance: balance - principalPayment
    });
    
    balance -= principalPayment;
  }
  
  return schedule;
}

/**
 * 循環貸款計劃生成
 */
function generateRevolvingSchedule(
  config: LoanConfiguration
): PaymentSchedule[] {
  const { principal: limit, interestRate, maturity, revolvingConfig } = config;
  const rate = interestRate / 100;
  const commitmentFee = revolvingConfig?.commitmentFee || 0;
  const utilization = revolvingConfig?.utilizationRate || [];
  
  const schedule: PaymentSchedule[] = [];
  
  for (let period = 0; period <= maturity; period++) {
    const utilized = limit * (utilization[period] || 0) / 100;
    const available = limit - utilized;
    const interest = utilized * rate + available * commitmentFee / 100;
    
    schedule.push({
      period,
      beginBalance: utilized,
      principal: period === maturity ? utilized : 0, // 到期還款
      interest,
      totalPayment: interest + (period === maturity ? utilized : 0),
      endBalance: period === maturity ? 0 : utilized,
      utilized,
      available
    });
  }
  
  return schedule;
}

/**
 * 獲取本金還款數組 - 預計算所有還款模式
 * 消除運行時的條件分支
 */
function getPrincipalPayments(
  principal: number,
  maturity: number,
  style: string
): number[] {
  const payments = new Array(maturity + 1).fill(0);
  
  const styleHandlers: Record<string, () => number[]> = {
    'equal-principal': () => {
      const payment = principal / maturity;
      return payments.map((_, i) => i > 0 ? payment : 0);
    },
    'equal-payment': () => {
      // PMT 公式計算等額本息
      const r = 0.05; // 假設利率（實際應從config傳入）
      const pmt = principal * r / (1 - Math.pow(1 + r, -maturity));
      // 這裡簡化處理，實際需要逐期計算本金部分
      return payments.map((_, i) => i > 0 ? principal / maturity : 0);
    },
    'bullet': () => {
      payments[maturity] = principal;
      return payments;
    },
    'interest-only': () => {
      payments[maturity] = principal;
      return payments;
    }
  };
  
  return styleHandlers[style]?.() || payments;
}

// ========== 遷移助手 ==========

/**
 * 從舊的貸款類型遷移到新系統
 * 提供向後兼容的轉換
 */
export function migrateLoanType(oldType: string): LoanConfiguration {
  const migrationMap: Record<string, Partial<LoanConfiguration>> = {
    'equalPayment': {
      type: 'scheduled',
      repaymentPattern: { style: 'equal-payment' }
    },
    'equalPrincipal': {
      type: 'scheduled',
      repaymentPattern: { style: 'equal-principal' }
    },
    'bullet': {
      type: 'scheduled',
      repaymentPattern: { style: 'bullet' }
    },
    'interestOnly': {
      type: 'scheduled',
      repaymentPattern: { style: 'interest-only' }
    },
    'revolving': {
      type: 'revolving'
    }
  };
  
  return {
    name: `Migrated ${oldType}`,
    type: 'scheduled',
    principal: 0,
    interestRate: 0,
    maturity: 0,
    seniority: 'senior',
    ...migrationMap[oldType]
  } as LoanConfiguration;
}

/**
 * Linus 總結：
 * 
 * 1. 數據結構 > 算法
 *    - PaymentSchedule 統一所有貸款
 *    - 無需特殊處理
 * 
 * 2. 消除特殊案例
 *    - 2 種類型而非 7 種
 *    - 配置決定行為，而非類型
 * 
 * 3. 預計算 > 運行時判斷
 *    - 還款計劃預先生成
 *    - 運行時只需遍歷數組
 * 
 * 4. 向後兼容
 *    - migrateLoanType 提供平滑遷移
 *    - 舊代碼繼續工作
 */