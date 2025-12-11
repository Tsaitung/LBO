/**
 * 估值參數設定 Tab
 * 管理：入場/出場 EV/EBITDA 倍數、槓桿參數
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
import { updateScenario, ScenarioType } from '../../../store/slices/scenarios.slice';
import { ScenarioAssumptions } from '../../../types/financial';

interface ValuationParamsTabProps {
  scenarios: {
    base: ScenarioAssumptions;
    upside: ScenarioAssumptions;
    downside: ScenarioAssumptions;
  };
}

// 欄位配置
const FIELDS = [
  {
    key: 'entryEvEbitdaMultiple',
    label: '入場 EV/EBITDA 倍數',
    unit: 'x',
    step: 0.5,
    description: '收購時的企業價值倍數'
  },
  {
    key: 'exitEvEbitdaMultiple',
    label: '出場 EV/EBITDA 倍數',
    unit: 'x',
    step: 0.5,
    description: '退出時的企業價值倍數'
  },
  {
    key: 'seniorDebtEbitda',
    label: '優先債 / EBITDA',
    unit: 'x',
    step: 0.5,
    description: '優先債務槓桿倍數'
  },
  {
    key: 'mezzDebtEbitda',
    label: '夾層債 / EBITDA',
    unit: 'x',
    step: 0.5,
    description: '夾層債務槓桿倍數'
  },
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
  entryEvEbitdaMultiple: 10,
  exitEvEbitdaMultiple: 12,
  seniorDebtEbitda: 4,
  mezzDebtEbitda: 2,
};

export const ValuationParamsTab: React.FC<ValuationParamsTabProps> = React.memo(({
  scenarios,
}) => {
  const dispatch = useAppDispatch();

  const handleChange = (
    scenario: ScenarioType,
    field: keyof Pick<ScenarioAssumptions, 'entryEvEbitdaMultiple' | 'exitEvEbitdaMultiple' | 'seniorDebtEbitda' | 'mezzDebtEbitda'>,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    dispatch(updateScenario({
      scenario,
      updates: { [field]: numValue },
    }));
  };

  // 計算隱含 EV（以 Base 情境為例顯示）
  const baseEntry = safeGet(scenarios.base, 'entryEvEbitdaMultiple', DEFAULTS.entryEvEbitdaMultiple);
  const baseExit = safeGet(scenarios.base, 'exitEvEbitdaMultiple', DEFAULTS.exitEvEbitdaMultiple);
  const multipleExpansion = baseEntry > 0 ? ((baseExit / baseEntry - 1) * 100).toFixed(1) : '0.0';

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        估值參數設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        設定各情境的入場/出場估值倍數與槓桿參數
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        入場倍數決定收購價格（EV = EBITDA × 倍數），出場倍數決定退出價值。
        Base 情境倍數擴張：{multipleExpansion}%
      </Alert>

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
                  <Typography variant="caption" color="text.secondary">
                    {field.description}
                  </Typography>
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
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          參數說明
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>入場 EV/EBITDA：</strong>收購時支付的企業價值倍數。較高的倍數意味著更高的收購成本。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>出場 EV/EBITDA：</strong>退出時預期的企業價值倍數。出場倍數高於入場倍數可實現倍數擴張收益。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>槓桿倍數：</strong>債務相對於 EBITDA 的倍數，用於評估融資能力和風險。
        </Typography>
      </Box>
    </Box>
  );
});

ValuationParamsTab.displayName = 'ValuationParamsTab';
