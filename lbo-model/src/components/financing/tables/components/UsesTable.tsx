/**
 * Uses Table Component
 * Displays uses of funds in tabular format
 * Following Linus principle: Single responsibility - render uses
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { SourceCategory, formatCurrency, formatPercentage } from '../hooks/useSourcesUsesData';

interface UsesTableProps {
  usesData: SourceCategory[];
  totalUses: number;
}

const UsesTable: React.FC<UsesTableProps> = ({ usesData, totalUses }) => {
  return (
    <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(50% - 12px)' } }}>
      <Typography variant="h6" gutterBottom color="primary">
        資金使用 (Uses)
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'secondary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>項目</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>金額</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>占比</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usesData.map((category) => (
              <React.Fragment key={category.category}>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                    {category.category}
                  </TableCell>
                </TableRow>
                {category.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ 
                      pl: item.isSubItem ? 6 : 4,
                      fontStyle: item.isSubItem ? 'italic' : 'normal',
                      color: item.isSubItem ? 'text.secondary' : item.highlight ? 'info.main' : 'text.primary',
                      fontWeight: item.highlight ? 'bold' : 'normal'
                    }}>
                      {item.name}
                    </TableCell>
                    <TableCell align="right" sx={{
                      fontStyle: item.isSubItem ? 'italic' : 'normal',
                      color: item.isSubItem ? 'text.secondary' : item.highlight ? 'info.main' : 'text.primary',
                      fontWeight: item.highlight ? 'bold' : 'normal'
                    }}>
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell align="right" sx={{
                      fontStyle: item.isSubItem ? 'italic' : 'normal',
                      color: item.isSubItem ? 'text.secondary' : item.highlight ? 'info.main' : 'text.primary',
                      fontWeight: item.highlight ? 'bold' : 'normal'
                    }}>
                      {item.isSubItem ? '' : formatPercentage(item.amount, totalUses)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ pl: 4, fontWeight: 'bold' }}>小計</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(category.subtotal)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatPercentage(category.subtotal, totalUses)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            <TableRow sx={{ bgcolor: 'secondary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>總計使用</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                {formatCurrency(totalUses)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                100.0%
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsesTable;