/**
 * Term Sheet 數據生成器
 * 從 Redux state 提取數據並生成標準化的 Term Sheet
 */

import { RootState } from '../store/store';
import { 
  TermSheet, 
  TransactionSummary, 
  FinancingStructure, 
  PaymentTerms,
  GovernanceTerms,
  FinancialCovenants,
  ExitStrategy,
  ConditionsPrecedent,
  KeyDates,
  FeeStructure,
  RiskFactors
} from '../types/termSheet';
import {
  calculateEnterpriseValue,
  calculateEquityValue,
  calculateValuationMultiples,
  calculateProjectedReturns,
  calculateFinancingMix
} from '../calculations/termSheet/valuations';

/**
 * 從 Redux state 生成完整的 Term Sheet
 */
export function generateTermSheet(state: RootState): TermSheet {
  const businessMetrics = state.businessMetrics;
  const mnaDeal = state.mnaDeal;
  const financingPlans = state.financingPlan?.plans || [];
  const scenarios = state.scenarios?.scenarios || {};
  const currentScenario = scenarios[state.scenarios?.current || 'base'] || {};

  // 提前檢查必要數據
  if (!businessMetrics || !mnaDeal) {
    throw new Error('Missing required data for term sheet generation');
  }

  // 計算關鍵財務指標
  const entryMultiple = currentScenario.entryEvEbitdaMultiple || 10;
  const exitMultiple = currentScenario.exitEvEbitdaMultiple || 12;
  const enterpriseValue = calculateEnterpriseValue(businessMetrics.ebitda, entryMultiple);
  
  // 計算債務總額
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
  const equityValue = calculateEquityValue(
    enterpriseValue, 
    businessMetrics.totalLiabilities,
    businessMetrics.cashAndCashEquivalents
  );

  // 計算融資結構
  const equityInvestment = Math.max(0, enterpriseValue - totalDebt);
  const financingMix = calculateFinancingMix(totalSeniorDebt, totalMezzanineDebt, equityInvestment);

  // 生成交易摘要
  const transactionSummary: TransactionSummary = {
    targetCompany: '目標公司',
    transactionDate: new Date().toISOString().split('T')[0],
    transactionType: mnaDeal.dealType || 'fullAcquisition',
    businessDescription: '待併購之目標公司主要從事[業務描述]',
    enterpriseValue,
    equityValue,
    entryMultiple,
    impliedValuation: calculateValuationMultiples(
      enterpriseValue,
      businessMetrics.revenue,
      businessMetrics.ebitda,
      businessMetrics.netIncome
    )
  };

  // 生成融資結構
  const financingStructure: FinancingStructure = {
    seniorDebt: {
      amount: totalSeniorDebt,
      percentage: financingMix.seniorPct,
      interestRate: financingPlans.find(p => p.facilityType === 'senior')?.interestRate || 5,
      maturity: financingPlans.find(p => p.facilityType === 'senior')?.maturity || 5,
      amortization: '等額本息'
    },
    mezzanineDebt: {
      amount: totalMezzanineDebt,
      percentage: financingMix.mezzaninePct,
      interestRate: financingPlans.find(p => p.facilityType === 'mezzanine')?.interestRate || 10,
      maturity: financingPlans.find(p => p.facilityType === 'mezzanine')?.maturity || 7,
      amortization: '到期一次還本'
    },
    revolverFacility: {
      limit: revolverLimit,
      drawnAmount: 0,
      interestRate: financingPlans.find(p => p.facilityType === 'revolver')?.interestRate || 4,
      commitment: 1
    },
    equityInvestment: {
      amount: equityInvestment,
      percentage: financingMix.equityPct,
      sponsorEquity: equityInvestment * 0.9,
      managementRollover: equityInvestment * 0.1
    },
    totalSources: financingMix.total
  };

  // 生成付款條款
  const paymentTerms: PaymentTerms = {
    upfrontPayment: {
      amount: enterpriseValue * (mnaDeal.paymentStructure?.upfrontPayment || 100) / 100,
      percentage: mnaDeal.paymentStructure?.upfrontPayment || 100,
      paymentMethod: (mnaDeal.paymentStructure?.paymentMethod === 'equity' ? 'stock' : mnaDeal.paymentStructure?.paymentMethod) || 'cash'
    },
    deferredPayments: [],
    earnouts: [],
    escrow: {
      amount: enterpriseValue * 0.1,
      period: 18,
      purpose: '保證與賠償'
    }
  };

  // 如果有里程碑付款，添加到延遲付款中
  if (mnaDeal.paymentStructure?.year1MilestonePayment) {
    paymentTerms.deferredPayments.push({
      year: 1,
      amount: enterpriseValue * mnaDeal.paymentStructure.year1MilestonePayment / 100,
      condition: mnaDeal.milestones?.year1?.kpiTarget || '達成第一年業績目標',
      paymentMethod: 'cash'
    });
  }

  if (mnaDeal.paymentStructure?.year2MilestonePayment) {
    paymentTerms.deferredPayments.push({
      year: 2,
      amount: enterpriseValue * mnaDeal.paymentStructure.year2MilestonePayment / 100,
      condition: mnaDeal.milestones?.year2?.kpiTarget || '達成第二年業績目標',
      paymentMethod: 'cash'
    });
  }

  // 生成治理條款
  const governanceTerms: GovernanceTerms = {
    boardComposition: {
      totalSeats: 7,
      sponsorSeats: 4,
      managementSeats: 2,
      independentSeats: 1
    },
    vetoRights: [
      '年度預算批准',
      '重大資本支出（超過 1000 萬）',
      '併購或處分資產',
      '發行新股或債務',
      '關聯方交易',
      '高管任免與薪酬',
      '股利分配政策'
    ],
    informationRights: {
      frequency: 'quarterly',
      reports: [
        '財務報表（月報、季報）',
        '管理層討論與分析',
        '預算執行情況',
        '重要合約與客戶',
        'KPI 追蹤報告'
      ],
      auditRights: true
    },
    restrictiveCovenants: {
      nonCompete: 3,
      nonSolicitation: 2,
      confidentiality: 5
    }
  };

  // 生成財務契約
  // const debtMetrics = calculateDebtMetrics(
  //   totalDebt,
  //   businessMetrics.ebitda,
  //   businessMetrics.interestExpense
  // ); // Reserved for future use

  const financialCovenants: FinancialCovenants = {
    leverageRatio: {
      maximum: 6.0,
      testFrequency: 'quarterly'
    },
    interestCoverage: {
      minimum: 2.0,
      testFrequency: 'quarterly'
    },
    fixedChargeCoverage: {
      minimum: 1.25,
      testFrequency: 'quarterly'
    },
    minimumEbitda: {
      amount: businessMetrics.ebitda * 0.8,
      testFrequency: 'quarterly'
    },
    capitalExpenditure: {
      maximumAnnual: businessMetrics.revenue * 0.04,
      carryforward: true
    }
  };

  // 生成退出策略
  const projectedReturns = calculateProjectedReturns(
    equityInvestment,
    exitMultiple,
    businessMetrics.ebitda * Math.pow(1 + (currentScenario.revenueGrowthRate || 5) / 100, 5),
    mnaDeal.planningHorizon || 5,
    totalDebt * 0.5 // 假設償還一半債務
  );

  const exitStrategy: ExitStrategy = {
    targetHoldPeriod: mnaDeal.planningHorizon || 5,
    expectedExitYear: new Date().getFullYear() + (mnaDeal.planningHorizon || 5),
    exitMultiple,
    exitOptions: [
      {
        method: 'strategicSale',
        probability: 50,
        expectedReturn: projectedReturns.irr
      },
      {
        method: 'ipo',
        probability: 30,
        expectedReturn: projectedReturns.irr * 1.2
      },
      {
        method: 'secondaryBuyout',
        probability: 20,
        expectedReturn: projectedReturns.irr * 0.9
      }
    ],
    projectedReturns: {
      irr: projectedReturns.irr,
      moic: projectedReturns.moic,
      cashOnCash: projectedReturns.moic
    }
  };

  // 生成先決條件
  const conditionsPrecedent: ConditionsPrecedent = {
    dueDiligence: {
      financial: true,
      legal: true,
      commercial: true,
      environmental: true,
      tax: true
    },
    regulatoryApprovals: [
      '公平交易委員會核准',
      '投資審議委員會核准（如適用）'
    ],
    thirdPartyConsents: [
      '主要客戶合約轉讓同意',
      '銀行融資同意',
      '房地產租約轉讓'
    ],
    keyEmployeeRetention: [
      '執行長續聘協議',
      '核心管理團隊留任',
      '研發團隊穩定'
    ],
    minimumCash: businessMetrics.cashAndCashEquivalents * 0.5,
    workingCapitalAdjustment: true,
    materialAdverseChange: '無重大不利變化'
  };

  // 生成關鍵日期
  const today = new Date();
  const signingDate = today.toISOString().split('T')[0];
  const expectedClosing = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0];
  const longStopDate = new Date(today.setMonth(today.getMonth() + 6)).toISOString().split('T')[0];

  const keyDates: KeyDates = {
    signingDate,
    expectedClosing,
    longStopDate,
    dueDiligenceDeadline: new Date(today.setMonth(today.getMonth() + 2)).toISOString().split('T')[0],
    financingCommitmentExpiry: new Date(today.setMonth(today.getMonth() + 4)).toISOString().split('T')[0]
  };

  // 生成費用結構
  const totalTransactionFees = enterpriseValue * (mnaDeal.transactionFeePercentage || 2) / 100;
  
  const feeStructure: FeeStructure = {
    transactionFees: {
      advisoryFees: totalTransactionFees * 0.4,
      legalFees: totalTransactionFees * 0.3,
      dueDiligenceFees: totalTransactionFees * 0.15,
      financingFees: totalTransactionFees * 0.1,
      otherFees: totalTransactionFees * 0.05,
      totalFees: totalTransactionFees
    },
    ongoingFees: {
      managementFee: enterpriseValue * 0.02,
      monitoringFee: 500,
      boardFee: 200
    }
  };

  // 生成風險因素
  const riskFactors: RiskFactors = {
    marketRisks: [
      '市場競爭加劇',
      '客戶集中度風險',
      '原物料價格波動'
    ],
    operationalRisks: [
      '關鍵人員流失',
      '系統整合風險',
      '供應鏈中斷'
    ],
    financialRisks: [
      '利率上升風險',
      '再融資風險',
      '匯率波動'
    ],
    regulatoryRisks: [
      '法規變更',
      '環保要求提高',
      '稅務政策調整'
    ],
    keyPersonRisks: [
      '管理層變動',
      '技術人才短缺'
    ],
    mitigationStrategies: {
      '市場風險': '多元化客戶基礎，開發新產品線',
      '營運風險': '建立完善的接班計畫與系統備援',
      '財務風險': '利率避險，維持適當現金儲備',
      '法規風險': '持續監控法規變化，建立合規團隊'
    }
  };

  // 組合完整的 Term Sheet
  const termSheet: TermSheet = {
    version: '1.0',
    status: 'draft',
    lastUpdated: new Date().toISOString(),
    confidential: true,
    
    transactionSummary,
    financingStructure,
    paymentTerms,
    governanceTerms,
    financialCovenants,
    exitStrategy,
    conditionsPrecedent,
    keyDates,
    feeStructure,
    riskFactors,
    
    representations: [
      '財務報表真實準確',
      '無未披露負債',
      '智慧財產權完整',
      '重要合約有效',
      '無重大訴訟'
    ],
    
    warranties: [
      '業務正常營運',
      '資產權屬清晰',
      '稅務合規',
      '勞工關係和諧',
      '環保合規'
    ],
    
    indemnities: [
      '稅務賠償',
      '訴訟賠償',
      '環保責任',
      '員工福利責任'
    ],
    
    disputeResolution: {
      mechanism: 'arbitration',
      jurisdiction: '台北',
      governingLaw: '中華民國法律'
    },
    
    parties: {
      buyer: {
        name: '買方投資公司',
        entity: 'PE Fund LP',
        representative: '投資合夥人',
        address: '台北市信義區[地址]'
      },
      seller: {
        name: '賣方公司',
        entity: '目標公司股東',
        representative: '董事長',
        address: '台北市[地址]'
      }
    }
  };

  return termSheet;
}

