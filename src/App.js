/**
 * App - Root component
 * Updated to use ThemeProvider with dark mode support
 */
import React from 'react';
import { Box } from '@mui/material';
import TabsLayout from './TabsLayout';
import ThemeProvider from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <Box
        sx={{
          minHeight: '100vh',
          background: (theme) => 
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundAttachment: 'fixed',
        }}
      >
        <TabsLayout />
      </Box>
    </ThemeProvider>
  );
}

export default App;
