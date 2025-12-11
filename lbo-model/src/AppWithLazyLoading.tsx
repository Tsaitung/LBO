/**
 * App with Lazy Loading
 * Linus 原則：按需載入，減少初始 bundle
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  CircularProgress 
} from '@mui/material';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import Navigation from './components/Navigation';

// 延遲載入所有路由組件
const BusinessMetricsContainer = lazy(() =>
  import('./components/business-metrics/BusinessMetricsContainer')
);
const ScenarioManagerContainer = lazy(() =>
  import('./components/scenario-manager/ScenarioManagerContainer')
);
const FinancingPlanning = lazy(() =>
  import('./components/financing/FinancingPlanning')
);
const MnaDealContainer = lazy(() =>
  import('./components/mna-deal-design/MnaDealContainer')
);
const DebtSchedule = lazy(() =>
  import('./components/DebtSchedule')
);
const TermSheet = lazy(() =>
  import('./components/TermSheet')
);
const Summary = lazy(() =>
  import('./components/Summary')
);

// 主題配置
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

/**
 * Loading 組件
 * 統一的載入指示器
 */
const LoadingComponent = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
    }}
  >
    <CircularProgress />
  </Box>
);

/**
 * 優化的 App 組件
 * 使用 React.lazy 和 Suspense 實現路由級別的代碼分割
 */
function AppWithLazyLoading() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<LoadingComponent />}
        persistor={persistor}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ flexGrow: 1 }}>
              <AppBar position="static">
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    LBO 財務模型管理系統
                  </Typography>
                </Toolbar>
              </AppBar>

              <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
                <Navigation />
                
                <Suspense fallback={<LoadingComponent />}>
                  <Routes>
                    <Route path="/" element={<BusinessMetricsContainer />} />
                    <Route path="/scenario-manager" element={<ScenarioManagerContainer />} />
                    <Route path="/mna-deal" element={<MnaDealContainer />} />
                    <Route path="/financing-planning" element={<FinancingPlanning />} />
                    <Route path="/debt-schedule" element={<DebtSchedule />} />
                    <Route path="/term-sheet" element={<TermSheet />} />
                    <Route path="/summary" element={<Summary />} />
                  </Routes>
                </Suspense>
              </Container>
            </Box>
          </Router>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default AppWithLazyLoading;