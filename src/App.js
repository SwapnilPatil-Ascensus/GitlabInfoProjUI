import React from 'react';
import TabsLayout from './TabsLayout';
import { CssBaseline, Container, Typography } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          GitLab Project Manager UI
        </Typography>
        <TabsLayout />
      </Container>
    </>
  );
}

export default App;
