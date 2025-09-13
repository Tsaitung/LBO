/**
 * Key Metrics Cards Component
 * Displays key financial metrics in card format
 * Following Linus principle: Pure display component with React.memo
 */

import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

export interface KeyMetrics {
  enterpriseValue: string;
  entryMultiple: string;
  currentScenario: string;
  entryLeverage: string;
  exitLeverage: string;
  fcffCAGR: number | string;
  avgEbitdaMargin: number | string;
}

interface KeyMetricsCardsProps {
  metrics: KeyMetrics;
  dealType?: string;
  planningHorizon?: number;
}

const KeyMetricsCards: React.FC<KeyMetricsCardsProps> = React.memo(({ 
  metrics, 
  dealType,
  planningHorizon = 5
}) => {
  const getDealTypeDisplay = (type?: string) => {
    switch(type) {
      case 'fullAcquisition':
        return '全資收購';
      case 'assetAcquisition':
        return '資產併購';
      default:
        return '未設定';
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
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
      
      <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            交易模式
          </Typography>
          <Typography variant="h5">
            {getDealTypeDisplay(dealType)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metrics.currentScenario} Case
          </Typography>
        </CardContent>
      </Card>
      
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
      
      <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            出場槓桿
          </Typography>
          <Typography variant="h5">
            {metrics.exitLeverage}x
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Year {planningHorizon}
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            FCFF CAGR
          </Typography>
          <Typography variant="h5">
            {typeof metrics.fcffCAGR === 'number' ? metrics.fcffCAGR.toFixed(1) : metrics.fcffCAGR}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {planningHorizon}年複合成長
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            平均EBITDA利潤率
          </Typography>
          <Typography variant="h5">
            {typeof metrics.avgEbitdaMargin === 'number' ? metrics.avgEbitdaMargin.toFixed(1) : metrics.avgEbitdaMargin}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {planningHorizon}年平均
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
});

KeyMetricsCards.displayName = 'KeyMetricsCards';

export default KeyMetricsCards;