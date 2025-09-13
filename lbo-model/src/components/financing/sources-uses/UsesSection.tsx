/**
 * 資金使用顯示組件
 * Linus 原則：純展示，無邏輯分支
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
  Tooltip,
} from '@mui/material';
import { UseItem } from './hooks/useSourcesUsesCalculations';

interface UsesSectionProps {
  data: UseItem[];
  total: number;
}

/**
 * 格式化貨幣
 */
const formatCurrency = (value: number): string => {
  return `${value.toFixed(1)}M`;
};

/**
 * 格式化百分比
 */
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * 資金使用展示
 * 職責：展示資金用途明細
 */
export const UsesSection: React.FC<UsesSectionProps> = React.memo(({ 
  data, 
  total 
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
        💸 資金使用 (Uses)
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              <TableCell align="right">金額</TableCell>
              <TableCell align="right">佔比</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {item.note ? (
                    <Tooltip title={item.note} arrow>
                      <span style={{ cursor: 'help' }}>
                        {item.name} ℹ️
                      </span>
                    </Tooltip>
                  ) : (
                    item.name
                  )}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell align="right">
                  {formatPercentage(item.percentage || 0)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'error.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                總計
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                {formatCurrency(total)}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                100.0%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});