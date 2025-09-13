/**
 * ScenarioContainer - 情境管理容器
 * Linus 原則：純協調，專注單一職責
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useScenarios, useCurrentScenario, useBusinessMetrics } from '../../hooks/typed-hooks';
import { setCurrentScenario, updateScenario } from '../../store/slices/scenarios.slice';
import { updateAssumptions } from '../../store/slices/assumptions.slice';
import { ScenarioEngine, ScenarioType, ScenarioConfig } from './ScenarioEngine';
import { ScenarioAssumptions } from '../../types/financial';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ScenarioParametersTable } from './components/ScenarioParametersTable';
import { ScenarioComparison } from './components/ScenarioComparison';
import ActionButtons from '../ActionButtons';

/**
 * 情境管理容器組件
 * 職責：協調子組件，管理情境切換
 */
const ScenarioContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const scenarios = useScenarios();
  const currentScenario = useCurrentScenario();
  const businessMetrics = useBusinessMetrics();
  
  // 正規化當前情境類型
  const normalizedCurrent = ScenarioEngine.normalizeScenarioType(currentScenario);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>(normalizedCurrent);

  // 提取情境配置（統一處理，無特殊案例）
  const getScenarioConfig = useCallback((type: ScenarioType): ScenarioConfig => {
    const scenarioData = (scenarios as any)?.[type] || {};
    return {
      entryEvEbitdaMultiple: scenarioData.entryEvEbitdaMultiple || 8,
      exitEvEbitdaMultiple: scenarioData.exitEvEbitdaMultiple || 10,
      cogsAsPercentageOfRevenue: scenarioData.cogsAsPercentageOfRevenue || 60,
      operatingExpensesAsPercentageOfRevenue: scenarioData.operatingExpensesAsPercentageOfRevenue || 20,
      netMargin: scenarioData.netMargin || 10,
    };
  }, [scenarios]);

  // 所有情境配置
  const scenarioConfigs = useMemo(() => ({
    base: getScenarioConfig('base'),
    upside: getScenarioConfig('upside'),
    downside: getScenarioConfig('downside'),
  }), [getScenarioConfig]);

  // 處理情境選擇
  const handleScenarioSelect = useCallback((scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  }, []);

  // 處理參數更新
  const handleParameterChange = useCallback((
    scenario: ScenarioType,
    field: keyof ScenarioConfig,
    value: number
  ) => {
    dispatch(updateScenario({
      scenario,
      updates: { [field]: value },
    }));
  }, [dispatch]);

  // 應用情境
  const handleApplyScenario = useCallback(() => {
    const config = scenarioConfigs[selectedScenario];
    
    // 更新當前情境
    dispatch(setCurrentScenario(selectedScenario));
    
    // 同步到假設
    const ebitdaMargin = ScenarioEngine.calculateEbitdaMargin(config);
    dispatch(updateAssumptions({
      cogsAsPercentageOfRevenue: config.cogsAsPercentageOfRevenue,
      operatingExpensesAsPercentageOfRevenue: config.operatingExpensesAsPercentageOfRevenue,
      ebitdaMargin,
    }));
  }, [selectedScenario, scenarioConfigs, dispatch]);

  // 計算情境結果
  const scenarioResults = useMemo(() => {
    if (!businessMetrics?.revenue) return null;
    
    return {
      base: ScenarioEngine.runScenario(businessMetrics, scenarioConfigs.base, 'base'),
      upside: ScenarioEngine.runScenario(businessMetrics, scenarioConfigs.upside, 'upside'),
      downside: ScenarioEngine.runScenario(businessMetrics, scenarioConfigs.downside, 'downside'),
    };
  }, [businessMetrics, scenarioConfigs]);

  // 驗證配置
  const validationErrors = useMemo(() => {
    const errors: Record<ScenarioType, string[]> = {
      base: ScenarioEngine.validateConfig(scenarioConfigs.base),
      upside: ScenarioEngine.validateConfig(scenarioConfigs.upside),
      downside: ScenarioEngine.validateConfig(scenarioConfigs.downside),
    };
    return errors;
  }, [scenarioConfigs]);

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
          
          <ScenarioSelector
            selectedScenario={selectedScenario}
            currentScenario={normalizedCurrent}
            onSelect={handleScenarioSelect}
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleApplyScenario}
              disabled={
                selectedScenario === normalizedCurrent ||
                validationErrors[selectedScenario].length > 0
              }
            >
              應用情境 (Apply Scenario)
            </Button>
            
            {selectedScenario !== normalizedCurrent && (
              <Typography variant="body2" color="text.secondary">
                將應用 {selectedScenario.toUpperCase()} 情境的參數設定
              </Typography>
            )}
            
            {validationErrors[selectedScenario].length > 0 && (
              <Typography variant="body2" color="error">
                {validationErrors[selectedScenario][0]}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* 詳細參數設定 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            詳細參數設定
          </Typography>
          
          <ScenarioParametersTable
            configs={scenarioConfigs}
            businessMetrics={businessMetrics}
            onChange={handleParameterChange}
          />
        </Paper>

        {/* 情境比較 */}
        {scenarioResults && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
              情境比較分析
            </Typography>
            
            <ScenarioComparison results={scenarioResults} />
          </Paper>
        )}

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

export default React.memo(ScenarioContainer);