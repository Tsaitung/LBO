/**
 * 平衡檢查組件
 * Linus 原則：簡單直接
 */

import React from 'react';
import { Box, Alert, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

interface BalanceCheckProps {
  totalSources: number;
  totalUses: number;
  isBalanced: boolean;
}

/**
 * 資金平衡檢查
 * 職責：驗證 Sources = Uses
 */
export const BalanceCheck: React.FC<BalanceCheckProps> = React.memo(({ 
  totalSources,
  totalUses,
  isBalanced 
}) => {
  const difference = Math.abs(totalSources - totalUses);
  
  if (isBalanced) {
    return (
      <Alert 
        severity="success" 
        icon={<CheckCircleIcon />}
        sx={{ mt: 2 }}
      >
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          ✅ 資金來源與使用平衡
        </Typography>
        <Typography variant="body2">
          Sources ({totalSources.toFixed(1)}M) = Uses ({totalUses.toFixed(1)}M)
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert 
      severity="warning" 
      icon={<WarningIcon />}
      sx={{ mt: 2 }}
    >
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        ⚠️ 資金不平衡
      </Typography>
      <Typography variant="body2">
        差額：{difference.toFixed(1)}M ({totalSources > totalUses ? '資金過剩' : '資金不足'})
      </Typography>
    </Alert>
  );
});