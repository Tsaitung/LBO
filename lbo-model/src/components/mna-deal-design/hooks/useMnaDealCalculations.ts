/**
 * M&A Deal 計算 Hook
 * Linus 原則：純計算，無副作用
 */

import { useMemo } from 'react';
import { 
  useMnaDealDesign, 
  useBusinessMetrics,
  useCurrentScenario,
  useScenarios
} from '../../../hooks/typed-hooks';

/**
 * 統一計算邏輯
 * 無特殊案例，純數據流
 */
export function useMnaDealCalculations() {
  const mnaDealDesign = useMnaDealDesign();
  const businessMetrics = useBusinessMetrics();
  const currentScenarioKey = useCurrentScenario();
  const scenarios = useScenarios();
  const currentScenario = scenarios[currentScenarioKey];

  // 企業價值計算
  const enterpriseValue = useMemo(() => {
    if (!businessMetrics?.ebitda || !currentScenario?.entryEvEbitdaMultiple) {
      return 0;
    }
    return businessMetrics.ebitda * currentScenario.entryEvEbitdaMultiple;
  }, [businessMetrics?.ebitda, currentScenario?.entryEvEbitdaMultiple]);

  // 選定資產價值計算
  const selectedAssetValue = useMemo(() => {
    if (!mnaDealDesign?.assetSelections || !businessMetrics) {
      return 0;
    }

    let total = 0;
    const selections = mnaDealDesign.assetSelections;

    if (selections.cashAndCashEquivalents) {
      total += businessMetrics.cashAndCashEquivalents || 0;
    }
    if (selections.accountsReceivable) {
      total += businessMetrics.accountsReceivable || 0;
    }
    if (selections.inventory) {
      total += businessMetrics.inventory || 0;
    }
    if (selections.propertyPlantEquipment) {
      total += businessMetrics.propertyPlantEquipment || 0;
    }

    return total;
  }, [mnaDealDesign?.assetSelections, businessMetrics]);

  // 交易費用計算
  const transactionFee = useMemo(() => {
    if (!mnaDealDesign?.transactionFeePercentage) {
      return 0;
    }
    return enterpriseValue * mnaDealDesign.transactionFeePercentage / 100;
  }, [enterpriseValue, mnaDealDesign?.transactionFeePercentage]);

  // 分期付款計算
  const calculateInstallmentAmount = (percentage: number) => {
    const baseValue = mnaDealDesign?.dealType === 'assetAcquisition' 
      ? selectedAssetValue 
      : enterpriseValue;
    return baseValue * percentage / 100;
  };

  // 付款排程總計驗證
  const paymentScheduleTotalPercentage = useMemo(() => {
    if (!mnaDealDesign?.assetDealSettings?.paymentSchedule?.schedule) {
      return 0;
    }
    return mnaDealDesign.assetDealSettings.paymentSchedule.schedule.reduce(
      (total, installment) => total + installment.percentage,
      0
    );
  }, [mnaDealDesign?.assetDealSettings?.paymentSchedule?.schedule]);

  return {
    enterpriseValue,
    selectedAssetValue,
    transactionFee,
    calculateInstallmentAmount,
    paymentScheduleTotalPercentage,
  };
}