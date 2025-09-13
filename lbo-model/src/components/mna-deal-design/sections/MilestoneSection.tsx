/**
 * 里程碑設定區塊
 * Linus 原則：配置驅動，無重複代碼
 */

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Grid,
} from '@mui/material';
import { useMnaDealDesign, useAppDispatch } from '../../../hooks/typed-hooks';
import { updateDealDesign } from '../../../store/slices/mnaDealDesign.slice';

/**
 * 里程碑配置
 * 統一的里程碑定義
 */
const MILESTONE_CONFIG = [
  {
    year: 'year1' as const,
    label: '第一年里程碑',
    fields: [
      { key: 'revenueTarget', label: '營收目標', type: 'number' },
      { key: 'ebitdaTarget', label: 'EBITDA 目標', type: 'number' },
      { key: 'description', label: '描述', type: 'text' },
    ]
  },
  {
    year: 'year2' as const,
    label: '第二年里程碑',
    fields: [
      { key: 'revenueTarget', label: '營收目標', type: 'number' },
      { key: 'ebitdaTarget', label: 'EBITDA 目標', type: 'number' },
      { key: 'description', label: '描述', type: 'text' },
    ]
  }
];

/**
 * 里程碑管理
 * 職責：處理業績里程碑設定
 */
export const MilestoneSection: React.FC = React.memo(() => {
  const dispatch = useAppDispatch();
  const mnaDealDesign = useMnaDealDesign();

  const handleMilestoneChange = (
    year: 'year1' | 'year2', 
    field: string, 
    value: string
  ) => {
    const numValue = field.includes('Target') ? parseFloat(value) || 0 : value;
    
    dispatch(updateDealDesign({
      milestones: {
        ...mnaDealDesign?.milestones,
        [year]: {
          ...mnaDealDesign?.milestones?.[year],
          [field]: numValue,
        },
      },
    }));
  };

  const getMilestoneValue = (year: string, field: string) => {
    return mnaDealDesign?.milestones?.[year as 'year1' | 'year2']?.[field] || '';
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        🎯 業績里程碑設定
      </Typography>

      <Grid container spacing={3}>
        {MILESTONE_CONFIG.map((milestone) => (
          <Grid key={milestone.year} size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {milestone.label}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {milestone.fields.map((field) => (
                  <TextField
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    value={getMilestoneValue(milestone.year, field.key)}
                    onChange={(e) => handleMilestoneChange(
                      milestone.year,
                      field.key,
                      e.target.value
                    )}
                    fullWidth
                    multiline={field.type === 'text'}
                    rows={field.type === 'text' ? 3 : 1}
                    inputProps={
                      field.type === 'number' 
                        ? { min: 0, step: 1000000 } 
                        : {}
                    }
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
});