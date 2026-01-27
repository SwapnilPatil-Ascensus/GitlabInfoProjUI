/**
 * AppHeader component - Main application header with navigation
 */
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import DarkModeToggle from './DarkModeToggle';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boxShadow: theme.shadows[4],
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: 'white',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

export default function AppHeader({ onAboutClick, onContactClick, onTokenClick, onHomeClick }) {
  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1} 
          flexGrow={1}
          onClick={onHomeClick}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9,
            },
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          <img src="/gitlab-logo-white.png" alt="GitLab" width={32} height={32} style={{ display: 'block' }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            GitLab Project Manager
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <StyledButton onClick={onTokenClick}>
            Manage Token
          </StyledButton>
          <StyledButton onClick={onAboutClick}>
            About
          </StyledButton>
          <StyledButton onClick={onContactClick}>
            Contact Us
          </StyledButton>
          <DarkModeToggle />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
}
