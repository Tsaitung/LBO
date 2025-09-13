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
import { EquityAnalysisItem } from './EquityReturnsCalculator';

interface CashFlowWaterfallProps {
  equityAnalysis: EquityAnalysisItem[];
  planningHorizon: number;
}

export const CashFlowWaterfall: React.FC<CashFlowWaterfallProps> = ({ 
  equityAnalysis, 
  planningHorizon 
}) => {
  // Prepare waterfall data
  const years = Array.from({ length: planningHorizon + 1 }, (_, i) => i);
  
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="bold">
                投資者
              </Typography>
            </TableCell>
            {years.map(year => (
              <TableCell key={year} align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  Year {year}
                </Typography>
              </TableCell>
            ))}
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                總計
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {equityAnalysis.map((equity, index) => (
            <TableRow key={index} hover>
              <TableCell>
                <Typography variant="body2">
                  {equity.name}
                </Typography>
              </TableCell>
              {equity.cashFlows.map((cf, yearIndex) => (
                <TableCell key={yearIndex} align="right">
                  <Typography 
                    variant="body2"
                    color={cf < 0 ? 'error.main' : cf > 0 ? 'success.main' : 'text.secondary'}
                  >
                    {cf !== 0 ? cf.toFixed(1) : '-'}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align="right">
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={equity.totalReturn > 0 ? 'success.main' : 'error.main'}
                >
                  {equity.totalReturn.toFixed(1)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          
          {/* Total row */}
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="bold">
                總計
              </Typography>
            </TableCell>
            {years.map(year => {
              const yearTotal = equityAnalysis.reduce((sum, equity) => {
                return sum + (equity.cashFlows[year] || 0);
              }, 0);
              
              return (
                <TableCell key={year} align="right">
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold"
                    color={yearTotal < 0 ? 'error.main' : yearTotal > 0 ? 'success.main' : 'text.secondary'}
                  >
                    {yearTotal !== 0 ? yearTotal.toFixed(1) : '-'}
                  </Typography>
                </TableCell>
              );
            })}
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {equityAnalysis.reduce((sum, e) => sum + e.totalReturn, 0).toFixed(1)}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};