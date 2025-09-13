import React, { useState } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalculateIcon from '@mui/icons-material/Calculate';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useDispatch } from 'react-redux';
import { useMnaDeal, useBusinessMetrics, useAssumptions } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';
import DebtProtectionSettings from '../dividend/DebtProtectionSettings';
import { FinancingPlan } from '../../../types/financial';
import TieredTriggerSettings from '../dividend/TieredTriggerSettings';
import WaterfallConfiguration from '../dividend/WaterfallConfiguration';
import {
  DividendPolicySettings,
  DebtProtectionCovenants,
  DividendTier,
  WaterfallRule,
} from '../../../types/financial';
import { useProFormaData } from '../../../hooks/useProFormaData';

const DividendPolicyTable: React.FC = () => {
  const dispatch = useDispatch();
  const mnaDealDesign = useMnaDeal();
  const businessMetrics = useBusinessMetrics();
  const futureAssumptions = useAssumptions();
  // 移除未使用的變數
  // const scenarios = useScenarios();
  // const currentScenarioKey = useCurrentScenario();
  // const currentScenarioData = ((scenarios as unknown) as { scenarios?: Record<string, ScenarioAssumptions> })?.scenarios?.[currentScenarioKey]
  //   || ((scenarios as unknown) as Record<string, ScenarioAssumptions>)?.[currentScenarioKey]
  //   || ((scenarios as unknown) as { base?: ScenarioAssumptions })?.base;
  
  // 使用共享的 ProForma 數據
  const { proFormaData } = useProFormaData();
  
  // 從股權注入中獲取優先股利率
  const preferredEquity = mnaDealDesign.equityInjections.find(e => e.type === 'preferred');
  const preferredRate = preferredEquity?.dividendRate || 0; // 不提供預設值

  // 初始化股利政策設定
  const [policySettings, setPolicySettings] = useState<DividendPolicySettings>(() => {
    // 檢查是否已有保存的設定
    const existingPolicy = mnaDealDesign.dividendPolicySettings;
    if (existingPolicy) {
      return existingPolicy;
    }

    // 默認設定
    return {
      id: `policy-${Date.now()}`,
      name: 'LBO標準分紅政策',
      covenants: {
        dscr: { value: 1.25, enabled: true },
        netLeverage: { value: 4.0, enabled: true },
        interestCoverage: { value: 3.0, enabled: true },
        minCashMonths: { value: 3, enabled: true },
      },
      tiers: [],
      waterfallRules: [],
      timing: {
        frequency: 'annual',
        evaluationDate: 'Q4+45',
        paymentDate: 'Q2-end',
      },
      redemptionStrategy: {
        year1: 0,
        year2: 0,
        year3: 20,
        year4: 30,
        year5: 50,
      },
    };
  });

  const [expandedPanel, setExpandedPanel] = useState<string | false>('covenants');

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleCovenantsChange = (covenants: DebtProtectionCovenants) => {
    const newSettings: DividendPolicySettings = {
      ...policySettings,
      covenants,
    };
    setPolicySettings(newSettings);
    // 即時同步到Redux，讓 Covenant Monitor 立即反映門檻變更
    dispatch(updateDealDesign({
      dividendPolicySettings: newSettings,
    }));
  };

  const handleTiersChange = (tiers: DividendTier[]) => {
    setPolicySettings({
      ...policySettings,
      tiers,
    });
  };

  const handleWaterfallChange = (waterfallRules: WaterfallRule[]) => {
    setPolicySettings({
      ...policySettings,
      waterfallRules,
    });
  };

  const handleSavePolicy = () => {
    // 保存到Redux state
    dispatch(updateDealDesign({
      dividendPolicySettings: policySettings,
    }));
    
    // 股利政策已保存
  };

  const calculateDividendPreview = () => {
    // 簡單的預覽計算邏輯
    const ebitda = businessMetrics.ebitda / 1000; // 轉換為M
    const fcff = ebitda * 0.7; // 簡化計算
    
    // 確定適用層級
    let applicableTier = policySettings.tiers[0]; // 默認最低層級
    for (const tier of [...policySettings.tiers].reverse()) {
      if (ebitda >= tier.ebitdaThreshold && fcff >= tier.fcffThreshold) {
        applicableTier = tier;
        break;
      }
    }
    
    if (!applicableTier) return null;
    
    const distributableCash = fcff * (applicableTier.payoutRatio / 100);
    
    return {
      fcff,
      tier: applicableTier.name,
      payoutRatio: applicableTier.payoutRatio,
      distributableCash,
    };
  };

  // 計算多年度股利預覽
  const calculateMultiYearDividendPreview = () => {
    const years = Array.from({ length: mnaDealDesign.planningHorizon }, (_, i) => i + 1);
    const baseRevenue = businessMetrics.revenue / 1000;
    // const baseEbitda = businessMetrics.ebitda / 1000; // Reserved for future calculations
    // const entryMultiple = currentScenarioData?.entryEvEbitdaMultiple ?? 0; // Reserved for future calculations
    // const enterpriseValue = baseEbitda * entryMultiple; // Reserved for future calculations
    
    // 計算初始債務
    const year0Debt = mnaDealDesign.financingPlans
      .filter(plan => (!plan.entryTiming || plan.entryTiming === 0) && (plan.amount || 0) > 0)
      .reduce((sum: number, plan: FinancingPlan) => sum + (plan.amount || 0), 0) / 1000;
    
    let cumulativeDebtBalance = year0Debt;
    
    return years.map(year => {
      // 預測財務數據
      const revenue = baseRevenue * Math.pow(1 + futureAssumptions.revenueGrowthRate / 100, year);
      const ebitda = revenue * (futureAssumptions.ebitdaMargin / 100);
      const capex = revenue * (futureAssumptions.capexAsPercentageOfRevenue / 100);
      const fcff = ebitda - capex;
      
      // 檢查當年新融資
      const newDebtThisYear = mnaDealDesign.financingPlans
        .filter(plan => plan.entryTiming === year && (plan.amount || 0) > 0)
        .reduce((sum: number, plan: FinancingPlan) => sum + (plan.amount || 0) / 1000, 0);
      
      cumulativeDebtBalance += newDebtThisYear;
      
      // 計算債務還款和利息
      let principalPayment = 0;
      let interestExpense = 0;
      
      mnaDealDesign.financingPlans.forEach((plan: FinancingPlan) => {
        if (!plan || (plan.amount || 0) <= 0) return;
        if (plan.entryTiming && plan.entryTiming > year) return;
        
        const planAmount = plan.amount / 1000;
        const maturity = Math.max(plan.maturity || 0, 1);
        const rate = plan.interestRate / 100;
        const loanYear = year - (plan.entryTiming || 0);
        
        if (loanYear > 0) {
          if (plan.repaymentMethod === 'equalPrincipal') {
            if (loanYear <= maturity) {
              principalPayment += planAmount / maturity;
              interestExpense += (planAmount - (planAmount / maturity) * (loanYear - 1)) * rate;
            }
          } else if (plan.repaymentMethod === 'bullet' || plan.repaymentMethod === 'interestOnly') {
            interestExpense += planAmount * rate;
            if (loanYear === maturity) {
              principalPayment += planAmount;
            }
          }
        }
      });
      
      cumulativeDebtBalance = Math.max(0, cumulativeDebtBalance - principalPayment);
      
      // 計算營運費用和最低現金
      const operatingExpenses = revenue - ebitda;
      const monthlyOperatingExpenses = operatingExpenses / 12;
      const minimumCashMonths = policySettings.covenants.minCashMonths.value;
      const minimumCash = monthlyOperatingExpenses * minimumCashMonths;
      
      // 從 proFormaData 獲取實際現金餘額
      const yearData = proFormaData.find(d => d.year === year);
      const actualCash = yearData ? parseFloat(yearData.endingCash) : 0;
      
      // 計算債務保護指標
      const debtService = interestExpense + principalPayment;
      const dscr = debtService > 0 ? ebitda / debtService : 999;
      const netLeverage = ebitda > 0 ? cumulativeDebtBalance / ebitda : 0;
      const interestCoverage = interestExpense > 0 ? ebitda / interestExpense : 999;
      const cashMonths = monthlyOperatingExpenses > 0 ? actualCash / monthlyOperatingExpenses : 999;
      
      // 檢查條件是否滿足
      const dscrCompliant = !policySettings.covenants.dscr.enabled || 
                           dscr >= policySettings.covenants.dscr.value;
      const leverageCompliant = !policySettings.covenants.netLeverage.enabled || 
                               netLeverage <= policySettings.covenants.netLeverage.value;
      const coverageCompliant = !policySettings.covenants.interestCoverage.enabled || 
                               interestCoverage >= policySettings.covenants.interestCoverage.value;
      const cashCompliant = !policySettings.covenants.minCashMonths.enabled || 
                          cashMonths >= policySettings.covenants.minCashMonths.value;
      
      const allConditionsMet = dscrCompliant && leverageCompliant && coverageCompliant && cashCompliant;
      
      // 計算可分配現金
      const availableCashForDividend = Math.max(0, actualCash - minimumCash);
      // 使用層級設定的分配比例，若無設定則使用50%
      const payoutRatio = policySettings.tiers.length > 0 && policySettings.tiers[0].payoutRatio 
        ? policySettings.tiers[0].payoutRatio / 100 
        : 0.5;
      const distributableCash = allConditionsMet ? availableCashForDividend * payoutRatio : 0;
      
      // 計算佔比
      const distributableRatioToFCFF = fcff > 0 ? (distributableCash / fcff) * 100 : 0;
      const distributableRatioToEBITDA = ebitda > 0 ? (distributableCash / ebitda) * 100 : 0;
      
      return {
        year,
        revenue: revenue.toFixed(1),
        ebitda: ebitda.toFixed(1),
        fcff: fcff.toFixed(1),
        dscr: dscr.toFixed(2),
        dscrCompliant,
        netLeverage: netLeverage.toFixed(2),
        leverageCompliant,
        interestCoverage: interestCoverage.toFixed(2),
        coverageCompliant,
        cashMonths: cashMonths.toFixed(1),
        cashCompliant,
        estimatedCash: actualCash.toFixed(1),
        minimumCash: minimumCash.toFixed(1),
        availableCash: availableCashForDividend.toFixed(1),
        allConditionsMet,
        distributableCash: distributableCash.toFixed(1),
        distributableRatioToFCFF: distributableRatioToFCFF.toFixed(1),
        distributableRatioToEBITDA: distributableRatioToEBITDA.toFixed(1),
      };
    });
  };

  // const preview = calculateDividendPreview(); // Reserved for future display
  const multiYearPreview = calculateMultiYearDividendPreview();

  return (
    <Box>
      {/* 頂部操作欄 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          股利分紅政策設定
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={calculateDividendPreview}
          >
            預覽計算
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePolicy}
          >
            保存政策
          </Button>
        </Box>
      </Box>


      {/* 多年度預覽表格 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            多年度股利分配預覽
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            基於預測財務數據和債務保護條件的年度分配計畫
          </Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>年度</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">EBITDA</TableCell>
                  <TableCell align="right">FCFF</TableCell>
                  <TableCell align="center">DSCR</TableCell>
                  <TableCell align="center">淨槓桿</TableCell>
                  <TableCell align="center">利息覆蓋</TableCell>
                  <TableCell align="center">現金月數</TableCell>
                  <TableCell align="center">條件達成</TableCell>
                  <TableCell align="right">可分配現金</TableCell>
                  <TableCell align="right">佔FCFF%</TableCell>
                  <TableCell align="right">佔EBITDA%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {multiYearPreview.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>Year {row.year}</TableCell>
                    <TableCell align="right">{row.revenue}M</TableCell>
                    <TableCell align="right">{row.ebitda}M</TableCell>
                    <TableCell align="right">{row.fcff}M</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.dscrCompliant ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                        <Typography variant="body2">{row.dscr}x</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.leverageCompliant ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                        <Typography variant="body2">{row.netLeverage}x</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.coverageCompliant ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                        <Typography variant="body2">{row.interestCoverage}x</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.cashCompliant ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                        <Typography variant="body2">{row.cashMonths}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.allConditionsMet ? '達成' : '未達成'}
                        color={row.allConditionsMet ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: row.allConditionsMet ? 'success.main' : 'text.disabled'
                        }}
                      >
                        {row.distributableCash}M
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: row.allConditionsMet ? 'text.primary' : 'text.disabled'
                        }}
                      >
                        {row.distributableRatioToFCFF}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: row.allConditionsMet ? 'text.primary' : 'text.disabled'
                        }}
                      >
                        {row.distributableRatioToEBITDA}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="body2" color="info.main">
              <strong>債務保護條件：</strong>
              <br />
              • DSCR (債務服務覆蓋率) ≥ {policySettings.covenants.dscr.value}x
              <br />
              • 淨槓桿率 (Net Debt/EBITDA) ≤ {policySettings.covenants.netLeverage.value}x
              <br />
              • 利息覆蓋率 (EBITDA/Interest) ≥ {policySettings.covenants.interestCoverage.value}x
              <br />
              • 最低現金保留 ≥ {policySettings.covenants.minCashMonths.value} 個月營運費用
              <br />
              • 只有當所有條件都滿足時，才能進行股利分配
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.main">
              <strong>計算邏輯說明：</strong>
              <br />
              • 初始現金 = 收購融資總額 × 10%（作為營運資金）
              <br />
              • 營運現金流 = EBITDA - 利息支出 - 稅金（稅率: {futureAssumptions.taxRate}%）
              <br />
              • 淨現金流 = 營運現金流 - 資本支出 - 本金償還
              <br />
              • 累積現金 = 前期現金餘額 + 本期淨現金流
              <br />
              • 可分配現金 = Max(0, 累積現金 - 最低現金保留)
              <br />
              • 實際分配 = 可分配現金 × 分配比例（{policySettings.tiers.length > 0 && policySettings.tiers[0].payoutRatio ? policySettings.tiers[0].payoutRatio : 50}%）
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 設定面板 */}
      <Box>
        <Accordion 
          expanded={expandedPanel === 'covenants'} 
          onChange={handlePanelChange('covenants')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ width: '33%', flexShrink: 0 }}>
              Step 1: 債務保護條件
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              設定分紅前必須滿足的財務條件
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DebtProtectionSettings
              covenants={policySettings.covenants}
              onChange={handleCovenantsChange}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expandedPanel === 'tiers'} 
          onChange={handlePanelChange('tiers')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ width: '33%', flexShrink: 0 }}>
              Step 2: 分級觸發條件
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              根據財務表現決定FCFF分配比例
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TieredTriggerSettings
              tiers={policySettings.tiers}
              onChange={handleTiersChange}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expandedPanel === 'waterfall'} 
          onChange={handlePanelChange('waterfall')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ width: '33%', flexShrink: 0 }}>
              Step 3: 瀑布式分配
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              設定分配優先順序和規則
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <WaterfallConfiguration
              rules={policySettings.waterfallRules}
              onChange={handleWaterfallChange}
              preferredStockRate={preferredRate}
            />
          </AccordionDetails>
        </Accordion>

      </Box>
    </Box>
  );
};

export default DividendPolicyTable;
