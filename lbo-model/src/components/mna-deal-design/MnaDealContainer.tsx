/**
 * M&A Deal Design Container
 * Linus 原則：純協調，無業務邏輯
 * 檔案大小：<100 行
 */

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Domain sections
import { DealTypeSection } from './sections/DealTypeSection';
import { ValuationSection } from './sections/ValuationSection';
import { TransactionFeeSection } from './sections/TransactionFeeSection';
import { AssetSelectionSection } from './sections/AssetSelectionSection';
import { AssetDealSettingsSection } from './sections/AssetDealSettingsSection';
import { MilestoneSection } from './sections/MilestoneSection';
import { PaymentScheduleSection } from './sections/PaymentScheduleSection';

// Hooks
import { useMnaDealDesign } from '../../hooks/typed-hooks';
import { useMnaDealCalculations } from './hooks/useMnaDealCalculations';
import { useMnaDealValidation } from './hooks/useMnaDealValidation';

// Common components
import ActionButtons from '../ActionButtons';

/**
 * 主容器組件
 * 職責：協調各個區塊的顯示
 */
const MnaDealContainer: React.FC = () => {
  const navigate = useNavigate();
  const mnaDealDesign = useMnaDealDesign();
  const { enterpriseValue, selectedAssetValue } = useMnaDealCalculations();
  const { validateAll } = useMnaDealValidation();

  // 防禦性檢查
  if (!mnaDealDesign) {
    return null;
  }

  const handleProceed = () => {
    if (validateAll()) {
      navigate('/financing-planning');
    }
  };

  const isAssetDeal = mnaDealDesign.dealType === 'assetAcquisition';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        📈 M&A 交易設計
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {/* 交易類型選擇 */}
        <DealTypeSection />

        {/* 企業價值顯示 */}
        <ValuationSection enterpriseValue={enterpriseValue} />

        {/* 交易費用設定 */}
        <TransactionFeeSection enterpriseValue={enterpriseValue} />

        {/* 資產收購特定區塊 */}
        {isAssetDeal && (
          <>
            <AssetSelectionSection 
              selectedAssetValue={selectedAssetValue} 
            />
            <AssetDealSettingsSection />
            <PaymentScheduleSection 
              selectedAssetValue={selectedAssetValue}
            />
          </>
        )}

        {/* 里程碑設定 */}
        <MilestoneSection />
      </Paper>

      {/* 導航按鈕 */}
      <ActionButtons
        title="M&A 交易設計完成"
        onProceed={handleProceed}
        nextStepLabel="設計融資規劃"
      />
    </Box>
  );
};

export default MnaDealContainer;