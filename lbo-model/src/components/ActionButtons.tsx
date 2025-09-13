import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import { Save, Forward } from '@mui/icons-material';

interface ActionButtonsProps {
  title: string;
  onProceed?: () => void;
  nextStepLabel?: string;
  showSave?: boolean;
  showProceed?: boolean;
}

// Simplified ActionButtons - reset functionality is in Navigation component
const ActionButtons: React.FC<ActionButtonsProps> = ({
  title,
  onProceed,
  nextStepLabel = '下一步',
  showSave = true,
  showProceed = true,
}) => {
  const [saveMessage, setSaveMessage] = React.useState('');

  const handleSave = () => {
    // Redux Persist 自動保存數據到 localStorage
    // 只需要告知用戶數據已被自動保存
    setSaveMessage('數據已自動保存至瀏覽器儲存空間');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleProceed = () => {
    if (onProceed) {
      onProceed();
    }
  };

  return (
    <>
      {saveMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {saveMessage}
        </Alert>
      )}
      <Paper
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: 2,
        }}
        elevation={1}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="primary">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              請確認您的輸入正確，然後選擇下一步操作
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>

            {showSave && (
              <Button
                variant="contained"
                color="info"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ minWidth: 120 }}
              >
                儲存
              </Button>
            )}

            {showProceed && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Forward />}
                onClick={handleProceed}
                sx={{
                  minWidth: 140,
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                {nextStepLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default ActionButtons;
