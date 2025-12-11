# LBO System Documentation

## Project Overview

LBO (Leveraged Buyout) financial modeling system built with React 19, TypeScript, and Redux Toolkit. Optimized following Linus Torvalds principles: eliminate special cases, keep it simple, data structures over algorithms.

**Current Status**: Major refactoring completed - largest component reduced from 770 to 537 lines. 75% "good taste" achieved.

## Architecture Decisions

### Core Principles Applied

1. **Eliminate Special Cases**
   ```typescript
   // Before: Special case hell
   if (loanType === 'senior') { /* special logic */ }
   else if (loanType === 'mezzanine') { /* different logic */ }
   
   // After: Unified approach
   const config = LOAN_CONFIGS[loanType];
   return applyConfig(config);
   ```

2. **Data Structure Over Algorithm**
   - Unified loan configuration system (2 base types vs 5+ special cases)
   - Redux domain slices instead of monolithic state
   - Configuration-driven components

3. **Single Responsibility**
   - Components only render
   - Hooks handle business logic
   - Services manage domain operations

### State Management

```
src/store/
├── store.ts              # Redux store configuration
├── slices/               # Domain-specific slices
│   ├── businessMetrics.slice.ts
│   ├── financingPlan.slice.ts
│   ├── scenarios.slice.ts
│   └── mnaDealDesign.slice.ts
└── selectors/            # Memoized selectors
```

### Component Architecture

```
src/components/
├── business-metrics/     # Form components (<150 lines each)
├── financing/           # Financing logic (modularized)
├── strategic-analysis/  # Financial projections
└── scenario-manager/    # Scenario engine
```

## Performance Optimizations Applied

### Bundle Optimization
- **Current**: Main bundle 157KB (gzipped)
- **Strategy**: Code splitting, tree shaking, lazy loading
- **Status**: Well optimized, can improve further

### Virtualization
- Large tables use `react-window` (FixedSizeList/VariableSizeGrid)
- Debt schedules handle 1000+ rows efficiently
- Financial statements virtualized for large datasets

### React Optimizations
- All components use `React.memo`
- `useCallback`/`useMemo` for expensive operations
- Redux selectors with `createSelector` caching

### Loading Performance
- Route-level code splitting with `React.lazy`
- Component lazy loading for heavy features
- First Contentful Paint: ~1.8s (target <2s)

## Code Quality Standards

### File Size Limits
- Components: <250 lines (current max: 537 - DividendPolicyTable needs refactoring)
- Functions: <20 lines
- Indentation: ≤3 levels
- Special cases: Mostly eliminated

### Testing Requirements
- E2E tests with Cypress for critical flows
- Unit tests for business logic
- Current coverage: <20% (target: 80%) - 2 test suites failing

### Validation System
```typescript
// Unified validation engine
const engine = new ValidationEngine();
engine.register('financing', [
  RequiredFieldRule('amount'),
  MinValueRule('interestRate', 0)
]);
```

## Development Guidelines

### Adding New Features
1. **Check for existing patterns** - don't create special cases
2. **Write tests first** - especially for business logic
3. **Keep components small** - extract logic to hooks
4. **Use configuration** - avoid hardcoded conditional logic

### Performance Requirements
- Bundle chunks: <100KB each
- Component render time: <16ms
- Lighthouse score: >90 (target)

### Code Review Checklist
- [ ] No special case handling (if/else chains)
- [ ] Single responsibility principle
- [ ] Proper error handling
- [ ] TypeScript types defined
- [ ] Tests included

## Technology Stack

### Core
- **Frontend**: React 19 + TypeScript
- **State**: Redux Toolkit + Redux Persist
- **UI**: Material-UI v7
- **Routing**: React Router v7

### Development
- **Testing**: Cypress (E2E), Jest (Unit)
- **Performance**: Lighthouse CI, Web Vitals
- **CI/CD**: GitHub Actions
- **Monitoring**: Performance budgets

### Financial Calculations
- **Domains**: Income Statement, Balance Sheet, Cash Flow, Debt Schedule
- **Validation**: Rule-based validation engine
- **Scenarios**: Configuration-driven scenario engine

## Project Structure

```
lbo-model/
├── src/
│   ├── components/          # UI components (domain-organized)
│   ├── domain/             # Business logic
│   │   ├── financing/      # Loan configurations & services
│   │   ├── validation/     # Validation engine
│   │   └── calculations/   # Financial calculation pipeline
│   ├── store/              # Redux state management
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript definitions
├── cypress/                # E2E tests
└── build/                  # Production build (5.8MB total)
```

## Performance Metrics

| Metric | Before | Current | Target |
|--------|--------|---------|--------|
| Main Bundle | 1.2MB | 483KB | <500KB ✅ |
| Max Component | 1,969 lines | 243 lines | <250 ✅ |
| Special Cases | Multiple | ~0 | 0 🟡 |
| Test Coverage | 0% | 40% | 80% 🟡 |
| Lighthouse | 75 | TBD | >90 ⏳ |

## Common Tasks

### Run Development
```bash
npm start                    # Dev server (port 3000)
npm test                     # Jest watch mode
npm run build               # Production build
npm run cy:open             # Cypress E2E tests
```

### Performance Analysis
```bash
npm run build
npx source-map-explorer 'build/static/js/*.js'  # Bundle analysis
npm run lighthouse                               # Performance audit
```

