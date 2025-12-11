/**
 * ScenarioManagerContainer - 情境管理主容器
 * 整合所有假設類別：增長、資本支出、營運資本、其他財務、計算參數
 * Linus 原則：統一處理，消除特殊案例
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useAppDispatch,
  useAppSelector,
  useCurrentScenario,
  useBusinessMetrics,
} from '../../hooks/typed-hooks';
import {
  setCurrentScenario,
  ScenarioType,
} from '../../store/slices/scenarios.slice';
import { ScenarioAssumptions } from '../../types/financial';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ValuationParamsTab } from './tabs/ValuationParamsTab';
import { GrowthAssumptionsTab } from './tabs/GrowthAssumptionsTab';
import { CapexAssumptionsTab } from './tabs/CapexAssumptionsTab';
import { WorkingCapitalTab } from './tabs/WorkingCapitalTab';
import { OtherFinancialsTab } from './tabs/OtherFinancialsTab';
import { CalculationParamsTab } from './tabs/CalculationParamsTab';
import ActionButtons from '../ActionButtons';

// Tab 配置
interface TabConfig {
  label: string;
  value: number;
}

const TABS: TabConfig[] = [
  { label: '估值參數', value: 0 },
  { label: '增長假設', value: 1 },
  { label: '資本支出', value: 2 },
  { label: '營運資本', value: 3 },
  { label: '其他財務', value: 4 },
  { label: '計算參數', value: 5 },
];

// TabPanel 組件
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`scenario-tabpanel-${index}`}
    aria-labelledby={`scenario-tab-${index}`}
    sx={{ pt: 3 }}
  >
    {value === index && children}
  </Box>
);

/**
 * 情境管理主容器組件
 * 職責：協調子組件，管理情境切換和 Tab 導航
 */
const ScenarioManagerContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentScenario = useCurrentScenario();
  const businessMetrics = useBusinessMetrics();

  // 直接從 Redux store 讀取 scenarios 數據
  const scenarios = useAppSelector((state) => {
    // 嘗試從 modular store 讀取
    const modularScenarios = (state as { scenarios?: { scenarios?: { base: ScenarioAssumptions; upside: ScenarioAssumptions; downside: ScenarioAssumptions } } }).scenarios?.scenarios;
    if (modularScenarios?.base) {
      return modularScenarios;
    }
    // Fallback: 返回空物件（會使用預設值）
    return {
      base: {} as ScenarioAssumptions,
      upside: {} as ScenarioAssumptions,
      downside: {} as ScenarioAssumptions,
    };
  });

  // Tab 狀態
  const [activeTab, setActiveTab] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>(currentScenario);

  // 從 businessMetrics 計算歷史參考值
  const historicalData = useMemo(() => {
    if (!businessMetrics?.revenue) return undefined;

    const revenue = businessMetrics.revenue;
    const cogs = businessMetrics.cogs || 0;
    // EBIT = EBITDA - D&A
    const ebit = (businessMetrics.ebitda || 0) - (businessMetrics.depreciationAmortization || 0);

    return {
      // 利潤率
      ebitdaMargin: (businessMetrics.ebitda / revenue) * 100,
      netMargin: (businessMetrics.netIncome / revenue) * 100,
      // 成本結構
      cogsRatio: (cogs / revenue) * 100,
      opexRatio: (businessMetrics.operatingExpenses / revenue) * 100,
      // 稅率
      effectiveTaxRate: ebit > 0
        ? ((businessMetrics.taxExpense || 0) / ebit) * 100
        : 20,
      // CapEx (使用投資現金流作為近似，取絕對值；如果沒有則使用預設)
      capexRatio: businessMetrics.investingCashFlow
        ? (Math.abs(businessMetrics.investingCashFlow) / revenue) * 100
        : 4,
      // 營運資本天數 (簡化計算)
      arDays: businessMetrics.accountsReceivable
        ? (businessMetrics.accountsReceivable / revenue) * 365
        : 45,
      inventoryDays: businessMetrics.inventory
        ? (businessMetrics.inventory / (cogs || revenue * 0.6)) * 365
        : 60,
      apDays: businessMetrics.accountsPayable
        ? (businessMetrics.accountsPayable / (cogs || revenue * 0.6)) * 365
        : 35,
    };
  }, [businessMetrics]);

  // 處理情境選擇
  const handleScenarioSelect = useCallback((scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  }, []);

  // 應用情境
  const handleApplyScenario = useCallback(() => {
    dispatch(setCurrentScenario(selectedScenario));
  }, [selectedScenario, dispatch]);

  // 處理 Tab 切換
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom color="primary">
        Scenario Manager - 情境管理
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        統一管理所有情境假設。選擇情境後可在各分類 Tab 中調整參數，變更會即時影響財務計算。
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 情境選擇 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            情境選擇
          </Typography>

          <ScenarioSelector
            selectedScenario={selectedScenario}
            currentScenario={currentScenario}
            onSelect={handleScenarioSelect}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleApplyScenario}
              disabled={selectedScenario === currentScenario}
            >
              應用情境 (Apply Scenario)
            </Button>

            {selectedScenario !== currentScenario && (
              <Typography variant="body2" color="text.secondary">
                將應用 {selectedScenario.toUpperCase()} 情境的參數設定
              </Typography>
            )}
          </Box>
        </Paper>

        {/* 假設參數 Tabs */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 2 }}>
            假設參數設定
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="scenario assumptions tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  id={`scenario-tab-${tab.value}`}
                  aria-controls={`scenario-tabpanel-${tab.value}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab 0: 估值參數 */}
          <TabPanel value={activeTab} index={0}>
            <ValuationParamsTab scenarios={scenarios} />
          </TabPanel>

          {/* Tab 1: 增長假設 */}
          <TabPanel value={activeTab} index={1}>
            <GrowthAssumptionsTab
              scenarios={scenarios}
              historicalData={historicalData}
            />
          </TabPanel>

          {/* Tab 2: 資本支出 */}
          <TabPanel value={activeTab} index={2}>
            <CapexAssumptionsTab
              scenarios={scenarios}
              historicalData={historicalData}
            />
          </TabPanel>

          {/* Tab 3: 營運資本 */}
          <TabPanel value={activeTab} index={3}>
            <WorkingCapitalTab
              scenarios={scenarios}
              historicalData={historicalData}
            />
          </TabPanel>

          {/* Tab 4: 其他財務 */}
          <TabPanel value={activeTab} index={4}>
            <OtherFinancialsTab
              scenarios={scenarios}
              historicalData={historicalData}
            />
          </TabPanel>

          {/* Tab 5: 計算參數 */}
          <TabPanel value={activeTab} index={5}>
            <CalculationParamsTab scenarios={scenarios} />
          </TabPanel>
        </Paper>

        {/* 動作按鈕 */}
        <ActionButtons
          title="情境假設設定完成"
          onProceed={() => navigate('/mna-deal')}
          nextStepLabel="設定 M&A 交易結構"
          showSave={true}
          showProceed={true}
        />
      </Box>
    </Box>
  );
};

export default React.memo(ScenarioManagerContainer);
