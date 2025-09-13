/**
 * 資產選擇區塊
 * Linus 原則：資料驅動，無特殊案例
 */

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
} from '@mui/material';
import { useMnaDealDesign, useBusinessMetrics, useAppDispatch } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';
import { formatCurrency } from '../utils/formatters';

interface AssetSelectionSectionProps {
  selectedAssetValue: number;
}

/**
 * 資產選擇配置
 * 資料驅動的資產列表
 */
const ASSET_CONFIG = [
  {
    key: 'cashAndCashEquivalents' as const,
    label: '現金及約當現金',
    field: 'cashAndCashEquivalents',
  },
  {
    key: 'accountsReceivable' as const,
    label: '應收帳款',
    field: 'accountsReceivable',
  },
  {
    key: 'inventory' as const,
    label: '存貨',
    field: 'inventory',
  },
  {
    key: 'propertyPlantEquipment' as const,
    label: '不動產、廠房及設備',
    field: 'propertyPlantEquipment',
  },
];

/**
 * 資產選擇管理
 * 職責：處理資產項目的選擇
 */
export const AssetSelectionSection: React.FC<AssetSelectionSectionProps> = React.memo(({ 
  selectedAssetValue 
}) => {
  const dispatch = useAppDispatch();
  const mnaDealDesign = useMnaDealDesign();
  const businessMetrics = useBusinessMetrics();

  // 初始化資產選擇
  React.useEffect(() => {
    if (!mnaDealDesign?.assetSelections) {
      dispatch(updateDealDesign({
        assetSelections: {
          cashAndCashEquivalents: true,
          accountsReceivable: false,
          inventory: true,
          propertyPlantEquipment: true,
        }
      }));
    }
  }, [mnaDealDesign?.assetSelections, dispatch]);

  const handleAssetToggle = (assetKey: keyof typeof mnaDealDesign.assetSelections) => {
    if (!mnaDealDesign?.assetSelections) return;

    dispatch(updateDealDesign({
      assetSelections: {
        ...mnaDealDesign.assetSelections,
        [assetKey]: !mnaDealDesign.assetSelections[assetKey]
      }
    }));
  };

  const getAssetValue = (field: string): number => {
    return (businessMetrics as any)?.[field] || 0;
  };

  const isAssetSelected = (assetKey: string): boolean => {
    return mnaDealDesign?.assetSelections?.[assetKey as keyof typeof mnaDealDesign.assetSelections] || false;
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        📊 資產選擇
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>資產項目</TableCell>
              <TableCell align="right">金額</TableCell>
              <TableCell align="center">狀態</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ASSET_CONFIG.map((asset) => {
              const value = getAssetValue(asset.field);
              const selected = isAssetSelected(asset.key);
              
              return (
                <TableRow key={asset.key}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected}
                      onChange={() => handleAssetToggle(asset.key)}
                    />
                  </TableCell>
                  <TableCell>{asset.label}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(value)}
                  </TableCell>
                  <TableCell align="center">
                    {selected ? (
                      <Chip label="已選擇" color="primary" size="small" />
                    ) : (
                      <Chip label="未選擇" variant="outlined" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ bgcolor: 'success.main', p: 2, borderRadius: 1 }}>
        <Typography variant="body2" color="white">
          選定資產總值：{formatCurrency(selectedAssetValue)}
        </Typography>
      </Box>
    </Box>
  );
});