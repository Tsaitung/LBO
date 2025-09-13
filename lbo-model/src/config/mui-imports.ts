/**
 * 統一的 MUI imports 配置
 * Linus 原則：減少重複，優化 bundle
 */

// 只導入實際使用的組件
export {
  Alert,
  AlertTitle,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';

// Icons - 只導入使用的
export {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Forward as ForwardIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Theme
export { 
  ThemeProvider,
  createTheme,
  styled,
} from '@mui/material/styles';