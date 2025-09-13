/**
 * ScenarioParametersTable - 情境參數表格
 * Linus 原則：資料驅動，無特殊案例
 */

import React, { useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { ScenarioType, ScenarioConfig, ScenarioEngine } from '../ScenarioEngine';
import { BusinessMetricsBeforeAcquisition } from '../../../types/financial';

interface ScenarioParametersTableProps {
  configs: Record<ScenarioType, ScenarioConfig>;
  businessMetrics: BusinessMetricsBeforeAcquisition;
  onChange: (scenario: ScenarioType, field: keyof ScenarioConfig, value: number) => void;
}

// 參數定義（資料驅動）
const PARAMETER_DEFINITIONS = [
  {
    field: 'entryEvEbitdaMultiple' as keyof ScenarioConfig,
    label: '入場 EV/EBITDA 倍數',
    unit: 'x',
    step: 0.1,
    refField: null,
  },
  {
    field: 'exitEvEbitdaMultiple' as keyof ScenarioConfig,
    label: '出場 EV/EBITDA 倍數',
    unit: 'x',
    step: 0.1,
    refField: null,
  },
  {
    field: 'cogsAsPercentageOfRevenue' as keyof ScenarioConfig,
    label: 'COGS 占營收比例',
    unit: '%',
    step: 0.1,
    refField: 'cogs',
  },
  {
    field: 'operatingExpensesAsPercentageOfRevenue' as keyof ScenarioConfig,
    label: '營業費用占營收比例',
    unit: '%',
    step: 0.1,
    refField: 'operatingExpenses',
  },
  {
    field: 'netMargin' as keyof ScenarioConfig,
    label: '淨利率',
    unit: '%',
    step: 0.1,
    refField: 'netIncome',
  },
];

const SCENARIOS: ScenarioType[] = ['base', 'upside', 'downside'];

/**
 * 參數表格組件
 * 統一處理所有參數，無條件分支
 */
export const ScenarioParametersTable: React.FC<ScenarioParametersTableProps> = React.memo(({
  configs,
  businessMetrics,
  onChange,
}) => {
  // 計算參考值
  const getReferenceValue = useCallback((refField: string | null): number => {
    if (!refField || !businessMetrics?.revenue) return 0;
    return (businessMetrics[refField] / businessMetrics.revenue) * 100;
  }, [businessMetrics]);

  // 處理輸入變更
  const handleChange = useCallback((
    scenario: ScenarioType,
    field: keyof ScenarioConfig,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    onChange(scenario, field, numValue);
  }, [onChange]);

  // 格式化百分比
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>參數名稱</TableCell>
            {SCENARIOS.map(scenario => (
              <TableCell key={scenario} align="center" sx={{ fontWeight: 'bold' }}>
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
              </TableCell>
            ))}
            <TableCell sx={{ fontWeight: 'bold' }}>單位</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {PARAMETER_DEFINITIONS.map(param => (
            <TableRow key={param.field}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {param.label}
                  </Typography>
                  {param.refField && (
                    <Typography variant="caption" color="text.secondary">
                      參考（併購前）：{formatPercent(getReferenceValue(param.refField))}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              {SCENARIOS.map(scenario => (
                <TableCell key={scenario} align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={configs[scenario][param.field]}
                    onChange={(e) => handleChange(scenario, param.field, e.target.value)}
                    inputProps={{
                      step: param.step,
                      style: { textAlign: 'center' },
                    }}
                    sx={{ width: 100 }}
                  />
                </TableCell>
              ))}
              
              <TableCell>{param.unit}</TableCell>
            </TableRow>
          ))}
          
          {/* EBITDA Margin (自動計算) */}
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  隱含 EBITDA 利潤率（自動）
                </Typography>
                {businessMetrics?.revenue && (
                  <Typography variant="caption" color="text.secondary">
                    參考（併購前）：{formatPercent(
                      (businessMetrics.ebitda / businessMetrics.revenue) * 100
                    )}
                  </Typography>
                )}
              </Box>
            </TableCell>
            
            {SCENARIOS.map(scenario => (
              <TableCell key={scenario} align="center">
                <Typography variant="body2">
                  {formatPercent(ScenarioEngine.calculateEbitdaMargin(configs[scenario]))}
                </Typography>
              </TableCell>
            ))}
            
            <TableCell>%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
});