/**
 * Cash Flow Statement Tab Component
 * Displays pro forma cash flow statement
 * Following Linus principle: Display logic ONLY
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

interface CashFlowStatementTabProps {
  proFormaData: ProFormaDataItem[];
}

const CashFlowStatementTab: React.FC<CashFlowStatementTabProps> = React.memo(({ proFormaData }) => {
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
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.year === 0 ? 'Year 0 (併購)' : `Year ${d.year}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Operating Activities */}
            <TableRow sx={{ bgcolor: 'primary.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>營業活動現金流量</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.operatingCashFlow}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>淨利</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.netIncome}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>折舊攤銷</TableCell>
              {proFormaData.map((d) => {
                const da = (parseFloat(d.ebitda) || 0) - (parseFloat(d.ebit) || 0);
                return <TableCell key={d.year} align="right">{da.toFixed(1)}</TableCell>;
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>營運資本變動</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.nwcChangeCF || '0.0'}</TableCell>
              ))}
            </TableRow>

            {/* Dividends */}
            <TableRow>
              <TableCell>特別股股息（當期支付）</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.preferredDividends || '0.0'}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>普通股股利</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.commonDividends || '0.0'}</TableCell>
              ))}
            </TableRow>
            
            {/* Investing Activities */}
            <TableRow sx={{ bgcolor: 'warning.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>投資活動現金流量</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.investingCashFlow}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>資本支出 (CapEx)</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.capexCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>交易費用</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.transactionFeeCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>收購現金付款</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.acquisitionCashCF}</TableCell>
              ))}
            </TableRow>
            
            {/* Financing Activities */}
            <TableRow sx={{ bgcolor: 'success.50' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>融資活動現金流量</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.financingCashFlow}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>新債務流入</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.newDebtCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>新股權流入</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.newEquityCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>本金償還</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.principalRepaymentCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>利息支付</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.interestPaidCF}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>特別股贖回</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.preferredRedemption || '0.0'}</TableCell>
              ))}
            </TableRow>
            
            {/* Cash Summary */}
            <TableRow>
              <TableCell>本期淨現金流量</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.netCashFlow}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>期初現金餘額</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.beginningCash}</TableCell>
              ))}
            </TableRow>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>期末現金餘額</TableCell>
              {proFormaData.map((d) => (
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

export default CashFlowStatementTab;