/**
 * 交易類型選擇區塊
 * Linus 原則：單一職責，純展示
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
  Alert,
} from '@mui/material';
import { useMnaDealDesign, useAppDispatch } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';

/**
 * 交易類型選擇
 * 職責：處理交易類型的選擇與顯示
 */
export const DealTypeSection: React.FC = React.memo(() => {
  const dispatch = useAppDispatch();
  const mnaDealDesign = useMnaDealDesign();

  const handleDealTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dealType = event.target.value as 'fullAcquisition' | 'assetAcquisition';
    dispatch(updateDealDesign({ dealType }));
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
        併購交易架構設計
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        選擇併購交易類型，系統將根據您的選擇提供相應的交易結構設計選項
      </Alert>

      <FormControl component="fieldset">
        <FormLabel component="legend">交易類型</FormLabel>
        <RadioGroup
          value={mnaDealDesign?.dealType || 'fullAcquisition'}
          onChange={handleDealTypeChange}
          row
        >
          <FormControlLabel
            value="fullAcquisition"
            control={<Radio />}
            label="股權收購 (100%)"
          />
          <FormControlLabel
            value="assetAcquisition"
            control={<Radio />}
            label="資產收購"
          />
        </RadioGroup>
      </FormControl>

      {mnaDealDesign?.dealType === 'assetAcquisition' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          資產收購模式下，您需要選擇要收購的資產項目，並設定付款排程
        </Alert>
      )}
    </Box>
  );
});