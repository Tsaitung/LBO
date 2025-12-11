/**
 * 統一計算管線架構
 * Linus 原則：清晰的計算流程，消除循環依賴
 * 單一方向數據流：輸入 → 計算 → 輸出
 */

import { 
  BusinessMetricsBeforeAcquisition,
  FutureAssumptions,
  MnaDealDesign,
  ScenarioAssumptions,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData
} from '../../types/financial';

/**
 * 計算管線階段定義
 */
export enum PipelineStage {
  VALIDATE_INPUTS = 'validateInputs',
  CALCULATE_BASE = 'calculateBase',
  APPLY_SCENARIOS = 'applyScenarios',
  CALCULATE_DERIVED = 'calculateDerived',
  VALIDATE_RESULTS = 'validateResults'
}

/**
 * 計算上下文 - 傳遞給所有計算階段
 */
export interface CalculationContext {
  // 輸入數據
  businessMetrics: BusinessMetricsBeforeAcquisition;
  assumptions: FutureAssumptions;
  dealDesign: MnaDealDesign;
  scenario: ScenarioAssumptions;
  planningHorizon: number;
  
  // 中間結果
  incomeStatements?: IncomeStatementData[];
  balanceSheets?: BalanceSheetData[];
  cashFlows?: CashFlowData[];
  debtSchedule?: DebtScheduleData[];
  
  // 元數據
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

/**
 * 計算階段介面
 */
export interface CalculationStage {
  name: PipelineStage;
  execute(context: CalculationContext): Promise<CalculationContext>;
  validate?(context: CalculationContext): boolean;
}

/**
 * 輸入驗證階段
 */
export class ValidateInputsStage implements CalculationStage {
  name = PipelineStage.VALIDATE_INPUTS;
  
  async execute(context: CalculationContext): Promise<CalculationContext> {
    const errors: string[] = [];
    
    // 驗證業務指標
    if (!context.businessMetrics || !context.businessMetrics.ebitda) {
      errors.push('EBITDA 必須設定');
    }
    
    // 驗證假設
    if (!context.assumptions || context.assumptions.revenueGrowthRate === undefined) {
      errors.push('營收增長率必須設定');
    }
    
    // 驗證交易設計
    if (!context.dealDesign) {
      errors.push('交易設計必須設定');
    }
    
    // 驗證融資結構
    const totalDebt = (context.dealDesign?.financingPlans || [])
      .reduce((sum, plan) => sum + (plan.amount || 0), 0);
    const totalEquity = (context.dealDesign?.equityInjections || [])
      .reduce((sum, inj) => sum + (inj.amount || 0), 0);
    
    if (totalDebt + totalEquity === 0) {
      errors.push('必須有至少一個融資來源');
    }
    
    return {
      ...context,
      errors: [...context.errors, ...errors]
    };
  }
}

/**
 * 基礎計算階段
 */
export class CalculateBaseStage implements CalculationStage {
  name = PipelineStage.CALCULATE_BASE;
  
  async execute(context: CalculationContext): Promise<CalculationContext> {
    // 這裡將調用現有的計算函數
    // 但以管線方式組織，確保單向數據流
    
    try {
      // 1. 先計算債務明細（不依賴其他計算）
      const { calculateDebtSchedule } = await import('../../calculations/financial/debtSchedule');
      const debtSchedule = calculateDebtSchedule(
        context.dealDesign.financingPlans || [],
        context.planningHorizon,
        context.assumptions
      );
      
      // 2. 計算損益表（需要債務明細）
      const { calculateIncomeStatement } = await import('../../calculations/financial/incomeStatement');
      const incomeStatements = calculateIncomeStatement(
        context.businessMetrics,
        context.assumptions,
        context.planningHorizon,
        debtSchedule,
        context.dealDesign,
        context.scenario
      );
      
      // 3. 計算資產負債表
      const { calculateBalanceSheet } = await import('../../calculations/financial/balanceSheet');
      const balanceSheets = calculateBalanceSheet(
        context.businessMetrics,
        context.assumptions,
        incomeStatements,
        debtSchedule,
        context.planningHorizon,
        context.scenario,
        context.dealDesign
      );
      
      // 4. 計算現金流量表
      const { calculateCashFlow } = await import('../../calculations/financial/cashFlow');
      const cashFlows = calculateCashFlow(
        incomeStatements,
        balanceSheets,
        debtSchedule,
        context.dealDesign,
        context.scenario,
        context.assumptions
      );
      
      return {
        ...context,
        incomeStatements,
        balanceSheets,
        cashFlows,
        debtSchedule
      };
    } catch (error) {
      return {
        ...context,
        errors: [...context.errors, `計算錯誤: ${error}`]
      };
    }
  }
}

/**
 * 應用情境階段
 */
export class ApplyScenariosStage implements CalculationStage {
  name = PipelineStage.APPLY_SCENARIOS;
  
