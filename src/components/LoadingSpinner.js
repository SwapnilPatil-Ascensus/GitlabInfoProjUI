/**
 * LoadingSpinner component - Shows loading state with animation
 */
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'background.default',
        }),
      }}
    >
      <Fade in={true} timeout={500}>
        <CircularProgress 
          size={fullScreen ? 60 : 40}
          thickness={4}
          sx={{
            animationDuration: '1.5s',
          }}
        />
      </Fade>
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  return content;
}
