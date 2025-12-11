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
   * 將 timing 轉換為年份
   * @param timing - 付款時間點
   * @returns 對應的年份 (0, 1, 2, ...)
   */
  private static timingToYear(timing: string | undefined): number {
    if (!timing) return 0;
    if (timing === 'preClosing' || timing === 'closing') return 0;
    if (timing === 'postClosing') return 0; // 交割後仍算 Year 0
    if (timing.startsWith('year')) {
      const n = Number(timing.replace('year', ''));
      return isNaN(n) ? 0 : n;
    }
    if (timing === 'milestone') return -1; // 里程碑特殊處理，不在固定年份
    return 0;
  }

  /**
   * 計算分期付款金額
   * 統一處理新舊付款系統
   *
   * @param purchasePrice - 購買價格
   * @param year - 目標年份 (0, 1, 2, ...)
   * @param dealDesign - 交易設計
   * @param timingDetail - 可選：篩選期初('beginning')或期末('end')，不指定則兩者都計入
   */
  static calculatePaymentAmount(
    purchasePrice: number,
    year: number,
    dealDesign: MnaDealDesign,
    timingDetail?: 'beginning' | 'end'
  ): number {
    // 優先使用 paymentSchedule（新系統）
    const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];

    if (schedule.length > 0) {
      const paymentPct = schedule
        .filter((s) => {
          // 篩選現金付款
          if (s?.paymentMethod !== 'cash') return false;
          // 根據 timing 轉換為年份並比對
          const itemYear = this.timingToYear(s?.timing);
          if (itemYear !== year) return false;
          // 如果指定了 timingDetail，進一步篩選
          if (timingDetail && s?.timingDetail !== timingDetail) return false;
          return true;
        })
        .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0);
      return purchasePrice * (paymentPct / 100);
    }

    // Fallback：使用 paymentStructure（舊系統）
    // 舊系統：period 1=Year0, 2=Year1, 3=Year2
    const ps = dealDesign?.paymentStructure || {};
    const periodMap: Record<number, number> = {
      0: Number(ps.upfrontPayment ?? 0),
      1: Number(ps.year1MilestonePayment ?? 0),
      2: Number(ps.year2MilestonePayment ?? 0),
    };

    const paymentPct = periodMap[year] || 0;
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