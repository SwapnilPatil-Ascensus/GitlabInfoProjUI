/**
 * App - Root component
 * Updated with header, footer, routing, and token management
 */
import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import TabsLayout from './TabsLayout';
import LeadershipDashboardPage from './pages/LeadershipDashboardPage';
import GitLabUsagePage from './pages/GitLabUsagePage';
import ThemeProvider from './components/ThemeProvider';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import TokenManager from './components/TokenManager';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function App() {
  const [currentView, setCurrentView] = useState('leadership');
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const handleAboutClick = () => {
    setCurrentView('about');
  };

  const handleContactClick = () => {
    setCurrentView('contact');
  };

  const handleTokenClick = () => {
    setTokenDialogOpen(true);
  };

  const handleBackToDashboard = () => {
    setCurrentView('leadership');
  };

  const handleHomeClick = () => {
    setCurrentView('leadership');
  };

  const handleDashboardClick = () => {
    setCurrentView('leadership');
  };

  const handleReportingClick = () => {
    setCurrentView('reporting');
  };

  const handleUsageClick = () => {
    setCurrentView('usage');
  };

  return (
    <ThemeProvider>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: (theme) => 
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundAttachment: 'fixed',
        }}
      >
        <AppHeader
          onAboutClick={handleAboutClick}
          onContactClick={handleContactClick}
          onTokenClick={handleTokenClick}
          onHomeClick={handleHomeClick}
          onDashboardClick={handleDashboardClick}
          onReportingClick={handleReportingClick}
          onUsageClick={handleUsageClick}
          currentView={currentView}
        />
        
        <Box 
          sx={{ 
            flex: 1, 
            py: 3,
            animation: 'fadeIn 0.4s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          {currentView === 'leadership' && <LeadershipDashboardPage />}
          {currentView === 'usage' && <GitLabUsagePage />}
          {currentView === 'reporting' && <TabsLayout />}
          {currentView === 'about' && (
            <Box>
              <AboutPage />
              <Box textAlign="center" mt={3}>
                <Button
                  variant="contained"
                  onClick={handleBackToDashboard}
                  size="large"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 6,
                    },
                  }}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </Box>
          )}
          {currentView === 'contact' && (
            <Box>
              <ContactPage />
              <Box textAlign="center" mt={3}>
                <Button
                  variant="contained"
                  onClick={handleBackToDashboard}
                  size="large"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 6,
                    },
                  }}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <AppFooter
          onAboutClick={handleAboutClick}
          onContactClick={handleContactClick}
        />

        <TokenManager
          open={tokenDialogOpen}
          onClose={() => setTokenDialogOpen(false)}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
