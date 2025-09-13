import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  Gavel as GavelIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { RootState } from '../store/store';
import { generateTermSheet } from '../utils/termSheetGenerator';
import { formatCurrency, formatPercentage } from '../calculations/termSheet/valuations';

const TermSheet: React.FC = () => {
  const termSheetRef = useRef<HTMLDivElement>(null);
  const state = useSelector((state: RootState) => state);
  
  // 生成 Term Sheet 數據
  const termSheet = generateTermSheet(state);
  const { 
    transactionSummary, 
    financingStructure, 
    governanceTerms,
    financialCovenants,
    exitStrategy,
    keyDates,
    riskFactors
  } = termSheet;

  // PDF 下載功能（暫時使用瀏覽器打印）
  const handleDownloadPDF = () => {
    window.print();
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      {/* 頁面標題和操作按鈕 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" color="primary" fontWeight="bold">
          投資條款清單 (Term Sheet)
        </Typography>
        <Box>
          <Tooltip title="打印">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
            sx={{ ml: 1 }}
          >
            下載 PDF
          </Button>
        </Box>
      </Box>

      {/* 狀態標籤 */}
      <Box sx={{ mb: 2 }}>
        <Chip 
          label={`版本 ${termSheet.version}`} 
          color="info" 
          size="small" 
          sx={{ mr: 1 }}
        />
        <Chip 
          label={termSheet.status === 'draft' ? '草稿' : '最終版'} 
          color={termSheet.status === 'draft' ? 'warning' : 'success'}
          size="small" 
          sx={{ mr: 1 }}
        />
        <Chip 
          label="機密文件" 
          color="error" 
          size="small" 
        />
      </Box>

      {/* Term Sheet 內容 */}
      <div ref={termSheetRef}>
        {/* 1. 交易摘要 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" color="primary">
                交易摘要
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    目標公司
                  </Typography>
                  <Typography variant="h6">
                    {transactionSummary.targetCompany}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {transactionSummary.businessDescription}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    交易類型
                  </Typography>
                  <Typography variant="h6">
                    {transactionSummary.transactionType === 'fullAcquisition' ? '全額收購' : '資產收購'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    交易日期：{transactionSummary.transactionDate}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid size={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>估值指標</TableCell>
                        <TableCell align="right">金額 (千元)</TableCell>
                        <TableCell align="right">倍數</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>企業價值 (EV)</TableCell>
                        <TableCell align="right">
                          {formatCurrency(transactionSummary.enterpriseValue)}
                        </TableCell>
                        <TableCell align="right">
                          {transactionSummary.entryMultiple}x EBITDA
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>股權價值</TableCell>
                        <TableCell align="right">
                          {formatCurrency(transactionSummary.equityValue)}
                        </TableCell>
                        <TableCell align="right">
                          {transactionSummary.impliedValuation.peRatio}x P/E
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>EV/Revenue</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">
                          {transactionSummary.impliedValuation.evToRevenue}x
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 2. 融資結構 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" color="primary">
                融資結構
              </Typography>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>融資來源</TableCell>
                    <TableCell align="right">金額 (千元)</TableCell>
                    <TableCell align="right">佔比 (%)</TableCell>
                    <TableCell align="right">利率 (%)</TableCell>
                    <TableCell align="right">期限 (年)</TableCell>
                    <TableCell>還款方式</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>優先債務</TableCell>
                    <TableCell align="right">
                      {formatCurrency(financingStructure.seniorDebt.amount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercentage(financingStructure.seniorDebt.percentage)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercentage(financingStructure.seniorDebt.interestRate)}
                    </TableCell>
                    <TableCell align="right">
                      {financingStructure.seniorDebt.maturity}
                    </TableCell>
                    <TableCell>{financingStructure.seniorDebt.amortization}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>夾層債務</TableCell>
                    <TableCell align="right">
                      {formatCurrency(financingStructure.mezzanineDebt.amount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercentage(financingStructure.mezzanineDebt.percentage)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercentage(financingStructure.mezzanineDebt.interestRate)}
                    </TableCell>
                    <TableCell align="right">
                      {financingStructure.mezzanineDebt.maturity}
                    </TableCell>
                    <TableCell>{financingStructure.mezzanineDebt.amortization}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>循環信貸額度</TableCell>
                    <TableCell align="right">
                      {formatCurrency(financingStructure.revolverFacility.limit)}
                    </TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">
                      {formatPercentage(financingStructure.revolverFacility.interestRate)}
                    </TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell>循環使用</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: 'primary.light' }}>
                    <TableCell><strong>股權投資</strong></TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(financingStructure.equityInvestment.amount)}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{formatPercentage(financingStructure.equityInvestment.percentage)}</strong>
                    </TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: 'grey.200' }}>
                    <TableCell><strong>總計</strong></TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(financingStructure.totalSources)}</strong>
                    </TableCell>
                    <TableCell align="right"><strong>100%</strong></TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* 3. 治理條款 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GavelIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" color="primary">
                治理條款
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>董事會組成</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`總席次：${governanceTerms.boardComposition.totalSeats} 席`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`投資方席次：${governanceTerms.boardComposition.sponsorSeats} 席`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`管理層席次：${governanceTerms.boardComposition.managementSeats} 席`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`獨立董事：${governanceTerms.boardComposition.independentSeats} 席`}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>否決權事項</Typography>
                <List dense>
                  {governanceTerms.vetoRights.slice(0, 4).map((right, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={right} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 4. 財務契約 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">財務契約</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>槓桿比率</Typography>
                  <Typography>
                    最高 {financialCovenants.leverageRatio.maximum}x
                    （{financialCovenants.leverageRatio.testFrequency === 'quarterly' ? '每季' : '每年'}檢測）
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>利息覆蓋率</Typography>
                  <Typography>
                    最低 {financialCovenants.interestCoverage.minimum}x
                    （{financialCovenants.interestCoverage.testFrequency === 'quarterly' ? '每季' : '每年'}檢測）
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>最低 EBITDA</Typography>
                  <Typography>
                    {formatCurrency(financialCovenants.minimumEbitda.amount)}
                    （{financialCovenants.minimumEbitda.testFrequency === 'quarterly' ? '每季' : '每年'}檢測）
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>資本支出上限</Typography>
                  <Typography>
                    年度上限 {formatCurrency(financialCovenants.capitalExpenditure.maximumAnnual)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 5. 退出策略 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">退出策略</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{exitStrategy.projectedReturns.irr}%</Typography>
                  <Typography variant="subtitle1">目標 IRR</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="h4">{exitStrategy.projectedReturns.moic}x</Typography>
                  <Typography variant="subtitle1">目標 MOIC</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Typography variant="h4">{exitStrategy.targetHoldPeriod} 年</Typography>
                  <Typography variant="subtitle1">持有期間</Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 6. 關鍵日期 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">關鍵日期</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="簽約日期"
                  secondary={keyDates.signingDate}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="預計交割日"
                  secondary={keyDates.expectedClosing}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="盡職調查截止日"
                  secondary={keyDates.dueDiligenceDeadline}
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* 7. 風險因素 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">風險因素與緩解措施</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>主要風險</Typography>
              <List dense>
                {riskFactors.marketRisks.map((risk, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={risk} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          </AccordionDetails>
        </Accordion>

        {/* 簽署區 */}
        <Card sx={{ mt: 3, p: 3, bgcolor: 'grey.100' }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>買方</Typography>
              <Typography>{termSheet.parties.buyer.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {termSheet.parties.buyer.entity}
              </Typography>
              <Box sx={{ mt: 3, borderTop: 1, pt: 1 }}>
                <Typography variant="caption">簽名：________________</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>賣方</Typography>
              <Typography>{termSheet.parties.seller.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {termSheet.parties.seller.entity}
              </Typography>
              <Box sx={{ mt: 3, borderTop: 1, pt: 1 }}>
                <Typography variant="caption">簽名：________________</Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </div>

      {/* 打印樣式 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root * {
            visibility: visible;
          }
          .MuiIconButton-root,
          .MuiButton-root {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default TermSheet;