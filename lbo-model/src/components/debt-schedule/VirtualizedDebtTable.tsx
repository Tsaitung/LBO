/**
 * 虛擬化債務表格組件
 * Linus 原則：性能優化，減少 DOM 節點
 */

import React, { useMemo } from 'react';
import * as ReactWindow from 'react-window';
import {
  Box,
  Paper,
} from '@mui/material';
const FixedSizeList = (ReactWindow as any).FixedSizeList;

interface DebtRowData {
  year: number;
  beginningBalance: number;
  interestExpense: number;
  principalRepayment: number;
  endingBalance: number;
  isTotal?: boolean;
}

interface VirtualizedDebtTableProps {
  data: DebtRowData[];
  height?: number;
  rowHeight?: number;
}

/**
 * 格式化貨幣
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value * 1000);
};

/**
 * 虛擬化行渲染
 */
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: DebtRowData[];
}

const Row = React.memo(({ index, style, data }: RowProps) => {
  const item = data[index];
  const isTotal = item.isTotal;
  
  return (
    <div style={style}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: isTotal ? '2px solid' : '1px solid #e0e0e0',
          bgcolor: isTotal ? 'grey.100' : 'transparent',
          fontWeight: isTotal ? 'bold' : 'normal',
        }}
      >
        <Box sx={{ flex: '0 0 100px', p: 2 }}>
          {isTotal ? '總計' : `Year ${item.year}`}
        </Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>
          {formatCurrency(item.beginningBalance)}
        </Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>
          {formatCurrency(item.interestExpense)}
        </Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>
          {formatCurrency(item.principalRepayment)}
        </Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>
          {formatCurrency(item.endingBalance)}
        </Box>
      </Box>
    </div>
  );
});

/**
 * 虛擬化債務表格
 * 使用 react-window 減少大量數據的渲染負擔
 */
export const VirtualizedDebtTable: React.FC<VirtualizedDebtTableProps> = ({
  data,
  height = 600,
  rowHeight = 50,
}) => {
  // Memoize 數據處理
  const processedData = useMemo(() => data, [data]);

  return (
    <Paper elevation={2} sx={{ overflow: 'hidden' }}>
      {/* 表頭 */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        <Box sx={{ flex: '0 0 100px', p: 2 }}>年度</Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>期初餘額</Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>利息費用</Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>本金償還</Box>
        <Box sx={{ flex: 1, p: 2, textAlign: 'right' }}>期末餘額</Box>
      </Box>

      {/* 虛擬化列表 */}
      <FixedSizeList
        height={height}
        itemCount={processedData.length}
        itemSize={rowHeight}
        width="100%"
        itemData={processedData}
      >
        {Row}
      </FixedSizeList>
    </Paper>
  );
};

export default VirtualizedDebtTable;