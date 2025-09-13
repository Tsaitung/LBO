import React from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ActionButtons from './ActionButtons';
import { FutureAssumptions } from '../types/financial';

// Smart hooks
import { useAppDispatch, useFutureAssumptions, useBusinessMetrics } from '../hooks/typed-hooks';

// Modular imports
import { updateAssumptions } from '../store/slices/assumptions.slice';

const FutureAssumptionsComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const futureAssumptions = useFutureAssumptions();
  const businessMetrics = useBusinessMetrics(); // 獲取併購前業務指標

  // 計算歷史財務比率 (reserved for future display)
  // const historicalCogsRatio = businessMetrics.revenue > 0 
  //   ? ((businessMetrics.cogs / businessMetrics.revenue) * 100).toFixed(1) 
  //   : '0.0';
  
  // const historicalOpexRatio = businessMetrics.revenue > 0 
  //   ? ((businessMetrics.operatingExpenses / businessMetrics.revenue) * 100).toFixed(1) 
  //   : '0.0';
  
  const historicalEbitdaMargin = businessMetrics.revenue > 0 
    ? ((businessMetrics.ebitda / businessMetrics.revenue) * 100).toFixed(1) 
    : '0.0';
  
  const historicalNetMargin = businessMetrics.revenue > 0 
    ? ((businessMetrics.netIncome / businessMetrics.revenue) * 100).toFixed(1) 
    : '0.0';
  
  const historicalDaRatio = businessMetrics.revenue > 0 
    ? ((businessMetrics.depreciationAmortization / businessMetrics.revenue) * 100).toFixed(1) 
    : '0.0';
  
  const historicalCapexRatio = businessMetrics.revenue > 0 && businessMetrics.investingCashFlow < 0
    ? ((Math.abs(businessMetrics.investingCashFlow) / businessMetrics.revenue) * 100).toFixed(1) 
    : '7.5'; // 預設值
  
  const effectiveTaxRate = businessMetrics.ebitda > businessMetrics.depreciationAmortization 
    ? ((businessMetrics.taxExpense / (businessMetrics.ebitda - businessMetrics.depreciationAmortization)) * 100).toFixed(1)
    : '20.0';
  
  // 計算歷史營運資本天數
  const historicalArDays = businessMetrics.revenue > 0 
    ? ((businessMetrics.accountsReceivable / businessMetrics.revenue) * 365).toFixed(0)
    : '45';
  
  const historicalInventoryDays = businessMetrics.cogs > 0 
    ? ((businessMetrics.inventory / businessMetrics.cogs) * 365).toFixed(0)
    : '37';
  
  const historicalApDays = businessMetrics.cogs > 0 
    ? ((businessMetrics.accountsPayable / businessMetrics.cogs) * 365).toFixed(0)
    : '33';

  const handleInputChange = (field: keyof FutureAssumptions, value: string) => {
    const numValue = parseFloat(value) || 0;
    dispatch(updateAssumptions({ [field]: numValue }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="primary">
        Future Assumptions - 未來預期假設
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        設定未來年度的關鍵財務假設，包括增長率、利潤率、資本支出等。這些假設將用於財務預測計算。
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 成本結構假設改由 Scenario Manager 管理（此處移除） */}

        {/* 增長假設 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📈 增長假設
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="營收增長率 (Revenue Growth Rate)"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.revenueGrowthRate}
              onChange={(e) => handleInputChange('revenueGrowthRate', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText="年度營收預期增長率"
            />

            <TextField
              fullWidth
              label="EBITDA 利潤率 (EBITDA Margin)"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.ebitdaMargin}
              onChange={(e) => handleInputChange('ebitdaMargin', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText={`目前為: ${historicalEbitdaMargin}% | EBITDA 占營收的比例`}
            />

            <TextField
              fullWidth
              label="淨利率 (Net Margin)"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.netMargin}
              onChange={(e) => handleInputChange('netMargin', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText={`目前為: ${historicalNetMargin}% | 淨利占營收的比例`}
            />
          </Box>
        </Paper>

        {/* 資本支出假設 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🏗️ 資本支出假設
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="CapEx/營收比例"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.capexAsPercentageOfRevenue}
              onChange={(e) => handleInputChange('capexAsPercentageOfRevenue', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText={`目前為: ${historicalCapexRatio}% | 資本支出占營收的比例`}
            />

            <TextField
              fullWidth
              label="CapEx 增長率"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.capexGrowthRate}
              onChange={(e) => handleInputChange('capexGrowthRate', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText="資本支出年度增長率"
            />
          </Box>
        </Paper>

        {/* 營運資本假設 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📊 營運資本假設
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="應收帳款天數 (AR Days)"
              type="number"
              value={futureAssumptions.accountsReceivableDays}
              onChange={(e) => handleInputChange('accountsReceivableDays', e.target.value)}
              InputProps={{
                endAdornment: '天',
              }}
              helperText={`目前為: ${historicalArDays} 天 | 應收帳款平均回收天數`}
            />

            <TextField
              fullWidth
              label="存貨天數 (Inventory Days)"
              type="number"
              value={futureAssumptions.inventoryDays}
              onChange={(e) => handleInputChange('inventoryDays', e.target.value)}
              InputProps={{
                endAdornment: '天',
              }}
              helperText={`目前為: ${historicalInventoryDays} 天 | 存貨平均週轉天數`}
            />

            <TextField
              fullWidth
              label="應付帳款天數 (AP Days)"
              type="number"
              value={futureAssumptions.accountsPayableDays}
              onChange={(e) => handleInputChange('accountsPayableDays', e.target.value)}
              InputProps={{
                endAdornment: '天',
              }}
              helperText={`目前為: ${historicalApDays} 天 | 應付帳款平均付款天數`}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="white">
              計算得出的淨營運資本天數 (NWC Days)
            </Typography>
            <Typography variant="h6" color="white">
              {futureAssumptions.accountsReceivableDays + futureAssumptions.inventoryDays - futureAssumptions.accountsPayableDays} 天
            </Typography>
          </Box>
        </Paper>

        {/* 其他假設 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            ⚙️ 其他財務假設
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="稅率 (Tax Rate)"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.taxRate}
              onChange={(e) => handleInputChange('taxRate', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText={`目前有效稅率: ${effectiveTaxRate}% | 企業所得稅稅率`}
            />

            <TextField
              fullWidth
              label="折現率 (Discount Rate)"
              type="number"
              inputProps={{ step: "0.1" }}
              value={futureAssumptions.discountRate}
              onChange={(e) => handleInputChange('discountRate', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText="用於計算NPV的折現率"
            />
          </Box>
        </Paper>

        {/* 計算參數設定 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔧 計算參數設定
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            這些參數可以根據實際情況調整。
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="D&A/CapEx 比例"
              type="number"
              inputProps={{ step: "1" }}
              value={futureAssumptions.depreciationToCapexRatio}
              onChange={(e) => handleInputChange('depreciationToCapexRatio', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText={`目前 D&A/營收: ${historicalDaRatio}% | 折舊攤銷佔資本支出的比例（預設 20%）`}
            />

            <TextField
              fullWidth
              label="固定資產/CapEx 倍數"
              type="number"
              inputProps={{ step: "1" }}
              value={futureAssumptions.fixedAssetsToCapexMultiple}
              onChange={(e) => handleInputChange('fixedAssetsToCapexMultiple', e.target.value)}
              InputProps={{
                endAdornment: '倍',
              }}
              helperText="初始固定資產為年度 CapEx 的倍數（預設 10倍）"
            />

            <TextField
              fullWidth
              label="循環信用年償還率"
              type="number"
              inputProps={{ step: "5" }}
              value={futureAssumptions.revolvingCreditRepaymentRate}
              onChange={(e) => handleInputChange('revolvingCreditRepaymentRate', e.target.value)}
              InputProps={{
                endAdornment: '%',
              }}
              helperText="循環信用每年償還餘額的比例（預設 20%）"
            />
          </Box>
        </Paper>

        {/* 假設摘要 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📋 假設摘要
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="white">
                年度營收增長
              </Typography>
              <Typography variant="h5" color="white">
                {futureAssumptions.revenueGrowthRate}%
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="white">
                EBITDA 利潤率
              </Typography>
              <Typography variant="h5" color="white">
                {futureAssumptions.ebitdaMargin}%
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="white">
                資本支出比例
              </Typography>
              <Typography variant="h5" color="white">
                {futureAssumptions.capexAsPercentageOfRevenue}%
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="white">
                稅率
              </Typography>
              <Typography variant="h5" color="white">
                {futureAssumptions.taxRate}%
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 動作按鈕 */}
      <ActionButtons
        title="未來預期假設設定完成"
        onProceed={() => navigate('/mna-deal-design')}
        nextStepLabel="設計併購交易"
      />
    </Box>
  );
};

export default FutureAssumptionsComponent;
