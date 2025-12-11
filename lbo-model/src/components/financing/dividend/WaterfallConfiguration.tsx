import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { WaterfallRule } from '../../../types/financial';
import { createDefaultWaterfallRules } from '../../../constants/dividendPolicyDefaults';

interface WaterfallConfigurationProps {
  rules: WaterfallRule[];
  onChange: (rules: WaterfallRule[]) => void;
  preferredStockRate?: number; // 從股權設定讀取的優先股利率
}

const WaterfallConfiguration: React.FC<WaterfallConfigurationProps> = ({
  rules,
  onChange,
  preferredStockRate = 8, // 默認8%
}) => {
  const [editingRule, setEditingRule] = useState<WaterfallRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 初始化默認規則（使用統一預設值）
  React.useEffect(() => {
    if (rules.length === 0) {
      onChange(createDefaultWaterfallRules(preferredStockRate));
    }
  }, [rules.length, onChange, preferredStockRate]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(rules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新優先級
    const updatedItems = items.map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

    onChange(updatedItems);
  };

  const handleEditRule = (rule: WaterfallRule) => {
    setEditingRule({ ...rule });
    setDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    // 自動生成描述和公式（用戶不需手動輸入）
    const ruleToSave = { ...editingRule };

    if (ruleToSave.type === 'preferredRedemption') {
      if (ruleToSave.calculation === 'fixed') {
        ruleToSave.description = `優先股本金贖回（${ruleToSave.value}M）`;
      } else if (ruleToSave.calculation === 'percentage') {
        ruleToSave.description = `優先股本金贖回（餘額${ruleToSave.value}%）`;
      }
      ruleToSave.formula = undefined; // 不需要公式
    } else if (ruleToSave.type === 'preferredDividend') {
      // 優先股股息：使用從股權注入讀取的利率
      ruleToSave.calculation = 'formula';
      ruleToSave.value = preferredStockRate;
      ruleToSave.formula = `preferredOutstanding * ${preferredStockRate}%`;
      ruleToSave.description = `優先股股息（${preferredStockRate}% p.a.）`;
    } else if (ruleToSave.type === 'commonDividend') {
      ruleToSave.description = ruleToSave.value === 100
        ? '普通股股利（剩餘可分配現金）'
        : `普通股股利（剩餘現金${ruleToSave.value}%）`;
      ruleToSave.formula = undefined;
    } else if (ruleToSave.type === 'carried') {
      ruleToSave.description = `附帶權益（${ruleToSave.value}%）`;
      ruleToSave.formula = undefined;
    }

    const updatedRules = rules.map(rule =>
      rule.priority === editingRule.priority ? ruleToSave : rule
    );
    onChange(updatedRules);
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleAddRule = () => {
    const newRule: WaterfallRule = {
      priority: rules.length + 1,
      type: 'carried',
      calculation: 'percentage',
      value: 20,
      description: '新分配規則',
    };
    onChange([...rules, newRule]);
  };

  const handleDeleteRule = (priority: number) => {
    const filteredRules = rules.filter(rule => rule.priority !== priority);
    // 重新編號
    const updatedRules = filteredRules.map((rule, index) => ({
      ...rule,
      priority: index + 1,
    }));
    onChange(updatedRules);
  };

  const getTypeLabel = (type: WaterfallRule['type']) => {
    const labels = {
      preferredRedemption: '優先股贖回',
      preferredDividend: '優先股股息',
      commonDividend: '普通股股利',
      carried: '附帶權益',
    };
    return labels[type];
  };

  const getTypeColor = (type: WaterfallRule['type']) => {
    const colors = {
      preferredRedemption: 'error',
      preferredDividend: 'warning',
      commonDividend: 'success',
      carried: 'info',
    } as const;
    return colors[type];
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            瀑布式分配順序
            <Tooltip title="按優先級順序分配可用現金，優先級高的先分配">
              <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
            </Tooltip>
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddRule}
            variant="outlined"
          >
            新增規則
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          拖動項目以調整分配優先順序，優先級1最先分配
        </Typography>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="waterfall-rules">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {rules.map((rule, index) => (
                  <Draggable key={`rule-${rule.priority}`} draggableId={`rule-${rule.priority}`} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 1,
                          bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <ListItemIcon {...provided.dragHandleProps}>
                          <DragIndicatorIcon />
                        </ListItemIcon>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Chip
                            label={`優先級 ${rule.priority}`}
                            size="small"
                            color="primary"
                          />
                          
                          <Chip
                            label={getTypeLabel(rule.type)}
                            size="small"
                            color={getTypeColor(rule.type)}
                          />
                          
                          <Typography variant="body2">
                            {rule.description}
                          </Typography>
                          
                          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={
                                rule.calculation === 'fixed'
                                  ? `${rule.value}M`
                                  : rule.calculation === 'percentage'
                                  ? `${rule.value}%`
                                  : '公式'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => handleEditRule(rule)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteRule(rule.priority)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography variant="body2" color="info.main">
            <strong>分配邏輯說明：</strong>
            <br />
            • 系統按優先級順序逐層分配可用現金
            <br />
            • 每層分配金額 = Min(該層計算金額, 剩餘可分配現金)
            <br />
            • 優先股利率自動從股權設定中讀取（當前：{preferredStockRate}%）
            <br />
            • 優先股贖回減少未來的股息負擔，提高IRR
          </Typography>
        </Box>

        {/* 編輯對話框 - 簡化設計：系統自動生成公式 */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>編輯分配規則</DialogTitle>
          <DialogContent>
            {editingRule && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 分配類型選擇 */}
                <Select
                  value={editingRule.type}
                  onChange={(e) => {
                    const newType = e.target.value as WaterfallRule['type'];
                    // 根據類型自動設定計算方式
                    let newCalc: WaterfallRule['calculation'] = 'percentage';
                    let newValue = editingRule.value;
                    if (newType === 'preferredRedemption') {
                      newCalc = 'fixed';
                      newValue = 90;
                    } else if (newType === 'preferredDividend') {
                      newCalc = 'formula';
                      newValue = preferredStockRate;
                    } else if (newType === 'commonDividend') {
                      newCalc = 'percentage';
                      newValue = 100;
                    }
                    setEditingRule({ ...editingRule, type: newType, calculation: newCalc, value: newValue });
                  }}
                  fullWidth
                  displayEmpty
                >
                  <MenuItem value="preferredRedemption">優先股贖回</MenuItem>
                  <MenuItem value="preferredDividend">優先股股息</MenuItem>
                  <MenuItem value="commonDividend">普通股股利</MenuItem>
                  <MenuItem value="carried">附帶權益</MenuItem>
                </Select>

                {/* 根據類型顯示不同的設定 */}
                {editingRule.type === 'preferredRedemption' && (
                  <>
                    <Select
                      value={editingRule.calculation}
                      onChange={(e) => setEditingRule({ ...editingRule, calculation: e.target.value as WaterfallRule['calculation'] })}
                      fullWidth
                    >
                      <MenuItem value="fixed">固定金額</MenuItem>
                      <MenuItem value="percentage">優先股餘額百分比</MenuItem>
                    </Select>
                    <TextField
                      label={editingRule.calculation === 'fixed' ? '贖回金額' : '贖回比例'}
                      type="number"
                      fullWidth
                      value={editingRule.value}
                      onChange={(e) => setEditingRule({ ...editingRule, value: Number(e.target.value) })}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {editingRule.calculation === 'fixed' ? '百萬元' : '%'}
                          </InputAdornment>
                        ),
                      }}
                      helperText={editingRule.calculation === 'fixed'
                        ? '每年固定贖回的金額'
                        : '每年贖回優先股餘額的比例'}
                    />
                  </>
                )}

                {editingRule.type === 'preferredDividend' && (
                  <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>計算方式：</strong>優先股餘額 × 股息率
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                      股息率自動從股權注入設定讀取：<strong>{preferredStockRate}%</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      若需修改股息率，請至「股權注入」頁面調整優先股設定
                    </Typography>
                  </Box>
                )}

                {editingRule.type === 'commonDividend' && (
                  <TextField
                    label="分配比例"
                    type="number"
                    fullWidth
                    value={editingRule.value}
                    onChange={(e) => setEditingRule({ ...editingRule, value: Number(e.target.value) })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="剩餘可分配現金中用於普通股股利的比例（通常為100%）"
                  />
                )}

                {editingRule.type === 'carried' && (
                  <TextField
                    label="附帶權益比例"
                    type="number"
                    fullWidth
                    value={editingRule.value}
                    onChange={(e) => setEditingRule({ ...editingRule, value: Number(e.target.value) })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="管理層或GP的附帶權益分成比例"
                  />
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveRule} variant="contained">保存</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WaterfallConfiguration;