/**
 * Metrics Summary Card Component
 * Displays key financial metrics summary
 * Following Linus principle: Display logic ONLY
 */

import React from 'react';
import { Grid, Paper, Typography, Divider, Box } from '@mui/material';
import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

interface MetricsSummaryCardProps {
  businessMetrics: BusinessMetricsBeforeAcquisition;
}

const MetricsSummaryCard: React.FC<MetricsSummaryCardProps> = ({ businessMetrics }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        關鍵財務指標摘要
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              EBITDA Margin
            </Typography>
            <Typography variant="h6">
              {businessMetrics.revenue > 0 
                ? `${((businessMetrics.ebitda / businessMetrics.revenue) * 100).toFixed(1)}%`
                : '0.0%'}
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              淨利率
            </Typography>
            <Typography variant="h6">
              {businessMetrics.revenue > 0 
                ? `${((businessMetrics.netIncome / businessMetrics.revenue) * 100).toFixed(1)}%`
                : '0.0%'}
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              資產負債比
            </Typography>
            <Typography variant="h6">
              {businessMetrics.totalAssets > 0 
                ? `${((businessMetrics.totalLiabilities / businessMetrics.totalAssets) * 100).toFixed(1)}%`
                : '0.0%'}
            </Typography>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              ROE
            </Typography>
            <Typography variant="h6">
              {businessMetrics.shareholdersEquity > 0 
                ? `${((businessMetrics.netIncome / businessMetrics.shareholdersEquity) * 100).toFixed(1)}%`
                : '0.0%'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MetricsSummaryCard;