/**
 * Term Sheet Selectors
 * 從現有數據生成條款 - Linus 品味：數據結構勝於演算法
 * 統一條款生成邏輯，無特殊情況處理
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { TermClause, TermClauseValue } from '../../types/termSheet';
import { ScenarioAssumptions } from '../../types/financial';
import {
  calculateEnterpriseValue,
  calculateEquityValue,
  calculateValuationMultiples,
  calculateProjectedReturns,
  formatCurrency,
  formatPercentage
} from '../../calculations/termSheet/valuations';

// 基礎數據選擇器
const selectBusinessMetrics = (state: RootState) => state.businessMetrics;
const selectMnaDeal = (state: RootState) => state.mnaDeal;
const selectFinancingPlans = (state: RootState) => state.financingPlan?.plans || [];
const selectScenarios = (state: RootState) => state.scenarios;
const selectAssumptions = (state: RootState) => state.assumptions;

// 計算關鍵指標
const selectKeyMetrics = createSelector(
  [selectBusinessMetrics, selectScenarios, selectFinancingPlans],
  (businessMetrics, scenarios, financingPlans) => {
    if (!businessMetrics) {
      return { enterpriseValue: 0, equityValue: 0, totalDebt: 0, totalEquity: 0 };
    }
    
    const currentScenario = (scenarios?.scenarios?.[scenarios?.current || 'base'] || {}) as Partial<ScenarioAssumptions>;
    const entryMultiple = currentScenario.entryEvEbitdaMultiple || 10;
    const exitMultiple = currentScenario.exitEvEbitdaMultiple || 12;
    
    const enterpriseValue = calculateEnterpriseValue(businessMetrics.ebitda, entryMultiple);
    const equityValue = calculateEquityValue(
      enterpriseValue,
      businessMetrics.totalLiabilities,
      businessMetrics.cashAndCashEquivalents
    );

    // 計算債務結構
    const totalSeniorDebt = financingPlans
      .filter(p => p.facilityType === 'senior')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalMezzanineDebt = financingPlans
      .filter(p => p.facilityType === 'mezzanine')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const revolverLimit = financingPlans
      .filter(p => p.facilityType === 'revolver')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDebt = totalSeniorDebt + totalMezzanineDebt;
    const equityInvestment = Math.max(0, enterpriseValue - totalDebt);

    return {
      enterpriseValue,
      equityValue,
      entryMultiple,
      exitMultiple,
      totalSeniorDebt,
      totalMezzanineDebt,
      revolverLimit,
      totalDebt,
      equityInvestment,
      totalSources: totalDebt + equityInvestment,
      valuationMultiples: calculateValuationMultiples(
        enterpriseValue,
        businessMetrics.revenue,
        businessMetrics.ebitda,
        businessMetrics.netIncome
      )
    };
  }
);

// 生成條款內容的輔助函數
const createClause = (
  id: string,
  section: TermClause['section'],
  title: string,
  content: string | number | TermClauseValue,
  isEditable: boolean = false,
  displayOrder: number = 0
): TermClause => ({
  id,
  section,
  title,
  content,
  isEditable,
  isGenerated: !isEditable,
  displayOrder,
});

// 創建貨幣類型條款值
const createCurrencyValue = (
  amount: number,
  currency: 'TWD' | 'USD' = 'TWD',
  scale: 'thousands' | 'millions' = 'thousands'
): TermClauseValue => ({
  type: 'currency',
  value: amount,
  format: { currency, scale, decimals: 0 }
});

// 創建百分比類型條款值
const createPercentageValue = (value: number, decimals: number = 1): TermClauseValue => ({
  type: 'percentage',
  value,
  format: { decimals }
});

// 生成交易摘要條款
const selectSummaryClauses = createSelector(
  [selectBusinessMetrics, selectMnaDeal, selectKeyMetrics],
  (businessMetrics, mnaDeal, metrics): Record<string, TermClause> => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      'summary.target_company': createClause(
        'summary.target_company',
        'summary',
        '目標公司',
        '目標公司股份有限公司',
        true,
        1
      ),
      'summary.transaction_date': createClause(
        'summary.transaction_date',
        'summary',
        '交易日期',
        today,
        true,
        2
      ),
      'summary.transaction_type': createClause(
        'summary.transaction_type',
        'summary',
        '交易類型',
        mnaDeal?.dealType === 'fullAcquisition' ? '全額收購' : '資產收購',
        false,
        3
      ),
      'summary.enterprise_value': createClause(
        'summary.enterprise_value',
        'summary',
        '企業價值',
        createCurrencyValue(metrics.enterpriseValue),
        false,
        4
      ),
      'summary.equity_value': createClause(
        'summary.equity_value',
        'summary',
        '股權價值',
        createCurrencyValue(metrics.equityValue),
        false,
        5
      ),
      'summary.entry_multiple': createClause(
        'summary.entry_multiple',
        'summary',
        '入場倍數',
        `${metrics.entryMultiple}x EBITDA`,
        false,
        6
      ),
      'summary.ev_revenue': createClause(
        'summary.ev_revenue',
        'summary',
        'EV/Revenue',
        `${metrics.valuationMultiples?.evToRevenue || 0}x`,
        false,
        7
      ),
      'summary.ev_ebitda': createClause(
        'summary.ev_ebitda',
        'summary',
        'EV/EBITDA',
        `${metrics.valuationMultiples?.evToEbitda || 0}x`,
        false,
        8
      )
    };
  }
);

// 生成融資結構條款
const selectFinancingClauses = createSelector(
  [selectFinancingPlans, selectKeyMetrics],
  (financingPlans, metrics): Record<string, TermClause> => {
    const seniorPlan = financingPlans.find(p => p.facilityType === 'senior');
    const mezzaninePlan = financingPlans.find(p => p.facilityType === 'mezzanine');
    const revolverPlan = financingPlans.find(p => p.facilityType === 'revolver');

    const totalSources = metrics.totalSources || 0;
    const seniorPct = totalSources > 0 ? 
      ((metrics.totalSeniorDebt || 0) / totalSources) * 100 : 0;
    const mezzaninePct = totalSources > 0 ? 
      ((metrics.totalMezzanineDebt || 0) / totalSources) * 100 : 0;
    const equityPct = totalSources > 0 ? 
      ((metrics.equityInvestment || 0) / totalSources) * 100 : 0;

    return {
      'financing.senior_debt_amount': createClause(
        'financing.senior_debt_amount',
        'financing',
        '優先債務金額',
        createCurrencyValue(metrics.totalSeniorDebt || 0),
        false,
        1
      ),
      'financing.senior_debt_percentage': createClause(
        'financing.senior_debt_percentage',
        'financing',
        '優先債務佔比',
        createPercentageValue(seniorPct),
        false,
        2
      ),
      'financing.senior_debt_rate': createClause(
        'financing.senior_debt_rate',
        'financing',
        '優先債務利率',
        createPercentageValue(seniorPlan?.interestRate || 0),
        false,
        3
      ),
      'financing.senior_debt_maturity': createClause(
        'financing.senior_debt_maturity',
        'financing',
        '優先債務期限',
        `${seniorPlan?.maturity || 0} 年`,
        false,
        4
      ),
      'financing.mezzanine_debt_amount': createClause(
        'financing.mezzanine_debt_amount',
        'financing',
        '夾層債務金額',
        createCurrencyValue(metrics.totalMezzanineDebt || 0),
        false,
        5
      ),
      'financing.mezzanine_debt_percentage': createClause(
        'financing.mezzanine_debt_percentage',
        'financing',
        '夾層債務佔比',
        createPercentageValue(mezzaninePct),
        false,
        6
      ),
      'financing.mezzanine_debt_rate': createClause(
        'financing.mezzanine_debt_rate',
        'financing',
        '夾層債務利率',
        createPercentageValue(mezzaninePlan?.interestRate || 0),
        false,
        7
      ),
      'financing.revolver_limit': createClause(
        'financing.revolver_limit',
        'financing',
        '循環信貸額度',
        createCurrencyValue(metrics.revolverLimit || 0),
        false,
        8
      ),
      'financing.equity_investment': createClause(
        'financing.equity_investment',
        'financing',
        '股權投資',
        createCurrencyValue(metrics.equityInvestment || 0),
        false,
        9
      ),
      'financing.equity_percentage': createClause(
        'financing.equity_percentage',
        'financing',
        '股權投資佔比',
        createPercentageValue(equityPct),
        false,
        10
      ),
      'financing.total_sources': createClause(
        'financing.total_sources',
        'financing',
        '總資金來源',
        createCurrencyValue(metrics.totalSources || 0),
        false,
        11
      )
    };
  }
);

// 生成付款條款
const selectPaymentClauses = createSelector(
  [selectMnaDeal, selectKeyMetrics],
  (mnaDeal, metrics): Record<string, TermClause> => {
    const upfrontPct = mnaDeal?.paymentStructure?.upfrontPayment || 100;
    const upfrontAmount = metrics.enterpriseValue * upfrontPct / 100;

    return {
      'payment.upfront_payment': createClause(
        'payment.upfront_payment',
        'payment',
        '交割前付款',
        createCurrencyValue(upfrontAmount),
        false,
        1
      ),
      'payment.upfront_percentage': createClause(
        'payment.upfront_percentage',
        'payment',
        '交割前付款比例',
        createPercentageValue(upfrontPct),
        true,
        2
      ),
      'payment.payment_method': createClause(
        'payment.payment_method',
        'payment',
        '付款方式',
        mnaDeal?.paymentStructure?.paymentMethod === 'cash' ? '現金' : 
        mnaDeal?.paymentStructure?.paymentMethod === 'equity' ? '股權' : '混合',
        true,
        3
      ),
      'payment.escrow_amount': createClause(
        'payment.escrow_amount',
        'payment',
        '保證金金額',
        createCurrencyValue(metrics.enterpriseValue * 0.1),
        true,
        4
      )
    };
  }
);

// 生成退出策略條款
const selectExitClauses = createSelector(
  [selectMnaDeal, selectAssumptions, selectKeyMetrics, selectBusinessMetrics],
  (mnaDeal, assumptions, metrics, businessMetrics): Record<string, TermClause> => {
    const holdingPeriod = mnaDeal?.planningHorizon || 5;
    const baseEbitda = businessMetrics?.ebitda || 0;
    const projectedEbitda = baseEbitda * 
      Math.pow(1 + (assumptions?.revenueGrowthRate || 5) / 100, holdingPeriod);
    
    const projectedReturns = calculateProjectedReturns(
      metrics.equityInvestment || 0,
      metrics.exitMultiple || 0,
      projectedEbitda,
      holdingPeriod,
      (metrics.totalDebt || 0) * 0.5
    );

    return {
      'exit.holding_period': createClause(
        'exit.holding_period',
        'exit',
        '預計持有期間',
        `${holdingPeriod} 年`,
        true,
        1
      ),
      'exit.exit_multiple': createClause(
        'exit.exit_multiple',
        'exit',
        '出場倍數',
        `${metrics.exitMultiple}x EBITDA`,
        true,
        2
      ),
      'exit.target_irr': createClause(
        'exit.target_irr',
        'exit',
        '目標 IRR',
        createPercentageValue(projectedReturns.irr),
        false,
        3
      ),
      'exit.target_moic': createClause(
        'exit.target_moic',
        'exit',
        '目標 MOIC',
        `${projectedReturns.moic}x`,
        false,
        4
      )
    };
  }
);

// 主選擇器：組合所有條款
export const selectAllClauses = createSelector(
  [selectSummaryClauses, selectFinancingClauses, selectPaymentClauses, selectExitClauses],
  (summary, financing, payment, exit): Record<string, TermClause> => ({
    ...summary,
    ...financing,
    ...payment,
    ...exit
  })
);

// 按章節分組的條款
export const selectClausesBySection = createSelector(
  [selectAllClauses],
  (clauses) => {
    const sections: Record<string, TermClause[]> = {};
    
    Object.values(clauses).forEach(clause => {
      if (!sections[clause.section]) {
        sections[clause.section] = [];
      }
      sections[clause.section].push(clause);
    });

    // 每個章節內部排序
    Object.keys(sections).forEach(section => {
      sections[section].sort((a, b) => a.displayOrder - b.displayOrder);
    });

    return sections;
  }
);

// 統計信息
export const selectTermSheetStats = createSelector(
  [selectAllClauses],
  (clauses) => {
    const total = Object.keys(clauses).length;
    const editable = Object.values(clauses).filter(c => c.isEditable).length;
    const generated = Object.values(clauses).filter(c => c.isGenerated).length;
    
    return { total, editable, generated };
  }
);