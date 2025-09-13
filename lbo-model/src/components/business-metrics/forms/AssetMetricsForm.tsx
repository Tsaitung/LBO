/**
 * 資產指標表單組件
 * Linus 原則：單一職責，專注資產指標
 */

import React, { useCallback } from 'react';
import { TextField, InputAdornment, FormControlLabel, Checkbox, Grid } from '@mui/material';
import { useMetricsValidation } from '../hooks/useMetricsValidation';

interface AssetMetricsFormProps {
  cashAndCashEquivalents: number;
  cashIncludedInTransaction: boolean;
  accountsReceivable: number;
  arIncludedInTransaction: boolean;
  inventory: number;
  inventoryIncludedInTransaction: boolean;
  propertyPlantEquipment: number;
  ppeIncludedInTransaction: boolean;
  totalAssets: number;
  onChange: (field: string, value: number | boolean) => void;
}

export const AssetMetricsForm: React.FC<AssetMetricsFormProps> = React.memo(({
  cashAndCashEquivalents,
  cashIncludedInTransaction,
  accountsReceivable,
  arIncludedInTransaction,
  inventory,
  inventoryIncludedInTransaction,
  propertyPlantEquipment,
  ppeIncludedInTransaction,
  totalAssets,
  onChange,
}) => {
  const { errors, validateField } = useMetricsValidation('asset');
  
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
          label="現金及約當現金"
          type="number"
          value={cashAndCashEquivalents}
          onChange={handleNumberChange('cashAndCashEquivalents')}
          error={!!errors.cashAndCashEquivalents}
          helperText={errors.cashAndCashEquivalents || '現金、銀行存款等'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={cashIncludedInTransaction}
              onChange={handleCheckboxChange('cashIncludedInTransaction')}
            />
          }
          label="納入交易"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="應收帳款"
          type="number"
          value={accountsReceivable}
          onChange={handleNumberChange('accountsReceivable')}
          error={!!errors.accountsReceivable}
          helperText={errors.accountsReceivable || '客戶欠款'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={arIncludedInTransaction}
              onChange={handleCheckboxChange('arIncludedInTransaction')}
            />
          }
          label="納入交易"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="存貨"
          type="number"
          value={inventory}
          onChange={handleNumberChange('inventory')}
          error={!!errors.inventory}
          helperText={errors.inventory || '商品、原材料等'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={inventoryIncludedInTransaction}
              onChange={handleCheckboxChange('inventoryIncludedInTransaction')}
            />
          }
          label="納入交易"
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="不動產、廠房及設備"
          type="number"
          value={propertyPlantEquipment}
          onChange={handleNumberChange('propertyPlantEquipment')}
          error={!!errors.propertyPlantEquipment}
          helperText={errors.propertyPlantEquipment || '固定資產淨值'}
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={ppeIncludedInTransaction}
              onChange={handleCheckboxChange('ppeIncludedInTransaction')}
            />
          }
          label="納入交易"
        />
      </Grid>
      
      <Grid size={12}>
        <TextField
          fullWidth
          label="總資產"
          type="number"
          value={totalAssets}
          disabled
          helperText="所有資產項目總和"
          InputProps={{
            endAdornment: <InputAdornment position="end">仟元</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );
});