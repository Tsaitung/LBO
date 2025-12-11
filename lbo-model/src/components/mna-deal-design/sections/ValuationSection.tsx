/**
 * 企業價值顯示區塊
 * Linus 原則：純展示，無計算
 */

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useBusinessMetrics, useScenarios } from '../../../hooks/typed-hooks';
import { formatCurrency } from '../utils/formatters';
import { DealCalculator } from '../../../domain/deal/DealCalculator';

interface ValuationSectionProps {
  enterpriseValue: number;
}

/**
 * 企業價值展示
 * 職責：顯示各情境下的估值
 */
export const ValuationSection: React.FC<ValuationSectionProps> = React.memo(({ 
  enterpriseValue 
}) => {
  const businessMetrics = useBusinessMetrics();
  const scenarios = useScenarios();

  // 計算情境估值
  const calculateScenarioValuation = (scenario: 'base' | 'upside' | 'downside') => {
    const scenarioData = scenarios[scenario];
    if (!scenarioData || !businessMetrics?.ebitda || !businessMetrics?.revenue) {
      return { ev: 0, evEbitda: 0, evSales: 0 };
    }

    const evValue = DealCalculator.calculateEnterpriseValue(
      businessMetrics.ebitda, 
      scenarioData.entryEvEbitdaMultiple
    );
    const evSalesMultiple = businessMetrics.revenue !== 0 
      ? evValue / businessMetrics.revenue 
      : 0;

    return {
      ev: evValue,
      evEbitda: scenarioData.entryEvEbitdaMultiple,
      evSales: evSalesMultiple
    };
  };

  const valuations = {
    base: calculateScenarioValuation('base'),
    upside: calculateScenarioValuation('upside'),
    downside: calculateScenarioValuation('downside')
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        💰 企業價值評估
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>情境</TableCell>
              <TableCell align="right">企業價值 (EV)</TableCell>
              <TableCell align="right">EV/EBITDA</TableCell>
              <TableCell align="right">EV/Sales</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Chip label="基準" color="primary" size="small" />
              </TableCell>
              <TableCell align="right">
                {formatCurrency(valuations.base.ev)}
              </TableCell>
              <TableCell align="right">
                {valuations.base.evEbitda.toFixed(1)}x
              </TableCell>
              <TableCell align="right">
                {valuations.base.evSales.toFixed(2)}x
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip label="樂觀" color="success" size="small" />
              </TableCell>
              <TableCell align="right">
                {formatCurrency(valuations.upside.ev)}
              </TableCell>
              <TableCell align="right">
                {valuations.upside.evEbitda.toFixed(1)}x
              </TableCell>
              <TableCell align="right">
                {valuations.upside.evSales.toFixed(2)}x
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip label="保守" color="warning" size="small" />
              </TableCell>
              <TableCell align="right">
                {formatCurrency(valuations.downside.ev)}
              </TableCell>
              <TableCell align="right">
                {valuations.downside.evEbitda.toFixed(1)}x
              </TableCell>
              <TableCell align="right">
                {valuations.downside.evSales.toFixed(2)}x
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ bgcolor: 'primary.main', p: 2, borderRadius: 1 }}>
        <Typography variant="body2" color="white">
          當前企業價值：{formatCurrency(enterpriseValue)}
        </Typography>
      </Box>
    </Box>
  );
});