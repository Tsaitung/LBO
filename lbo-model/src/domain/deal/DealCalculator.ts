/**
 * 統一的交易計算中心
 * Linus 原則：單一真相來源，消除特殊案例
 */

import { ScenarioAssumptions, MnaDealDesign } from '../../types/financial';

export class DealCalculator {
  /**
   * 計算企業價值 (EV)
   * 統一使用仟元為基礎單位
   */
  static calculateEnterpriseValue(
    ebitdaInThousands: number, 
    multiple: number
  ): number {
    return ebitdaInThousands * multiple;
  }

  /**
   * 計算收購價格
   * 簡化邏輯：購買價 = EV（無特殊案例）
   */
  static calculatePurchasePrice(
    ebitdaInThousands: number,
    scenario: ScenarioAssumptions,
    dealDesign?: MnaDealDesign
  ): number {
    const ev = this.calculateEnterpriseValue(ebitdaInThousands, scenario.entryEvEbitdaMultiple);
    
    // 簡化：購買價格 = EV
    // 不管是資產交易還是股權收購，都使用 EV
    return ev;
  }

  /**
   * 計算交易費用
   */
  static calculateTransactionFees(
    purchasePrice: number,
    feePercentage: number = 2
  ): number {
    return purchasePrice * (feePercentage / 100);
  }

  /**
   * 計算分期付款金額
   * 統一處理新舊付款系統
   */
  static calculatePaymentAmount(
    purchasePrice: number,
    period: number, // 1=Year0, 2=Year1, 3=Year2
    dealDesign: MnaDealDesign
  ): number {
    // 優先使用 paymentSchedule（新系統）
    const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];
    
    if (schedule.length > 0) {
      const paymentPct = schedule
        .filter((s) => s?.paymentMethod === 'cash' && Number(s?.period) === period)
        .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0);
      return purchasePrice * (paymentPct / 100);
    }
    
    // Fallback：使用 paymentStructure（舊系統）
    const ps = dealDesign?.paymentStructure || {};
    const periodMap: Record<number, number> = {
      1: Number(ps.upfrontPayment ?? 0),
      2: Number(ps.year1MilestonePayment ?? 0),
      3: Number(ps.year2MilestonePayment ?? 0),
    };
    
    const paymentPct = periodMap[period] || 0;
    return purchasePrice * (paymentPct / 100);
  }

  /**
   * 驗證付款比例總和
   * Linus 原則：數據完整性檢查
   */
  static validatePaymentStructure(dealDesign: MnaDealDesign): {
    isValid: boolean;
    totalPercentage: number;
    message?: string;
  } {
    const ps = dealDesign?.paymentStructure;
    if (!ps) {
      return { isValid: false, totalPercentage: 0, message: '缺少付款結構設定' };
    }
    
    const total = (ps.upfrontPayment || 0) + 
                  (ps.year1MilestonePayment || 0) + 
                  (ps.year2MilestonePayment || 0);
    
    const isValid = Math.abs(total - 100) < 0.01; // 容忍 0.01% 誤差
    
    return {
      isValid,
      totalPercentage: total,
      message: isValid ? undefined : `付款比例總和為 ${total}%，應為 100%`
    };
  }

  /**
   * 轉換為百萬元顯示
   * UI 顯示專用
   */
  static toMillions(valueInThousands: number): number {
    return valueInThousands / 1000;
  }

  /**
   * 轉換為仟元計算
   * 從百萬元輸入轉換
   */
  static toThousands(valueInMillions: number): number {
    return valueInMillions * 1000;
  }
}