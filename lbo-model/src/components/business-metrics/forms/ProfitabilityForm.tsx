/**
 * 獲利能力表單組件
 * Linus 原則：單一職責，專注獲利指標
 */

import React, { useCallback } from 'react';
import { TextField, InputAdornment, Grid } from '@mui/material';
import { useMetricsValidation } from '../hooks/useMetricsValidation';

interface ProfitabilityFormProps {
  operatingExpenses: number;
  ebitda: number;
  depreciationAmortization: number;
  interestExpense: number;
  taxExpense: number;
  netIncome: number;
  onChange: (field: string, value: number) => void;
}

export const ProfitabilityForm: React.FC<ProfitabilityFormProps> = React.memo(({
  operatingExpenses,
  ebitda,
  depreciationAmortization,
  interestExpense,
  taxExpense,
  netIncome,
  onChange,
}) => {
  const { errors, validateField } = useMetricsValidation('profitability');
  
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
          label="營業費用"
          type="number"
          value={operatingExpenses}
          onChange={handleChange('operatingExpenses')}
          error={!!errors.operatingExpenses}
          helperText={errors.operatingExpenses || '銷管費用總和'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="EBITDA"
          type="number"
          value={ebitda}
          disabled
          helperText="毛利 - 營業費用"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="折舊與攤銷"
          type="number"
          value={depreciationAmortization}
          onChange={handleChange('depreciationAmortization')}
          helperText="年度折舊與攤銷費用"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="利息費用"
          type="number"
          value={interestExpense}
          onChange={handleChange('interestExpense')}
          error={!!errors.interestExpense}
          helperText={errors.interestExpense || '債務利息支出'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="稅費"
          type="number"
          value={taxExpense}
          onChange={handleChange('taxExpense')}
          error={!!errors.taxExpense}
          helperText={errors.taxExpense || '所得稅費用'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="淨利"
          type="number"
          value={netIncome}
          disabled
          helperText="EBIT - 利息 - 稅費"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );
});