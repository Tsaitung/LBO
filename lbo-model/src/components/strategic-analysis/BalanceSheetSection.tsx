import React from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  Divider,
} from '@mui/material';
import { useBalanceSheets } from '../../hooks/typed-hooks';
import { ProFormaDataItem } from './hooks/useProFormaData';
import { BusinessMetricsBeforeAcquisition, FutureAssumptions, MnaDealDesign } from '../../types/financial';

interface BalanceSheetSectionProps {
  proFormaData: ProFormaDataItem[];
  businessMetrics: BusinessMetricsBeforeAcquisition;
  futureAssumptions: FutureAssumptions;
  mnaDealDesign: MnaDealDesign;
  globalEnterpriseValue?: number;
}

const BalanceSheetSection: React.FC<BalanceSheetSectionProps> = React.memo(({
  proFormaData,
  businessMetrics,
  futureAssumptions,
  mnaDealDesign,
  globalEnterpriseValue,
}) => {
  // 使用 Redux 計算的資產負債表數據（單一數據源）
  const balanceSheets = useBalanceSheets();
  
  // 單位轉換：仟元 -> 百萬元
  const fmtM = (v?: number) => ((v || 0) / 1000).toFixed(1);

  // 判斷交易類型
  const isAssetDeal = mnaDealDesign.dealType === 'assetAcquisition';
  
  // 從 Redux 數據獲取 Year 0 資訊
  const year0BalanceSheet = balanceSheets?.[0];
  
  // 動態讀取用戶設定值
  const specialSharesDividendRate = mnaDealDesign.assetDealSettings?.specialSharesDetails?.dividendRate;
  const discountRate = (futureAssumptions.discountRate) / 100;
  
  // 付款結構
  const upfrontPaymentPct = (mnaDealDesign.paymentStructure?.upfrontPayment ?? 0) / 100;
  const year1PaymentPct = (mnaDealDesign.paymentStructure?.year1MilestonePayment ?? 0) / 100;
  const year2PaymentPct = (mnaDealDesign.paymentStructure?.year2MilestonePayment ?? 0) / 100;
  const specialSharesPct = 1 - upfrontPaymentPct;
  
  // 使用統一的企業價值
  const ev = globalEnterpriseValue || 0;

  // 如果沒有 Redux 數據，顯示提示
  if (!balanceSheets || balanceSheets.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>請先計算財務預測</AlertTitle>
        請點擊上方導航欄的「重算 Year1~N」按鈕來生成資產負債表數據。
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        合併資產負債表預測 (單位: 百萬元)
      </Typography>
      
      {isAssetDeal && (
        <Alert severity="info" sx={{ mb: 2 }}>
          交易類型：資產收購 - Year 0 顯示併購方SPV的資產負債表
          <br />
          選定資產：
          {mnaDealDesign.assetSelections?.cashAndCashEquivalents && ' 現金'}
          {mnaDealDesign.assetSelections?.accountsReceivable && ' 應收帳款'}
          {mnaDealDesign.assetSelections?.inventory && ' 存貨'}
          {mnaDealDesign.assetSelections?.propertyPlantEquipment && ' 不動產設備'}
        </Alert>
      )}
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {bs.year === 0 ? 'Year 0 (併購日)' : `Year ${bs.year}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 資產 */}
            <TableRow sx={{ bgcolor: 'primary.50' }}>
              <TableCell colSpan={balanceSheets.length + 1} sx={{ fontWeight: 'bold' }}>
                資產 (Assets)
              </TableCell>
            </TableRow>
            
            {/* 流動資產 - 直接使用 Redux 數據 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>現金及約當現金</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.cash)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell sx={{ pl: 3 }}>應收帳款</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.accountsReceivable)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell sx={{ pl: 3 }}>存貨</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.inventory)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ pl: 2, fontWeight: 'bold' }}>流動資產合計</TableCell>
              {balanceSheets.map((bs) => {
                const currentAssets = (bs.cash || 0) + 
                                     (bs.accountsReceivable || 0) + 
                                     (bs.inventory || 0);
                return (
                  <TableCell key={bs.year} align="right" sx={{ fontWeight: 'bold' }}>
                    {fmtM(currentAssets)}
                  </TableCell>
                );
              })}
            </TableRow>
            
            {/* 非流動資產 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>不動產、廠房及設備（淨額）</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.fixedAssets)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell sx={{ pl: 3 }}>商譽 (Goodwill)</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.goodwill)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>總資產</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {fmtM(bs.totalAssets)}
                </TableCell>
              ))}
            </TableRow>
            
            {/* 負債與股東權益 */}
            <TableRow sx={{ bgcolor: 'secondary.50' }}>
              <TableCell colSpan={balanceSheets.length + 1} sx={{ fontWeight: 'bold' }}>
                負債與股東權益 (Liabilities & Equity)
              </TableCell>
            </TableRow>
            
            {/* 流動負債 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>應付帳款</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.accountsPayable)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell sx={{ pl: 3 }}>其他流動負債</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.otherCurrentLiabilities)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ pl: 2, fontWeight: 'bold' }}>流動負債合計</TableCell>
              {balanceSheets.map((bs) => {
                const currentLiabilities = (bs.accountsPayable || 0) + 
                                          (bs.otherCurrentLiabilities || 0);
                return (
                  <TableCell key={bs.year} align="right" sx={{ fontWeight: 'bold' }}>
                    {fmtM(currentLiabilities)}
                  </TableCell>
                );
              })}
            </TableRow>
            
            {/* 非流動負債 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>長期債務</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.debt)}
                </TableCell>
              ))}
            </TableRow>
            
            {/* 特別股贖回負債 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>特別股贖回負債（{specialSharesDividendRate}%累積股息）</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.preferredStock)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'warning.light' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>總負債</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {fmtM(bs.totalLiabilities)}
                </TableCell>
              ))}
            </TableRow>
            
            {/* 股東權益 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>股東權益</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right">
                  {fmtM(bs.equity)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ pl: 2, fontWeight: 'bold' }}>股東權益合計</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {fmtM(bs.equity)}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'secondary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>負債與股東權益總計</TableCell>
              {balanceSheets.map((bs) => (
                <TableCell key={bs.year} align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {fmtM(bs.totalLiabilitiesEquity)}
                </TableCell>
              ))}
            </TableRow>
            
            {/* 平衡檢查 */}
            <TableRow sx={{ bgcolor: 'error.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>檢查：資產 - (負債+權益)</TableCell>
              {balanceSheets.map((bs) => {
                const difference = (bs.totalAssets || 0) - (bs.totalLiabilitiesEquity || 0);
                return (
                  <TableCell key={bs.year} align="right" sx={{ 
                    fontWeight: 'bold',
                    color: Math.abs(difference) < 0.1 ? 'success.main' : 'error.main'
                  }}>
                    {fmtM(difference)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Year 0 詳細資訊 */}
      {year0BalanceSheet && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Year 0 資產負債表詳情（來自 Redux）</AlertTitle>
          <Typography variant="body2">
            • 現金：{fmtM(year0BalanceSheet.cash)}M
            <br />• 長期債務：{fmtM(year0BalanceSheet.debt)}M
            <br />• 特別股：{fmtM(year0BalanceSheet.preferredStock)}M
            <br />• 商譽：{fmtM(year0BalanceSheet.goodwill)}M
            <br />• 總資產：{fmtM(year0BalanceSheet.totalAssets)}M
            <br />• 總負債與權益：{fmtM(year0BalanceSheet.totalLiabilitiesEquity)}M
          </Typography>
        </Alert>
      )}
      
      {/* 支付結構說明 */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>支付結構與會計處理說明</AlertTitle>
        <Typography variant="body2">
          <strong>交易結構：</strong>
        </Typography>
        <Typography variant="body2">
          • 企業價值：{ev.toFixed(1)}M
          • 折現率：{(discountRate * 100).toFixed(1)}%
          • 特別股股息率：{specialSharesDividendRate !== undefined ? `${specialSharesDividendRate}%` : '未設定'}（累積型）
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2">
          <strong>支付與贖回時程：</strong>
        </Typography>
        <Typography variant="body2">
          • Year 0（交割時）：
          <br />　- 現金支付 {(ev * upfrontPaymentPct).toFixed(1)}M ({(upfrontPaymentPct * 100).toFixed(0)}%)
          <br />　- 發行特別股 {(ev * specialSharesPct).toFixed(1)}M ({(specialSharesPct * 100).toFixed(0)}%)
        </Typography>
        <Typography variant="body2">
          • Year 1末：贖回特別股 {(ev * year1PaymentPct).toFixed(1)}M ({(year1PaymentPct * 100).toFixed(0)}%)
        </Typography>
        <Typography variant="body2">
          • Year 2末：贖回特別股 {(ev * year2PaymentPct).toFixed(1)}M ({(year2PaymentPct * 100).toFixed(0)}%)
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>數據來源：</strong>
          <br />• 所有資產負債表數據來自 Redux 統一計算
          <br />• 不再有本地計算，確保數據一致性
          <br />• 遵循單一數據源原則
        </Typography>
      </Alert>
    </>
  );
});

export default BalanceSheetSection;
