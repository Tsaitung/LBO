/**
 * Sources Table Component
 * Displays funding sources in tabular format
 * Following Linus principle: Single responsibility - render sources
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
  Chip,
} from '@mui/material';
import { 
  SourceCategory, 
  formatCurrency, 
  formatPercentage, 
  getChipColor 
} from '../hooks/useSourcesUsesData';

interface SourcesTableProps {
  sourcesData: SourceCategory[];
  totalSources: number;
}

const SourcesTable: React.FC<SourcesTableProps> = ({ sourcesData, totalSources }) => {
  return (
    <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 calc(50% - 12px)' } }}>
      <Typography variant="h6" gutterBottom color="primary">
        資金來源 (Sources)
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>項目</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>金額</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>占比</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sourcesData.map((category) => (
              <React.Fragment key={category.category}>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                    {category.category}
                  </TableCell>
                </TableRow>
                {category.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ pl: 4 }}>
                      {item.name}
                      {item.type && (
                        <Chip 
                          label={item.type} 
                          size="small" 
                          color={getChipColor(item.type)}
                          sx={{ ml: 1 }}
                        />
                      )}
                      {item.timing && item.timing > 0 && (
                        <Chip 
                          label={`Year ${item.timing}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right">{formatPercentage(item.amount, totalSources)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ pl: 4, fontWeight: 'bold' }}>小計</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(category.subtotal)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatPercentage(category.subtotal, totalSources)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>總計來源</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>
                {formatCurrency(totalSources)}
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

export default SourcesTable;