/**
 * 資產交易設定區塊
 * Linus 原則：配置驅動，無特殊邏輯
 */

import React from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  TextField,
  Divider,
} from '@mui/material';
import { useMnaDealDesign, useAppDispatch } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';
import { parseNumberInput } from '../utils/formatters';

/**
 * 解散選項配置
 * 資料驅動的選項定義
 */
const DISSOLUTION_OPTIONS = [
  {
    value: 'liquidate_and_dissolve',
    label: '清算並解散註銷',
    settings: { requireLiquidation: true, requireDissolution: true }
  },
  {
    value: 'dissolve_only',
    label: '僅註銷（無清算）',
    settings: { requireLiquidation: false, requireDissolution: true }
  },
  {
    value: 'no_dissolution',
    label: '不註銷',
    settings: { requireLiquidation: false, requireDissolution: false }
  },
  {
    value: 'custom',
    label: '自訂設定',
    settings: null // 保持現有設定
  }
];

/**
 * 資產交易設定管理
 * 職責：處理清算、解散等設定
 */
export const AssetDealSettingsSection: React.FC = React.memo(() => {
  const dispatch = useAppDispatch();
  const mnaDealDesign = useMnaDealDesign();

  // 初始化設定
  React.useEffect(() => {
    if (!mnaDealDesign?.assetDealSettings) {
      dispatch(updateDealDesign({
        assetDealSettings: {
          dissolutionOption: 'liquidate_and_dissolve',
          requireLiquidation: true,
          liquidationPeriod: 12,
          requireDissolution: true,
          milestonePaymentMethod: 'cash',
          specialSharesDetails: {
            dividendRate: 8,
            conversionRights: false,
            votingRights: false,
            redemptionPeriod: 5,
          },
          paymentSchedule: {
            installments: 3,
            schedule: []
          }
        }
      }));
    }
  }, [mnaDealDesign?.assetDealSettings, dispatch]);

  const handleDissolutionChange = (value: string) => {
    const option = DISSOLUTION_OPTIONS.find(opt => opt.value === value);
    if (!option) return;

    const updates: { 
      dissolutionOption: 'liquidate_and_dissolve' | 'dissolve_only' | 'no_dissolution' | 'custom'; 
      requireLiquidation?: boolean; 
      requireDissolution?: boolean; 
    } = {
      dissolutionOption: value as 'liquidate_and_dissolve' | 'dissolve_only' | 'no_dissolution' | 'custom'
    };

    // 應用預設設定（除了 custom）
    if (option.settings) {
      Object.assign(updates, option.settings);
    }

    dispatch(updateDealDesign({
      assetDealSettings: {
        ...mnaDealDesign?.assetDealSettings,
        ...updates
      }
    }));
  };

  const handleLiquidationPeriodChange = (value: string) => {
    dispatch(updateDealDesign({
      assetDealSettings: {
        ...mnaDealDesign?.assetDealSettings,
        liquidationPeriod: parseNumberInput(value)
      }
    }));
  };

  const handlePaymentMethodChange = (value: string) => {
    dispatch(updateDealDesign({
      assetDealSettings: {
        ...mnaDealDesign?.assetDealSettings!,
        milestonePaymentMethod: value as 'cash' | 'specialSharesBuyback'
      }
    }));
  };

  const settings = mnaDealDesign?.assetDealSettings;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        ⚙️ 資產交易設定
      </Typography>

      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">目標公司處理方式</FormLabel>
        <RadioGroup
          value={settings?.dissolutionOption || 'liquidate_and_dissolve'}
          onChange={(e) => handleDissolutionChange(e.target.value)}
        >
          {DISSOLUTION_OPTIONS.map(option => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {settings?.requireLiquidation && (
        <Box sx={{ mb: 3 }}>
          <TextField
            label="清算期間（月）"
            type="number"
            value={settings?.liquidationPeriod || 12}
            onChange={(e) => handleLiquidationPeriodChange(e.target.value)}
            inputProps={{ min: 1, max: 36 }}
            sx={{ width: 200 }}
          />
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <FormControl component="fieldset">
        <FormLabel component="legend">里程碑付款方式</FormLabel>
        <RadioGroup
          value={settings?.milestonePaymentMethod || 'cash'}
          onChange={(e) => handlePaymentMethodChange(e.target.value)}
          row
        >
          <FormControlLabel
            value="cash"
            control={<Radio />}
            label="現金"
          />
          <FormControlLabel
            value="specialSharesBuyback"
            control={<Radio />}
            label="特別股買回"
          />
        </RadioGroup>
      </FormControl>

      {settings?.milestonePaymentMethod === 'specialSharesBuyback' && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            特別股設定
          </Typography>
          <TextField
            label="股息率 (%)"
            type="number"
            value={settings?.specialSharesDetails?.dividendRate || 8}
            size="small"
            sx={{ width: 150 }}
            inputProps={{ min: 0, max: 20 }}
          />
        </Box>
      )}
    </Box>
  );
});