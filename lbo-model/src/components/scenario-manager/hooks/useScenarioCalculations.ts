/**
 * useScenarioCalculations Hook
 * Linus 原則：純計算，無副作用
 */

import { useMemo } from 'react';
import { ScenarioEngine, ScenarioType, ScenarioConfig, ScenarioResult } from '../ScenarioEngine';
import { BusinessMetricsBeforeAcquisition } from '../../../types/financial';

interface UseScenarioCalculationsParams {
  configs: Record<ScenarioType, ScenarioConfig>;
  baseMetrics: { revenue?: number; [key: string]: unknown } | null;
}

interface UseScenarioCalculationsResult {
  results: Record<ScenarioType, ScenarioResult> | null;
  comparison: {
    best: ScenarioResult;
    worst: ScenarioResult;
    median: ScenarioResult;
  } | null;
  validationErrors: Record<ScenarioType, string[]>;
}

/**
 * 情境計算 Hook
 * 統一處理所有情境計算
 */
export function useScenarioCalculations({
  configs,
  baseMetrics,
}: UseScenarioCalculationsParams): UseScenarioCalculationsResult {
  // 計算所有情境結果
  const results = useMemo(() => {
    if (!baseMetrics?.revenue) return null;
    
    const scenarios: ScenarioType[] = ['base', 'upside', 'downside'];
    const calculatedResults = {} as Record<ScenarioType, ScenarioResult>;
    
    // 統一計算流程，無特殊處理
    scenarios.forEach(scenario => {
      calculatedResults[scenario] = ScenarioEngine.runScenario(
        baseMetrics as unknown as BusinessMetricsBeforeAcquisition,
        configs[scenario],
        scenario
      );
    });
    
    return calculatedResults;
  }, [configs, baseMetrics]);

  // 比較情境
  const comparison = useMemo(() => {
    if (!results) return null;
    
    const resultsArray = Object.values(results);
    return ScenarioEngine.compareScenarios(resultsArray);
  }, [results]);

  // 驗證所有配置
  const validationErrors = useMemo(() => {
    const scenarios: ScenarioType[] = ['base', 'upside', 'downside'];
    const errors = {} as Record<ScenarioType, string[]>;
    
    scenarios.forEach(scenario => {
      errors[scenario] = ScenarioEngine.validateConfig(configs[scenario]);
    });
    
    return errors;
  }, [configs]);

  return {
    results,
    comparison,
    validationErrors,
  };
}