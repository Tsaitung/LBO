import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { useScenarios, useCurrentScenario, useKPIMetrics, useIsCalculated } from '../hooks/typed-hooks';

const Summary: React.FC = () => {
  // 遷移策略：優先使用新的域切片，回退到 facade
  // 使用統一的選擇器（單一數據源）
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  const kpiMetrics = useKPIMetrics();
  const isCalculated = useIsCalculated();
  const scenarioData = scenarios || {};
  const currentScenario: { entryEvEbitdaMultiple: number; exitEvEbitdaMultiple: number } = 
    ((scenarioData as unknown) as Record<string, unknown>)?.[currentScenarioKey] as { entryEvEbitdaMultiple: number; exitEvEbitdaMultiple: number } || 
    (((scenarioData as unknown) as { scenarios?: Record<string, unknown> })?.scenarios)?.[currentScenarioKey] as { entryEvEbitdaMultiple: number; exitEvEbitdaMultiple: number } ||
    ((scenarioData as unknown) as { base?: unknown })?.base as { entryEvEbitdaMultiple: number; exitEvEbitdaMultiple: number } ||
    { entryEvEbitdaMultiple: 0, exitEvEbitdaMultiple: 0 };

  if (!isCalculated && kpiMetrics.irr === 0 && kpiMetrics.moic === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom color="primary">
          Summary - KPI 分析與圖表
        </Typography>
        <Alert severity="warning">
          請先完成參數設定並點擊「重算 Year1~N」按鈕來生成財務預測。
        </Alert>
      </Box>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value * 1000);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="primary">
        Summary - KPI 分析與圖表
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        顯示關鍵投資指標、IRR、MOIC 和回報分析。當前使用 {String(currentScenarioKey).toUpperCase()} 情境參數。
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* 關鍵指標卡片 */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                IRR (內部報酬率)
              </Typography>
              <Typography variant="h3" color="white" sx={{ fontWeight: 'bold' }}>
                {formatPercentage(kpiMetrics.irr)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                MOIC (倍數投資資本)
              </Typography>
              <Typography variant="h3" color="white" sx={{ fontWeight: 'bold' }}>
                {kpiMetrics.moic.toFixed(1)}x
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                總回報
              </Typography>
              <Typography variant="h3" color="white" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(kpiMetrics.totalReturn)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card sx={{ bgcolor: 'secondary.light' }}>
            <CardContent>
              <Typography variant="h6" color="white" gutterBottom>
                回收期
              </Typography>
              <Typography variant="h3" color="white" sx={{ fontWeight: 'bold' }}>
                {kpiMetrics.paybackPeriod} 年
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 倍數比較 */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              投資倍數比較
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {currentScenario.entryEvEbitdaMultiple}x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  入場倍數
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {currentScenario.exitEvEbitdaMultiple}x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  出場倍數
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {((currentScenario.exitEvEbitdaMultiple / currentScenario.entryEvEbitdaMultiple) * kpiMetrics.moic).toFixed(1)}x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  預期倍數
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* 投資回報摘要 */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              投資回報摘要
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                • <strong>入場估值：</strong> {currentScenario.entryEvEbitdaMultiple}x EBITDA
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                • <strong>出場估值：</strong> {currentScenario.exitEvEbitdaMultiple}x EBITDA
              </Typography>
              
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Summary;
