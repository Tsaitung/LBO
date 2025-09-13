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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Draggable } from '@hello-pangea/dnd';
import { EquityInjection } from '../../../types/financial';
import {
  StyledTableContainer,
  StyledHeaderCell,
  StyledTableCell,
  DragHandleCell,
  ActionCell,
  EQUITY_COLUMNS,
  EQUITY_TYPE_OPTIONS,
  ENTRY_TIMING_TYPE_OPTIONS,
} from './common/TableStyles';

interface EquityFinancingTableProps {
  items: EquityInjection[];
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}

const EquityFinancingTable: React.FC<EquityFinancingTableProps> = ({
  items,
  onUpdate,
  onDelete,
}) => {
  if (items.length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography color="textSecondary">
          尚未新增股權注入項目
        </Typography>
      </Box>
    );
  }

  return (
    <StyledTableContainer>
      <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHead>
          <TableRow>
            {EQUITY_COLUMNS.map((column) => (
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
          {items.map((item, index) => (
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
                  {/* 拖曳手柄 - 4% */}
                  <DragHandleCell {...provided.dragHandleProps}>
                    <DragIndicatorIcon fontSize="small" />
                  </DragHandleCell>

                  {/* 項目名稱 - 15% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={item.name}
                      onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
                      variant="outlined"
                    />
                  </StyledTableCell>

                  {/* 股權類型 - 15% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={item.type}
                      onChange={(e) => onUpdate(item.id, 'type', e.target.value)}
                      variant="outlined"
                    >
                      {EQUITY_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </StyledTableCell>

                  {/* 金額 - 12% */}
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

                  {/* 進入時間 - 10% */}
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

                  {/* 期初/期末 - 10% */}
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

                  {/* 股權比例 - 12% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.ownershipPercentage}
                      onChange={(e) => onUpdate(item.id, 'ownershipPercentage', Number(e.target.value))}
                      variant="outlined"
                      InputProps={{ 
                        inputProps: { min: 0, max: 100, step: 0.1 },
                        endAdornment: '%'
                      }}
                    />
                  </StyledTableCell>

                  {/* 股息率 - 12% */}
                  <StyledTableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.dividendRate || 0}
                      onChange={(e) => onUpdate(item.id, 'dividendRate', Number(e.target.value))}
                      variant="outlined"
                      disabled={item.type === 'common'}
                      InputProps={{ 
                        inputProps: { min: 0, max: 100, step: 0.1 },
                        endAdornment: '%'
                      }}
                    />
                  </StyledTableCell>

                  {/* 特別條款 - 6% */}
                  <StyledTableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={item.specialTerms?.dividendDistributionEnabled || false}
                          onChange={(e) => onUpdate(item.id, 'specialTerms.dividendDistributionEnabled', e.target.checked)}
                        />
                      }
                      label=""
                      title="股利分發"
                    />
                  </StyledTableCell>

                  {/* 參與普通股配息 - 8% */}
                  <StyledTableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={item.specialTerms?.participateInCommonDividend || false}
                          onChange={(e) => onUpdate(item.id, 'specialTerms.participateInCommonDividend', e.target.checked)}
                          disabled={item.type !== 'preferred'} // 只有優先股可以設定
                        />
                      }
                      label=""
                      title={item.type === 'preferred' ? "參與普通股配息" : "普通股自動參與配息"}
                    />
                  </StyledTableCell>

                  {/* 刪除按鈕 - 5% */}
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
  );
};

export default EquityFinancingTable;