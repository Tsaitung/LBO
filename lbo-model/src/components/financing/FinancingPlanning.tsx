import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Add,
  AccountBalance,
  TrendingUp,
  Paid,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useMnaDeal } from '../../hooks/typed-hooks';
import { updateDealDesign } from '../../store/slices/mnaDealDesign.slice';
import DebtFinancingTable from './tables/DebtFinancingTable';
import EquityFinancingTable from './tables/EquityFinancingTable';
import DividendPolicyTable from './tables/DividendPolicyTable';
import SourcesUsesTable from './tables/SourcesUsesTable';
import ProFormaFinancials from '../strategic-analysis/ProFormaFinancialsRefactored';
import DebtCovenantMonitor from '../strategic-analysis/DebtCovenantMonitor';
import DebtSchedule from '../DebtSchedule';
import { FinancingPlan, EquityInjection, FacilityType, LoanType, RepaymentMethod } from '../../types/financial';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financing-tabpanel-${index}`}
      aria-labelledby={`financing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const FinancingPlanning: React.FC = () => {
  const dispatch = useDispatch();
  const mnaDealDesign = useMnaDeal();
  const [tabValue, setTabValue] = useState(0);
  const invalidPlans = (mnaDealDesign?.financingPlans || []).filter((p: FinancingPlan) => {
    if (!p) return true;
    const amountOk = (p.amount || 0) > 0;
    const rateOk = (p.interestRate ?? 0) >= 0;
    const maturityOk = p.repaymentMethod === 'revolving' ? true : (p.maturity || 0) >= 1;
    const methodOk = !!p.repaymentMethod;
    return !(amountOk && rateOk && maturityOk && methodOk);
  });

  // 處理債務融資更新
  const handleUpdateFinancingPlan = (id: string, field: string, value: unknown) => {
    const updatedPlans = mnaDealDesign.financingPlans.map((plan: FinancingPlan) => {
      if (plan.id === id) {
        // 處理嵌套字段
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...plan,
            [parent]: {
              ...((plan as unknown as Record<string, unknown>)[parent] as Record<string, unknown>),
              [child]: value,
            },
          };
        }

        // 處理 facilityType 變更時的智能默認值
        if (field === 'facilityType') {
          const facilityDefaults: Record<string, Partial<FinancingPlan>> = {
            senior: { 
              interestRate: 3, 
              maturity: 5, 
              repaymentMethod: 'equalPayment',
              repaymentFrequency: 'quarterly',
            },
            mezzanine: { 
              interestRate: 8, 
              maturity: 7, 
              repaymentMethod: 'bullet',
              repaymentFrequency: 'annual',
            },
            revolver: { 
              interestRate: 4, 
              maturity: 5, 
              repaymentMethod: 'revolving',
              repaymentFrequency: 'monthly',
            },
            termLoanA: {
              interestRate: 4,
              maturity: 5,
              repaymentMethod: 'equalPrincipal',
              repaymentFrequency: 'quarterly',
            },
            termLoanB: {
              interestRate: 6,
              maturity: 7,
              repaymentMethod: 'bullet',
              repaymentFrequency: 'annual',
            },
          };

          const defaults = facilityDefaults[value as string] || {};
          return {
            ...plan,
            facilityType: value as FacilityType,
            type: value as LoanType, // 保持向後兼容
            ...defaults,
            repaymentStructure: {
              ...plan.repaymentStructure,
              type: defaults.repaymentMethod || plan.repaymentStructure?.type,
            },
          };
        }

        // 處理 repaymentMethod 變更
        if (field === 'repaymentMethod') {
          return {
            ...plan,
            repaymentMethod: value as RepaymentMethod,
            repaymentStructure: {
              ...plan.repaymentStructure,
              type: value as RepaymentMethod,
            },
          };
        }

        return { ...plan, [field]: value };
      }
      return plan;
    });

    dispatch(updateDealDesign({
      financingPlans: updatedPlans,
    }));
  };

  // 處理股權注入更新
  const handleUpdateEquityInjection = (id: string, field: string, value: unknown) => {
    const updatedInjections = mnaDealDesign.equityInjections.map(injection => {
      if (injection.id === id) {
        // 處理嵌套字段
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...injection,
            [parent]: {
              ...((injection as unknown as Record<string, unknown>)[parent] as Record<string, unknown> || {}),
              [child]: value,
            },
          };
        }
        return { ...injection, [field]: value };
      }
      return injection;
    });

    dispatch(updateDealDesign({
      equityInjections: updatedInjections,
    }));
  };

  // 處理刪除債務融資
  const handleDeleteFinancingPlan = (id: string) => {
    const updatedPlans = mnaDealDesign.financingPlans.filter(plan => plan.id !== id);
    dispatch(updateDealDesign({
      financingPlans: updatedPlans,
    }));
  };

  // 處理刪除股權注入
  const handleDeleteEquityInjection = (id: string) => {
    const updatedInjections = mnaDealDesign.equityInjections.filter(injection => injection.id !== id);
    dispatch(updateDealDesign({
      equityInjections: updatedInjections,
    }));
  };

  // 新增債務融資
  const handleAddFinancingPlan = () => {
    const newPlan: FinancingPlan = {
      id: generateId(),
      name: `新債務項目 ${mnaDealDesign.financingPlans.length + 1}`,
      type: 'senior',
      facilityType: 'senior',
      repaymentMethod: 'equalPayment',
      amount: 0,
      entryTiming: 0,
      entryTimingType: 'beginning',
      maturity: 1,
      interestRate: 0,
      repaymentFrequency: 'quarterly',
      gracePeriod: 0,
      repaymentStructure: {
        type: 'equalPayment',
      },
    };

    dispatch(updateDealDesign({
      financingPlans: [...mnaDealDesign.financingPlans, newPlan],
    }));
  };

  // 新增股權注入
  const handleAddEquityInjection = () => {
    const newInjection: EquityInjection = {
      id: generateId(),
      name: `新股權項目 ${mnaDealDesign.equityInjections.length + 1}`,
      type: 'common',
      amount: 1000,
      entryTiming: 0,
      entryTimingType: 'beginning',
      ownershipPercentage: 20,
    };

    dispatch(updateDealDesign({
      equityInjections: [...mnaDealDesign.equityInjections, newInjection],
    }));
  };

  // 處理拖放結束 - 債務融資
  const handleDebtDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(mnaDealDesign.financingPlans) as FinancingPlan[];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    dispatch(updateDealDesign({
      financingPlans: items,
    }));
  };

  // 處理拖放結束 - 股權注入
  const handleEquityDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(mnaDealDesign.equityInjections) as EquityInjection[];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    dispatch(updateDealDesign({
      equityInjections: items,
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      {invalidPlans.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          有 {invalidPlans.length} 個債務融資項目未填完整（需金額、利率、年期及還款方式）。不完整項目將不納入計算。
        </Alert>
      )}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        融資規劃設計
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        設計您的融資結構，包括債務融資和股權注入。您可以添加多個融資項目，並設定不同的條款和時間安排。
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label="債務融資" 
            icon={<AccountBalance />} 
            iconPosition="start"
          />
          <Tab 
            label="股權注入" 
            icon={<TrendingUp />} 
            iconPosition="start"
          />
          <Tab 
            label="股利政策" 
            icon={<Paid />} 
            iconPosition="start"
          />
          <Tab 
            label="資金來源與使用" 
            icon={<AccountBalanceWallet />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 債務融資頁籤 */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            債務融資計劃
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddFinancingPlan}
          >
            新增債務融資
          </Button>
        </Box>

        <DragDropContext onDragEnd={handleDebtDragEnd}>
          <Droppable droppableId="debt-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <DebtFinancingTable
                  items={mnaDealDesign.financingPlans}
                  onUpdate={handleUpdateFinancingPlan}
                  onDelete={handleDeleteFinancingPlan}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {/* 整合債務償還明細表 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalance sx={{ mr: 1 }} />
            債務償還明細表 (Debt Schedule)
          </Typography>
          <DebtSchedule />
        </Box>
      </TabPanel>

      {/* 股權注入頁籤 */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            股權注入計劃
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddEquityInjection}
          >
            新增股權注入
          </Button>
        </Box>

        <DragDropContext onDragEnd={handleEquityDragEnd}>
          <Droppable droppableId="equity-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <EquityFinancingTable
                  items={mnaDealDesign.equityInjections}
                  onUpdate={handleUpdateEquityInjection}
                  onDelete={handleDeleteEquityInjection}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </TabPanel>

      {/* 股利政策頁籤 */}
      <TabPanel value={tabValue} index={2}>
        {/* 股利政策設定 */}
        <DividendPolicyTable />
        
        {/* 合併預估財務報表 */}
        <Box sx={{ mt: 4 }}>
          <ProFormaFinancials />
        </Box>
        
        {/* 契約條款監控 */}
        <Box sx={{ mt: 4 }}>
          <DebtCovenantMonitor />
        </Box>
      </TabPanel>

      {/* 資金來源與使用分析頁籤 */}
      <TabPanel value={tabValue} index={3}>
        <SourcesUsesTable />
      </TabPanel>
    </Paper>
  );
};

export default FinancingPlanning;
