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

interface PaymentScheduleSectionProps {
  selectedAssetValue: number;
}

/**
 * 付款時間選項
 */
const TIMING_OPTIONS = [
  { value: 'preClosing', label: '交割前' },
  { value: 'closing', label: '交割時' },
  { value: 'year1', label: '第一年' },
  { value: 'year2', label: '第二年' },
  { value: 'year3', label: '第三年' },
];

/**
 * 付款方式選項
 */
const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: '現金' },
  { value: 'specialSharesBuyback', label: '特別股買回' },
  { value: 'earningsAdjustment', label: '盈餘調整' },
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
                      sx={{ width: 120 }}
                    >
                      {TIMING_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
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
                      sx={{ width: 150 }}
                    >
                      {PAYMENT_METHOD_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
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