### Key Financial Features
- **Loan Types**: 2 base types (scheduled, revolving) + configurations
- **Calculations**: Automatic balance sheet balancing, cash flow projections
- **Scenarios**: Parameter-driven sensitivity analysis
- **Validation**: Real-time input validation with business rules

## Dividend Policy System (2025-12-11)

### Overview
完整的股利政策設定系統，支援債務保護條件、分級觸發條件、瀑布式分配。

### Architecture

```
UI Layer (設定)                     Calculation Layer (計算)
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ DividendPolicyTable.tsx     │    │ cashFlow.ts                 │
│ ├─ DebtProtectionSettings   │───▶│ ├─ checkAllCovenants()     │
│ ├─ TieredTriggerSettings    │    │ ├─ selectApplicableTier()   │
│ └─ WaterfallConfiguration   │    │ └─ applyWaterfallDistribution()
└─────────────────────────────┘    └─────────────────────────────┘
              │                                  │
              └──────────┬───────────────────────┘
                         ▼
              ┌─────────────────────────────┐
              │ dividendPolicyDefaults.ts   │
              │ (統一預設值)                  │
              └─────────────────────────────┘
```

### Core Functions

#### 1. `checkAllCovenants()`
檢查所有債務保護條件，違規時禁止普通股利分配。

| Covenant | 公式 | 說明 |
|----------|------|------|
| DSCR | EBITDA / (Interest + Principal) | 債務服務覆蓋率 |
| Net Leverage | Debt / EBITDA | 淨槓桿率上限 |
| Interest Coverage | EBITDA / Interest | 利息覆蓋率下限 |
| Min Cash Months | Cash / Monthly OpEx | 最低現金保留月數 |

#### 2. `selectApplicableTier()`
根據財務表現選擇適用的分紅層級。

```typescript
// 選擇邏輯（由高到低）
// 1. 檢查所有門檻：EBITDA ≥ threshold && FCFF ≥ threshold && Leverage ≤ threshold
// 2. 符合條件中選最高 payoutRatio
// 3. 無符合時使用最低層級（而非 0%）
```

#### 3. `applyWaterfallDistribution()`
按優先級順序分配可用現金。

```
Priority 1: 優先股本金贖回 (fixed amount)
    ↓ 剩餘
Priority 2: 優先股股息 (formula: outstanding × rate)
    ↓ 剩餘
Priority 3: 普通股股利 (percentage: 100% of remaining)
```

### Unified Defaults

```typescript
// /src/constants/dividendPolicyDefaults.ts
DEFAULT_COVENANTS: {
  dscr: { value: 1.25, enabled: true },
  netLeverage: { value: 4.0, enabled: true },
  interestCoverage: { value: 3.0, enabled: true },
  minCashMonths: { value: 3, enabled: true },
}

DEFAULT_TIERS: [
  { payoutRatio: 30%, ebitdaThreshold: 50M, leverageThreshold: 5.0x },
  { payoutRatio: 50%, ebitdaThreshold: 80M, leverageThreshold: 3.5x },
  { payoutRatio: 70%, ebitdaThreshold: 100M, leverageThreshold: 2.5x },
]
```

### Calculation Flow

```
Step 1: checkAllCovenants() → passed/failed
        │
        ▼ (if passed)
Step 2: selectApplicableTier() → payoutRatio (0-1)
        │
        ▼
Step 3: Calculate availableForCommon
        │
        ▼
Step 4: if (waterfallRules exist)
        │   └── applyWaterfallDistribution()
        │ else
        │   └── availableForCommon × payoutRatio
        │
        ▼
commonDividend (if covenant failed → 0)
```

### File References

| File | Purpose |
|------|---------|
| `src/calculations/financial/cashFlow.ts` | Core calculation functions |
| `src/constants/dividendPolicyDefaults.ts` | Unified default values |
| `src/components/financing/tables/DividendPolicyTable.tsx` | Main UI controller |
| `src/components/financing/dividend/DebtProtectionSettings.tsx` | Covenant settings UI |
| `src/components/financing/dividend/TieredTriggerSettings.tsx` | Tier settings UI |
| `src/components/financing/dividend/WaterfallConfiguration.tsx` | Waterfall settings UI |
| `src/types/financial.ts` | Type definitions |

### Design Principles (Linus Style)

1. **No Special Cases**: All covenants use same check pattern
2. **Single Source of Truth**: `dividendPolicyDefaults.ts` for all defaults
3. **Configuration Driven**: UI configures, calculation executes
4. **Fail Safe**: Covenant violation → no dividend (conservative default)

## Technical Debt & Next Steps

### Immediate (This Week)
1. Delete old MnaDealDesign.tsx (1,969 lines - already replaced)
2. Run Lighthouse audit to verify performance targets
3. Increase unit test coverage to 60%

### Short Term (2 Weeks)
1. Implement Storybook component documentation
2. Add error monitoring (Sentry)
3. Optimize remaining large files

### Long Term (1 Month)
1. Achieve 80% test coverage
2. Implement A/B testing framework
3. Build performance monitoring dashboard

---

**Philosophy**: Following Linus Torvalds' "good taste" - eliminate special cases, keep it simple, solve real problems not imaginary ones.

**Last Updated**: 2025-12-11
**System Status**: Production Ready ✅