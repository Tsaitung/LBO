import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import { ScenarioAssumptions } from '../types/financial';

// Smart hooks
import { useAppDispatch, useScenarios, useCurrentScenario, useIsCalculated, useBusinessMetrics } from '../hooks/typed-hooks';

// Modular imports
import { 
  setCurrentScenario,
  updateScenario
} from '../store/slices/scenarios.slice';
import { updateAssumptions } from '../store/slices/assumptions.slice';

import { useNavigate } from 'react-router-dom';
import ActionButtons from './ActionButtons';
import { ScenarioData } from '../types/components';

// Common types
type ScenarioType = 'base' | 'upper' | 'lower' | 'upside' | 'downside';

const ScenarioManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const scenarios = useScenarios();
  const currentScenario = useCurrentScenario();
  const isCalculated = useIsCalculated();
  const businessMetrics = useBusinessMetrics();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>(currentScenario as ScenarioType);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleScenarioSelect = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  };

  // Normalized scenario getters to avoid undefined access
  const sObj = (scenarios as unknown as ScenarioData) || {};
  const sBase = sObj.scenarios?.base || sObj.base || {} as ScenarioAssumptions;
  const sUpside = sObj.scenarios?.upside || sObj.upside || sObj.upper || {} as ScenarioAssumptions;
  const sDownside = sObj.scenarios?.downside || sObj.downside || sObj.lower || {} as ScenarioAssumptions;

  const handleApplyScenario = () => {
    setIsCalculating(true);
    const toSliceScenario = (s: ScenarioType): 'base' | 'upside' | 'downside' => {
      if (s === 'upper') return 'upside';
      if (s === 'lower') return 'downside';
      if (s === 'upside' || s === 'downside') return s;
      return 'base';
    };
    dispatch(setCurrentScenario(toSliceScenario(selectedScenario)));
    // 將情境中的成本結構同步到 Future Assumptions
    const s = selectedScenario === 'base' ? sBase : selectedScenario === 'upper' ? sUpside : selectedScenario === 'lower' ? sDownside : (selectedScenario === 'upside' ? sUpside : sDownside);
    const base = sBase;
    const cogs = Number(s?.cogsAsPercentageOfRevenue ?? base.cogsAsPercentageOfRevenue ?? 0);
    const opex = Number(s?.operatingExpensesAsPercentageOfRevenue ?? base.operatingExpensesAsPercentageOfRevenue ?? 0);
    const ebitda = Math.max(0, 100 - cogs - opex);
    dispatch(updateAssumptions({
      cogsAsPercentageOfRevenue: cogs,
      operatingExpensesAsPercentageOfRevenue: opex,
      ebitdaMargin: ebitda,
    }));
    // Calculations are handled by calculation hooks
    setTimeout(() => {
      setIsCalculating(false);
    }, 100);
  };

  const handleParameterChange = (scenario: ScenarioType, field: keyof ScenarioAssumptions, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const toSliceScenario = (s: ScenarioType): 'base' | 'upside' | 'downside' => {
      if (s === 'upper') return 'upside';
      if (s === 'lower') return 'downside';
      if (s === 'upside' || s === 'downside') return s;
      return 'base';
    };
    dispatch(updateScenario({ 
      scenario: toSliceScenario(scenario), 
      updates: { [field]: numericValue } 
    }));
  };

  // 格式化輔助
  const formatCurrency = (valueInMillions: number) =>
    new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(valueInMillions);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // 併購前參考值（以 businessMetrics 為準）
  const refEbitdaMargin = businessMetrics?.revenue
    ? (businessMetrics.ebitda / businessMetrics.revenue) * 100
    : 0;
  const refNetMargin = businessMetrics?.revenue
    ? (businessMetrics.netIncome / businessMetrics.revenue) * 100
    : 0;
  const refCogsPct = businessMetrics?.revenue
    ? (businessMetrics.cogs / businessMetrics.revenue) * 100
    : 0;
  const refOpexPct = businessMetrics?.revenue
    ? (businessMetrics.operatingExpenses / businessMetrics.revenue) * 100
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="primary">
        Scenario Manager - 情境管理
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        選擇並應用不同的情境假設來測試 LBO 模型的靈活性。情境將自動更新所有相關參數。
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 情境選擇 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            情境選擇
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedScenario === 'base' ? 2 : 1,
                  borderColor: selectedScenario === 'base' ? 'primary.main' : 'grey.300',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleScenarioSelect('base')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Base 情境
                    </Typography>
                    <Chip
                      label={selectedScenario === 'base' ? '已選擇' : '選擇'}
                      color={selectedScenario === 'base' ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    保守估計情境
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedScenario === 'upper' ? 2 : 1,
                  borderColor: selectedScenario === 'upper' ? 'success.main' : 'grey.300',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleScenarioSelect('upper')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="success.main">
                      Upper 情境
                    </Typography>
                    <Chip
                      label={selectedScenario === 'upper' ? '已選擇' : '選擇'}
                      color={selectedScenario === 'upper' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    樂觀估計情境
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedScenario === 'lower' ? 2 : 1,
                  borderColor: selectedScenario === 'lower' ? 'warning.main' : 'grey.300',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleScenarioSelect('lower')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="warning.main">
                      Lower 情境
                    </Typography>
                    <Chip
                      label={selectedScenario === 'lower' ? '已選擇' : '選擇'}
                      color={selectedScenario === 'lower' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    保守估計情境
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleApplyScenario}
              disabled={selectedScenario === currentScenario || isCalculating}
            >
              {isCalculating ? '重算中...' : '應用情境 (Apply Scenario)'}
            </Button>

            {selectedScenario !== currentScenario && (
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                將應用 {selectedScenario.toUpperCase()} 情境的參數設定
              </Typography>
            )}
          </Box>
        </Paper>

        {/* 詳細參數設定 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            詳細參數設定
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>參數名稱</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Base</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Upper</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Lower</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>單位</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>入場 EV/EBITDA 倍數</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                    value={sBase.entryEvEbitdaMultiple}
                      onChange={(e) => handleParameterChange('base', 'entryEvEbitdaMultiple', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                    value={sUpside.entryEvEbitdaMultiple}
                      onChange={(e) => handleParameterChange('upside', 'entryEvEbitdaMultiple', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                    value={sDownside.entryEvEbitdaMultiple}
                      onChange={(e) => handleParameterChange('downside', 'entryEvEbitdaMultiple', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>x</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>出場 EV/EBITDA 倍數</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                    value={sBase.exitEvEbitdaMultiple}
                      onChange={(e) => handleParameterChange('base', 'exitEvEbitdaMultiple', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                    value={sUpside.exitEvEbitdaMultiple}
                      onChange={(e) => handleParameterChange('upside', 'exitEvEbitdaMultiple', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                    value={sDownside.exitEvEbitdaMultiple}
                      onChange={(e) => handleParameterChange('downside', 'exitEvEbitdaMultiple', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>x</TableCell>
                </TableRow>


                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>COGS 占營收比例</Typography>
                      <Typography variant="caption" color="text.secondary">
                        參考（併購前）：{formatPercent(refCogsPct)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField type="number" size="small" value={sBase.cogsAsPercentageOfRevenue}
                      onChange={(e) => handleParameterChange('base', 'cogsAsPercentageOfRevenue', e.target.value)}
                      inputProps={{ step: 0.1, style: { textAlign: 'center' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell align="center">
                    <TextField type="number" size="small" value={sUpside.cogsAsPercentageOfRevenue}
                      onChange={(e) => handleParameterChange('upside', 'cogsAsPercentageOfRevenue', e.target.value)}
                      inputProps={{ step: 0.1, style: { textAlign: 'center' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell align="center">
                    <TextField type="number" size="small" value={sDownside.cogsAsPercentageOfRevenue}
                      onChange={(e) => handleParameterChange('downside', 'cogsAsPercentageOfRevenue', e.target.value)}
                      inputProps={{ step: 0.1, style: { textAlign: 'center' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell>%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>營業費用占營收比例</Typography>
                      <Typography variant="caption" color="text.secondary">
                        參考（併購前）：{formatPercent(refOpexPct)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField type="number" size="small" value={sBase.operatingExpensesAsPercentageOfRevenue}
                      onChange={(e) => handleParameterChange('base', 'operatingExpensesAsPercentageOfRevenue', e.target.value)}
                      inputProps={{ step: 0.1, style: { textAlign: 'center' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell align="center">
                    <TextField type="number" size="small" value={sUpside.operatingExpensesAsPercentageOfRevenue}
                      onChange={(e) => handleParameterChange('upside', 'operatingExpensesAsPercentageOfRevenue', e.target.value)}
                      inputProps={{ step: 0.1, style: { textAlign: 'center' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell align="center">
                    <TextField type="number" size="small" value={sDownside.operatingExpensesAsPercentageOfRevenue}
                      onChange={(e) => handleParameterChange('downside', 'operatingExpensesAsPercentageOfRevenue', e.target.value)}
                      inputProps={{ step: 0.1, style: { textAlign: 'center' } }} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell>%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>隱含 EBITDA 利潤率（自動）</Typography>
                      <Typography variant="caption" color="text.secondary">
                        參考（併購前）：{formatPercent(refEbitdaMargin)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {(100 - Number(sBase.cogsAsPercentageOfRevenue || 0) - Number(sBase.operatingExpensesAsPercentageOfRevenue || 0)).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {(100 - Number(sUpside.cogsAsPercentageOfRevenue || 0) - Number(sUpside.operatingExpensesAsPercentageOfRevenue || 0)).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {(100 - Number(sDownside.cogsAsPercentageOfRevenue || 0) - Number(sDownside.operatingExpensesAsPercentageOfRevenue || 0)).toFixed(1)}%
                  </TableCell>
                  <TableCell>%</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>淨利率</Typography>
                      <Typography variant="caption" color="text.secondary">
                        參考（併購前）：{formatPercent(refNetMargin)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={sBase.netMargin}
                      onChange={(e) => handleParameterChange('base', 'netMargin', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={sUpside.netMargin}
                      onChange={(e) => handleParameterChange('upside', 'netMargin', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={sDownside.netMargin}
                      onChange={(e) => handleParameterChange('downside', 'netMargin', e.target.value)}
                      inputProps={{ 
                        step: 0.1,
                        style: { textAlign: 'center' }
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 動作按鈕 */}
        <ActionButtons
          title="情境管理設定完成"
          onProceed={() => navigate('/future-assumptions')}
          nextStepLabel="設定未來假設"
          showSave={true}
          showProceed={true}
        />
      </Box>
    </Box>
  );
};

export default ScenarioManager;
