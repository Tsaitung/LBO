import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import { EquityAnalysisItem } from './EquityReturnsCalculator';

interface ReturnsSummaryCardProps {
  equityAnalysis: EquityAnalysisItem[];
  totalInvestment: number;
}

export const ReturnsSummaryCard: React.FC<ReturnsSummaryCardProps> = ({ 
  equityAnalysis, 
  totalInvestment 
}) => {
  const totalExitProceeds = equityAnalysis.reduce((sum, e) => sum + e.exitProceeds, 0);
  // const totalReturn = equityAnalysis.reduce((sum, e) => sum + e.totalReturn, 0); // Reserved for future use
  const totalMOIC = totalInvestment > 0 ? totalExitProceeds / totalInvestment : 0;
  
  // Calculate weighted average IRR
  const weightedIRR = equityAnalysis.reduce((sum, e) => {
    const weight = e.investmentAmount / totalInvestment;
    return sum + (e.irr * weight);
  }, 0);
  
  // const totalNPV = equityAnalysis.reduce((sum, e) => sum + e.npv, 0); // Reserved for future use

  return (
    <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
          💰 投資回報總覽
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'grey.100' }}>
                總投資金額
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                ${totalInvestment.toFixed(1)}M
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'grey.100' }}>
                退出收益
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                ${totalExitProceeds.toFixed(1)}M
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'grey.100' }}>
                投資倍數 (MOIC)
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {totalMOIC.toFixed(2)}x
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'grey.100' }}>
                加權平均 IRR
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {weightedIRR.toFixed(1)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};