/**
 * 計算參數設定 Tab
 * 管理：D&A/CapEx 比例、固定資產/CapEx 倍數、循環信用年償還率
 * 注意：這些參數通常所有情境共用，因此提供「同步所有情境」功能
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
  Button,
} from '@mui/material';
import { Sync } from '@mui/icons-material';
import { useAppDispatch } from '../../../hooks/typed-hooks';
import {
  updateCalculationParameters,
  updateAllCalculationParameters,
  ScenarioType
} from '../../../store/slices/scenarios.slice';
import { ScenarioAssumptions } from '../../../types/financial';

interface CalculationParamsTabProps {
  scenarios: {
    base: ScenarioAssumptions;
    upside: ScenarioAssumptions;
    downside: ScenarioAssumptions;
  };
}

// 欄位配置
const FIELDS = [
  {
    key: 'depreciationToCapexRatio',
    label: 'D&A/CapEx 比例',
    unit: '%',
    step: 5,
    description: '每年折舊攤銷佔資本支出的比例',
    defaultValue: 20,
  },
  {
    key: 'fixedAssetsToCapexMultiple',
    label: '固定資產/CapEx 倍數',
    unit: '倍',
    step: 1,
    description: '初始固定資產為年度 CapEx 的倍數',
    defaultValue: 10,
  },
  {
    key: 'revolvingCreditRepaymentRate',
    label: '循環信用年償還率',
    unit: '%',
    step: 5,
    description: '循環信用額度的年度償還比例',
    defaultValue: 20,
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

export const CalculationParamsTab: React.FC<CalculationParamsTabProps> = React.memo(({
  scenarios,
}) => {
  const dispatch = useAppDispatch();

  const handleChange = (
    scenario: ScenarioType,
    field: keyof Pick<ScenarioAssumptions, 'depreciationToCapexRatio' | 'fixedAssetsToCapexMultiple' | 'revolvingCreditRepaymentRate'>,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    dispatch(updateCalculationParameters({
      scenario,
      updates: { [field]: numValue },
    }));
  };

  const handleSyncAll = (field: keyof Pick<ScenarioAssumptions, 'depreciationToCapexRatio' | 'fixedAssetsToCapexMultiple' | 'revolvingCreditRepaymentRate'>, defaultValue: number) => {
    // 使用 Base 情境的值同步到所有情境
    dispatch(updateAllCalculationParameters({
      [field]: safeGet(scenarios.base, field, defaultValue),
    }));
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        計算參數設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        這些參數影響財務模型的計算邏輯，通常所有情境使用相同值
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        這些參數會直接影響財務預測結果，請謹慎調整。建議保持所有情境使用相同參數。
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
              <TableCell align="center" sx={{ fontWeight: 600, width: '100px' }}>
                同步
              </TableCell>
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
                  <Typography variant="caption" display="block" color="primary">
                    預設值：{field.defaultValue}{field.unit}
                  </Typography>
                </TableCell>
                {(['base', 'upside', 'downside'] as ScenarioType[]).map(scenario => (
                  <TableCell key={scenario} align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={safeGet(scenarios[scenario], field.key, field.defaultValue)}
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
                <TableCell align="center">
                  <Button
                    size="small"
                    startIcon={<Sync />}
                    onClick={() => handleSyncAll(field.key, field.defaultValue)}
                    title="將 Base 的值同步到所有情境"
                  >
                    同步
                  </Button>
                </TableCell>
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
          <strong>D&A/CapEx 比例：</strong>假設每年折舊攤銷佔資本支出的比例。較高的比例意味著資產折舊更快。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>固定資產/CapEx 倍數：</strong>初始年度固定資產為年度 CapEx 的倍數。用於估算初始固定資產基數。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>循環信用年償還率：</strong>循環信用額度的年度償還比例。較高的比例表示更積極的債務償還。
        </Typography>
      </Box>
    </Box>
  );
});

CalculationParamsTab.displayName = 'CalculationParamsTab';
