/**
 * Cash Flow Tab Component
 * Handles cash flow statement inputs
 * Following Linus principle: Single responsibility
 */

import React from 'react';
import { Grid, TextField, Typography, Divider } from '@mui/material';
import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

interface CashFlowTabProps {
  businessMetrics: BusinessMetricsBeforeAcquisition;
  onInputChange: (field: keyof BusinessMetricsBeforeAcquisition, value: string | boolean) => void;
  formatNumber: (value: number | undefined) => string;
}

const CashFlowTab: React.FC<CashFlowTabProps> = ({
  businessMetrics,
  onInputChange,
  formatNumber
}) => {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h6" gutterBottom>
          現金流量表 (Cash Flow Statement)
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="營業活動現金流量"
          value={formatNumber(businessMetrics.operatingCashFlow)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText="EBITDA - 利息 - 稅 + D&A"
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="投資活動現金流量"
          value={formatNumber(businessMetrics.investingCashFlow)}
          onChange={(e) => onInputChange('investingCashFlow', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText="資本支出（通常為負值）"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="融資活動現金流量"
          value={formatNumber(businessMetrics.financingCashFlow)}
          onChange={(e) => onInputChange('financingCashFlow', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText="債務變動 + 股利支付"
        />
      </Grid>
    </Grid>
  );
};

export default CashFlowTab;