/**
 * 股利政策統一預設值
 * 消除各組件分散定義的不一致風險
 * Linus 原則：單一數據來源
 */

import {
  DebtProtectionCovenants,
  DividendTier,
  WaterfallRule,
  DividendPolicySettings,
} from '../types/financial';

/**
 * 債務保護條件預設值
 */
export const DEFAULT_COVENANTS: DebtProtectionCovenants = {
  dscr: { value: 1.25, enabled: true },
  netLeverage: { value: 4.0, enabled: true },
  interestCoverage: { value: 3.0, enabled: true },
  minCashMonths: { value: 3, enabled: true },
};

/**
 * 分級觸發條件預設值
 * 3層設計：基礎 → 標準 → 積極
 */
export const DEFAULT_TIERS: DividendTier[] = [
  {
    id: 'tier-1',
    name: '基礎分紅',
    ebitdaThreshold: 50,    // 百萬元
    fcffThreshold: 20,      // 百萬元
    leverageThreshold: 5.0, // x
    payoutRatio: 30,        // %
  },
  {
    id: 'tier-2',
    name: '標準分紅',
    ebitdaThreshold: 80,
    fcffThreshold: 40,
    leverageThreshold: 3.5,
    payoutRatio: 50,
  },
  {
    id: 'tier-3',
    name: '積極分紅',
    ebitdaThreshold: 100,
    fcffThreshold: 60,
    leverageThreshold: 2.5,
    payoutRatio: 70,
  },
];

/**
 * 建立瀑布分配規則
 * @param preferredRate 優先股股息率（%），從股權注入設定讀取
 * @description 優先股股息率應從股權注入設定自動同步，不需手動輸入
 */
export const createDefaultWaterfallRules = (preferredRate = 8): WaterfallRule[] => [
  {
    priority: 1,
    type: 'preferredRedemption',
    calculation: 'fixed',
    value: 90,
    description: '優先股本金贖回（90M）',
  },
  {
    priority: 2,
    type: 'preferredDividend',
    calculation: 'formula',
    value: preferredRate,
    formula: `preferredOutstanding * ${preferredRate}%`,
    description: `優先股股息（${preferredRate}% p.a.）`,
  },
  {
    priority: 3,
    type: 'commonDividend',
    calculation: 'percentage',
    value: 100,
    description: '普通股股利（剩餘可分配現金）',
  },
];

/**
 * 建立完整股利政策設定
 * @param preferredRate 優先股股息率（%）
 */
export const createDefaultDividendPolicySettings = (preferredRate?: number): DividendPolicySettings => ({
  id: `policy-${Date.now()}`,
  name: 'LBO標準分紅政策',
  covenants: DEFAULT_COVENANTS,
  tiers: DEFAULT_TIERS,
  waterfallRules: createDefaultWaterfallRules(preferredRate),
  timing: {
    frequency: 'annual',
    evaluationDate: 'Q4+45',
    paymentDate: 'Q2-end',
  },
  redemptionStrategy: {
    year1: 0,
    year2: 0,
    year3: 20,
    year4: 30,
    year5: 50,
  },
});
