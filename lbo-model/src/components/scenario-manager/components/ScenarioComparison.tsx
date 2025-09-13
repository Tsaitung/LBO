/**
 * ScenarioComparison - 情境比較組件
 * Linus 原則：純展示，無業務邏輯
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
} from '@mui/material';
import { ScenarioResult, ScenarioType } from '../ScenarioEngine';

interface ScenarioComparisonProps {
  results: Record<ScenarioType, ScenarioResult>;
}

// 指標定義（資料驅動）
const METRIC_DEFINITIONS = [
  { key: 'irr', label: 'IRR', format: 'percent', color: 'primary' },
  { key: 'moic', label: 'MOIC', format: 'multiple', color: 'secondary' },
  { key: 'ebitdaMargin', label: 'EBITDA Margin', format: 'percent', color: 'info' },
  { key: 'netMargin', label: 'Net Margin', format: 'percent', color: 'success' },
];

// 情境標籤配置
const SCENARIO_LABELS: Record<ScenarioType, { label: string; color: string }> = {
  base: { label: 'Base', color: 'primary' },
  upside: { label: 'Upside', color: 'success' },
  downside: { label: 'Downside', color: 'warning' },
};

/**
 * 情境比較組件
 * 統一展示所有情境結果
 */
export const ScenarioComparison: React.FC<ScenarioComparisonProps> = React.memo(({
  results,
}) => {
  // 格式化數值
  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'multiple':
        return `${value.toFixed(2)}x`;
      case 'currency':
        return `NT$ ${(value / 1000).toFixed(0)}M`;
      default:
        return value.toFixed(2);
    }
  };

  // 計算相對進度（用於視覺化）
  const getRelativeProgress = (
    value: number,
    allValues: number[]
  ): number => {
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  };

  // 獲取所有情境的值
  const getMetricValues = (metricKey: string): number[] => {
    return Object.values(results).map(r => r.metrics[metricKey as keyof typeof r.metrics]);
  };

  return (
    <Box>
      {/* 摘要卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(Object.keys(results) as ScenarioType[]).map(scenario => {
          const result = results[scenario];
          const config = SCENARIO_LABELS[scenario];
          
          return (
            <Grid size={{ xs: 12, md: 4 }} key={scenario}>
              <Card>
                <CardContent>
                  <Typography
                    variant="h6"
                    color={`${config.color}.main`}
                    gutterBottom
                  >
                    {config.label} 情境
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        IRR
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatValue(result.metrics.irr, 'percent')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        MOIC
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatValue(result.metrics.moic, 'multiple')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Exit EV
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatValue(result.metrics.exitEV, 'currency')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 詳細比較 */}
      <Typography variant="h6" gutterBottom>
        指標詳細比較
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        {METRIC_DEFINITIONS.map(metric => {
          const allValues = getMetricValues(metric.key);
          
          return (
            <Box key={metric.key} sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {metric.label}
              </Typography>
              
              {(Object.keys(results) as ScenarioType[]).map(scenario => {
                const value = results[scenario].metrics[metric.key as keyof typeof results[typeof scenario]['metrics']];
                const progress = getRelativeProgress(value, allValues);
                const config = SCENARIO_LABELS[scenario];
                
                return (
                  <Box key={scenario} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color={`${config.color}.main`}>
                        {config.label}
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {formatValue(value, metric.format)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={config.color as "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit"}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});