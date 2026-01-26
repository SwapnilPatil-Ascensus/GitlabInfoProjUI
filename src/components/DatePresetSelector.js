/**
 * DatePresetSelector component - Quick date range selection
 */
import { Box, Button } from '@mui/material';
import { DATE_PRESETS } from '../utils/constants';
import { getDatePreset } from '../utils/formatters';

export default function DatePresetSelector({ onSelect, selectedPreset = null }) {
  const handlePresetClick = (preset) => {
    if (preset.days !== null) {
      const dates = getDatePreset(preset.days);
      onSelect(dates, preset.label);
    }
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {DATE_PRESETS.filter(p => p.days !== null).map((preset) => (
        <Button
          key={preset.label}
          onClick={() => handlePresetClick(preset)}
          variant={selectedPreset === preset.label ? 'contained' : 'outlined'}
          size="small"
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            transition: 'all 0.2s ease',
            transform: 'scale(1)',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          {preset.label}
        </Button>
      ))}
    </Box>
  );
}
