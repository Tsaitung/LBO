import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Box,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { DebtProtectionCovenants } from '../../../types/financial';

interface DebtProtectionSettingsProps {
  covenants: DebtProtectionCovenants;
  onChange: (covenants: DebtProtectionCovenants) => void;
}

const DebtProtectionSettings: React.FC<DebtProtectionSettingsProps> = ({
  covenants,
  onChange,
}) => {
  const handleChange = (field: keyof DebtProtectionCovenants, subField: 'value' | 'enabled', value: number | boolean) => {
    onChange({
      ...covenants,
      [field]: {
        ...covenants[field],
        [subField]: subField === 'value' ? Number(value) : value,
      },
    });
  };

  const covenantConfigs = [
    {
      field: 'dscr' as const,
      label: '債務服務覆蓋率 (DSCR)',
      tooltip: 'Debt Service Coverage Ratio - EBITDA / (利息 + 本金償還)',
      min: 1.0,
      max: 2.0,
      step: 0.05,
      suffix: 'x',
      defaultValue: 1.25,
    },
    {
      field: 'netLeverage' as const,
      label: '淨槓桿率上限',
      tooltip: 'Net Debt / EBITDA - 總債務減現金除以EBITDA',
      min: 2.0,
      max: 6.0,
      step: 0.5,
      suffix: 'x',
      defaultValue: 4.0,
    },
    {
      field: 'interestCoverage' as const,
      label: '利息覆蓋率下限',
      tooltip: 'EBITDA / Interest Expense - EBITDA除以利息費用',
      min: 2.0,
      max: 5.0,
      step: 0.5,
      suffix: 'x',
      defaultValue: 3.0,
    },
    {
      field: 'minCashMonths' as const,
      label: '最低現金保留',
      tooltip: '必須保留的營運現金月數',
      min: 1,
      max: 6,
      step: 1,
      suffix: '個月',
      defaultValue: 3,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          債務保護條件
          <Tooltip title="設定分紅前必須滿足的財務條件，以保護債權人利益">
            <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
          </Tooltip>
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          所有啟用的條件必須同時滿足才能進行股利分配
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {covenantConfigs.map((config) => (
            <Box 
              key={config.field as string}
              sx={{ 
                width: { xs: '100%', md: 'calc(50% - 12px)' },
                p: 2, 
                border: 1, 
                borderColor: covenants[config.field].enabled ? 'primary.main' : 'divider',
                borderRadius: 1,
                backgroundColor: covenants[config.field].enabled ? 'primary.50' : 'transparent',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={covenants[config.field].enabled}
                    onChange={(e) => handleChange(config.field, 'enabled', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {config.label}
                    <Tooltip title={config.tooltip}>
                      <InfoIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                }
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                type="number"
                value={covenants[config.field].value}
                onChange={(e) => handleChange(config.field, 'value', Number(e.target.value))}
                disabled={!covenants[config.field].enabled}
                size="small"
                InputProps={{
                  inputProps: {
                    min: config.min,
                    max: config.max,
                    step: config.step,
                  },
                  endAdornment: (
                    <InputAdornment position="end">{config.suffix}</InputAdornment>
                  ),
                }}
                helperText={`建議值: ${config.defaultValue}${config.suffix}`}
              />
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography variant="body2" color="info.main">
            <strong>注意：</strong>
            這些條件是為了確保公司在分配股利後仍有足夠的財務彈性來償還債務和維持營運。
            建議根據貸款合約中的財務約定條款來設定這些門檻值。
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DebtProtectionSettings;