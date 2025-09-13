/**
 * ProForma 財務預測容器組件
 * Linus 原則：純協調，不含業務邏輯
 * 職責：協調子組件，管理頁籤切換
 */

import React, { useState } from 'react';
import { Box, Card, CardContent, Tabs, Tab, Alert, AlertTitle, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// 導入自定義 hooks
import { useProFormaCalculations } from './hooks/useProFormaCalculations';
import { useProFormaMetrics } from './hooks/useProFormaMetrics';

// 導入面板組件
import { ProFormaHeader } from './panels/ProFormaHeader';
import { IncomeStatementPanel } from './panels/IncomeStatementPanel';
import { BalanceSheetPanel } from './panels/BalanceSheetPanel';
import { CashFlowPanel } from './panels/CashFlowPanel';
import { DividendDistributionPanel } from './panels/DividendDistributionPanel';
import { InvestmentAnalysisPanel } from './panels/InvestmentAnalysisPanel';

// 頁籤面板組件
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = React.memo(({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`proforma-tabpanel-${index}`}
      aria-labelledby={`proforma-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
});

/**
 * ProForma 容器組件
 * 職責：
 * 1. 協調子組件
 * 2. 管理頁籤狀態
 * 3. 提供數據給子組件
 */
const ProFormaContainer: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // 使用自定義 hooks 獲取數據
  const { proFormaData, isLoading, error } = useProFormaCalculations();
  const keyMetrics = useProFormaMetrics(proFormaData);
  
  // 處理頁籤切換
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 載入中狀態
  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // 錯誤或無數據狀態
  if (error || !proFormaData || proFormaData.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
          <AlertTitle>請先計算財務預測</AlertTitle>
          請點擊上方導航欄的「重算 Year1~N」按鈕來生成財務預測數據。
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* 頭部指標卡片 */}
      <ProFormaHeader metrics={keyMetrics} />
      
      {/* 主要內容區 */}
      <Card>
        <CardContent>
          {/* 頁籤導航 */}
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="財務報表頁籤"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<TrendingUpIcon />} label="損益表" />
            <Tab icon={<AccountBalanceWalletIcon />} label="資產負債表" />
            <Tab icon={<MonetizationOnIcon />} label="現金流量表" />
            <Tab icon={<AssessmentIcon />} label="股利分配表" />
            <Tab icon={<ShowChartIcon />} label="投資分析" />
          </Tabs>
          
          {/* 頁籤內容 */}
          <TabPanel value={tabValue} index={0}>
            <IncomeStatementPanel data={proFormaData} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <BalanceSheetPanel data={proFormaData} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <CashFlowPanel data={proFormaData} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <DividendDistributionPanel data={proFormaData} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <InvestmentAnalysisPanel data={proFormaData} metrics={keyMetrics} />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default React.memo(ProFormaContainer);