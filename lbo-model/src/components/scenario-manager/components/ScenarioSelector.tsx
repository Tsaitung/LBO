/**
 * ScenarioSelector - 情境選擇組件
 * Linus 原則：單一職責，無特殊案例
 */

import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { ScenarioType } from '../../../store/slices/scenarios.slice';

interface ScenarioSelectorProps {
  selectedScenario: ScenarioType;
  currentScenario: ScenarioType;
  onSelect: (scenario: ScenarioType) => void;
}

// 情境配置（資料驅動，無特殊處理）
const SCENARIO_CONFIG = [
  {
    type: 'base' as ScenarioType,
    label: 'Base 情境',
    description: '基準估計情境',
    color: 'primary',
  },
  {
    type: 'upside' as ScenarioType,
    label: 'Upside 情境',
    description: '樂觀估計情境',
    color: 'success',
  },
  {
    type: 'downside' as ScenarioType,
    label: 'Downside 情境',
    description: '保守估計情境',
    color: 'warning',
  },
];

/**
 * 情境選擇器組件
 * 統一處理所有情境，無特殊案例
 */
export const ScenarioSelector: React.FC<ScenarioSelectorProps> = React.memo(({
  selectedScenario,
  currentScenario,
  onSelect,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {SCENARIO_CONFIG.map(scenario => {
        const isSelected = selectedScenario === scenario.type;
        const isCurrent = currentScenario === scenario.type;
        
        return (
          <Box key={scenario.type} sx={{ flex: 1 }}>
            <Card
              sx={{
                cursor: 'pointer',
                border: isSelected ? 2 : 1,
                borderColor: isSelected 
                  ? `${scenario.color}.main` 
                  : 'grey.300',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              onClick={() => onSelect(scenario.type)}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    color={`${scenario.color}.main`}
                  >
                    {scenario.label}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isCurrent && (
                      <Chip
                        label="當前"
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {isSelected && (
                      <Chip
                        label="已選擇"
                        color={scenario.color as "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {scenario.description}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
});