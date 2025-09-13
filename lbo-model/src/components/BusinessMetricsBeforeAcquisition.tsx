/**
 * Business Metrics Before Acquisition Component
 * Main orchestrator using modular tab components
 * Following Linus principle: Orchestrate, don't implement
 */

import React, { useState } from 'react';
import { Box, Typography, Alert, AlertTitle, Paper, Tabs, Tab } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useBusinessMetrics, useAssumptions } from '../hooks/typed-hooks';
import { setBusinessMetrics } from '../store/slices/businessMetrics.slice';
import { BusinessMetricsBeforeAcquisition as BusinessMetricsType } from '../types/financial';

// Import modular components
import IncomeStatementTab from './business-metrics/IncomeStatementTab';
import BalanceSheetTab from './business-metrics/BalanceSheetTab';
import CashFlowTab from './business-metrics/CashFlowTab';
import MetricsSummaryCard from './business-metrics/MetricsSummaryCard';

const BusinessMetricsBeforeAcquisition: React.FC = () => {
  const dispatch = useDispatch();
  const businessMetrics = useBusinessMetrics();
  const futureAssumptions = useAssumptions();
  const [currentTab, setCurrentTab] = useState(0);

  // Calculate working capital (流動資產 - 流動負債)
  const calculateWorkingCapital = () => {
    const currentAssets = 
      businessMetrics.cashAndCashEquivalents + 
      businessMetrics.accountsReceivable + 
      businessMetrics.inventory;
    const currentLiabilities = 
      businessMetrics.accountsPayable + 
      businessMetrics.shortTermDebt + 
      businessMetrics.otherCurrentLiabilities;
    return currentAssets - currentLiabilities;
  };

  // Unified update function with tax rate
  const updateMetrics = (updates: Partial<BusinessMetricsType>) => {
    dispatch(setBusinessMetrics({
      data: updates,
      taxRate: futureAssumptions.taxRate
    }));
  };

  const handleInputChange = (field: keyof BusinessMetricsType, value: string | boolean) => {
    if (typeof value === 'boolean') {
      updateMetrics({ [field]: value });
    } else {
      const numValue = parseFloat(value.replace(/,/g, '')) || 0;
      updateMetrics({ [field]: numValue });
    }
  };

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return value.toLocaleString('zh-TW');
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return value.toLocaleString('zh-TW', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        併購前業務指標 (Business Metrics Before Acquisition)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Year 0 財務數據</AlertTitle>
        請輸入被併購公司的最近期財務數據。所有金額單位為新台幣千元 (NTD 1,000)。
      </Alert>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="損益表指標" />
          <Tab label="資產負債表" />
          <Tab label="現金流量" />
        </Tabs>

        {/* Income Statement Tab */}
        {currentTab === 0 && (
          <IncomeStatementTab
            businessMetrics={businessMetrics}
            taxRate={futureAssumptions.taxRate}
            onInputChange={handleInputChange}
            formatNumber={formatNumber}
          />
        )}

        {/* Balance Sheet Tab */}
        {currentTab === 1 && (
          <BalanceSheetTab
            businessMetrics={businessMetrics}
            onInputChange={handleInputChange}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            calculateWorkingCapital={calculateWorkingCapital}
          />
        )}

        {/* Cash Flow Tab */}
        {currentTab === 2 && (
          <CashFlowTab
            businessMetrics={businessMetrics}
            onInputChange={handleInputChange}
            formatNumber={formatNumber}
          />
        )}
      </Paper>

      {/* Summary Metrics */}
      <MetricsSummaryCard businessMetrics={businessMetrics} />
    </Box>
  );
};

export default BusinessMetricsBeforeAcquisition;