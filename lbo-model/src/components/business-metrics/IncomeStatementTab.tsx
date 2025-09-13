/**
 * Income Statement Tab Component
 * Handles income statement metrics input following Linus principle: ONE responsibility
 */

import React from 'react';
import { Grid, TextField, Typography, Divider } from '@mui/material';
import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

interface IncomeStatementTabProps {
  businessMetrics: BusinessMetricsBeforeAcquisition;
  taxRate: number;
  onInputChange: (field: keyof BusinessMetricsBeforeAcquisition, value: string | boolean) => void;
  formatNumber: (value: number | undefined) => string;
}

const IncomeStatementTab: React.FC<IncomeStatementTabProps> = ({
  businessMetrics,
  taxRate,
  onInputChange,
  formatNumber
}) => {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h6" gutterBottom>
          損益表指標 (Income Statement Metrics)
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      {/* 第一列：營業收入、銷貨成本、毛利額 */}
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="營業收入 (Revenue)"
          value={formatNumber(businessMetrics.revenue)}
          onChange={(e) => onInputChange('revenue', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText="年度總營收"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="銷貨成本 (COGS)"
          value={formatNumber(businessMetrics.cogs)}
          onChange={(e) => onInputChange('cogs', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`佔營收: ${businessMetrics.revenue > 0 ? ((businessMetrics.cogs / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}%`}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="毛利 (Gross Profit)"
          value={formatNumber(businessMetrics.grossProfit)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`毛利率: ${businessMetrics.grossMargin?.toFixed(1) || 0}%`}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#e8f5e9',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      {/* 第二列：營業費用、EBITDA */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="營業費用 (Operating Expenses)"
          value={formatNumber(businessMetrics.operatingExpenses)}
          onChange={(e) => onInputChange('operatingExpenses', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`佔營收: ${businessMetrics.revenue > 0 ? ((businessMetrics.operatingExpenses / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}%`}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          label="EBITDA"
          value={formatNumber(businessMetrics.ebitda)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`EBITDA Margin: ${businessMetrics.revenue > 0 ? ((businessMetrics.ebitda / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}%`}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      {/* 第三列：折舊攤提、利息費用、所得稅 */}
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="折舊與攤銷 (D&A)"
          value={formatNumber(businessMetrics.depreciationAmortization)}
          onChange={(e) => onInputChange('depreciationAmortization', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`佔營收: ${businessMetrics.revenue > 0 ? ((businessMetrics.depreciationAmortization / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}%`}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="利息費用 (Interest Expense)"
          value={formatNumber(businessMetrics.interestExpense)}
          onChange={(e) => onInputChange('interestExpense', e.target.value)}
          InputProps={{
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`佔營收: ${businessMetrics.revenue > 0 ? ((businessMetrics.interestExpense / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}%`}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          label="所得稅費用 (Tax Expense)"
          value={formatNumber(businessMetrics.taxExpense)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`佔營收: ${businessMetrics.revenue > 0 ? ((businessMetrics.taxExpense / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}% | 有效稅率: ${taxRate}%`}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#fff3e0',
              fontWeight: 'bold' 
            } 
          }}
        />
      </Grid>

      {/* 第四列：淨利 */}
      <Grid size={12}>
        <TextField
          fullWidth
          label="淨利 (Net Income)"
          value={formatNumber(businessMetrics.netIncome)}
          InputProps={{
            readOnly: true,
            endAdornment: <Typography variant="caption">千元</Typography>
          }}
          helperText={`淨利率: ${businessMetrics.revenue > 0 ? ((businessMetrics.netIncome / businessMetrics.revenue) * 100).toFixed(1) : '0.0'}%`}
          sx={{ 
            '& .MuiInputBase-input': { 
              backgroundColor: '#e3f2fd',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            } 
          }}
        />
      </Grid>
    </Grid>
  );
};

export default IncomeStatementTab;