/**
 * Balance Sheet Tab Component
 * Handles balance sheet inputs with transaction inclusion checkboxes
 * Following Linus principle: ONE clear responsibility
 */

import React from 'react';
import { 
  Grid, 
  TextField, 
  Typography, 
  Divider, 
  Box,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

interface BalanceSheetTabProps {
  businessMetrics: BusinessMetricsBeforeAcquisition;
  onInputChange: (field: keyof BusinessMetricsBeforeAcquisition, value: string | boolean) => void;
  formatNumber: (value: number | undefined) => string;
  formatCurrency: (value: number | undefined) => string;
  calculateWorkingCapital: () => number;
}

const BalanceSheetTab: React.FC<BalanceSheetTabProps> = ({
  businessMetrics,
  onInputChange,
  formatNumber,
  formatCurrency,
  calculateWorkingCapital
}) => {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h6" gutterBottom>
          資產負債表 (Balance Sheet)
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      {/* 資產項目 */}
      <Grid size={12}>
        <Typography variant="subtitle1" gutterBottom color="primary">
          資產 (Assets)
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="現金及約當現金"
            value={formatNumber(businessMetrics.cashAndCashEquivalents)}
            onChange={(e) => onInputChange('cashAndCashEquivalents', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.cashIncludedInTransaction}
                onChange={(e) => onInputChange('cashIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="應收帳款"
            value={formatNumber(businessMetrics.accountsReceivable)}
            onChange={(e) => onInputChange('accountsReceivable', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.arIncludedInTransaction}
                onChange={(e) => onInputChange('arIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="存貨"
            value={formatNumber(businessMetrics.inventory)}
            onChange={(e) => onInputChange('inventory', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.inventoryIncludedInTransaction}
                onChange={(e) => onInputChange('inventoryIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="不動產、廠房及設備"
            value={formatNumber(businessMetrics.propertyPlantEquipment)}
            onChange={(e) => onInputChange('propertyPlantEquipment', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.ppeIncludedInTransaction}
                onChange={(e) => onInputChange('ppeIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="總資產"
          value={formatNumber(businessMetrics.totalAssets)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#e3f2fd',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      {/* 負債項目 */}
      <Grid size={12}>
        <Typography variant="subtitle1" gutterBottom color="error">
          負債 (Liabilities)
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="應付帳款"
            value={formatNumber(businessMetrics.accountsPayable)}
            onChange={(e) => onInputChange('accountsPayable', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.apIncludedInTransaction}
                onChange={(e) => onInputChange('apIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="短期借款"
            value={formatNumber(businessMetrics.shortTermDebt)}
            onChange={(e) => onInputChange('shortTermDebt', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.stdIncludedInTransaction}
                onChange={(e) => onInputChange('stdIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="長期借款"
            value={formatNumber(businessMetrics.longTermDebt)}
            onChange={(e) => onInputChange('longTermDebt', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.ltdIncludedInTransaction}
                onChange={(e) => onInputChange('ltdIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="其他流動負債"
            value={formatNumber(businessMetrics.otherCurrentLiabilities)}
            onChange={(e) => onInputChange('otherCurrentLiabilities', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.oclIncludedInTransaction}
                onChange={(e) => onInputChange('oclIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            label="其他長期負債"
            value={formatNumber(businessMetrics.otherLongTermLiabilities)}
            onChange={(e) => onInputChange('otherLongTermLiabilities', e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption">千元</Typography>
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={businessMetrics.oltlIncludedInTransaction}
                onChange={(e) => onInputChange('oltlIncludedInTransaction', e.target.checked)}
                color="primary"
              />
            }
            label="納入交易"
            sx={{ minWidth: 100 }}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="總負債"
          value={formatNumber(businessMetrics.totalLiabilities)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#ffebee',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      {/* 股東權益 */}
      <Grid size={12}>
        <Typography variant="subtitle1" gutterBottom color="success.main">
          股東權益 (Shareholders' Equity)
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="股東權益 (Shareholders' Equity)"
          value={formatNumber(businessMetrics.shareholdersEquity)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`總資產(${formatCurrency(businessMetrics.totalAssets)}) - 總負債(${formatCurrency(businessMetrics.totalLiabilities)}) = ${formatCurrency(businessMetrics.shareholdersEquity)}`}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#e8f5e9',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="營運資本 (Working Capital)"
          value={formatNumber(businessMetrics.workingCapital)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={(() => {
            const currentAssets = businessMetrics.cashAndCashEquivalents + businessMetrics.accountsReceivable + businessMetrics.inventory;
            const currentLiabilities = businessMetrics.accountsPayable + businessMetrics.shortTermDebt + businessMetrics.otherCurrentLiabilities;
            return `流動資產(${formatCurrency(currentAssets)}) - 流動負債(${formatCurrency(currentLiabilities)}) = ${formatCurrency(calculateWorkingCapital())}`;
          })()}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#e8f5e9',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>
    </Grid>
  );
};

export default BalanceSheetTab;