/**
 * 資本支出假設 Tab
 * 管理：CapEx/營收比例、CapEx 增長率
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
} from '@mui/material';
import { useAppDispatch } from '../../../hooks/typed-hooks';
import { updateCapexAssumptions, ScenarioType } from '../../../store/slices/scenarios.slice';
import { ScenarioAssumptions } from '../../../types/financial';

interface CapexAssumptionsTabProps {
  scenarios: {
    base: ScenarioAssumptions;
    upside: ScenarioAssumptions;
    downside: ScenarioAssumptions;
  };
  historicalData?: {
    capexRatio?: number;
  };
}

// 欄位配置
const FIELDS = [
  { key: 'capexAsPercentageOfRevenue', label: 'CapEx/營收比例', unit: '%', step: 0.5 },
  { key: 'capexGrowthRate', label: 'CapEx 增長率', unit: '%', step: 0.5 },
] as const;

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

// 欄位預設值
const DEFAULTS: Record<string, number> = {
  capexAsPercentageOfRevenue: 4,
  capexGrowthRate: 3,
};

export const CapexAssumptionsTab: React.FC<CapexAssumptionsTabProps> = React.memo(({
  scenarios,
  historicalData,
}) => {
  const dispatch = useAppDispatch();

  const handleChange = (
    scenario: ScenarioType,
    field: keyof Pick<ScenarioAssumptions, 'capexAsPercentageOfRevenue' | 'capexGrowthRate'>,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    dispatch(updateCapexAssumptions({
      scenario,
      updates: { [field]: numValue },
    }));
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        資本支出假設
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        設定各情境的資本支出計劃假設
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
            {FIELDS.map(field => (
              <TableRow key={field.key}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {field.label}
                  </Typography>
                  {field.key === 'capexAsPercentageOfRevenue' && historicalData?.capexRatio !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      歷史參考：{historicalData.capexRatio.toFixed(1)}%
                    </Typography>
                  )}
                </TableCell>
                {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                  <TableCell key={scenario} align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={safeGet(scenarios[scenario], field.key, DEFAULTS[field.key] || 0)}
                      onChange={(e) => handleChange(scenario, field.key, e.target.value)}
                      inputProps={{
                        step: field.step,
                        style: { textAlign: 'center' },
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{field.unit}</InputAdornment>,
                      }}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

CapexAssumptionsTab.displayName = 'CapexAssumptionsTab';
