/**
 * 現金流量表面板組件
 * Linus 原則：純展示，無特殊情況處理
 */

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
} from '@mui/material';
import { ProFormaDataItem } from '../hooks/useProFormaData';
import { useBalanceSheets } from '../../../hooks/typed-hooks';

interface CashFlowPanelProps {
  data: ProFormaDataItem[];
}

/**
 * 現金流量表面板
 */
export const CashFlowPanel: React.FC<CashFlowPanelProps> = React.memo(({ data }) => {
  const balanceSheet = useBalanceSheets();
  
  // 計算折舊攤銷
  const calculateDA = (d: ProFormaDataItem) => {
    const da = (parseFloat(d.ebitda) || 0) - (parseFloat(d.ebit) || 0);
    return da.toFixed(1);
  };
  
  // 計算營運資本變動
  const calculateNWCChange = (idx: number) => {
    if (!balanceSheet || idx === 0) return '0.0';
    const prev = balanceSheet[idx - 1];
    const current = balanceSheet[idx];
    const chg = ((current.nwc || 0) - (prev.nwc || 0)) / 1000;
    return chg.toFixed(1);
  };
  
  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Year 0 現金流說明</AlertTitle>
        Year 0 為併購交易當期：
        • 營業活動現金流量 = 0（併購前營運不併入）。
        • 投資活動現金流量包含當期交易費與期1（併購日）的現金支付比例。
        • 融資活動現金流量包含初始債務與股權的現金流入；特別股發行為非現金，僅於資產負債表反映。
      </Alert>
      
      <Typography variant="h6" gutterBottom>
        合併現金流量表預測 (單位: 百萬元)
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.year === 0 ? 'Year 0 (併購)' : `Year ${d.year}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* 營業活動 */}
            <TableRow sx={{ bgcolor: 'primary.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>營業活動現金流量</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.operatingCashFlow}
                </TableCell>
              ))}
            </TableRow>
            {/* 營業活動細項 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>淨利</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.netIncome}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>折舊攤銷</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{calculateDA(d)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>營運資本變動</TableCell>
              {data.map((_, idx) => (
                <TableCell key={idx} align="right">{calculateNWCChange(idx)}</TableCell>
              ))}
            </TableRow>
            
            {/* 投資活動 */}
            <TableRow sx={{ bgcolor: 'warning.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>投資活動現金流量</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.investingCashFlow}
                </TableCell>
              ))}
            </TableRow>
            {/* 投資活動細項 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>資本支出 (CapEx)</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.capexCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>交易費用</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.transactionFeeCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>收購現金付款</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.acquisitionCashCF}</TableCell>
              ))}
            </TableRow>
            
            {/* 融資活動 */}
            <TableRow sx={{ bgcolor: 'success.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>融資活動現金流量</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.financingCashFlow}
                </TableCell>
              ))}
            </TableRow>
            {/* 融資活動細項 */}
            <TableRow>
              <TableCell sx={{ pl: 3 }}>新債務流入</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.newDebtCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>新股權流入</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.newEquityCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>本金償還</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.principalRepaymentCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>利息支付</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.interestPaidCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>特別股贖回</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.preferredRedemption || '0.0'}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>優先股股息</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.preferredDividends || '0.0'}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>普通股股利</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.commonDividends || '0.0'}</TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell>本期淨現金流量</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.netCashFlow}</TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell>期初現金餘額</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.beginningCash}</TableCell>
              ))}
            </TableRow>
            
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>期末現金餘額</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.endingCash}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
});