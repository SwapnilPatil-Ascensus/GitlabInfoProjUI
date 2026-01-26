/**
 * DarkModeToggle component - Toggle between light and dark mode
 */
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from './ThemeProvider';

export default function DarkModeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton onClick={toggleMode} color="inherit" sx={{ ml: 1 }}>
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}
