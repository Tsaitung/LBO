/**
 * Cypress E2E 支援檔案
 * Linus 原則：簡單直接，不過度設計
 */

// 自定義命令
Cypress.Commands.add('fillBusinessMetrics', (metrics) => {
  if (metrics.revenue) {
    cy.get('[data-testid="revenue-input"]').clear().type(metrics.revenue);
  }
  if (metrics.ebitda) {
    cy.get('[data-testid="ebitda-input"]').clear().type(metrics.ebitda);
  }
  if (metrics.netIncome) {
    cy.get('[data-testid="netIncome-input"]').clear().type(metrics.netIncome);
  }
});

Cypress.Commands.add('navigateToSection', (section: string) => {
  cy.get(`[data-testid="nav-${section}"]`).click();
  cy.url().should('include', section);
});

// TypeScript 支援
declare global {
  namespace Cypress {
    interface Chainable {
      fillBusinessMetrics(metrics: {
        revenue?: string;
        ebitda?: string;
        netIncome?: string;
      }): void;
      navigateToSection(section: string): void;
    }
  }
}

export {};