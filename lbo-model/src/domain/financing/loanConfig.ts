/**
 * 統一貸款配置系統
 * Linus 原則：消除特殊情況，使用統一的資料結構
 */

import { FacilityType, RepaymentMethod, FinancingPlan } from '../../types/financial';

/**
 * 基礎貸款配置介面
 * 所有貸款類型共享相同結構，避免特殊處理
 */
export interface LoanConfig {
  type: 'scheduled' | 'revolving';
  defaultRate: number;
  defaultMaturity: number;
  defaultMethod: RepaymentMethod;
  defaultGracePeriod: number;
  description: string;
}

/**
 * 統一的貸款配置映射
 * 無特殊情況，所有貸款使用相同的配置結構
 */
export const LOAN_CONFIGS: Record<FacilityType, LoanConfig> = {
  senior: {
    type: 'scheduled',
    defaultRate: 3,
    defaultMaturity: 5,
    defaultMethod: 'equalPayment',
    defaultGracePeriod: 0,
    description: '優先債務 - 低風險，低利率'
  },
  mezzanine: {
    type: 'scheduled',
    defaultRate: 8,
    defaultMaturity: 7,
    defaultMethod: 'bullet',
    defaultGracePeriod: 0,
    description: '夾層債務 - 中等風險，中等利率'
  },
  revolver: {
    type: 'revolving',
    defaultRate: 4,
    defaultMaturity: 5,
    defaultMethod: 'revolving',
    defaultGracePeriod: 0,
    description: '循環信貸 - 靈活使用'
  },
  termLoanA: {
    type: 'scheduled',
    defaultRate: 3.5,
    defaultMaturity: 5,
    defaultMethod: 'equalPrincipal',
    defaultGracePeriod: 0,
    description: '定期貸款A - 短期，定期攤還'
  },
  termLoanB: {
    type: 'scheduled',
    defaultRate: 5,
    defaultMaturity: 7,
    defaultMethod: 'interestOnly',
    defaultGracePeriod: 0,
    description: '定期貸款B - 長期，到期還本'
  }
};

/**
 * 獲取貸款預設值
 * 統一函數處理所有情況，無特殊分支
 */
export function getLoanDefaults(facilityType: FacilityType): Partial<FinancingPlan> {
  const config = LOAN_CONFIGS[facilityType];
  
  return {
    facilityType,
    interestRate: config.defaultRate,
    maturity: config.defaultMaturity,
    repaymentMethod: config.defaultMethod,
    gracePeriod: config.defaultGracePeriod,
    repaymentStructure: {
      type: config.defaultMethod
    }
  };
}

/**
 * 判斷是否為循環信貸
 */
export function isRevolvingLoan(facilityType: FacilityType): boolean {
  return LOAN_CONFIGS[facilityType].type === 'revolving';
}

/**
 * 判斷是否為定期貸款
 */
export function isScheduledLoan(facilityType: FacilityType): boolean {
  return LOAN_CONFIGS[facilityType].type === 'scheduled';
}

/**
 * 獲取貸款描述
 */
export function getLoanDescription(facilityType: FacilityType): string {
  return LOAN_CONFIGS[facilityType].description;
}