/**
 * Virtualized Table Component
 * Efficiently renders large datasets using windowing technique
 * Following Linus principle: Don't render what you can't see
 */

import React, { useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

// Add missing Typography import
import { Typography } from '@mui/material';

interface Column<T = unknown> {
  id: keyof T & string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: T[keyof T]) => string;
}

interface VirtualizedTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  rowHeight?: number;
  visibleRows?: number;
  maxHeight?: number;
  stickyHeader?: boolean;
  onRowClick?: (row: T, index: number) => void;
}

function VirtualizedTable<T = Record<string, unknown>>({
  columns,
  data,
  rowHeight = 52,
  visibleRows = 10,
  maxHeight = 520,
  stickyHeader = true,
  onRowClick,
}: VirtualizedTableProps<T>) {
  // Performance monitoring
  usePerformanceMonitor('VirtualizedTable', 16);

  const [scrollTop, setScrollTop] = React.useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(
      startIndex + visibleRows + 1, // +1 for buffer
      data.length
    );
    return { startIndex, endIndex };
  }, [scrollTop, rowHeight, visibleRows, data.length]);

  // Get visible data
  const visibleData = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [data, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Calculate total height for virtual scrolling
  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.startIndex * rowHeight;

  // Render cell content
  const renderCell = useCallback((column: Column<T>, row: T) => {
    const value = row[column.id];
    if (column.format) {
      return column.format(value);
    }
    return value?.toString() || '';
  }, []);

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          暫無數據
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer 
      component={Paper}
      sx={{ 
        maxHeight,
        position: 'relative',
        overflow: 'auto',
      }}
      onScroll={handleScroll}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <Table
          stickyHeader={stickyHeader}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ width: column.width }}
                  sx={{
                    backgroundColor: 'background.paper',
                    position: stickyHeader ? 'sticky' : 'relative',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleData.map((row, index) => {
              const actualIndex = visibleRange.startIndex + index;
              return (
                <TableRow
                  key={actualIndex}
                  hover
                  onClick={() => onRowClick?.(row, actualIndex)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    height: rowHeight,
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                    >
                      {renderCell(column, row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </TableContainer>
  );
}

export default React.memo(VirtualizedTable) as typeof VirtualizedTable;

// Export a hook for easy data transformation
export const useTableData = <T extends Record<string, unknown>>(
  rawData: T[],
  columns: Column[]
): T[] => {
  return useMemo(() => {
    return rawData.map(row => {
      const transformedRow: Record<string, unknown> = {};
      columns.forEach(column => {
        transformedRow[column.id] = row[column.id];
      });
      return transformedRow as T;
    });
  }, [rawData, columns]);
};