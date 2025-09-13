/**
 * Dividend Distribution Tab Component
 * Displays dividend and redemption plan
 * Following Linus principle: Display logic ONLY
 */

import React from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ProFormaDataItem } from '../hooks/useProFormaData';

interface DividendDistributionTabProps {
  proFormaData: ProFormaDataItem[];
}

const DividendDistributionTab: React.FC<DividendDistributionTabProps> = React.memo(({ 
  proFormaData 
}) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        股利分配與贖回計劃 (單位: 百萬元)
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>項目</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.year === 0 ? 'Year 0' : `Year ${d.year}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>FCFF (自由現金流)</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">{d.fcff}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>特別股贖回</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.preferredRedemption || '0.0'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>優先股股息</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.acquirerPreferredDividend}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>普通股股利</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right">
                  {d.commonDividend}
                </TableCell>
              ))}
            </TableRow>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>總分配金額</TableCell>
              {proFormaData.map((d) => (
                <TableCell key={d.year} align="right" sx={{ fontWeight: 'bold' }}>
                  {d.totalDistribution}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
});

DividendDistributionTab.displayName = 'DividendDistributionTab';

export default DividendDistributionTab;