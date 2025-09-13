/**
 * 股權融資面板
 * 從 FinancingPlanning 分離出的單一職責組件
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useEquityInjectionActions } from '../../../hooks/useFinancingActions';
import { useMnaDeal } from '../../../hooks/typed-hooks';
import { EquityInjection, EquityType } from '../../../types/financial';

/**
 * 股權融資面板組件
 */
const EquityFinancingPanel: React.FC = memo(() => {
  const mnaDeal = useMnaDeal();
  const equityInjections = useMemo(() => mnaDeal?.equityInjections || [], [mnaDeal?.equityInjections]);
  const {
    addEquityInjection,
    updateEquityInjection,
    deleteEquityInjection,
    validateInjection
  } = useEquityInjectionActions();

  // 處理添加新項目
  const handleAddInjection = useCallback(() => {
    addEquityInjection('common');
  }, [addEquityInjection]);

  // 處理欄位更新
  const handleFieldUpdate = useCallback((
    id: string,
    field: keyof EquityInjection,
    value: EquityInjection[keyof EquityInjection]
  ) => {
    updateEquityInjection(id, { [field]: value });
  }, [updateEquityInjection]);

  // 處理特殊條款更新
  const handleSpecialTermsUpdate = useCallback((
    id: string,
    field: string,
    value: unknown
  ) => {
    const injection = equityInjections.find(i => i.id === id);
    if (injection) {
      updateEquityInjection(id, {
        specialTerms: {
          ...injection.specialTerms,
          [field]: value
        }
      });
    }
  }, [equityInjections, updateEquityInjection]);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">股權注入計劃</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={handleAddInjection}
        >
          新增股權
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>名稱</TableCell>
              <TableCell>類型</TableCell>
              <TableCell>金額 (仟元)</TableCell>
              <TableCell>股權比例 (%)</TableCell>
              <TableCell>進入時間</TableCell>
              <TableCell>優先股設定</TableCell>
              <TableCell width={60}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equityInjections.map((injection) => (
              <EquityInjectionRow
                key={injection.id}
                injection={injection}
                onUpdate={handleFieldUpdate}
                onUpdateSpecialTerms={handleSpecialTermsUpdate}
                onDelete={() => deleteEquityInjection(injection.id)}
                errors={validateInjection(injection.id)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

/**
 * 單行股權注入組件
 */
interface EquityInjectionRowProps {
  injection: EquityInjection;
  onUpdate: (id: string, field: keyof EquityInjection, value: EquityInjection[keyof EquityInjection]) => void;
  onUpdateSpecialTerms: (id: string, field: string, value: unknown) => void;
  onDelete: () => void;
  errors: string[];
}

const EquityInjectionRow: React.FC<EquityInjectionRowProps> = memo(({
  injection,
  onUpdate,
  onUpdateSpecialTerms,
  onDelete,
  errors
}) => {
  const hasErrors = errors.length > 0;
  const isPreferred = injection.type === 'preferred';

  return (
    <TableRow
      sx={{
        borderLeft: hasErrors ? '3px solid' : 'none',
        borderLeftColor: 'error.main'
      }}
    >
      <TableCell>
        <TextField
          size="small"
          value={injection.name || ''}
          onChange={(e) => onUpdate(injection.id, 'name', e.target.value)}
          error={hasErrors}
          fullWidth
        />
      </TableCell>

      <TableCell>
        <Select
          size="small"
          value={injection.type || 'common'}
          onChange={(e) => onUpdate(injection.id, 'type', e.target.value as EquityType)}
          fullWidth
        >
          <MenuItem value="common">普通股</MenuItem>
          <MenuItem value="preferred">優先股</MenuItem>
          <MenuItem value="classA">A類股</MenuItem>
          <MenuItem value="classB">B類股</MenuItem>
        </Select>
      </TableCell>

      <TableCell>
        <TextField
          size="small"
          type="number"
          value={injection.amount || ''}
          onChange={(e) => onUpdate(injection.id, 'amount', Number(e.target.value))}
          error={!injection.amount || injection.amount <= 0}
          fullWidth
        />
      </TableCell>

      <TableCell>
        <TextField
          size="small"
          type="number"
          value={injection.ownershipPercentage || ''}
          onChange={(e) => onUpdate(injection.id, 'ownershipPercentage', Number(e.target.value))}
          error={injection.ownershipPercentage < 0 || injection.ownershipPercentage > 100}
          fullWidth
        />
      </TableCell>

      <TableCell>
        <TextField
          size="small"
          type="number"
          value={injection.entryTiming || 0}
          onChange={(e) => onUpdate(injection.id, 'entryTiming', Number(e.target.value))}
          fullWidth
        />
      </TableCell>

      <TableCell>
        {isPreferred && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <TextField
              size="small"
              type="number"
              label="股息率 (%)"
              value={injection.dividendRate || ''}
              onChange={(e) => onUpdate(injection.id, 'dividendRate', Number(e.target.value))}
              error={isPreferred && !injection.dividendRate}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={injection.specialTerms?.dividendDistributionEnabled || false}
                  onChange={(e) => onUpdateSpecialTerms(
                    injection.id,
                    'dividendDistributionEnabled',
                    e.target.checked
                  )}
                />
              }
              label="啟用股利分發"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={injection.specialTerms?.conversionRights || false}
                  onChange={(e) => onUpdateSpecialTerms(
                    injection.id,
                    'conversionRights',
                    e.target.checked
                  )}
                />
              }
              label="可轉換"
            />
          </Box>
        )}
      </TableCell>

      <TableCell>
        <IconButton
          size="small"
          onClick={onDelete}
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

EquityFinancingPanel.displayName = 'EquityFinancingPanel';
EquityInjectionRow.displayName = 'EquityInjectionRow';

export default EquityFinancingPanel;