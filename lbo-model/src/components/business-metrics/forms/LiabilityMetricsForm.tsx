/**
 * 負債指標表單組件
 * Linus 原則：單一職責，專注負債指標
 */

import React, { useCallback } from 'react';
import { TextField, InputAdornment, FormControlLabel, Checkbox, Grid } from '@mui/material';
import { useMetricsValidation } from '../hooks/useMetricsValidation';

interface LiabilityMetricsFormProps {
  accountsPayable: number;
  apIncludedInTransaction: boolean;
  shortTermDebt: number;
  stdIncludedInTransaction: boolean;
  longTermDebt: number;
  ltdIncludedInTransaction: boolean;
  otherCurrentLiabilities: number;
  oclIncludedInTransaction: boolean;
  otherLongTermLiabilities: number;
  oltlIncludedInTransaction: boolean;
  totalLiabilities: number;
  shareholdersEquity: number;
  onChange: (field: string, value: number | boolean) => void;
}

export const LiabilityMetricsForm: React.FC<LiabilityMetricsFormProps> = React.memo(({
  accountsPayable,
  apIncludedInTransaction,
  shortTermDebt,
  stdIncludedInTransaction,
  longTermDebt,
  ltdIncludedInTransaction,
  otherCurrentLiabilities,
  oclIncludedInTransaction,
  otherLongTermLiabilities,
  oltlIncludedInTransaction,
  totalLiabilities,
  shareholdersEquity,
  onChange,
}) => {
  const { errors, validateField } = useMetricsValidation('liability');
  
  const handleNumberChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (validateField(field, value)) {
      onChange(field, value);
    }
  }, [onChange, validateField]);
  
  const handleCheckboxChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field, e.target.checked);
  }, [onChange]);
  
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="應付帳款"
          type="number"
          value={accountsPayable}
          onChange={handleNumberChange('accountsPayable')}
          error={!!errors.accountsPayable}
          helperText={errors.accountsPayable || '供應商欠款'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={apIncludedInTransaction}
              onChange={handleCheckboxChange('apIncludedInTransaction')}
            />
          }
          label="由買方承擔"
          disabled
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="短期債務"
          type="number"
          value={shortTermDebt}
          onChange={handleNumberChange('shortTermDebt')}
          error={!!errors.shortTermDebt}
          helperText={errors.shortTermDebt || '一年內到期債務'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={stdIncludedInTransaction}
              onChange={handleCheckboxChange('stdIncludedInTransaction')}
            />
          }
          label="由買方承擔"
          disabled
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="長期債務"
          type="number"
          value={longTermDebt}
          onChange={handleNumberChange('longTermDebt')}
          error={!!errors.longTermDebt}
          helperText={errors.longTermDebt || '一年以上到期債務'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={ltdIncludedInTransaction}
              onChange={handleCheckboxChange('ltdIncludedInTransaction')}
            />
          }
          label="由買方承擔"
          disabled
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="其他流動負債"
          type="number"
          value={otherCurrentLiabilities}
          onChange={handleNumberChange('otherCurrentLiabilities')}
          helperText="其他短期負債"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={oclIncludedInTransaction}
              onChange={handleCheckboxChange('oclIncludedInTransaction')}
            />
          }
          label="由買方承擔"
          disabled
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="其他長期負債"
          type="number"
          value={otherLongTermLiabilities}
          onChange={handleNumberChange('otherLongTermLiabilities')}
          helperText="其他長期負債"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={oltlIncludedInTransaction}
              onChange={handleCheckboxChange('oltlIncludedInTransaction')}
            />
          }
          label="由買方承擔"
          disabled
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="總負債"
          type="number"
          value={totalLiabilities}
          disabled
          helperText="所有負債項目總和"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="股東權益"
          type="number"
          value={shareholdersEquity}
          disabled
          helperText="總資產 - 總負債"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );
});