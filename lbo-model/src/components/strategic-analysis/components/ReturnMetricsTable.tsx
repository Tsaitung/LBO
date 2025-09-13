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
  Chip,
} from '@mui/material';
import { EquityAnalysisItem } from './EquityReturnsCalculator';

interface ReturnMetricsTableProps {
  equityAnalysis: EquityAnalysisItem[];
}

export const ReturnMetricsTable: React.FC<ReturnMetricsTableProps> = ({ equityAnalysis }) => {
  const totalInvestment = equityAnalysis.reduce((sum, e) => sum + e.investmentAmount, 0);
  const totalExitProceeds = equityAnalysis.reduce((sum, e) => sum + e.exitProceeds, 0);
  
  const getInvestorTypeColor = (type: string) => {
    switch (type) {
      case 'preferred': return 'info';
      case 'common': return 'success';
      default: return 'default';
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell width="200">
              <Typography variant="subtitle2" fontWeight="bold">
                投資者
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="subtitle2" fontWeight="bold">
                類型
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                投資金額 (M)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                持股比例
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                退出收益 (M)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                MOIC
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                IRR (%)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                NPV (M)
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {equityAnalysis.map((equity, index) => (
            <TableRow key={index} hover>
              <TableCell>
                <Typography variant="body2">{equity.name}</Typography>
              </TableCell>
              <TableCell align="center">
                <Chip 
                  label={equity.type === 'preferred' ? '優先股' : '普通股'}
                  size="small"
                  color={getInvestorTypeColor(equity.type)}
                />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {equity.investmentAmount.toFixed(1)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {equity.ownershipPercentage.toFixed(1)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {equity.exitProceeds.toFixed(1)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={equity.moic >= 2 ? 'success.main' : 'text.primary'}
                >
                  {equity.moic.toFixed(2)}x
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2"
                  fontWeight="bold"
                  color={equity.irr >= 20 ? 'success.main' : 'text.primary'}
                >
                  {equity.irr.toFixed(1)}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2"
                  color={equity.npv >= 0 ? 'success.main' : 'error.main'}
                >
                  {equity.npv.toFixed(1)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          
          {/* 總計行 */}
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell colSpan={2}>
              <Typography variant="subtitle2" fontWeight="bold">
                總計
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {totalInvestment.toFixed(1)}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {equityAnalysis.reduce((sum, e) => sum + e.ownershipPercentage, 0).toFixed(1)}%
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {totalExitProceeds.toFixed(1)}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {(totalInvestment > 0 ? totalExitProceeds / totalInvestment : 0).toFixed(2)}x
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                -
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {equityAnalysis.reduce((sum, e) => sum + e.npv, 0).toFixed(1)}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};