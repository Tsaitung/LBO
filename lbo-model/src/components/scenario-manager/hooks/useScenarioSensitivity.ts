/**
 * useScenarioSensitivity Hook
 * Linus 原則：批量處理，無特殊案例
 */

import { useState, useCallback, useMemo } from 'react';
import { ScenarioEngine, ScenarioConfig, ScenarioResult } from '../ScenarioEngine';
import { BusinessMetricsBeforeAcquisition } from '../../../types/financial';

interface SensitivityAnalysis {
  variable: keyof ScenarioConfig;
  range: number[];
  results: ScenarioResult[];
}

interface UseScenarioSensitivityResult {
  runSensitivity: (
    variable: keyof ScenarioConfig,
    range: number[]
  ) => Promise<void>;
  sensitivityData: SensitivityAnalysis | null;
  isLoading: boolean;
  clearResults: () => void;
}

/**
 * 敏感度分析 Hook
 * 統一處理所有變數的敏感度分析
 */
export function useScenarioSensitivity(
  baseMetrics: BusinessMetricsBeforeAcquisition,
  baseConfig: ScenarioConfig
): UseScenarioSensitivityResult {
  const [sensitivityData, setSensitivityData] = useState<SensitivityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 執行敏感度分析
  const runSensitivity = useCallback(async (
    variable: keyof ScenarioConfig,
    range: number[]
  ) => {
    if (!baseMetrics?.revenue) {
      return;
    }

    setIsLoading(true);
    try {
      const results = await ScenarioEngine.runSensitivity(
        baseMetrics,
        baseConfig,
        variable,
        range
      );

      setSensitivityData({
        variable,
        range,
        results,
      });
    } catch (error) {
      setSensitivityData(null);
    } finally {
      setIsLoading(false);
    }
  }, [baseMetrics, baseConfig]);

  // 清除結果
  const clearResults = useCallback(() => {
    setSensitivityData(null);
  }, []);

  // 生成預設範圍
  const generateRange = useCallback((
    variable: keyof ScenarioConfig,
    baseValue: number,
    steps: number = 5
  ): number[] => {
    // 根據變數類型決定範圍
    const rangeConfig: Record<string, { min: number; max: number; isPercent: boolean }> = {
      entryEvEbitdaMultiple: { min: 0.5, max: 1.5, isPercent: true },
      exitEvEbitdaMultiple: { min: 0.5, max: 1.5, isPercent: true },
      cogsAsPercentageOfRevenue: { min: -10, max: 10, isPercent: false },
      operatingExpensesAsPercentageOfRevenue: { min: -10, max: 10, isPercent: false },
      netMargin: { min: -5, max: 5, isPercent: false },
    };

    const config = rangeConfig[variable] || { min: 0.8, max: 1.2, isPercent: true };
    
    if (config.isPercent) {
      // 百分比變化
      const min = baseValue * config.min;
      const max = baseValue * config.max;
      const step = (max - min) / (steps - 1);
      return Array.from({ length: steps }, (_, i) => min + step * i);
    } else {
      // 絕對值變化
      const min = baseValue + config.min;
      const max = baseValue + config.max;
      const step = (max - min) / (steps - 1);
      return Array.from({ length: steps }, (_, i) => min + step * i);
    }
  }, []);

  return {
    runSensitivity,
    sensitivityData,
    isLoading,
    clearResults,
  };
}