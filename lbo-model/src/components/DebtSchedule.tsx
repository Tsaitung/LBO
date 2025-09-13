import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
} from '@mui/material';
import { useMnaDeal } from '../hooks/typed-hooks';
import { FinancingPlan } from '../types/financial';

const DebtSchedule: React.FC = () => {
  const mnaDealDesign = useMnaDeal();
  // const futureAssumptions = useAssumptions(); // Reserved for future use

  // 如果沒有融資計劃，顯示提示
  if (mnaDealDesign.financingPlans.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          尚未設定債務融資計劃。請先在上方表格中新增債務融資項目。
        </Alert>
      </Box>
    );
  }


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value * 1000);
  };

  // 計算每筆貸款的償還明細
  const calculateLoanSchedule = (plan: FinancingPlan, year: number) => {
    const amount = plan.amount / 1000; // 轉換為百萬
    const rate = plan.interestRate / 100;
    const maturity = plan.maturity;
    const entryTiming = plan.entryTiming || 0;
    const method = plan.repaymentMethod;
    
    // 如果還沒到貸款開始時間
    if (year < entryTiming) {
      return {
        beginningBalance: 0,
        interestExpense: 0,
        principalRepayment: 0,
        endingBalance: 0,
      };
    }
    
    // 計算從貸款開始的第幾年
    const loanYear = year - entryTiming;
    
    // 如果是貸款開始的當年（Year 0）
    if (loanYear === 0) {
      // 只有期末進入才特殊處理
      if (plan.entryTimingType === 'end') {
        return {
          beginningBalance: 0,      // 期初還沒貸款
          interestExpense: 0,       // 不計息
          principalRepayment: 0,    // 不還本
          endingBalance: amount,    // 期末才有貸款
        };
      }
      // 期初進入：將 loanYear 設為 1，進行正常計算
      // 不直接 return，繼續往下執行
    }
    
    // 計算實際清償年度
    // 期初進入：進入年開始算，共 maturity 年
    // 期末進入：下一年開始算，共 maturity 年
    const finalRepaymentYear = plan.entryTimingType === 'end' ?
      entryTiming + maturity :  // 期末：Year 0 期末進入，Year 1-N 還款
      entryTiming + maturity - 1; // 期初：Year N 期初進入，當年開始還款
    
    // 如果超過清償年度
    if (year > finalRepaymentYear) {
      return {
        beginningBalance: 0,
        interestExpense: 0,
        principalRepayment: 0,
        endingBalance: 0,
      };
    }
    
    // 根據還款方式計算
    let beginningBalance = amount;
    let interestExpense = 0;
    let principalRepayment = 0;
    
    // 對於期初進入的貸款，從第1年開始算；期末進入從第0年開始算
    const effectiveLoanYear = plan.entryTimingType === 'beginning' || 
                              (plan.entryTimingType !== 'end' && loanYear === 0) ? 
      loanYear + 1 :  // 期初：Year N 是第 N+1 個還款年
      loanYear;       // 期末：Year N 是第 N 個還款年
    
    // 計算實際還款期數（考慮期初/期末的差異）
    const actualMaturity = plan.entryTimingType === 'end' ? 
      maturity :  // 期末進入：年期即為還款期數
      maturity;   // 期初進入：年期也是還款期數
    
    if (method === 'equalPrincipal') {
      // 等額本金
      principalRepayment = amount / actualMaturity;
      beginningBalance = amount - (principalRepayment * (effectiveLoanYear - 1));
      interestExpense = beginningBalance * rate;
    } else if (method === 'equalPayment') {
      // 等額本息
      const pmt = (amount * rate * Math.pow(1 + rate, actualMaturity)) / 
                  (Math.pow(1 + rate, actualMaturity) - 1);
      beginningBalance = amount * (Math.pow(1 + rate, actualMaturity) - Math.pow(1 + rate, effectiveLoanYear - 1)) / 
                        (Math.pow(1 + rate, actualMaturity) - 1);
      interestExpense = beginningBalance * rate;
      principalRepayment = pmt - interestExpense;
    } else if (method === 'bullet' || method === 'interestOnly') {
      // 到期還本 - 在最後一年還清
      beginningBalance = amount;
      interestExpense = amount * rate;
      // 判斷是否為最後一年
      const isLastYear = year === finalRepaymentYear;
      principalRepayment = isLastYear ? amount : 0;
    } else if (method === 'revolving') {
      // 循環信用（假設不還本）
      beginningBalance = amount;
      interestExpense = amount * rate;
      principalRepayment = 0;
    }
    
    const endingBalance = Math.max(0, beginningBalance - principalRepayment);
    
    return {
      beginningBalance,
      interestExpense,
      principalRepayment,
      endingBalance,
    };
  };

  // 計算所有貸款的最後清償年度
  const getMaxRepaymentYear = () => {
    let maxYear = mnaDealDesign.planningHorizon;
    
    mnaDealDesign.financingPlans.forEach((plan: FinancingPlan) => {
      const entryTiming = plan.entryTiming || 0;
      const maturity = plan.maturity;
      
      // 計算每筆貸款的最後清償年度
      const finalYear = plan.entryTimingType === 'end' ?
        entryTiming + maturity :      // 期末：進入年 + 年期
        entryTiming + maturity - 1;   // 期初：進入年 + 年期 - 1
      
      maxYear = Math.max(maxYear, finalYear);
    });
    
    return maxYear;
  };

  // 生成年份列表（從 Year 0 到最大清償年度）
  const maxRepaymentYear = getMaxRepaymentYear();
  const years = Array.from({ length: maxRepaymentYear + 1 }, (_, i) => i);

  // 移除分頁，因為橫向表格顯示所有年份

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        橫向顯示各債務類型的償還時間表。包含 Senior、Mezzanine 和 Revolver 債務的詳細償還計劃、利息計算和本金攤還。
      </Alert>

      {/* 融資計劃摘要 */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          融資計劃摘要
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {mnaDealDesign.financingPlans.map((plan: FinancingPlan) => (
            <Chip
              key={plan.id}
              label={`${plan.name}: ${formatCurrency(plan.amount)}`}
              sx={{
                color: 'white',
                bgcolor: plan.type === 'senior' ? 'primary.dark' :
                         plan.type === 'mezzanine' ? 'secondary.main' : 'warning.main'
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* 橫向債務計劃表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>項目</TableCell>
              {years.map((year) => (
                <TableCell
                  key={year}
                  align="center"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: 120
                  }}
                >
                  Year {year}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 為每筆貸款生成償還明細 */}
            {mnaDealDesign.financingPlans.map((plan: FinancingPlan, planIndex: number) => {
              const getColor = () => {
                if (plan.facilityType === 'senior' || plan.type === 'senior') return 'primary.main';
                if (plan.facilityType === 'mezzanine' || plan.type === 'mezzanine') return 'secondary.main';
                return 'warning.main';
              };
              const planColor = getColor();
              
              return (
                <React.Fragment key={plan.id}>
                  {/* 期初餘額 */}
                  <TableRow sx={{ bgcolor: planIndex % 2 === 0 ? 'grey.50' : 'white' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: planColor }}>
                      {plan.name} - 期初餘額
                    </TableCell>
                    {years.map((year) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return (
                        <TableCell key={year} align="right">
                          {schedule.beginningBalance > 0 ? formatCurrency(schedule.beginningBalance) : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* 利息支出 */}
                  <TableRow>
                    <TableCell sx={{ pl: 4, color: planColor }}>
                      {plan.name} - 利息支出
                    </TableCell>
                    {years.map((year) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return (
                        <TableCell key={year} align="right">
                          {schedule.interestExpense > 0 ? formatCurrency(schedule.interestExpense) : 
                           (schedule.beginningBalance > 0 && year === (plan.entryTiming || 0) ? '$0' : '-')}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* 本金償還 */}
                  <TableRow>
                    <TableCell sx={{ pl: 4, color: planColor }}>
                      {plan.name} - 本金償還
                    </TableCell>
                    {years.map((year) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return (
                        <TableCell key={year} align="right">
                          {schedule.principalRepayment > 0 ? formatCurrency(schedule.principalRepayment) : 
                           (schedule.beginningBalance > 0 ? '$0' : '-')}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* 期末餘額 */}
                  <TableRow sx={{ borderBottom: '2px solid #e0e0e0' }}>
                    <TableCell sx={{ pl: 4, color: planColor, fontWeight: 'bold' }}>
                      {plan.name} - 期末餘額
                    </TableCell>
                    {years.map((year) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return (
                        <TableCell key={year} align="right" sx={{ fontWeight: 'bold' }}>
                          {(schedule.endingBalance > 0 || schedule.beginningBalance > 0) ? 
                           formatCurrency(schedule.endingBalance) : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </React.Fragment>
              );
            })}
            
            {/* 總計 - 期初餘額 */}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                總計 - 期初餘額
              </TableCell>
              {years.map((year) => (
                <TableCell key={year} align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(
                    mnaDealDesign.financingPlans.reduce((sum: number, plan: FinancingPlan) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return sum + schedule.beginningBalance;
                    }, 0)
                  )}
                </TableCell>
              ))}
            </TableRow>


            {/* 總計 - 利息支出 */}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                總計 - 利息支出
              </TableCell>
              {years.map((year) => (
                <TableCell key={year} align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(
                    mnaDealDesign.financingPlans.reduce((sum: number, plan: FinancingPlan) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return sum + schedule.interestExpense;
                    }, 0)
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* 總計 - 本金償還 */}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                總計 - 本金償還
              </TableCell>
              {years.map((year) => (
                <TableCell key={year} align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(
                    mnaDealDesign.financingPlans.reduce((sum: number, plan: FinancingPlan) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return sum + schedule.principalRepayment;
                    }, 0)
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* 總計 - 期末餘額 */}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                總計 - 期末餘額
              </TableCell>
              {years.map((year) => (
                <TableCell key={year} align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(
                    mnaDealDesign.financingPlans.reduce((sum: number, plan: FinancingPlan) => {
                      const schedule = calculateLoanSchedule(plan, year);
                      return sum + schedule.endingBalance;
                    }, 0)
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
          </Table>
        </TableContainer>

      {/* 債務結構摘要 */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          債務結構摘要
        </Typography>
        <Box sx={{ pl: 2 }}>
          {mnaDealDesign.financingPlans.map((plan: FinancingPlan) => {
            const getRepaymentMethodText = () => {
              switch (plan.repaymentMethod) {
                case 'equalPayment': return '等額本息';
                case 'equalPrincipal': return '等額本金';
                case 'bullet': return '到期一次還本';
                case 'interestOnly': return '按期付息到期還本';
                case 'revolving': return '循環信用';
                default: return plan.repaymentMethod;
              }
            };
            
            return (
              <Typography key={plan.id} variant="body1" sx={{ mb: 1 }}>
                • <strong>{plan.name}：</strong> 
                {formatCurrency(plan.amount)}，
                利率 {plan.interestRate}%，
                {plan.maturity} 年期，
                {getRepaymentMethodText()}
              </Typography>
            );
          })}
          {mnaDealDesign.financingPlans.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              尚未設定債務融資計劃
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DebtSchedule;
