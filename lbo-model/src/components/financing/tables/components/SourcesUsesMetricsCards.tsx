/**
 * Sources & Uses Metrics Cards Component
 * Displays key metrics in card format
 * Following Linus principle: Display logic ONLY
 */

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { formatCurrency, formatPercentage } from '../hooks/useSourcesUsesData';

interface SourcesUsesMetricsCardsProps {
  totalUses: number;
  totalSources: number;
  totalDebt: number;
  totalEquity: number;
}

const SourcesUsesMetricsCards: React.FC<SourcesUsesMetricsCardsProps> = ({
  totalUses,
  totalSources,
  totalDebt,
  totalEquity,
}) => {
  const isBalanced = Math.abs(totalSources - totalUses) < 0.1;
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
          <Typography variant="subtitle2" color="white">
            總資金需求
          </Typography>
          <Typography variant="h5" color="white" sx={{ mt: 1 }}>
            {formatCurrency(totalUses)}
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light' }}>
          <Typography variant="subtitle2" color="white">
            債務比例
          </Typography>
          <Typography variant="h5" color="white" sx={{ mt: 1 }}>
            {formatPercentage(totalDebt, totalSources)}
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
          <Typography variant="subtitle2" color="white">
            股權比例
          </Typography>
          <Typography variant="h5" color="white" sx={{ mt: 1 }}>
            {formatPercentage(totalEquity, totalSources)}
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(25% - 16px)' } }}>
        <Paper sx={{ 
          p: 2, 
          textAlign: 'center', 
          bgcolor: isBalanced ? 'success.main' : 'error.main' 
        }}>
          <Typography variant="subtitle2" color="white">
            平衡檢查
          </Typography>
          <Typography variant="h5" color="white" sx={{ mt: 1 }}>
            {isBalanced ? '✓ 平衡' : `差額 ${formatCurrency(totalSources - totalUses)}`}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default SourcesUsesMetricsCards;