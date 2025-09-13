/**
 * 投資分析面板組件
 * Linus 原則：純展示，委託給現有組件
 */

import React from 'react';
import { ProFormaDataItem } from '../hooks/useProFormaData';
import { KeyMetrics } from '../hooks/useProFormaMetrics';
import InvestmentAnalysis from '../InvestmentAnalysisRefactored';
import { useProFormaCalculations } from '../hooks/useProFormaCalculations';

interface InvestmentAnalysisPanelProps {
  data: ProFormaDataItem[];
  metrics: KeyMetrics;
}

/**
 * 投資分析面板
 * 委託給現有的 InvestmentAnalysis 組件處理
 */
export const InvestmentAnalysisPanel: React.FC<InvestmentAnalysisPanelProps> = React.memo(({ data }) => {
  const { 
    businessMetrics, 
    futureAssumptions, 
    mnaDealDesign, 
    globalEnterpriseValue 
  } = useProFormaCalculations();
  
  return (
    <InvestmentAnalysis 
      proFormaData={data}
      businessMetrics={businessMetrics}
      futureAssumptions={futureAssumptions}
      mnaDealDesign={mnaDealDesign}
      globalEnterpriseValue={globalEnterpriseValue}
    />
  );
});