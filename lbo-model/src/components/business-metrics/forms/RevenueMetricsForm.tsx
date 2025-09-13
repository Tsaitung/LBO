/**
 * 營收指標表單組件
 * Linus 原則：單一職責，專注營收相關指標
 */

import React, { useCallback } from 'react';
import { TextField, InputAdornment, Grid } from '@mui/material';
import { useMetricsValidation } from '../hooks/useMetricsValidation';

interface RevenueMetricsFormProps {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  onChange: (field: string, value: number) => void;
}

export const RevenueMetricsForm: React.FC<RevenueMetricsFormProps> = React.memo(({
  revenue,
  cogs,
  grossProfit,
  grossMargin,
  onChange,
}) => {
  const { errors, validateField } = useMetricsValidation('revenue');
  
  const handleChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (validateField(field, value)) {
      onChange(field, value);
    }
  }, [onChange, validateField]);
  
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="營業收入"
          type="number"
          value={revenue}
          onChange={handleChange('revenue')}
          error={!!errors.revenue}
          helperText={errors.revenue || '年度總營收'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="銷貨成本 (COGS)"
          type="number"
          value={cogs}
          onChange={handleChange('cogs')}
          error={!!errors.cogs}
          helperText={errors.cogs || '直接生產成本'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="毛利"
          type="number"
          value={grossProfit}
          disabled
          helperText="營收 - 銷貨成本"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="毛利率"
          type="number"
          value={grossMargin.toFixed(2)}
          disabled
          helperText="毛利 / 營收"
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );
});