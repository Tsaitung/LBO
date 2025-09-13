/**
 * 損益表面板組件
 * Linus 原則：單一職責 - 顯示損益表數據
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

interface IncomeStatementPanelProps {
  data: ProFormaDataItem[];
}

/**
 * 損益表面板
 */
export const IncomeStatementPanel: React.FC<IncomeStatementPanelProps> = React.memo(({ data }) => {
  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Year 0 損益說明</AlertTitle>
        Year 0 為併購交易當期：不併入併購前的損益，故損益表 Year 0 顯示為 0；自 Year 1 起反映併購後營運。
      </Alert>
      
      <Typography variant="h6" gutterBottom>
        合併損益表預測 (單位: 百萬元)
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.year === 0 ? 'Year 0' : `Year ${d.year}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>營業收入</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.revenue}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>EBITDA</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.ebitda}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>EBITDA Margin (%)</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.ebitdaMargin}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>EBIT</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.ebit}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>利息費用</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.interestExpense}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>淨利</TableCell>
              {data.map((d) => (
                <TableCell key={d.year} align="right">{d.netIncome}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
});