/**
 * 付款排程區塊
 * Linus 原則：表格驅動，無條件分支
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
  TextField,
  Button,
  IconButton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMnaDealDesign, useAppDispatch } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';
import { formatCurrency, parseNumberInput } from '../utils/formatters';
import { useMnaDealCalculations } from '../hooks/useMnaDealCalculations';
import { SchedulePaymentMethod, SchedulePaymentTiming } from '../../../types/financial';

interface PaymentScheduleSectionProps {
  selectedAssetValue: number;
}

/**
 * 付款時間選項 - 擴充更多 M&A 交易常見時點
 */
const TIMING_OPTIONS: Array<{ value: SchedulePaymentTiming; label: string; description?: string }> = [
  { value: 'preClosing', label: '交割前', description: '簽約至交割期間支付（如：訂金、保證金）' },
  { value: 'closing', label: '交割時', description: '交割完成時立即支付' },
  { value: 'postClosing', label: '交割後', description: '交割後特定期間內支付（如：30天內）' },
  { value: 'year1', label: '第一年', description: '交割後第一年支付' },
  { value: 'year2', label: '第二年', description: '交割後第二年支付' },
  { value: 'year3', label: '第三年', description: '交割後第三年支付' },
  { value: 'year4', label: '第四年', description: '交割後第四年支付' },
  { value: 'year5', label: '第五年', description: '交割後第五年支付' },
  { value: 'milestone', label: '里程碑達成時', description: '特定業績或條件達成時支付' },
];

/**
 * 付款方式選項 - 擴充更多 M&A 交易常見付款機制
 */
const PAYMENT_METHOD_OPTIONS: Array<{ value: SchedulePaymentMethod; label: string; description?: string }> = [
  { value: 'cash', label: '現金', description: '直接現金支付' },
  { value: 'specialSharesBuyback', label: '特別股買回', description: '以發行特別股方式支付，約定期限買回' },
  { value: 'earningsAdjustment', label: '盈餘調整 (Earnout)', description: '依未來業績達成情況調整支付金額' },
  { value: 'sellerNote', label: '賣方融資票據', description: '買方向賣方開立票據，分期償還' },
  { value: 'escrow', label: '第三方託管', description: '資金託管於第三方，待條件達成後釋放' },
  { value: 'stockSwap', label: '股權交換', description: '以買方股權支付部分對價' },
  { value: 'assetSwap', label: '資產交換', description: '以資產交換方式支付' },
  { value: 'contingentPayment', label: '或有對價', description: '依特定條件決定是否支付' },
  { value: 'deferred', label: '遞延付款', description: '約定未來特定時間支付' },
];

/**
 * 付款排程管理
 * 職責：處理分期付款設定
 */
export const PaymentScheduleSection: React.FC<PaymentScheduleSectionProps> = React.memo(({ 
  selectedAssetValue 
}) => {
  const dispatch = useAppDispatch();
  const mnaDealDesign = useMnaDealDesign();
  const { paymentScheduleTotalPercentage } = useMnaDealCalculations();

  const schedule = mnaDealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];

  const handleAddInstallment = () => {
    const newInstallment = {
      period: schedule.length + 1,
      percentage: 0,
      timing: 'year1' as const,
      timingDetail: 'end' as const,
      paymentMethod: 'cash' as const,
    };

    dispatch(updateDealDesign({
      assetDealSettings: {
        ...mnaDealDesign?.assetDealSettings,
        paymentSchedule: {
          ...mnaDealDesign?.assetDealSettings?.paymentSchedule,
          installments: schedule.length + 1,
          schedule: [...schedule, newInstallment]
        }
      }
    }));
  };

  const handleRemoveInstallment = (index: number) => {
    const newSchedule = schedule.filter((_, i) => i !== index);
    
    dispatch(updateDealDesign({
      assetDealSettings: {
        ...mnaDealDesign?.assetDealSettings,
        paymentSchedule: {
          ...mnaDealDesign?.assetDealSettings?.paymentSchedule,
          installments: newSchedule.length,
          schedule: newSchedule.map((item, i) => ({ ...item, period: i + 1 }))
        }
      }
    }));
  };

  const handleScheduleChange = (index: number, field: string, value: unknown) => {
    const newSchedule = [...schedule];
    newSchedule[index] = {
      ...newSchedule[index],
      [field]: field === 'percentage' ? parseNumberInput(value as string) : value
    };

    dispatch(updateDealDesign({
      assetDealSettings: {
        ...mnaDealDesign?.assetDealSettings,
        paymentSchedule: {
          ...mnaDealDesign?.assetDealSettings?.paymentSchedule,
          schedule: newSchedule
        }
      }
    }));
  };

  const calculateAmount = (percentage: number) => {
    return selectedAssetValue * percentage / 100;
  };

  const isValidTotal = paymentScheduleTotalPercentage === 100 || paymentScheduleTotalPercentage === 0;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        💳 付款排程
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          總計：{paymentScheduleTotalPercentage}%
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddInstallment}
          size="small"
          disabled={schedule.length >= 10}
        >
          新增期數
        </Button>
      </Box>

      {!isValidTotal && paymentScheduleTotalPercentage > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          付款比例總和必須為 100%，目前為 {paymentScheduleTotalPercentage}%
        </Alert>
      )}

      {schedule.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>期數</TableCell>
                <TableCell>付款時間</TableCell>
                <TableCell>時點</TableCell>
                <TableCell>比例 (%)</TableCell>
                <TableCell>付款方式</TableCell>
                <TableCell align="right">金額</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.period}</TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={item.timing}
                      onChange={(e) => handleScheduleChange(index, 'timing', e.target.value)}
                      SelectProps={{ native: true }}
                      sx={{ width: 140 }}
                    >
                      {TIMING_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} title={opt.description}>
                          {opt.label}
                        </option>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={item.timingDetail}
                      onChange={(e) => handleScheduleChange(index, 'timingDetail', e.target.value)}
                      SelectProps={{ native: true }}
                      sx={{ width: 100 }}
                    >
                      <option value="beginning">期初</option>
                      <option value="end">期末</option>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={item.percentage}
                      onChange={(e) => handleScheduleChange(index, 'percentage', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={item.paymentMethod}
                      onChange={(e) => handleScheduleChange(index, 'paymentMethod', e.target.value)}
                      SelectProps={{ native: true }}
                      sx={{ width: 180 }}
                    >
                      {PAYMENT_METHOD_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} title={opt.description}>
                          {opt.label}
                        </option>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(calculateAmount(item.percentage))}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveInstallment(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
});