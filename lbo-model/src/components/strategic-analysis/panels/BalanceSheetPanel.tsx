/**
 * 資產負債表面板組件
 * Linus 原則：單一職責 - 顯示資產負債表數據
 */

import React from 'react';
import { ProFormaDataItem } from '../hooks/useProFormaData';
import { useProFormaCalculations } from '../hooks/useProFormaCalculations';
import BalanceSheetSection from '../BalanceSheetSection';

interface BalanceSheetPanelProps {
  data: ProFormaDataItem[];
}

/**
 * 資產負債表面板
 * 委託給現有的 BalanceSheetSection 組件處理
 */
export const BalanceSheetPanel: React.FC<BalanceSheetPanelProps> = React.memo(({ data }) => {
  // 獲取必要的數據
  const { 
    businessMetrics, 
    futureAssumptions, 
    mnaDealDesign, 
    currentScenarioData, 
    globalEnterpriseValue 
  } = useProFormaCalculations();
  
  return (
    <BalanceSheetSection 
      proFormaData={data as ProFormaDataItem[]}
      businessMetrics={businessMetrics}
      futureAssumptions={futureAssumptions}
      mnaDealDesign={mnaDealDesign}
      currentScenarioData={currentScenarioData || undefined}
      globalEnterpriseValue={globalEnterpriseValue}
    />
  );
});