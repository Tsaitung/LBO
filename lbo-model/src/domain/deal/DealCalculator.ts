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
   * 購買價 = EV（不論交易類型）
   *
   * 注意：資產收購時，若只購買部分資產，差額會形成商譽
   * 這反映的是賣方不會因為只賣部分資產就降價的商業現實
   */
  static calculatePurchasePrice(
    ebitdaInThousands: number,
    scenario: ScenarioAssumptions,
    dealDesign?: MnaDealDesign
  ): number {
    const ev = this.calculateEnterpriseValue(ebitdaInThousands, scenario.entryEvEbitdaMultiple);
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
   * 計算頭期款金額（交割前/交割時的付款）
   * 用於資產收購時的商譽計算
   *
   * @param purchasePrice - 總購買價格
   * @param dealDesign - 交易設計
   * @returns 頭期款金額
   */
  static calculateUpfrontPayment(
    purchasePrice: number,
    dealDesign: MnaDealDesign
  ): number {
    const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];

    if (schedule.length > 0) {
      // 篩選交割前/交割時的現金付款
      const upfrontPct = schedule
        .filter((s) => {
          if (s?.paymentMethod !== 'cash') return false;
          const timing = s?.timing;
          // 只計入 preClosing 和 closing
          return timing === 'preClosing' || timing === 'closing';
        })
        .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0);
      return purchasePrice * (upfrontPct / 100);
    }

    // Fallback：使用 paymentStructure 的 upfrontPayment
    const ps = dealDesign?.paymentStructure || {};
    const upfrontPct = Number(ps.upfrontPayment ?? 0);
    return purchasePrice * (upfrontPct / 100);
  }

  /**
   * 計算後續款項金額（Year 1+ 的付款，視為費用）
   * 用於資產收購時的費用計算
   *
   * @param purchasePrice - 總購買價格
   * @param year - 目標年份
   * @param dealDesign - 交易設計
   * @returns 該年度的後續款項金額
   */
  static calculateDeferredPaymentExpense(
    purchasePrice: number,
    year: number,
    dealDesign: MnaDealDesign
  ): number {
    // 只有 Year 1+ 才有後續款項費用
    if (year <= 0) return 0;

    const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];

    if (schedule.length > 0) {
      const deferredPct = schedule
        .filter((s) => {
          if (s?.paymentMethod !== 'cash') return false;
          const itemYear = this.timingToYear(s?.timing);
          // 只計入 Year 1+ 的付款
          return itemYear === year && itemYear > 0;
        })
        .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0);
      return purchasePrice * (deferredPct / 100);
    }

    // Fallback：使用 paymentStructure
    const ps = dealDesign?.paymentStructure || {};
    if (year === 1) return purchasePrice * (Number(ps.year1MilestonePayment ?? 0) / 100);
    if (year === 2) return purchasePrice * (Number(ps.year2MilestonePayment ?? 0) / 100);
    return 0;
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