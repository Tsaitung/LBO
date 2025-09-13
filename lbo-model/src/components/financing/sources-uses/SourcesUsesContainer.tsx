/**
 * Sources & Uses 容器組件
 * Linus 原則：純協調，無業務邏輯
 */

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { SourcesSection } from './SourcesSection';
import { UsesSection } from './UsesSection';
import { BalanceCheck } from './BalanceCheck';
import { useSourcesUsesCalculations } from './hooks/useSourcesUsesCalculations';

/**
 * Sources & Uses 主容器
 * 職責：協調資金來源與使用的顯示
 */
export const SourcesUsesContainer: React.FC = () => {
  const calculations = useSourcesUsesCalculations();

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        📊 資金來源與使用分析
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
        <SourcesSection data={calculations.sources} total={calculations.totalSources} />
        <UsesSection data={calculations.uses} total={calculations.totalUses} />
      </Box>

      <BalanceCheck 
        totalSources={calculations.totalSources}
        totalUses={calculations.totalUses}
        isBalanced={calculations.isBalanced}
      />
    </Paper>
  );
};

export default SourcesUsesContainer;