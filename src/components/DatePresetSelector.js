/**
 * DatePresetSelector component - Quick date range selection
 */
import { ButtonGroup, Button } from '@mui/material';
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
    <ButtonGroup 
      variant="outlined" 
      size="small"
      sx={{ 
        mb: 2,
        '& .MuiButton-root': {
          borderRadius: 1,
          textTransform: 'none',
        }
      }}
    >
      {DATE_PRESETS.filter(p => p.days !== null).map((preset) => (
        <Button
          key={preset.label}
          onClick={() => handlePresetClick(preset)}
          variant={selectedPreset === preset.label ? 'contained' : 'outlined'}
        >
          {preset.label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
