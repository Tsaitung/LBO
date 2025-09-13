/**
 * Sources & Uses Table Component (Refactored)
 * Main orchestrator using modular components
 * Following Linus principle: Orchestrate, don't implement
 */

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useSourcesUsesData, formatCurrency } from './hooks/useSourcesUsesData';
import SourcesUsesMetricsCards from './components/SourcesUsesMetricsCards';
import SourcesTable from './components/SourcesTable';
import UsesTable from './components/UsesTable';

const SourcesUsesTable: React.FC = () => {
  const {
    enterpriseValue,
    totalDebt,
    totalEquity,
    totalSources,
    totalUses,
    cashForOperations,
    sourcesData,
    usesData,
    currentScenarioKey,
    entryMultiple,
  } = useSourcesUsesData();

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        資金來源與使用分析 (Sources & Uses)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        此表格顯示併購交易的完整資金結構，包括所有融資來源和資金用途。當前使用 {String(currentScenarioKey).toUpperCase()} 情境，
        企業價值為 {formatCurrency(enterpriseValue)} ({entryMultiple}x EBITDA)。
      </Alert>

      {/* Key Metrics Cards */}
      <SourcesUsesMetricsCards
        totalUses={totalUses}
        totalSources={totalSources}
        totalDebt={totalDebt}
        totalEquity={totalEquity}
      />

      {/* Sources and Uses Tables */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <SourcesTable 
          sourcesData={sourcesData} 
          totalSources={totalSources} 
        />
        <UsesTable 
          usesData={usesData} 
          totalUses={totalUses} 
        />
      </Box>

      {/* Balance Check Alert */}
      <Alert severity="success" sx={{ mt: 3 }}>
        資金來源與使用完全平衡。
        {Math.abs(cashForOperations) > 0.01 && (
          <span>
            {cashForOperations > 0 
              ? ` 剩餘 ${formatCurrency(cashForOperations)} 作為現金週轉金。`
              : ` 資金缺口 ${formatCurrency(Math.abs(cashForOperations))} 需要額外融資。`}
          </span>
        )}
      </Alert>
    </Box>
  );
};

export default SourcesUsesTable;