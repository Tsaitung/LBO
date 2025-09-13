/**
 * ProForma 頭部指標組件
 * Linus 原則：純展示，不含邏輯
 */

import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { KeyMetrics } from '../hooks/useProFormaMetrics';

interface ProFormaHeaderProps {
  metrics: KeyMetrics;
}

/**
 * 顯示 ProForma 關鍵指標卡片
 */
export const ProFormaHeader: React.FC<ProFormaHeaderProps> = React.memo(({ metrics }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        合併報表預測 (Pro Forma Financials)
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {/* 企業價值 */}
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              企業價值
            </Typography>
            <Typography variant="h4">
              ${metrics.enterpriseValue}M
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metrics.entryMultiple}x EBITDA
            </Typography>
          </CardContent>
        </Card>
        
        {/* 交易模式 */}
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              交易模式
            </Typography>
            <Typography variant="h5">
              {metrics.dealType}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metrics.currentScenario} Case
            </Typography>
          </CardContent>
        </Card>
        
        {/* 入場槓桿 */}
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              入場槓桿
            </Typography>
            <Typography variant="h5">
              {metrics.entryLeverage}x
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Debt/EBITDA
            </Typography>
          </CardContent>
        </Card>
        
        {/* 出場槓桿 */}
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              出場槓桿
            </Typography>
            <Typography variant="h5">
              {metrics.exitLeverage}x
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Year {metrics.planningHorizon}
            </Typography>
          </CardContent>
        </Card>
        
        {/* FCFF CAGR */}
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              FCFF CAGR
            </Typography>
            <Typography variant="h5">
              {metrics.fcffCAGR.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metrics.planningHorizon}年複合成長
            </Typography>
          </CardContent>
        </Card>
        
        {/* 平均 EBITDA 利潤率 */}
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              平均EBITDA利潤率
            </Typography>
            <Typography variant="h5">
              {metrics.avgEbitdaMargin.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {metrics.planningHorizon}年平均
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
});