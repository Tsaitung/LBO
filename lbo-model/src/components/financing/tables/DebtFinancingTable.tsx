import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Alert, AlertTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Draggable } from '@hello-pangea/dnd';
import { FinancingPlan } from '../../../types/financial';
import {
  StyledTableContainer,
  StyledHeaderCell,
  StyledTableCell,
  DragHandleCell,
  ActionCell,
  DEBT_COLUMNS,
  FACILITY_TYPE_OPTIONS,
  REPAYMENT_METHOD_OPTIONS,
  REPAYMENT_FREQUENCY_OPTIONS,
  ENTRY_TIMING_TYPE_OPTIONS,
} from './common/TableStyles';

interface DebtFinancingTableProps {
  items: FinancingPlan[];
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}

const DebtFinancingTable: React.FC<DebtFinancingTableProps> = ({
  items,
  onUpdate,
  onDelete,
}) => {
  const debtItems = items.filter(item => 
    ['senior', 'mezzanine', 'revolver', 'termLoanA', 'termLoanB'].includes(item.facilityType || item.type)
  );

  if (debtItems.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography color="textSecondary">
          尚未新增債務融資項目
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        <AlertTitle>債務進入時點與現金/利息邏輯</AlertTitle>
        • 期初（Beginning）：進入當年即為第1還款年，當年計入利息與（若適用）本金償還；融資現金流於當年流入。<br/>
        • 期末（End）：進入當年不計息、不還本，但期末顯示債務餘額且融資現金流於當年流入；隔年開始計息與還本。<br/>
        • 循環信貸（Revolver）：以本金為初始餘額，按年償還率遞減並計息。<br/>
        • 等額本息/等額本金/到期一次/只付息：依設定自動計算。<br/>
        • 提醒：金額{'>'}0、（非循環）年期≥1，且需選定還款方式，才會反映在債務與現金流。
      </Alert>

      <StyledTableContainer>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow>
            {DEBT_COLUMNS.map((column) => (
              <StyledHeaderCell
                key={column.field}
                sx={{ width: column.width }}
              >
                {column.label}
              </StyledHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {debtItems.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided, snapshot) => (
                <TableRow
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  sx={{
                    backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  {/* 拖曳手柄 - 3% */}
                  <DragHandleCell {...provided.dragHandleProps}>
                    <DragIndicatorIcon fontSize="small" />
                  </DragHandleCell>

                  {/* 項目名稱 - 12% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={item.name}
                      onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
                      variant="outlined"
                    />
                  </StyledTableCell>

                  {/* 貸款類型 - 10% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={item.facilityType || item.type}
                      onChange={(e) => onUpdate(item.id, 'facilityType', e.target.value)}
                      variant="outlined"
                    >
                      {FACILITY_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </StyledTableCell>

                  {/* 金額 - 10% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.amount}
                      onChange={(e) => onUpdate(item.id, 'amount', Number(e.target.value))}
                      variant="outlined"
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </StyledTableCell>

                  {/* 進入時間 - 8% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.entryTiming}
                      onChange={(e) => onUpdate(item.id, 'entryTiming', Number(e.target.value))}
                      variant="outlined"
                      InputProps={{ 
                        inputProps: { min: 0, max: 10 },
                        endAdornment: '年'
                      }}
                    />
                  </StyledTableCell>

                  {/* 期初/期末 - 8% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={item.entryTimingType || 'beginning'}
                      onChange={(e) => onUpdate(item.id, 'entryTimingType', e.target.value)}
                      variant="outlined"
                    >
                      {ENTRY_TIMING_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </StyledTableCell>

                  {/* 利率 - 8% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.interestRate}
                      onChange={(e) => onUpdate(item.id, 'interestRate', Number(e.target.value))}
                      variant="outlined"
                      InputProps={{ 
                        inputProps: { min: 0, max: 100, step: 0.1 },
                        endAdornment: '%'
                      }}
                    />
                  </StyledTableCell>

                  {/* 年期 - 8% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.maturity}
                      onChange={(e) => onUpdate(item.id, 'maturity', Number(e.target.value))}
                      variant="outlined"
                      InputProps={{ 
                        inputProps: { min: 1, max: 30 },
                        endAdornment: '年'
                      }}
                    />
                  </StyledTableCell>

                  {/* 還款頻率 - 10% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={item.repaymentFrequency}
                      onChange={(e) => onUpdate(item.id, 'repaymentFrequency', e.target.value)}
                      variant="outlined"
                    >
                      {REPAYMENT_FREQUENCY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </StyledTableCell>

                  {/* 寬限期 - 8% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.gracePeriod}
                      onChange={(e) => onUpdate(item.id, 'gracePeriod', Number(e.target.value))}
                      variant="outlined"
                      InputProps={{ 
                        inputProps: { min: 0, max: 60 },
                        endAdornment: '月'
                      }}
                    />
                  </StyledTableCell>

                  {/* 還款方式 - 12% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={item.repaymentMethod || item.repaymentStructure?.type || 'equalPayment'}
                      onChange={(e) => onUpdate(item.id, 'repaymentMethod', e.target.value)}
                      variant="outlined"
                    >
                      {REPAYMENT_METHOD_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </StyledTableCell>

                  {/* 刪除按鈕 - 3% */}
                  <ActionCell>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(item.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ActionCell>
                </TableRow>
              )}
            </Draggable>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
    </>
  );
};

export default DebtFinancingTable;
