# LBO 財務模型管理系統

一個完整的槓桿收購 (Leveraged Buyout) 財務模型管理系統，支援多情境分析、自動財務預測和投資回報分析。

## 🚀 系統特色

### 📊 完整財務模型
- **被併標的業務指標 (Target Business Metrics)**: Year 0 財報數據輸入與核心假設設定
- **未來假設 (Future Assumptions)**: 多年度財務預測參數設定
- **M&A 交易設計 (M&A Deal Design)**: 交易結構與付款條件設定
- **融資計劃 (Financing Planning)**: 融資結構與還款計劃設計
- **情境管理器 (Scenario Manager)**: Base/Upper/Lower 三種情境切換與參數管理
- **來源與用途 (Sources & Uses)**: 資金來源與使用分析
- **損益表 (Income Statement)**: 完整收益表預測
- **資產負債表 (Balance Sheet)**: 資產負債表分析
- **現金流量表 (Cash Flow Statement)**: 現金流量表預測
- **債務計劃表 (Debt Schedule)**: 債務償還計劃橫向顯示
- **約束條件 (Covenants)**: 財務約定條件測試與遵循分析
- **總結報告 (Summary)**: KPI 指標與投資回報分析

### 🎯 核心功能
- **自動化計算**: 一鍵生成 Year 1~N 財務預測
- **情境分析**: 即時切換 Base/Upper/Lower 情境
- **動態債務管理**: 支援5種貸款類型和智能償還計劃
- **拖拽排序**: 融資項目支援拖拽重新排序
- **約定測試**: 自動檢查財務約定遵循狀況
- **投資回報分析**: IRR、MOIC、倍數比較
- **數據持久化**: 自動保存用戶輸入數據

## 📋 技術架構

### 前端技術棧
- **React 18** + **TypeScript**: 類型安全的現代前端框架
- **Material-UI (MUI)**: 美觀的設計系統與組件庫
- **Redux Toolkit**: 狀態管理和資料流控制
- **React Router**: 單頁應用路由管理
- **Recharts**: 圖表視覺化 (預留整合)

### 專案結構
```
src/
├── components/          # React 組件
│   ├── Navigation.tsx           # 導航欄
│   ├── BusinessMetricsBeforeAcquisition.tsx # 被併標的業務指標
│   ├── FutureAssumptions.tsx    # 未來假設
│   ├── MnaDealDesign.tsx        # M&A 交易設計
│   ├── FinancingPlanning.tsx    # 融資計劃 (支援拖拽排序)
│   ├── ScenarioManager.tsx      # 情境管理器
│   ├── SourcesUses.tsx          # 來源與用途
│   ├── IncomeStatement.tsx      # 損益表
│   ├── BalanceSheet.tsx         # 資產負債表
│   ├── CashFlowStatement.tsx    # 現金流量表
│   ├── DebtSchedule.tsx         # 債務計劃表 (橫向顯示)
│   ├── Covenants.tsx            # 約束條件
│   ├── Summary.tsx              # 總結報告
│   ├── ActionButtons.tsx        # 操作按鈕組件
│   └── Parameters.tsx           # 參數設定 (已整合)
├── store/                      # Redux 狀態管理
│   ├── store.ts               # Store 與 Persist 配置（僅使用 domain slices）
│   └── slices/                # Domain slices（businessMetrics/assumptions/financingPlan/mnaDeal/scenarios）
├── types/                      # TypeScript 類型定義
│   └── financial.ts           # 財務數據類型
└── utils/                      # 工具函數
```

## 🔧 安裝與使用

### 環境需求
- Node.js 16+
- npm 或 yarn

### 安裝步驟
```bash
# 1. 複製專案
git clone <repository-url>
cd lbo-model

# 2. 安裝依賴
npm install

# 3. 啟動開發服務器
npm start

# 4. 開啟瀏覽器訪問 http://localhost:3000
```

提示：亦可在專案根目錄直接執行 `./start-lbo-app.sh` 進行快速啟動（會自動處理埠佔用並嘗試開啟瀏覽器）。

### 建置生產版本
```bash
npm run build
```

## 📖 使用指南

### 1. 被併標的業務指標 (Target Business Metrics)
- **數據輸入**: 輸入 Year 0 財報數據（營收、EBITDA、淨利等）
- **資產勾選**: 選擇納入交易的資產項目
- **自動計算**: 所得稅、營運資本自動計算
- **數據驗證**: 總資產、總負債自動平衡

### 2. 未來假設 (Future Assumptions)
- **增長假設**: 設定營收增長率、EBITDA利潤率
- **資本支出**: 設定資本支出比率和折舊攤銷
- **營運資本**: 設定應收帳款、存貨、應付帳款週轉天數
- **財務假設**: 設定稅率和折現率

### 3. M&A 交易設計 (M&A Deal Design)
- **交易類型**: 選擇全股權收購或資產收購
- **付款結構**: 設定50%交割前 + 30%第一年末 + 20%第二年末
- **付款方式**: 選擇現金、股權或混合支付
- **里程碑設定**: 定義KPI達成條件

### 4. 融資計劃 (Financing Planning)
- **貸款類型**: 支援5種貸款類型：
  - 本息均攤（等額本息）
  - 本金均攤（等額本金）
  - 到期一次還本
  - 按季付息，到期還本
  - 循環信用
