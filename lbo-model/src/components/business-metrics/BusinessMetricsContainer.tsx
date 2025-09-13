/**
 * BusinessMetrics 容器組件
 * Linus 原則：純協調，不含業務邏輯
 * 職責：協調子組件，管理狀態更新
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { useBusinessMetrics } from '../../hooks/typed-hooks';
import { setBusinessMetrics } from '../../store/slices/businessMetrics.slice';
import { useMetricsCalculation } from './hooks/useMetricsCalculation';
import { RevenueMetricsForm } from './forms/RevenueMetricsForm';
import { ProfitabilityForm } from './forms/ProfitabilityForm';
import { AssetMetricsForm } from './forms/AssetMetricsForm';
import { LiabilityMetricsForm } from './forms/LiabilityMetricsForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = React.memo(({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
});

/**
 * BusinessMetrics 容器組件
 */
const BusinessMetricsContainer: React.FC = () => {
  const dispatch = useDispatch();
  const businessMetrics = useBusinessMetrics();
  const [tabValue, setTabValue] = useState(0);
  
  // 使用計算 hook
  const calculations = useMetricsCalculation(businessMetrics);
  
  // 處理頁籤切換
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 統一的更新函數
  const handleMetricChange = useCallback((field: string, value: number | boolean) => {
    const updatedMetrics = {
      ...businessMetrics,
      [field]: value,
    };
    
    // 如果是計算相關的欄位，更新計算值
    const allMetrics = {
      ...updatedMetrics,
      ...calculations.getCalculatedMetrics(),
    };
    
    dispatch(setBusinessMetrics({
      data: allMetrics,
      taxRate: 20, // 預設稅率 20%
    }));
  }, [businessMetrics, calculations, dispatch]);
  
  // 合併所有指標
  const allMetrics = useMemo(() => ({
    ...businessMetrics,
    ...calculations.getCalculatedMetrics(),
  }), [businessMetrics, calculations]);
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        併購前業務指標 (Business Metrics Before Acquisition)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>指標輸入說明</AlertTitle>
        請輸入目標公司併購前的最新財務數據。所有金額單位為新台幣仟元。
        灰色欄位為自動計算值，無需手動輸入。
      </Alert>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="營收指標" />
          <Tab label="獲利能力" />
          <Tab label="資產" />
          <Tab label="負債與權益" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <RevenueMetricsForm
            revenue={allMetrics.revenue}
            cogs={allMetrics.cogs}
            grossProfit={calculations.grossProfit}
            grossMargin={calculations.grossMargin}
            onChange={handleMetricChange}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ProfitabilityForm
            operatingExpenses={allMetrics.operatingExpenses}
            ebitda={calculations.ebitda}
            depreciationAmortization={allMetrics.depreciationAmortization}
            interestExpense={allMetrics.interestExpense}
            taxExpense={allMetrics.taxExpense}
            netIncome={calculations.netIncome}
            onChange={handleMetricChange}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <AssetMetricsForm
            cashAndCashEquivalents={allMetrics.cashAndCashEquivalents}
            cashIncludedInTransaction={allMetrics.cashIncludedInTransaction}
            accountsReceivable={allMetrics.accountsReceivable}
            arIncludedInTransaction={allMetrics.arIncludedInTransaction}
            inventory={allMetrics.inventory}
            inventoryIncludedInTransaction={allMetrics.inventoryIncludedInTransaction}
            propertyPlantEquipment={allMetrics.propertyPlantEquipment}
            ppeIncludedInTransaction={allMetrics.ppeIncludedInTransaction}
            totalAssets={calculations.totalAssets}
            onChange={handleMetricChange}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <LiabilityMetricsForm
            accountsPayable={allMetrics.accountsPayable}
            apIncludedInTransaction={allMetrics.apIncludedInTransaction}
            shortTermDebt={allMetrics.shortTermDebt}
            stdIncludedInTransaction={allMetrics.stdIncludedInTransaction}
            longTermDebt={allMetrics.longTermDebt}
            ltdIncludedInTransaction={allMetrics.ltdIncludedInTransaction}
            otherCurrentLiabilities={allMetrics.otherCurrentLiabilities}
            oclIncludedInTransaction={allMetrics.oclIncludedInTransaction}
            otherLongTermLiabilities={allMetrics.otherLongTermLiabilities}
            oltlIncludedInTransaction={allMetrics.oltlIncludedInTransaction}
            totalLiabilities={calculations.totalLiabilities}
            shareholdersEquity={calculations.shareholdersEquity}
            onChange={handleMetricChange}
          />
        </TabPanel>
      </Paper>
      
      {/* 摘要資訊 */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>關鍵財務指標摘要</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">EBITDA</Typography>
            <Typography variant="h6">{calculations.ebitda.toLocaleString()} 仟元</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">淨利</Typography>
            <Typography variant="h6">{calculations.netIncome.toLocaleString()} 仟元</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">總資產</Typography>
            <Typography variant="h6">{calculations.totalAssets.toLocaleString()} 仟元</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">股東權益</Typography>
            <Typography variant="h6">{calculations.shareholdersEquity.toLocaleString()} 仟元</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">營運資本</Typography>
            <Typography variant="h6">{calculations.workingCapital.toLocaleString()} 仟元</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">毛利率</Typography>
            <Typography variant="h6">{calculations.grossMargin.toFixed(2)}%</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default React.memo(BusinessMetricsContainer);