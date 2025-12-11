/**
 * 營運資本假設 Tab
 * 管理：應收帳款天數、存貨天數、應付帳款天數
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
  Alert,
} from '@mui/material';
import { useAppDispatch } from '../../../hooks/typed-hooks';
import { updateWorkingCapitalAssumptions, ScenarioType } from '../../../store/slices/scenarios.slice';
import { ScenarioAssumptions } from '../../../types/financial';

interface WorkingCapitalTabProps {
  scenarios: {
    base: ScenarioAssumptions;
    upside: ScenarioAssumptions;
    downside: ScenarioAssumptions;
  };
  historicalData?: {
    arDays?: number;
    inventoryDays?: number;
    apDays?: number;
  };
}

// 欄位配置
const FIELDS = [
  { key: 'accountsReceivableDays', label: '應收帳款天數', unit: '天', step: 1, historical: 'arDays' },
  { key: 'inventoryDays', label: '存貨天數', unit: '天', step: 1, historical: 'inventoryDays' },
  { key: 'accountsPayableDays', label: '應付帳款天數', unit: '天', step: 1, historical: 'apDays' },
] as const;

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  base: 'Base',
  upside: 'Upside',
  downside: 'Downside',
};

// 安全取值函數
const safeGet = (scenario: ScenarioAssumptions | undefined, key: keyof ScenarioAssumptions, defaultValue: number = 0): number => {
  if (!scenario) return defaultValue;
  const value = scenario[key];
  return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
};

// 計算淨營運資本天數
const calculateNwcDays = (scenario: ScenarioAssumptions | undefined): number => {
  const ar = safeGet(scenario, 'accountsReceivableDays', 45);
  const inv = safeGet(scenario, 'inventoryDays', 60);
  const ap = safeGet(scenario, 'accountsPayableDays', 35);
  return ar + inv - ap;
};

export const WorkingCapitalTab: React.FC<WorkingCapitalTabProps> = React.memo(({
  scenarios,
  historicalData,
}) => {
  const dispatch = useAppDispatch();

  const handleChange = (
    scenario: ScenarioType,
    field: keyof Pick<ScenarioAssumptions, 'accountsReceivableDays' | 'inventoryDays' | 'accountsPayableDays'>,
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    dispatch(updateWorkingCapitalAssumptions({
      scenario,
      updates: { [field]: numValue },
    }));
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        營運資本假設
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        設定各情境的應收/存貨/應付週轉天數
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
                  {field.historical && historicalData?.[field.historical] !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      歷史參考：{Math.round(historicalData[field.historical]!)} 天
                    </Typography>
                  )}
                </TableCell>
                {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                  <TableCell key={scenario} align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={safeGet(scenarios[scenario], field.key, field.key === 'accountsReceivableDays' ? 45 : field.key === 'inventoryDays' ? 60 : 35)}
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
            {/* 淨營運資本天數（自動計算） */}
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  淨營運資本天數
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  = AR + 存貨 - AP
                </Typography>
              </TableCell>
              {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                <TableCell key={scenario} align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {calculateNwcDays(scenarios[scenario])} 天
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 2 }}>
        淨營運資本天數越低，表示營運資金效率越高。Upside 情境通常假設更有效率的營運資本管理。
      </Alert>
    </Box>
  );
});

WorkingCapitalTab.displayName = 'WorkingCapitalTab';
