/**
 * 其他財務假設 Tab
 * 管理：稅率、折現率、成本結構（COGS、營業費用）
 */

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Divider,
} from '@mui/material';
import { useAppDispatch } from '../../../hooks/typed-hooks';
import { updateOtherAssumptions, updateCostStructure, ScenarioType } from '../../../store/slices/scenarios.slice';
import { ScenarioAssumptions } from '../../../types/financial';

interface OtherFinancialsTabProps {
  scenarios: {
    base: ScenarioAssumptions;
    upside: ScenarioAssumptions;
    downside: ScenarioAssumptions;
  };
  historicalData?: {
    effectiveTaxRate?: number;
    cogsRatio?: number;
    opexRatio?: number;
  };
}

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  base: 'Base',
  upside: 'Upside',
  downside: 'Downside',
};

// 安全取值函數
const safeGet = (scenario: ScenarioAssumptions | undefined, key: keyof ScenarioAssumptions, defaultValue: number): number => {
  if (!scenario) return defaultValue;
  const value = scenario[key];
  return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
};

// 計算隱含 EBITDA 利潤率
const calculateImpliedEbitdaMargin = (scenario: ScenarioAssumptions | undefined): number => {
  const cogs = safeGet(scenario, 'cogsAsPercentageOfRevenue', 60);
  const opex = safeGet(scenario, 'operatingExpensesAsPercentageOfRevenue', 15);
  return 100 - cogs - opex;
};

export const OtherFinancialsTab: React.FC<OtherFinancialsTabProps> = React.memo(({
  scenarios,
  historicalData,
}) => {
  const dispatch = useAppDispatch();

  const handleTaxDiscountChange = (
    scenario: ScenarioType,
    field: 'taxRate' | 'discountRate',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    dispatch(updateOtherAssumptions({
      scenario,
      updates: { [field]: numValue },
    }));
  };

  const handleCostChange = (
    scenario: ScenarioType,
    field: 'cogsAsPercentageOfRevenue' | 'operatingExpensesAsPercentageOfRevenue',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    dispatch(updateCostStructure({
      scenario,
      updates: { [field]: numValue },
    }));
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        其他財務假設
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        設定稅率、折現率和成本結構
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: '30%' }}>參數</TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center" sx={{ fontWeight: 600 }}>
                  {SCENARIO_LABELS[scenario]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 稅率 */}
            <TableRow>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>稅率</Typography>
                {historicalData?.effectiveTaxRate !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    歷史有效稅率：{historicalData.effectiveTaxRate.toFixed(1)}%
                  </Typography>
                )}
              </TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={safeGet(scenarios[scenario], 'taxRate', 20)}
                    onChange={(e) => handleTaxDiscountChange(scenario, 'taxRate', e.target.value)}
                    inputProps={{ step: 0.5, style: { textAlign: 'center' } }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
              ))}
            </TableRow>

            {/* 折現率 */}
            <TableRow>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>折現率</Typography>
                <Typography variant="caption" color="text.secondary">
                  用於 NPV 計算
                </Typography>
              </TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={safeGet(scenarios[scenario], 'discountRate', 10)}
                    onChange={(e) => handleTaxDiscountChange(scenario, 'discountRate', e.target.value)}
                    inputProps={{ step: 0.5, style: { textAlign: 'center' } }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
              ))}
            </TableRow>

            {/* 分隔線 */}
            <TableRow>
              <TableCell colSpan={4}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  成本結構
                </Typography>
              </TableCell>
            </TableRow>

            {/* COGS */}
            <TableRow>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>COGS/營收比例</Typography>
                {historicalData?.cogsRatio !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    歷史參考：{historicalData.cogsRatio.toFixed(1)}%
                  </Typography>
                )}
              </TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={safeGet(scenarios[scenario], 'cogsAsPercentageOfRevenue', 60)}
                    onChange={(e) => handleCostChange(scenario, 'cogsAsPercentageOfRevenue', e.target.value)}
                    inputProps={{ step: 0.5, style: { textAlign: 'center' } }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
              ))}
            </TableRow>

            {/* 營業費用 */}
            <TableRow>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>營業費用/營收比例</Typography>
                {historicalData?.opexRatio !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    歷史參考：{historicalData.opexRatio.toFixed(1)}%
                  </Typography>
                )}
              </TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={safeGet(scenarios[scenario], 'operatingExpensesAsPercentageOfRevenue', 15)}
                    onChange={(e) => handleCostChange(scenario, 'operatingExpensesAsPercentageOfRevenue', e.target.value)}
                    inputProps={{ step: 0.5, style: { textAlign: 'center' } }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
              ))}
            </TableRow>

            {/* 隱含 EBITDA 利潤率（自動計算） */}
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  隱含 EBITDA 利潤率
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  = 100% - COGS% - OpEx%
                </Typography>
              </TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {calculateImpliedEbitdaMargin(scenarios[scenario]).toFixed(1)}%
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

OtherFinancialsTab.displayName = 'OtherFinancialsTab';