  async execute(context: CalculationContext): Promise<CalculationContext> {
    // 應用情境調整
    // 例如：調整增長率、利潤率等
    
    if (!context.scenario) {
      return context;
    }
    
    // 這裡可以根據情境調整計算結果
    // 保持簡單，避免複雜的條件分支
    
    return context;
  }
}

/**
 * 計算衍生指標階段
 */
export class CalculateDerivedStage implements CalculationStage {
  name = PipelineStage.CALCULATE_DERIVED;
  
  async execute(context: CalculationContext): Promise<CalculationContext> {
    // 計算衍生指標
    // 例如：IRR、MOIC、財務比率等
    
    const warnings: string[] = [];
    
    // 檢查債務覆蓋率
    if (context.incomeStatements && context.debtSchedule) {
      context.incomeStatements.forEach((is, year) => {
        const totalInterest = context.debtSchedule!
          .filter(d => d.year === year)
          .reduce((sum, d) => sum + d.interestExpense, 0);
        
        if (totalInterest > 0) {
          const interestCoverage = is.ebitda / totalInterest;
          if (interestCoverage < 2) {
            warnings.push(`Year ${year}: 利息覆蓋率過低 (${interestCoverage.toFixed(2)}x)`);
          }
        }
      });
    }
    
    return {
      ...context,
      warnings: [...context.warnings, ...warnings]
    };
  }
}

/**
 * 結果驗證階段
 */
export class ValidateResultsStage implements CalculationStage {
  name = PipelineStage.VALIDATE_RESULTS;
  
  async execute(context: CalculationContext): Promise<CalculationContext> {
    const errors: string[] = [];
    
    // 驗證資產負債表平衡
    if (context.balanceSheets) {
      context.balanceSheets.forEach(bs => {
        const diff = Math.abs(bs.totalAssets - bs.totalLiabilitiesEquity);
        if (diff > 0.01) {
          errors.push(`Year ${bs.year}: 資產負債表不平衡 (差異: ${diff.toFixed(2)})`);
        }
      });
    }
    
    // 驗證現金流連續性
    if (context.cashFlows) {
      for (let i = 1; i < context.cashFlows.length; i++) {
        const prevEndingCash = context.cashFlows[i - 1].endingCash;
        const currentBeginningCash = context.cashFlows[i].beginningCash;
        const diff = Math.abs(prevEndingCash - currentBeginningCash);
        
        if (diff > 0.01) {
          errors.push(`Year ${i}: 現金流不連續 (差異: ${diff.toFixed(2)})`);
        }
      }
    }
    
    return {
      ...context,
      errors: [...context.errors, ...errors]
    };
  }
}

/**
 * 計算管線執行器
 */
export class CalculationPipeline {
  private stages: CalculationStage[] = [];
  
  /**
   * 添加計算階段
   */
  addStage(stage: CalculationStage): CalculationPipeline {
    this.stages.push(stage);
    return this;
  }
  
  /**
   * 執行計算管線
   */
  async execute(context: CalculationContext): Promise<CalculationContext> {
    let result = context;
    
    for (const stage of this.stages) {
      // 驗證階段前置條件
      if (stage.validate && !stage.validate(result)) {
        result.errors.push(`階段 ${stage.name} 驗證失敗`);
        break;
      }
      
      // 執行階段
      result = await stage.execute(result);
      
      // 如果有錯誤，停止執行
      if (result.errors.length > 0 && stage.name !== PipelineStage.VALIDATE_RESULTS) {
        break;
      }
    }
    
    return result;
  }
  
  /**
   * 創建標準計算管線
   */
  static createStandardPipeline(): CalculationPipeline {
    return new CalculationPipeline()
      .addStage(new ValidateInputsStage())
      .addStage(new CalculateBaseStage())
      .addStage(new ApplyScenariosStage())
      .addStage(new CalculateDerivedStage())
      .addStage(new ValidateResultsStage());
  }
}

/**
 * 執行完整的財務計算
 * 統一入口，避免分散的計算邏輯
 */
export async function executeFinancialCalculations(
  businessMetrics: BusinessMetricsBeforeAcquisition,
  assumptions: FutureAssumptions,
  dealDesign: MnaDealDesign,
  scenario: ScenarioAssumptions,
  planningHorizon: number
): Promise<CalculationContext> {
  const context: CalculationContext = {
    businessMetrics,
    assumptions,
    dealDesign,
    scenario,
    planningHorizon,
    errors: [],
    warnings: [],
    timestamp: new Date()
  };
  
  const pipeline = CalculationPipeline.createStandardPipeline();
  return pipeline.execute(context);
}