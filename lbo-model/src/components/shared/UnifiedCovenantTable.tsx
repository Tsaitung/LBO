/**
 * 統一的契約指標表格組件
 * 遵循 Linus 原則：消除重複，單一組件服務多個用途
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import { CovenantMetrics } from '../../hooks/useCovenantMetrics';
import { DebtProtectionCovenants } from '../../types/financial';

interface UnifiedCovenantTableProps {
  metricsData: CovenantMetrics[];
  covenants: DebtProtectionCovenants;
  showDividendColumns?: boolean;
  title?: string;
  compact?: boolean;
}

const UnifiedCovenantTable: React.FC<UnifiedCovenantTableProps> = ({ 
  metricsData, 
  covenants, 
  showDividendColumns = false,
  title,
  compact = false
}) => {
  const getStatusIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircleIcon color="success" fontSize="small" />
    ) : (
      <CancelIcon color="error" fontSize="small" />
    );
  };

  const getComplianceChip = (allCompliant: boolean) => {
    return (
      <Chip
        label={allCompliant ? '合規' : '違約'}
        color={allCompliant ? 'success' : 'error'}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  // 判斷是否接近門檻（警告）
  const isWarning = (value: number, threshold: number, operator: 'gte' | 'lte') => {
    const margin = 0.1; // 10% 緩衝區
    if (operator === 'gte') {
      return value < threshold * (1 + margin) && value >= threshold;
    } else {
      return value > threshold * (1 - margin) && value <= threshold;
    }
  };

  const parseMetricValue = (value: string): number => {
    const cleanValue = value.replace(/[x%>]/g, '');
    return parseFloat(cleanValue) || 0;
  };

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table size={compact ? "small" : "medium"}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>年度</TableCell>
              
              {/* 基礎財務數據 */}
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>EBITDA</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>FCFF</TableCell>
              
              {/* 契約指標 */}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                <Box>
                  DSCR
                  {covenants.dscr.enabled && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      ≥{covenants.dscr.value}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                <Box>
                  淨槓桿率
                  {covenants.netLeverage.enabled && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      ≤{covenants.netLeverage.value}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                <Box>
                  利息覆蓋率
                  {covenants.interestCoverage.enabled && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      ≥{covenants.interestCoverage.value}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                <Box>
                  現金月數
                  {covenants.minCashMonths.enabled && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      ≥{covenants.minCashMonths.value}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              {/* 債務和現金狀況 */}
              {!compact && (
                <>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>債務餘額</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>現金餘額</TableCell>
                </>
              )}
              
              {/* 合規狀態 */}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>合規狀態</TableCell>
              
              {/* 股利分配列（可選） */}
              {showDividendColumns && (
                <>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>可分配現金</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>佔FCFF%</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>佔EBITDA%</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {metricsData.map((row) => {
              const dscrValue = parseMetricValue(row.dscr);
              const leverageValue = parseMetricValue(row.netLeverage);
              const coverageValue = parseMetricValue(row.interestCoverage);
              const cashMonthsValue = parseMetricValue(row.cashMonths);
              
              const dscrWarning = isWarning(dscrValue, covenants.dscr.value, 'gte');
              const leverageWarning = isWarning(leverageValue, covenants.netLeverage.value, 'lte');
              const coverageWarning = isWarning(coverageValue, covenants.interestCoverage.value, 'gte');
              const cashWarning = isWarning(cashMonthsValue, covenants.minCashMonths.value, 'gte');
              
              return (
                <TableRow 
                  key={row.year} 
                  sx={{ 
                    bgcolor: row.allCompliant ? 'inherit' : 'error.50',
                    '&:hover': { bgcolor: row.allCompliant ? 'grey.50' : 'error.100' }
                  }}
                >
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Year {row.year}
                  </TableCell>
                  
                  {/* 基礎財務數據 */}
                  <TableCell align="right">{row.revenue}M</TableCell>
                  <TableCell align="right">{row.ebitda}M</TableCell>
                  <TableCell align="right">{row.fcff}M</TableCell>
                  
                  {/* DSCR */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: row.dscrCompliant ? 'normal' : 'bold',
                          color: row.dscrCompliant ? 'text.primary' : 'error.main'
                        }}
                      >
                        {row.dscr}
                      </Typography>
                      {covenants.dscr.enabled && (
                        dscrWarning ? <WarningIcon color="warning" fontSize="small" /> : getStatusIcon(row.dscrCompliant)
                      )}
                    </Box>
                  </TableCell>
                  
                  {/* 淨槓桿率 */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: row.leverageCompliant ? 'normal' : 'bold',
                          color: row.leverageCompliant ? 'text.primary' : 'error.main'
                        }}
                      >
                        {row.netLeverage}
                      </Typography>
                      {covenants.netLeverage.enabled && (
                        leverageWarning ? <WarningIcon color="warning" fontSize="small" /> : getStatusIcon(row.leverageCompliant)
                      )}
                    </Box>
                  </TableCell>
                  
                  {/* 利息覆蓋率 */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: row.coverageCompliant ? 'normal' : 'bold',
                          color: row.coverageCompliant ? 'text.primary' : 'error.main'
                        }}
                      >
                        {row.interestCoverage}
                      </Typography>
                      {covenants.interestCoverage.enabled && (
                        coverageWarning ? <WarningIcon color="warning" fontSize="small" /> : getStatusIcon(row.coverageCompliant)
                      )}
                    </Box>
                  </TableCell>
                  
                  {/* 現金月數 */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: row.cashCompliant ? 'normal' : 'bold',
                          color: row.cashCompliant ? 'text.primary' : 'error.main'
                        }}
                      >
                        {row.cashMonths}
                      </Typography>
                      {covenants.minCashMonths.enabled && (
                        cashWarning ? <WarningIcon color="warning" fontSize="small" /> : getStatusIcon(row.cashCompliant)
                      )}
                    </Box>
                  </TableCell>
                  
                  {/* 債務和現金狀況 */}
                  {!compact && (
                    <>
                      <TableCell align="center">{row.outstandingDebt}M</TableCell>
                      <TableCell align="center">{row.cashBalance}M</TableCell>
                    </>
                  )}
                  
                  {/* 合規狀態 */}
                  <TableCell align="center">
                    {getComplianceChip(row.allCompliant)}
                  </TableCell>
                  
                  {/* 股利分配列 */}
                  {showDividendColumns && (
                    <>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: row.allCompliant ? 'success.main' : 'text.disabled'
                          }}
                        >
                          {row.distributableCash || '0.0M'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2"
                          color={row.allCompliant ? 'text.primary' : 'text.disabled'}
                        >
                          {row.distributableRatioToFCFF || '0.0%'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2"
                          color={row.allCompliant ? 'text.primary' : 'text.disabled'}
                        >
                          {row.distributableRatioToEBITDA || '0.0%'}
                        </Typography>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* 圖例說明 */}
      {!compact && (
        <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon color="success" fontSize="small" />
            <Typography variant="caption">符合門檻</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningIcon color="warning" fontSize="small" />
            <Typography variant="caption">接近門檻</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CancelIcon color="error" fontSize="small" />
            <Typography variant="caption">違反門檻</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UnifiedCovenantTable;