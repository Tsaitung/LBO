import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Tabs,
  Tab,
  Box,
  Paper,
  Button,
  ButtonGroup,
} from '@mui/material';
import { useIsCalculated, useMnaDealDesign } from '../hooks/typed-hooks';
import { clearPersistedData } from '../store/store';
import { FinancingPlan } from '../types/financial';

const navigationItems = [
  { label: 'Business Metrics', path: '/' },
  { label: 'Scenario Manager', path: '/scenario-manager' },
  { label: 'M&A Deal', path: '/mna-deal' },
  { label: 'Financing Planning', path: '/financing-planning' },
  { label: 'Term Sheet', path: '/term-sheet' },
  { label: 'Summary', path: '/summary' },
];

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCalculated = useIsCalculated();
  const mnaDealDesign = useMnaDealDesign();

  const invalidPlans = (mnaDealDesign?.financingPlans || []).filter((p: FinancingPlan | undefined) => {
    if (!p) return true;
    const amountOk = (p.amount || 0) > 0;
    const rateOk = (p.interestRate ?? 0) >= 0;
    const maturityOk = p.repaymentMethod === 'revolving' ? true : (p.maturity || 0) >= 1;
    const methodOk = !!p.repaymentMethod;
    return !(amountOk && rateOk && maturityOk && methodOk);
  });

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const activeIndex = navigationItems.findIndex(item => item.path === currentPath);
    return activeIndex >= 0 ? activeIndex : 0;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(navigationItems[newValue].path);
  };

  const handleCalculate = () => {
    // 計算邏輯已經移到各個 slice 內部自動處理
    // 直接跳轉到 Summary 頁面查看結果
    navigate('/summary');
  };

  const handleReset = () => {
    if (window.confirm('確定要恢復到預設值嗎？這將清除所有已輸入的數據。')) {
      // 使用 clearPersistedData 清除持久化數據，然後重新載入
      clearPersistedData();
      window.location.reload();
    }
  };

  const handleClearPersistedData = () => {
    if (window.confirm('確定要清除所有保存的數據嗎？這將刪除localStorage中的所有數據，重啟應用將恢復初始狀態。')) {
      clearPersistedData();
      window.location.reload(); // 重新載入頁面以應用更改
    }
  };

  return (
    <Paper sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              onClick={handleCalculate}
              variant="contained"
              color="primary"
              disabled={invalidPlans.length > 0}
            >
              重算 Year1~N
            </Button>
            <Button
              onClick={handleReset}
              variant="outlined"
              color="error"
            >
              恢復預設值
            </Button>
            <Button
              onClick={handleClearPersistedData}
              variant="outlined"
              color="warning"
            >
              清除保存數據
            </Button>
          </ButtonGroup>

          {invalidPlans.length > 0 ? (
            <Box sx={{ color: 'warning.main', fontSize: '0.875rem' }}>
              ⚠ 有 {invalidPlans.length} 個未完整的融資項目，請先補齊金額/利率/年期/還款方式。
            </Box>
          ) : isCalculated && (
            <Box sx={{ color: 'success.main', fontSize: '0.875rem' }}>
              ✓ 計算完成
            </Box>
          )}
        </Box>
      </Box>

      <Tabs
        value={getActiveTab()}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          '& .MuiTab-root': {
            minWidth: 120,
            textTransform: 'none',
          },
        }}
      >
        {navigationItems.map((item, index) => (
          <Tab
            key={index}
            label={item.label}
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          />
        ))}
      </Tabs>
    </Paper>
  );
};

export default Navigation;
