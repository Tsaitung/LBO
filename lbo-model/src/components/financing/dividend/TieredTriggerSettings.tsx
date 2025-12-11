import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { DividendTier } from '../../../types/financial';
import { DEFAULT_TIERS } from '../../../constants/dividendPolicyDefaults';

interface TieredTriggerSettingsProps {
  tiers: DividendTier[];
  onChange: (tiers: DividendTier[]) => void;
}

const TieredTriggerSettings: React.FC<TieredTriggerSettingsProps> = ({
  tiers,
  onChange,
}) => {
  const handleTierChange = (index: number, field: keyof DividendTier, value: string | number) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      [field]: field === 'name' ? value : Number(value),
    };
    onChange(updatedTiers);
  };

  const getTierColor = (index: number) => {
    const colors = ['success', 'warning', 'error'] as const;
    return colors[index] || 'default';
  };

  const getTierLabel = (index: number) => {
    const labels = ['保守級', '標準級', '積極級'];
    return labels[index] || `層級 ${index + 1}`;
  };

  // 如果沒有 tiers，使用統一預設值初始化
  if (tiers.length === 0) {
    onChange(DEFAULT_TIERS);
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          分級觸發條件
          <Tooltip title="根據公司財務表現設定不同層級的分紅比例">
            <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
          </Tooltip>
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          系統將自動選擇符合條件的最高層級來決定FCFF分配比例
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>層級</TableCell>
                <TableCell>名稱</TableCell>
                <TableCell align="center">
                  EBITDA門檻
                  <Tooltip title="年度EBITDA必須達到的最低金額">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  FCFF門檻
                  <Tooltip title="自由現金流必須達到的最低金額">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  槓桿率上限
                  <Tooltip title="淨債務/EBITDA不得超過的最高倍數">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  FCFF分配比例
                  <Tooltip title="可用於分紅的FCFF百分比">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.map((tier, index) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <Chip
                      label={getTierLabel(index)}
                      color={getTierColor(index)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                      size="small"
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={tier.ebitdaThreshold}
                      onChange={(e) => handleTierChange(index, 'ebitdaThreshold', e.target.value)}
                      size="small"
                      variant="outlined"
                      InputProps={{
                        inputProps: { min: 0, step: 10 },
                        endAdornment: <InputAdornment position="end">M</InputAdornment>,
                      }}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={tier.fcffThreshold}
                      onChange={(e) => handleTierChange(index, 'fcffThreshold', e.target.value)}
                      size="small"
                      variant="outlined"
                      InputProps={{
                        inputProps: { min: 0, step: 5 },
                        endAdornment: <InputAdornment position="end">M</InputAdornment>,
                      }}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={tier.leverageThreshold}
                      onChange={(e) => handleTierChange(index, 'leverageThreshold', e.target.value)}
                      size="small"
                      variant="outlined"
                      InputProps={{
                        inputProps: { min: 0, max: 10, step: 0.5 },
                        endAdornment: <InputAdornment position="end">x</InputAdornment>,
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={tier.payoutRatio}
                      onChange={(e) => handleTierChange(index, 'payoutRatio', e.target.value)}
                      size="small"
                      variant="outlined"
                      InputProps={{
                        inputProps: { min: 0, max: 100, step: 5 },
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
          <Typography variant="body2" color="warning.main">
            <strong>分配邏輯：</strong>
            <br />
            • 系統會從最高層級（積極級）開始檢查，選擇第一個滿足所有條件的層級
            <br />
            • EBITDA和FCFF必須≥門檻值，槓桿率必須≤上限值
            <br />
            • 如果沒有任何層級符合條件，則當年不進行分紅
          </Typography>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            建議設定原則：
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>保守級：</strong>優先償還債務，保留大部分現金（30%分配）
            <br />
            • <strong>標準級：</strong>平衡債務償還與股東回報（50%分配）
            <br />
            • <strong>積極級：</strong>財務狀況優良，最大化股東回報（70%分配）
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TieredTriggerSettings;