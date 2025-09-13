/**
 * 交易費用設定區塊
 * Linus 原則：單一職責
 */

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMnaDealDesign, useAppDispatch } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';
import { formatCurrency, parseNumberInput } from '../utils/formatters';

interface TransactionFeeSectionProps {
  enterpriseValue: number;
}

/**
 * 交易費用管理
 * 職責：處理交易費用的設定與分期
 */
export const TransactionFeeSection: React.FC<TransactionFeeSectionProps> = React.memo(({ 
  enterpriseValue 
}) => {
  const dispatch = useAppDispatch();
  const mnaDealDesign = useMnaDealDesign();

  const handleFeePercentageChange = (value: string) => {
    dispatch(updateDealDesign({
      transactionFeePercentage: parseNumberInput(value)
    }));
  };

  const handleAddInstallment = () => {
    const currentInstallments = mnaDealDesign?.transactionFeePaymentSchedule?.installments || [];
    const newInstallment = {
      timing: 'closing' as const,
      percentage: 0,
      year: 0,
    };

    dispatch(updateDealDesign({
      transactionFeePaymentSchedule: {
        paymentMethod: 'installment' as const,
        installments: [...currentInstallments, newInstallment]
      }
    }));
  };

  const handleRemoveInstallment = (index: number) => {
    const currentInstallments = mnaDealDesign?.transactionFeePaymentSchedule?.installments || [];
    const newInstallments = currentInstallments.filter((_, i) => i !== index);
    
    dispatch(updateDealDesign({
      transactionFeePaymentSchedule: {
        paymentMethod: mnaDealDesign?.transactionFeePaymentSchedule?.paymentMethod || 'upfront',
        installments: newInstallments
      }
    }));
  };

  const handleInstallmentChange = (index: number, field: string, value: unknown) => {
    const currentInstallments = [...(mnaDealDesign?.transactionFeePaymentSchedule?.installments || [])];
    currentInstallments[index] = {
      ...currentInstallments[index],
      [field]: field === 'percentage' ? parseNumberInput(value as string) : value
    };

    dispatch(updateDealDesign({
      transactionFeePaymentSchedule: {
        paymentMethod: mnaDealDesign?.transactionFeePaymentSchedule?.paymentMethod || 'installment',
        installments: currentInstallments
      }
    }));
  };

  const totalFee = enterpriseValue * (mnaDealDesign?.transactionFeePercentage || 0) / 100;
  const installments = mnaDealDesign?.transactionFeePaymentSchedule?.installments || [];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        💼 交易費用設定
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="交易費用比例 (%)"
          type="number"
          value={mnaDealDesign?.transactionFeePercentage || 0}
          onChange={(e) => handleFeePercentageChange(e.target.value)}
          inputProps={{ min: 0, max: 10, step: 0.1 }}
          sx={{ width: 200, mr: 2 }}
        />
        <Typography variant="body2" sx={{ mt: 1 }}>
          總費用：{formatCurrency(totalFee)}
        </Typography>
      </Box>

      {totalFee > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">付款排程</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddInstallment}
              size="small"
              sx={{ ml: 2 }}
            >
              新增期數
            </Button>
          </Box>

          {installments.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>期數</TableCell>
                    <TableCell>時間點</TableCell>
                    <TableCell>比例 (%)</TableCell>
                    <TableCell align="right">金額</TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {installments.map((installment, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={installment.timing}
                          onChange={(e) => handleInstallmentChange(index, 'timing', e.target.value)}
                          SelectProps={{ native: true }}
                        >
                          <option value="closing">交割時</option>
                          <option value="year1">第一年</option>
                          <option value="year2">第二年</option>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={installment.percentage}
                          onChange={(e) => handleInstallmentChange(index, 'percentage', e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(totalFee * installment.percentage / 100)}
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
        </>
      )}
    </Box>
  );
});