/**
 * 生成 Term Sheet 摘要
 */
export function generateTermSheetSummary(termSheet: TermSheet): string {
  const { transactionSummary, financingStructure, exitStrategy } = termSheet;
  
  return `
    交易摘要
    ========
    目標公司：${transactionSummary.targetCompany}
    交易類型：${transactionSummary.transactionType === 'fullAcquisition' ? '全額收購' : '資產收購'}
    企業價值：NT$${transactionSummary.enterpriseValue.toLocaleString()}K
    入場倍數：${transactionSummary.entryMultiple}x EBITDA
    
    融資結構
    ========
    優先債務：NT$${financingStructure.seniorDebt.amount.toLocaleString()}K (${financingStructure.seniorDebt.percentage}%)
    夾層債務：NT$${financingStructure.mezzanineDebt.amount.toLocaleString()}K (${financingStructure.mezzanineDebt.percentage}%)
    股權投資：NT$${financingStructure.equityInvestment.amount.toLocaleString()}K (${financingStructure.equityInvestment.percentage}%)
    
    預期回報
    ========
    持有期間：${exitStrategy.targetHoldPeriod} 年
    目標 IRR：${exitStrategy.projectedReturns.irr}%
    目標 MOIC：${exitStrategy.projectedReturns.moic}x
  `;
}