import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  useBusinessMetrics,
  useAssumptions,
  useMnaDeal,
  useIncomeStatements,
} from '../../hooks/typed-hooks';
import { useProFormaData } from '../../hooks/useProFormaData';
import { FinancingPlan } from '../../types/financial';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
// Removed unused import: AccountBalanceWalletIcon

const DebtCovenantMonitor: React.FC = () => {
  const businessMetrics = useBusinessMetrics();
  const mnaDealDesign = useMnaDeal();
  const futureAssumptions = useAssumptions();
  const incomeStatement = useIncomeStatements();
  // const debtSchedule = useDebtSchedule(); // Reserved for future use
  
  // 使用統一的 ProForma 數據源
  const { proFormaData } = useProFormaData();

  // 獲取股利政策中的契約條款設定
  const covenants = mnaDealDesign?.dividendPolicySettings?.covenants || {
    dscr: { value: 1.25, enabled: true },
    netLeverage: { value: 4.0, enabled: true },
    interestCoverage: { value: 3.0, enabled: true },
    minCashMonths: { value: 3, enabled: true },
  };

  // 計算各年度的契約指標
  const calculateCovenantMetrics = () => {
    const years = Array.from({ length: mnaDealDesign?.planningHorizon || 5 }, (_, i) => i + 1);
    const baseRevenue = (businessMetrics?.revenue || 0) / 1000;
    // const baseEbitda = (businessMetrics?.ebitda || 0) / 1000; // Reserved for calculations
    
    // 計算初始債務（只計入Year 0進入的融資）
    const year0Debt = (mnaDealDesign?.financingPlans || [])
      .filter((plan: FinancingPlan) => !plan.entryTiming || plan.entryTiming === 0)
      .reduce((sum: number, plan: FinancingPlan) => sum + (plan.amount || 0), 0) / 1000;
    // const year0Equity = (mnaDealDesign?.equityInjections || [])
    //   .filter((inj: any) => !inj.entryTiming || inj.entryTiming === 0)
    //   .reduce((sum: number, inj: any) => sum + (inj.amount || 0), 0) / 1000; // Reserved for calculations
    
    // 追蹤累積債務餘額
    let cumulativeDebtBalance = year0Debt;
    
    return years.map(year => {
      // 預測財務數據
      const revenue = baseRevenue * Math.pow(1 + futureAssumptions.revenueGrowthRate / 100, year);
      const ebitda = revenue * (futureAssumptions.ebitdaMargin / 100);
      
      // 檢查當年是否有新融資進入
      const newDebtThisYear = (mnaDealDesign?.financingPlans || [])
        .filter((plan: FinancingPlan) => plan.entryTiming === year && (plan.amount || 0) > 0)
        .reduce((sum: number, plan: FinancingPlan) => sum + (plan.amount || 0) / 1000, 0);
      
      // 更新債務餘額
      cumulativeDebtBalance += newDebtThisYear;
      
      // 計算債務還款和利息
      let principalPayment = 0;
      let interestExpense = 0;
      
      (mnaDealDesign?.financingPlans || []).forEach((plan: FinancingPlan) => {
        if (!plan || (plan.amount || 0) <= 0) return;
        // 檢查融資是否已經進入
        if (plan.entryTiming && plan.entryTiming > year) {
          return; // 尚未進入
        }
        
        // 檢查是否為當年期末進入（期末進入當年不計息）
        const isEndOfYearEntry = plan.entryTiming === year && plan.entryTimingType === 'end';
        if (isEndOfYearEntry) {
          return;
        }
        
        const planAmount = plan.amount / 1000;
        const maturity = Math.max(plan.maturity || 0, 1);
        const rate = plan.interestRate / 100;
        const loanYear = year - (plan.entryTiming || 0);
        
        if (loanYear > 0) {
          // 根據還款方式計算
          if (plan.repaymentMethod === 'equalPrincipal') {
            if (loanYear <= maturity) {
              principalPayment += planAmount / maturity;
              interestExpense += (planAmount - (planAmount / maturity) * (loanYear - 1)) * rate;
            }
          } else if (plan.repaymentMethod === 'equalPayment') {
            if (loanYear <= maturity) {
              const pmt = planAmount * rate * Math.pow(1 + rate, maturity) / (Math.pow(1 + rate, maturity) - 1);
              const remainingBalance = planAmount * (Math.pow(1 + rate, maturity) - Math.pow(1 + rate, loanYear - 1)) / (Math.pow(1 + rate, maturity) - 1);
              const interestPortion = remainingBalance * rate;
              principalPayment += pmt - interestPortion;
              interestExpense += interestPortion;
            }
          } else if (plan.repaymentMethod === 'bullet' || plan.repaymentMethod === 'interestOnly') {
            interestExpense += planAmount * rate;
            if (loanYear === maturity) {
              principalPayment += planAmount;
            }
          } else if (plan.repaymentMethod === 'revolving') {
            interestExpense += planAmount * rate;
          }
        }
      });
      
      // 更新債務餘額
      cumulativeDebtBalance = Math.max(0, cumulativeDebtBalance - principalPayment);
      
      // 計算營運費用（Revenue - EBITDA = Operating Expenses）
      const operatingExpenses = revenue - ebitda;
      const monthlyOperatingExpenses = operatingExpenses / 12;
      
      // 從統一的 ProForma 數據獲取現金餘額
      const yearData = proFormaData.find(d => d.year === year);
      const actualCash = yearData ? parseFloat(yearData.endingCash) : 0; // 無數據時不注入估算常數
      
      // 從實際財務數據獲取 EBITDA（如果有）
      const incomeData = incomeStatement.find(inc => inc.year === year);
      const actualEbitda = incomeData ? incomeData.ebitda / 1000 : ebitda;
      
      // 計算契約指標（使用實際數據）
      const debtService = interestExpense + principalPayment;
      const dscr = debtService > 0 ? actualEbitda / debtService : 999; // DSCR = EBITDA / (Interest + Principal)
      const netLeverage = actualEbitda > 0 ? cumulativeDebtBalance / actualEbitda : 0;
      const interestCoverage = interestExpense > 0 ? actualEbitda / interestExpense : 999;
      const cashMonths = monthlyOperatingExpenses > 0 ? actualCash / monthlyOperatingExpenses : 999; // 現金可支撐月數
      
      // 檢查是否符合契約要求
      const dscrCompliant = !covenants.dscr.enabled || dscr >= covenants.dscr.value;
      const leverageCompliant = !covenants.netLeverage.enabled || netLeverage <= covenants.netLeverage.value;
      const coverageCompliant = !covenants.interestCoverage.enabled || interestCoverage >= covenants.interestCoverage.value;
      const cashCompliant = !covenants.minCashMonths.enabled || cashMonths >= covenants.minCashMonths.value;
      
      const allCompliant = dscrCompliant && leverageCompliant && coverageCompliant && cashCompliant;
      
      return {
        year,
        dscr: dscr.toFixed(2),
        dscrCompliant,
        netLeverage: netLeverage.toFixed(2),
        leverageCompliant,
        interestCoverage: interestCoverage.toFixed(2),
        coverageCompliant,
        cashMonths: cashMonths.toFixed(1),
        cashCompliant,
        outstandingDebt: cumulativeDebtBalance.toFixed(1),
        cashBalance: actualCash.toFixed(1),
        allCompliant,
      };
    });
  };

  const metricsData = calculateCovenantMetrics();

  // 計算整體健康度分數
  const calculateHealthScore = () => {
    const latestMetrics = metricsData[metricsData.length - 1];
    let score = 0;
    let maxScore = 0;
    
    if (covenants.dscr.enabled) {
      maxScore += 25;
      const ratio = parseFloat(latestMetrics.dscr) / covenants.dscr.value;
      score += Math.min(25, ratio * 25);
    }
    
    if (covenants.netLeverage.enabled) {
      maxScore += 25;
      const ratio = covenants.netLeverage.value / parseFloat(latestMetrics.netLeverage);
      score += Math.min(25, ratio * 25);
    }
    
    if (covenants.interestCoverage.enabled) {
      maxScore += 25;
      const ratio = parseFloat(latestMetrics.interestCoverage) / covenants.interestCoverage.value;
      score += Math.min(25, ratio * 25);
    }
    
    if (covenants.minCashMonths.enabled) {
      maxScore += 25;
      const ratio = parseFloat(latestMetrics.cashMonths) / covenants.minCashMonths.value;
      score += Math.min(25, ratio * 25);
    }
    
    return maxScore > 0 ? (score / maxScore) * 100 : 100;
  };

  const healthScore = calculateHealthScore();
  const healthStatus = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'warning' : 'critical';

  const getStatusIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircleIcon color="success" fontSize="small" />
    ) : (
      <ErrorIcon color="error" fontSize="small" />
    );
  };

  const getStatusChip = (compliant: boolean) => {
    return compliant ? (
      <Chip label="合規" color="success" size="small" />
    ) : (
      <Chip label="違約" color="error" size="small" />
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 1 }} />
        債務契約條款監控 (Covenant Compliance Monitor)
      </Typography>

      {/* 健康度總覽 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33% - 12px)' } }}>
              <Typography variant="h6" gutterBottom>
                財務健康度評分
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={healthScore}
                  sx={{
                    width: '100%',
                    height: 20,
                    borderRadius: 10,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: healthStatus === 'excellent' ? 'success.main' :
                              healthStatus === 'good' ? 'info.main' :
                              healthStatus === 'warning' ? 'warning.main' : 'error.main',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {healthScore.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {healthStatus === 'excellent' ? '優秀 - 所有指標遠超要求' :
                 healthStatus === 'good' ? '良好 - 符合所有契約要求' :
                 healthStatus === 'warning' ? '警告 - 接近契約限制' :
                 '危險 - 可能違反契約條款'}
              </Typography>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(67% - 12px)' } }}>
              <Typography variant="h6" gutterBottom>
                契約條款設定
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {covenants.dscr.enabled ? <CheckCircleIcon color="primary" /> : <WarningIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`債務服務覆蓋率 (DSCR) ≥ ${covenants.dscr.value}x`}
                    secondary={covenants.dscr.enabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {covenants.netLeverage.enabled ? <CheckCircleIcon color="primary" /> : <WarningIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`淨槓桿率 (Net Leverage) < ${covenants.netLeverage.value}x`}
                    secondary={covenants.netLeverage.enabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {covenants.interestCoverage.enabled ? <CheckCircleIcon color="primary" /> : <WarningIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`利息覆蓋率 (Interest Coverage) ≥ ${covenants.interestCoverage.value}x`}
                    secondary={covenants.interestCoverage.enabled ? '已啟用' : '未啟用'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {covenants.minCashMonths.enabled ? <CheckCircleIcon color="primary" /> : <WarningIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`最低現金月數 ≥ ${covenants.minCashMonths.value}個月`}
                    secondary={covenants.minCashMonths.enabled ? 
                      '已啟用 - 現金餘額必須能支撐至少該月數的營運費用' : 
                      '未啟用'}
                  />
                </ListItem>
              </List>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 年度指標追蹤表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            契約指標年度追蹤
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>年度</TableCell>
                  <TableCell align="center">
                    DSCR
                    <Typography variant="caption" display="block" sx={{ fontWeight: 'normal' }}>
                      (實際值/門檻≥{covenants.dscr.value})
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    淨槓桿率
                    <Typography variant="caption" display="block" sx={{ fontWeight: 'normal' }}>
                      (實際值/門檻≤{covenants.netLeverage.value})
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    利息覆蓋率
                    <Typography variant="caption" display="block" sx={{ fontWeight: 'normal' }}>
                      (實際值/門檻≥{covenants.interestCoverage.value})
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    現金月數
                    <Typography variant="caption" display="block" sx={{ fontWeight: 'normal' }}>
                      (實際值/門檻≥{covenants.minCashMonths.value})
                    </Typography>
                  </TableCell>
                  <TableCell align="center">債務餘額(M)</TableCell>
                  <TableCell align="center">現金餘額(M)</TableCell>
                  <TableCell align="center">合規狀態</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metricsData.map((row) => (
                  <TableRow key={row.year} sx={{ bgcolor: row.allCompliant ? 'inherit' : 'error.50' }}>
                    <TableCell>第{row.year}年</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.dscr}x
                        {covenants.dscr.enabled && getStatusIcon(row.dscrCompliant)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.netLeverage}x
                        {covenants.netLeverage.enabled && getStatusIcon(row.leverageCompliant)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.interestCoverage}x
                        {covenants.interestCoverage.enabled && getStatusIcon(row.coverageCompliant)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {row.cashMonths}
                        {covenants.minCashMonths.enabled && getStatusIcon(row.cashCompliant)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{row.outstandingDebt}</TableCell>
                    <TableCell align="center">{row.cashBalance}</TableCell>
                    <TableCell align="center">
                      {getStatusChip(row.allCompliant)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 風險提示 */}
          {metricsData.some(m => !m.allCompliant) && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <AlertTitle>契約違約風險提示</AlertTitle>
              存在違反債務契約條款的風險，請注意：
              <ul>
                {metricsData.filter(m => !m.allCompliant).map(m => (
                  <li key={m.year}>
                    第{m.year}年可能違反契約條款，需要調整財務計劃或與債權人協商
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {/* 改善建議 */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              <TrendingDownIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              財務改善建議
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="優化營運資本管理，縮短應收帳款天數以提升現金流" />
              </ListItem>
              <ListItem>
                <ListItemText primary="考慮提前償還部分高利率債務，降低財務費用負擔" />
              </ListItem>
              <ListItem>
                <ListItemText primary="保持適當現金儲備，確保滿足最低現金要求" />
              </ListItem>
              <ListItem>
                <ListItemText primary="定期與債權人溝通，必要時協商調整契約條款" />
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DebtCovenantMonitor;
