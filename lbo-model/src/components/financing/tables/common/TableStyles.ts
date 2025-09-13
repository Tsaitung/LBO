import { styled } from '@mui/material/styles';
import { TableContainer, TableCell } from '@mui/material';

export const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'visible',
}));

export const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  padding: theme.spacing(1.5),
  whiteSpace: 'nowrap',
  borderRight: `1px solid ${theme.palette.primary.dark}`,
  '&:last-child': {
    borderRight: 'none',
  },
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRight: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderRight: 'none',
  },
}));

export const DragHandleCell = styled(TableCell)(({ theme }) => ({
  width: '30px',
  padding: '4px',
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing',
  },
  borderRight: `1px solid ${theme.palette.divider}`,
}));

export const ActionCell = styled(TableCell)(({ theme }) => ({
  width: '40px',
  padding: '4px',
  textAlign: 'center',
}));

// 債務表格列寬定義
export const DEBT_COLUMNS = [
  { field: 'dragHandle', label: '', width: '3%' },
  { field: 'name', label: '項目名稱', width: '12%' },
  { field: 'facilityType', label: '貸款類型', width: '10%' },
  { field: 'amount', label: '金額(仟元)', width: '10%' },
  { field: 'timing', label: '進入時間', width: '8%' },
  { field: 'timingType', label: '期初/期末', width: '8%' },
  { field: 'rate', label: '利率(%)', width: '8%' },
  { field: 'maturity', label: '年期', width: '8%' },
  { field: 'frequency', label: '還款頻率', width: '10%' },
  { field: 'gracePeriod', label: '寬限期(月)', width: '8%' },
  { field: 'repaymentMethod', label: '還款方式', width: '12%' },
  { field: 'actions', label: '', width: '3%' },
];

// 股權表格列寬定義
export const EQUITY_COLUMNS = [
  { field: 'dragHandle', label: '', width: '4%' },
  { field: 'name', label: '項目名稱', width: '13%' },
  { field: 'type', label: '股權類型', width: '12%' },
  { field: 'amount', label: '金額(仟元)', width: '12%' },
  { field: 'timing', label: '進入時間', width: '8%' },
  { field: 'timingType', label: '期初/期末', width: '8%' },
  { field: 'ownership', label: '股權比例(%)', width: '10%' },
  { field: 'dividendRate', label: '股息率(%)', width: '10%' },
  { field: 'specialTerms', label: '特別條款', width: '6%' },
  { field: 'participateCommon', label: '參與配息', width: '8%' },
  { field: 'actions', label: '', width: '5%' },
];

// 貸款類型選項
export const FACILITY_TYPE_OPTIONS = [
  { value: 'senior', label: 'Senior Debt' },
  { value: 'mezzanine', label: 'Mezzanine' },
  { value: 'revolver', label: 'Revolver' },
  { value: 'termLoanA', label: 'Term Loan A' },
  { value: 'termLoanB', label: 'Term Loan B' },
];

// 還款方式選項
export const REPAYMENT_METHOD_OPTIONS = [
  { value: 'equalPayment', label: '等額本息' },
  { value: 'equalPrincipal', label: '等額本金' },
  { value: 'bullet', label: '到期一次還本' },
  { value: 'interestOnly', label: '按期付息到期還本' },
  { value: 'revolving', label: '循環信貸' },
  { value: 'custom', label: '自定義' },
];

// 股權類型選項
export const EQUITY_TYPE_OPTIONS = [
  { value: 'common', label: '普通股' },
  { value: 'preferred', label: '優先股' },
  { value: 'classA', label: 'A類股' },
  { value: 'classB', label: 'B類股' },
];

// 還款頻率選項
export const REPAYMENT_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季' },
  { value: 'semi-annual', label: '每半年' },
  { value: 'annual', label: '每年' },
  { value: 'bullet', label: '到期' },
];

// 進入時點選項
export const ENTRY_TIMING_TYPE_OPTIONS = [
  { value: 'beginning', label: '期初' },
  { value: 'end', label: '期末' },
];