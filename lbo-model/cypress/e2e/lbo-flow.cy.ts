/**
 * LBO 完整流程 E2E 測試
 * Linus 原則：測試真實場景，不測試實現細節
 */

describe('LBO 財務模型完整流程', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('應該完成基本 LBO 分析流程', () => {
    // Step 1: 輸入業務指標
    cy.contains('營運指標').should('be.visible');
    
    // 填寫收入相關
    cy.get('input[name="revenue"]').type('100000');
    cy.get('input[name="cogs"]').type('60000');
    cy.get('input[name="operatingExpenses"]').type('20000');
    
    // 驗證 EBITDA 自動計算
    cy.get('input[name="ebitda"]').should('have.value', '20000');
    
    // Step 2: 設定未來假設
    cy.contains('設定未來假設').click();
    cy.url().should('include', '/future-assumptions');
    
    cy.get('input[name="revenueGrowthRate"]').clear().type('5');
    cy.get('input[name="ebitdaMargin"]').clear().type('25');
    
    // Step 3: M&A 交易設計
    cy.contains('設計併購交易').click();
    cy.url().should('include', '/mna-deal-design');
    
    // 選擇交易類型
    cy.get('input[value="fullAcquisition"]').check();
    
    // 設定交易費用
    cy.get('input[name="transactionFeePercentage"]').type('2');
    
    // Step 4: 融資規劃
    cy.contains('設計融資規劃').click();
    cy.url().should('include', '/financing-planning');
    
    // 新增債務融資
    cy.contains('button', '新增融資項目').click();
    cy.get('input[name="loanAmount"]').type('50000');
    cy.get('input[name="interestRate"]').type('5');
    cy.get('select[name="loanType"]').select('equalPayment');
    
    // Step 5: 查看結果
    cy.contains('查看結果').click();
    
    // 驗證關鍵指標存在
    cy.contains('IRR').should('be.visible');
    cy.contains('MOIC').should('be.visible');
    cy.contains('投資回收期').should('be.visible');
  });

  it('應該正確處理錯誤輸入', () => {
    // 測試負數輸入
    cy.get('input[name="revenue"]').type('-100');
    cy.contains('營收必須為正數').should('be.visible');
    
    // 測試超出範圍
    cy.get('input[name="revenue"]').clear().type('999999999999');
    cy.contains('數值超出合理範圍').should('be.visible');
  });

  it('應該保存和恢復數據', () => {
    // 輸入數據
    cy.get('input[name="revenue"]').type('100000');
    cy.get('input[name="ebitda"]').type('20000');
    
    // 重新載入頁面
    cy.reload();
    
    // 驗證數據被保存
    cy.get('input[name="revenue"]').should('have.value', '100000');
    cy.get('input[name="ebitda"]').should('have.value', '20000');
  });

  it('應該支援情境分析', () => {
    // 導航到情境管理
    cy.contains('情境管理').click();
    cy.url().should('include', '/scenario-manager');
    
    // 設定基準情境
    cy.get('input[name="baseCase-evMultiple"]').clear().type('8');
    
    // 設定樂觀情境
    cy.get('input[name="optimistic-evMultiple"]').clear().type('10');
    
    // 設定悲觀情境
    cy.get('input[name="pessimistic-evMultiple"]').clear().type('6');
    
    // 驗證情境差異
    cy.get('[data-testid="scenario-comparison"]').within(() => {
      cy.contains('基準').should('be.visible');
      cy.contains('樂觀').should('be.visible');
      cy.contains('悲觀').should('be.visible');
    });
  });

  it('應該生成債務還款計劃表', () => {
    // 先設定基本數據
    cy.get('input[name="revenue"]').type('100000');
    cy.get('input[name="ebitda"]').type('20000');
    
    // 新增融資
    cy.contains('設計融資規劃').click();
    cy.contains('button', '新增融資項目').click();
    cy.get('input[name="loanAmount"]').type('50000');
    cy.get('input[name="interestRate"]').type('5');
    cy.get('input[name="maturity"]').type('5');
    
    // 查看債務還款計劃
    cy.contains('債務還款計劃').click();
    cy.url().should('include', '/debt-schedule');
    
    // 驗證還款表存在
    cy.contains('Year 1').should('be.visible');
    cy.contains('期初餘額').should('be.visible');
    cy.contains('利息費用').should('be.visible');
    cy.contains('本金償還').should('be.visible');
    cy.contains('期末餘額').should('be.visible');
  });
});

describe('性能測試', () => {
  it('應該在3秒內載入首頁', () => {
    const startTime = Date.now();
    cy.visit('/');
    cy.contains('營運指標').should('be.visible');
    const loadTime = Date.now() - startTime;
    expect(loadTime).to.be.lessThan(3000);
  });

  it('應該平滑處理大量數據', () => {
    // 測試大量年份的計算
    cy.contains('設定未來假設').click();
    
    // 設定10年預測
    for (let i = 1; i <= 10; i++) {
      cy.get(`input[name="year${i}-growth"]`).type('5');
    }
    
    // 驗證計算完成
    cy.contains('計算完成').should('be.visible');
  });
});