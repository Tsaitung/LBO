/**
 * 資金來源顯示組件
 * Linus 原則：純展示，單一職責
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
  Chip,
} from '@mui/material';
import { SourceCategory } from './hooks/useSourcesUsesCalculations';

interface SourcesSectionProps {
  data: SourceCategory[];
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
 * 資金來源展示
 * 職責：展示債務和股權融資明細
 */
export const SourcesSection: React.FC<SourcesSectionProps> = React.memo(({ 
  data, 
  total 
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
        💰 資金來源 (Sources)
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
            {data.map((category, catIndex) => (
              <React.Fragment key={catIndex}>
                <TableRow>
                  <TableCell colSpan={3} sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                    {category.category}
                  </TableCell>
                </TableRow>
                {category.items.map((item, itemIndex) => (
                  <TableRow key={`${catIndex}-${itemIndex}`}>
                    <TableCell sx={{ pl: 4 }}>
                      {item.name}
                      {item.type && (
                        <Chip 
                          label={item.type} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
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
                <TableRow>
                  <TableCell sx={{ pl: 4, fontWeight: 'bold' }}>
                    小計
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(category.subtotal)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatPercentage((category.subtotal / total) * 100)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            <TableRow sx={{ bgcolor: 'primary.main' }}>
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