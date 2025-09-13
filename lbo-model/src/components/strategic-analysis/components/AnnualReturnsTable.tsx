import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import { ProFormaDataItem } from '../hooks/useProFormaData';

interface AnnualReturnsTableProps {
  proFormaData: ProFormaDataItem[];
  totalInvestment: number;
}

export const AnnualReturnsTable: React.FC<AnnualReturnsTableProps> = ({ 
  proFormaData, 
  totalInvestment 
}) => {
  // Calculate annual returns
  const annualReturns = proFormaData.map((yearData, index) => {
    const year = yearData.year;
    
    // Skip year 0
    if (year === 0) {
      return {
        year,
        equity: parseFloat(yearData.equity || '0'),
        capitalGainsReturn: 0,
        dividendReturn: 0,
        totalReturn: 0,
        cumulativeReturn: 0,
        dpi: 0,
        rvpi: 0,
        tvpi: 0,
      };
    }
    
    // Calculate equity values
    const currentEquityValue = parseFloat(yearData.equity || '0');
    let previousEquityValue = totalInvestment;
    
    if (year > 1) {
      const prevYearData = proFormaData[index - 1];
      previousEquityValue = parseFloat(prevYearData?.equity || '0') || totalInvestment;
    }
    
    // Capital Gains
    const capitalGainsReturn = previousEquityValue > 0
      ? ((currentEquityValue / previousEquityValue - 1) * 100)
      : 0;
    
    // Dividend Return
    const dividends = parseFloat(yearData.commonDividend || '0') + 
                     parseFloat(yearData.preferredDividends || '0');
    const dividendReturn = previousEquityValue > 0
      ? (dividends / previousEquityValue * 100)
      : 0;
    
    // Total Return
    const totalReturn = capitalGainsReturn + dividendReturn;
    
    // Cumulative metrics
    const cumulativeDividends = proFormaData
      .slice(0, index + 1)
      .reduce((sum, d) => sum + parseFloat(d.commonDividend || '0') + parseFloat(d.preferredDividends || '0'), 0);
    
    // PE metrics
    const dpi = totalInvestment > 0 ? (cumulativeDividends / totalInvestment) : 0;
    const rvpi = totalInvestment > 0 ? (currentEquityValue / totalInvestment) : 0;
    const tvpi = dpi + rvpi;
    
    return {
      year,
      equity: currentEquityValue,
      capitalGainsReturn,
      dividendReturn,
      totalReturn,
      cumulativeReturn: (tvpi - 1) * 100,
      dpi,
      rvpi,
      tvpi,
    };
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
              年度
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              股權價值 (M)
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              資本利得 (%)
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              股息收益 (%)
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              年度報酬 (%)
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              累計報酬 (%)
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              DPI
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              RVPI
            </TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
              TVPI
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {annualReturns.map((returns) => (
            <TableRow key={returns.year} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  Year {returns.year}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {returns.equity.toFixed(1)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2"
                  color={returns.capitalGainsReturn > 0 ? 'success.main' : 
                         returns.capitalGainsReturn < 0 ? 'error.main' : 'text.primary'}
                >
                  {returns.capitalGainsReturn.toFixed(2)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {returns.dividendReturn.toFixed(2)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2"
                  fontWeight="bold"
                  color={returns.totalReturn > 0 ? 'success.main' : 
                         returns.totalReturn < 0 ? 'error.main' : 'text.primary'}
                >
                  {returns.totalReturn.toFixed(2)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2"
                  fontWeight="bold"
                  color={returns.cumulativeReturn > 0 ? 'success.main' : 
                         returns.cumulativeReturn < 0 ? 'error.main' : 'text.primary'}
                >
                  {returns.cumulativeReturn.toFixed(2)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {returns.dpi.toFixed(2)}x
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {returns.rvpi.toFixed(2)}x
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2"
                  fontWeight="bold"
                  color={returns.tvpi >= 2 ? 'success.main' : 'text.primary'}
                >
                  {returns.tvpi.toFixed(2)}x
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};