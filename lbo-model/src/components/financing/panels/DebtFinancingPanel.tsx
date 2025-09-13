/**
 * 債務融資面板
 * 從 FinancingPlanning 分離出的單一職責組件
 * Linus 原則：組件做一件事且做好
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
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
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useFinancingPlanActions } from '../../../hooks/useFinancingActions';
import { useMnaDeal } from '../../../hooks/typed-hooks';
import { FacilityType, FinancingPlan } from '../../../types/financial';
import { getLoanDescription } from '../../../domain/financing/loanConfig';

/**
 * 債務融資面板組件
 * 專注於債務融資的 CRUD 操作
 */
const DebtFinancingPanel: React.FC = memo(() => {
  const mnaDeal = useMnaDeal();
  const financingPlans = useMemo(() => mnaDeal?.financingPlans || [], [mnaDeal?.financingPlans]);
  const {
    addFinancingPlan,
    updateFinancingPlan,
    deleteFinancingPlan,
    reorderFinancingPlans,
    validatePlan
  } = useFinancingPlanActions();

  // 處理拖拽結束
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(financingPlans);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderFinancingPlans(items);
  }, [financingPlans, reorderFinancingPlans]);

  // 處理欄位更新
  const handleFieldUpdate = useCallback((
    id: string,
    field: keyof FinancingPlan,
    value: FinancingPlan[keyof FinancingPlan]
  ) => {
    updateFinancingPlan(id, { [field]: value });
  }, [updateFinancingPlan]);

  // 處理添加新項目
  const handleAddPlan = useCallback(() => {
    addFinancingPlan('senior');
  }, [addFinancingPlan]);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">債務融資計劃</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={handleAddPlan}
        >
          新增債務
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="debt-financing">
          {(provided) => (
            <TableContainer {...provided.droppableProps} ref={provided.innerRef}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell>名稱</TableCell>
                    <TableCell>類型</TableCell>
                    <TableCell>金額 (仟元)</TableCell>
                    <TableCell>利率 (%)</TableCell>
                    <TableCell>年期</TableCell>
                    <TableCell>還款方式</TableCell>
                    <TableCell>進入時間</TableCell>
                    <TableCell width={60}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {financingPlans.map((plan, index) => (
                    <DebtFinancingRow
                      key={plan.id}
                      plan={plan}
                      index={index}
                      onUpdate={handleFieldUpdate}
                      onDelete={() => deleteFinancingPlan(plan.id)}
                      errors={validatePlan(plan.id)}
                    />
                  ))}
                  {provided.placeholder}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Droppable>
      </DragDropContext>
    </Paper>
  );
});

/**
 * 單行債務融資組件
 * 使用 memo 優化重新渲染
 */
interface DebtFinancingRowProps {
  plan: FinancingPlan;
  index: number;
  onUpdate: (id: string, field: keyof FinancingPlan, value: FinancingPlan[keyof FinancingPlan]) => void;
  onDelete: () => void;
  errors: string[];
}

const DebtFinancingRow: React.FC<DebtFinancingRowProps> = memo(({
  plan,
  index,
  onUpdate,
  onDelete,
  errors
}) => {
  const hasErrors = errors.length > 0;

  return (
    <Draggable draggableId={plan.id} index={index}>
      {(provided, snapshot) => (
        <TableRow
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{
            backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
            borderLeft: hasErrors ? '3px solid' : 'none',
            borderLeftColor: 'error.main'
          }}
        >
          <TableCell {...provided.dragHandleProps}>
            <Typography variant="caption">≡</Typography>
          </TableCell>
          
          <TableCell>
            <TextField
              size="small"
              value={plan.name || ''}
              onChange={(e) => onUpdate(plan.id, 'name', e.target.value)}
              error={hasErrors}
              fullWidth
            />
          </TableCell>

          <TableCell>
            <Select
              size="small"
              value={plan.facilityType || plan.type || 'senior'}
              onChange={(e) => onUpdate(plan.id, 'facilityType', e.target.value)}
              fullWidth
            >
              {(['senior', 'mezzanine', 'revolver', 'termLoanA', 'termLoanB'] as FacilityType[])
                .map(type => (
                  <MenuItem key={type} value={type}>
                    <Box>
                      <Typography variant="body2">{type}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getLoanDescription(type)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </TableCell>

          <TableCell>
            <TextField
              size="small"
              type="number"
              value={plan.amount || ''}
              onChange={(e) => onUpdate(plan.id, 'amount', Number(e.target.value))}
              error={!plan.amount || plan.amount <= 0}
              fullWidth
            />
          </TableCell>

          <TableCell>
            <TextField
              size="small"
              type="number"
              value={plan.interestRate || ''}
              onChange={(e) => onUpdate(plan.id, 'interestRate', Number(e.target.value))}
              error={plan.interestRate === undefined || plan.interestRate < 0}
              fullWidth
            />
          </TableCell>

          <TableCell>
            <TextField
              size="small"
              type="number"
              value={plan.maturity || ''}
              onChange={(e) => onUpdate(plan.id, 'maturity', Number(e.target.value))}
              error={plan.repaymentMethod !== 'revolving' && (!plan.maturity || plan.maturity < 1)}
              disabled={plan.repaymentMethod === 'revolving'}
              fullWidth
            />
          </TableCell>

          <TableCell>
            <Select
              size="small"
              value={plan.repaymentMethod || 'equalPayment'}
              onChange={(e) => onUpdate(plan.id, 'repaymentMethod', e.target.value)}
              fullWidth
            >
              <MenuItem value="equalPayment">本息均攤</MenuItem>
              <MenuItem value="equalPrincipal">本金均攤</MenuItem>
              <MenuItem value="bullet">到期還本</MenuItem>
              <MenuItem value="interestOnly">按期付息</MenuItem>
              <MenuItem value="revolving">循環信貸</MenuItem>
            </Select>
          </TableCell>

          <TableCell>
            <TextField
              size="small"
              type="number"
              value={plan.entryTiming || 0}
              onChange={(e) => onUpdate(plan.id, 'entryTiming', Number(e.target.value))}
              fullWidth
            />
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
      )}
    </Draggable>
  );
});

DebtFinancingPanel.displayName = 'DebtFinancingPanel';
DebtFinancingRow.displayName = 'DebtFinancingRow';

export default DebtFinancingPanel;