import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useScenarios, useCurrentScenario } from '../../hooks/typed-hooks';
import { calculateEquityReturns } from './components/EquityReturnsCalculator';
import { ReturnMetricsTable } from './components/ReturnMetricsTable';
import { AnnualReturnsTable } from './components/AnnualReturnsTable';
import { CashFlowWaterfall } from './components/CashFlowWaterfall';
import { ReturnsSummaryCard } from './components/ReturnsSummaryCard';
import { ProFormaDataItem } from './hooks/useProFormaData';
import { BusinessMetricsBeforeAcquisition, MnaDealDesign, FutureAssumptions } from '../../types/financial';

interface InvestmentAnalysisProps {
  proFormaData: ProFormaDataItem[];
  businessMetrics: BusinessMetricsBeforeAcquisition;
  mnaDealDesign: MnaDealDesign;
  futureAssumptions: FutureAssumptions;
  globalEnterpriseValue: number;
}

/**
 * Refactored Investment Analysis Component
 * Follows Linus principle: "Functions do ONE thing and do it well"
 * Split from 770 lines to multiple focused components
 */
const InvestmentAnalysisRefactored: React.FC<InvestmentAnalysisProps> = ({
  proFormaData,
  businessMetrics,
  mnaDealDesign,
  futureAssumptions,
  globalEnterpriseValue,
}) => {
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  const currentScenarioData = scenarios?.[currentScenarioKey];
  const exitMultiple = currentScenarioData?.exitEvEbitdaMultiple || 0;
  
  // Discount rate from Assumptions
  const discountRate = futureAssumptions?.discountRate ?? 0;
  const discountRateDecimal = discountRate / 100;

  // Calculate equity returns using extracted logic
  const equityAnalysis = calculateEquityReturns({
    proFormaData,
    mnaDealDesign,
    exitMultiple,
    discountRateDecimal,
  });

  // Error handling - simple and clear
  if (!equityAnalysis) {
    return (
      <Box>
        <Alert severity="warning">
          <AlertTitle>投資分析無法計算</AlertTitle>
          請確認已設定退出倍數和財務預測數據。
        </Alert>
      </Box>
    );
  }

  if (equityAnalysis.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          <AlertTitle>尚未設定股權投資</AlertTitle>
          請先在融資規劃中設定股權投資項目。
        </Alert>
      </Box>
    );
  }

  const totalInvestment = equityAnalysis.reduce((sum, e) => sum + e.investmentAmount, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 投資分析
      </Typography>

      {/* Investment Returns Summary */}
      <ReturnsSummaryCard 
        equityAnalysis={equityAnalysis}
        totalInvestment={totalInvestment}
      />

      {/* Return Metrics by Investor */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            投資者回報分析
          </Typography>
          <ReturnMetricsTable equityAnalysis={equityAnalysis} />
        </CardContent>
      </Card>

      {/* Annual Returns Analysis */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            年度回報分析 (PE Industry Metrics)
          </Typography>
          <AnnualReturnsTable 
            proFormaData={proFormaData}
            totalInvestment={totalInvestment}
          />
        </CardContent>
      </Card>

      {/* Cash Flow Waterfall */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            現金流瀑布圖
          </Typography>
          <CashFlowWaterfall 
            equityAnalysis={equityAnalysis}
            planningHorizon={mnaDealDesign.planningHorizon}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvestmentAnalysisRefactored;