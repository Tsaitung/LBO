/**
 * Pro Forma Financials Component (Refactored)
 * Main orchestrator using modular components
 * Following Linus principle: Orchestrate, don't implement
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// Import hooks
import { useProFormaData, calculateKeyMetrics } from './hooks/useProFormaData';
import { useBusinessMetrics, useMnaDeal, useScenarios, useAssumptions, useCurrentScenario } from '../../hooks/typed-hooks';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

// Import components
import IncomeStatementTab from './components/IncomeStatementTab';
import CashFlowStatementTab from './components/CashFlowStatementTab';
import DividendDistributionTab from './components/DividendDistributionTab';
import KeyMetricsCards from './components/KeyMetricsCards';
import BalanceSheetSection from './BalanceSheetSection';
import InvestmentAnalysis from './InvestmentAnalysisRefactored';
import ErrorBoundary from '../common/ErrorBoundary';

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo<TabPanelProps>(({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

const ProFormaFinancials: React.FC = () => {
  // Performance monitoring
  usePerformanceMonitor('ProFormaFinancials', 20);

  const [tabValue, setTabValue] = useState(0);
  
  // Get data from hooks
  const { data: proFormaData, hasData, enterpriseValue, entryMultiple } = useProFormaData();
  const businessMetrics = useBusinessMetrics();
  const mnaDealDesign = useMnaDeal();
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  const futureAssumptions = useAssumptions();

  // Calculate key metrics using memoization
  const keyMetrics = useMemo(() => {
    if (!proFormaData || proFormaData.length === 0) {
      return {
        enterpriseValue: '0',
        entryMultiple: '0',
        currentScenario: 'Base',
        entryLeverage: '0',
        exitLeverage: '0',
        fcffCAGR: 0,
        avgEbitdaMargin: 0,
      };
    }
    return calculateKeyMetrics(
      proFormaData,
      businessMetrics,
      mnaDealDesign,
      scenarios,
      currentScenarioKey,
      entryMultiple,
      enterpriseValue
    );
  }, [proFormaData, businessMetrics, mnaDealDesign, scenarios, currentScenarioKey, entryMultiple, enterpriseValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Show loading state if no data
  if (!hasData || !proFormaData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
          <AlertTitle>請先計算財務預測</AlertTitle>
          請點擊上方導航欄的「重算 Year1~N」按鈕來生成財務預測數據。
        </Alert>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            合併報表預測 (Pro Forma Financials)
          </Typography>
          
          {/* Key Metrics Cards */}
          <KeyMetricsCards
            metrics={keyMetrics}
            dealType={mnaDealDesign?.dealType}
            planningHorizon={mnaDealDesign?.planningHorizon}
          />
        </Box>

        {/* Main Content */}
        <Card>
          <CardContent>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="financial statements tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<TrendingUpIcon />} label="損益表" />
              <Tab icon={<AccountBalanceWalletIcon />} label="資產負債表" />
              <Tab icon={<MonetizationOnIcon />} label="現金流量表" />
              <Tab icon={<AssessmentIcon />} label="股利分配表" />
              <Tab icon={<ShowChartIcon />} label="投資分析" />
            </Tabs>

            {/* Income Statement Tab */}
            <TabPanel value={tabValue} index={0}>
              <IncomeStatementTab proFormaData={proFormaData} />
            </TabPanel>

            {/* Balance Sheet Tab */}
            <TabPanel value={tabValue} index={1}>
              <BalanceSheetSection 
                proFormaData={proFormaData}
                businessMetrics={businessMetrics}
                futureAssumptions={futureAssumptions}
                mnaDealDesign={mnaDealDesign}
                currentScenarioData={scenarios?.scenarios?.[currentScenarioKey] || scenarios?.base || undefined}
              />
            </TabPanel>

            {/* Cash Flow Tab */}
            <TabPanel value={tabValue} index={2}>
              <CashFlowStatementTab proFormaData={proFormaData} />
            </TabPanel>

            {/* Dividend Distribution Tab */}
            <TabPanel value={tabValue} index={3}>
              <DividendDistributionTab proFormaData={proFormaData} />
            </TabPanel>

            {/* Investment Analysis Tab */}
            <TabPanel value={tabValue} index={4}>
              <InvestmentAnalysis 
                proFormaData={proFormaData}
                businessMetrics={businessMetrics}
                futureAssumptions={futureAssumptions}
                mnaDealDesign={mnaDealDesign}
                globalEnterpriseValue={enterpriseValue}
              />
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </ErrorBoundary>
  );
};

export default ProFormaFinancials;