/**
 * 虛擬化財務報表組件
 * Linus 原則：大數據表格性能優化
 */

import React, { useMemo } from 'react';
import * as ReactWindow from 'react-window';
import { Box, Paper, Typography } from '@mui/material';
const VariableSizeGrid = (ReactWindow as any).VariableSizeGrid;

interface FinancialData {
  label: string;
  values: number[];
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

interface VirtualizedFinancialTableProps {
  title: string;
  data: FinancialData[];
  years: number[];
  height?: number;
  columnWidth?: number;
  rowHeight?: number;
}

/**
 * 格式化數字
 */
const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

/**
 * 單元格渲染組件
 */
interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: { rows: FinancialData[]; years: number[] };
}

const Cell = React.memo(({ columnIndex, rowIndex, style, data }: CellProps) => {
  const { rows, years } = data;
  
  // 第一列是標籤
  if (columnIndex === 0) {
    const row = rows[rowIndex];
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16 + (row.indent || 0) * 16,
          fontWeight: row.isHeader || row.isTotal ? 'bold' : 'normal',
          backgroundColor: row.isHeader ? '#f5f5f5' : 'transparent',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {row.label}
      </div>
    );
  }
  
  // 年份標題行
  if (rowIndex === 0) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          backgroundColor: '#1976d2',
          color: 'white',
        }}
      >
        Year {years[columnIndex - 1]}
      </div>
    );
  }
  
  // 數據單元格
  const row = rows[rowIndex - 1];
  const value = row.values[columnIndex - 1];
  
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 16,
        fontWeight: row.isTotal ? 'bold' : 'normal',
        backgroundColor: row.isHeader ? '#f5f5f5' : 'transparent',
        borderBottom: '1px solid #e0e0e0',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      {formatNumber(value)}
    </div>
  );
});

/**
 * 虛擬化財務報表
 * 處理大量年份數據的高效渲染
 */
export const VirtualizedFinancialTable: React.FC<VirtualizedFinancialTableProps> = ({
  title,
  data,
  years,
  height = 600,
  columnWidth = 120,
  rowHeight = 40,
}) => {
  // 計算列寬
  const getColumnWidth = (index: number) => {
    return index === 0 ? 200 : columnWidth; // 第一列（標籤）較寬
  };
  
  // 計算行高
  const getRowHeight = (index: number) => {
    return index === 0 ? 50 : rowHeight; // 標題行較高
  };
  
  // Memoize 數據
  const gridData = useMemo(() => ({
    rows: data,
    years: years,
  }), [data, years]);
  
  return (
    <Paper elevation={2} sx={{ mb: 3 }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">{title}</Typography>
      </Box>
      
      <VariableSizeGrid
        columnCount={years.length + 1}
        columnWidth={getColumnWidth}
        height={height}
        rowCount={data.length + 1}
        rowHeight={getRowHeight}
        width={window.innerWidth - 100}
        itemData={gridData}
      >
        {Cell}
      </VariableSizeGrid>
    </Paper>
  );
};

export default VirtualizedFinancialTable;