- **拖拽排序**: 點擊項目名稱拖拽重新排序
- **自動調整**: 貸款類型切換時自動調整還款結構
- **寬限期**: 設定貸款寬限期

### 5. 情境管理器 (Scenario Manager)
- **情境切換**: Base/Upper/Lower 三種情境
- **參數調整**: Entry/Exit EV/EBITDA倍數、持有期間
- **自動應用**: 應用情境參數後自動重算

### 6. 財務報表分析
- **來源與用途**: 資金來源與使用平衡分析
- **損益表**: 完整收益表預測
- **資產負債表**: 資產負債表分析
- **現金流量表**: 現金流量表預測

### 7. 債務計劃表 (Debt Schedule)
- **橫向顯示**: 年度橫向排列，完整償還軌跡
- **多債務類型**: Senior、Mezzanine、Revolver並排顯示
- **利息計算**: 準確的利息支出計算
- **本金償還**: 動態本金償還計劃

### 8. 約束條件 (Covenants)
- **財務比率**: DSCR、利息覆蓋率、淨槓桿比率
- **年度監控**: 各年度約定條件計算
- **違約警示**: 自動警示潛在違約風險

### 9. 總結報告 (Summary)
- **投資回報**: IRR、MOIC 計算
- **敏感性分析**: 關鍵參數影響評估
- **決策支持**: 投資建議和風險評定

## 📊 財務計算邏輯

### 營收預測
```
Year N Revenue = Year 0 Revenue × (1 + Growth Rate)^N
```

### EBITDA 計算
```
EBITDA = Revenue × EBITDA Margin
```

### 槓桿結構
```
Senior Debt = Year 0 EBITDA × Senior Debt Multiple
Mezz Debt = Year 0 EBITDA × Mezz Debt Multiple
Equity = Enterprise Value - Total Debt
```

### 貸款類型與償還方式

#### 1. 本息均攤（等額本息）
```
每期償還的金額相同，包含本金與利息
- 適用於：長期穩定融資
- 特點：每月還款額固定，總利息較高
```

#### 2. 本金均攤（等額本金）
```
每期償還的本金相同，利息隨本金餘額下降而逐期減少
- 適用於：希望早期降低負債的融資
- 特點：前幾期還款額較高，總利息較低
```

#### 3. 到期一次還本
```
每期僅支付利息，本金於貸款期滿時一次償還
- 適用於：短期融資需求
- 特點：現金流壓力最小，但到期一次性償還壓力大
```

#### 4. 按季付息，到期還本
```
定期繳息，本金到期一次償還
- 適用於：需要資金靈活使用的融資
- 特點：利息支付頻率較低，本金償還有明確時間點
```

#### 5. 循環信用
```
有額度上限，利息依實際動用金額及天數計算，隨時可償還或再動用
- 適用於：資金需求波動大的企業
- 特點：高度靈活，但利率通常較高
```

### 約定測試
- **DSCR**: 債務服務覆蓋率 ≥ 1.25x
- **Interest Coverage**: 利息覆蓋率 ≥ 3.0x
- **Net Leverage**: 淨槓桿率 ≤ 4.0x

## 🎨 介面設計

- **響應式設計**: 支援桌面和行動裝置
- **Material Design**: 現代化且直觀的用戶介面
- **即時計算**: 參數變更即時反應
- **視覺化指標**: 關鍵指標以卡片和圖表形式展示
- **拖拽排序**: 融資項目支援拖拽重新排序
- **表格對齊**: 表頭與內容欄位寬度完美對齊
- **貸款類型選擇**: 清晰的貸款類型下拉選單

## 🔮 未來擴展

### 已實現功能 ✅
- ✅ **拖拽排序**: 融資項目支援拖拽重新排序
- ✅ **貸款類型擴展**: 支援5種完整貸款類型
- ✅ **表格寬度對齊**: 完美解決表頭內容對齊問題
- ✅ **特別條款編輯**: 債務和股權項目的詳細參數設定
- ✅ **進入時間控制**: 期初/期末時間點精確控制
- ✅ **數據持久化**: 完整的Redux Persist實現
- ✅ **模組整合**: 按財務分析最佳實務整合頁面

### 功能增強 🔄
- 🔄 圖表視覺化 (Recharts 整合)
- 🔄 Excel 匯出功能
- 🔄 多公司比較分析
- 🔄 敏感度分析
- 🔄 蒙地卡羅模擬

### 技術優化 🔄
- 🔄 PWA 支援
- 🔄 離線模式
- 🔄 雲端儲存
- 🔄 API 整合
- 🔄 效能優化

## 📝 開發說明

### 程式碼規範
- 使用 TypeScript 確保類型安全
- 遵循 React Hooks 最佳實踐
- Redux Toolkit 進行狀態管理
- Material-UI 組件設計系統

### 測試策略
```bash
# 運行測試
npm test

# 程式碼覆蓋率
npm test -- --coverage
```

### 部署
```bash
# 建置生產版本
npm run build

# 部署到 GitHub Pages
npm install -g gh-pages
npm run deploy
```

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 🙏 致謝

感謝所有為此專案做出貢獻的開發者和財務專家。

---

**開發者**: LBO 財務模型團隊
**版本**: 1.0.0
**最後更新**: 2024
