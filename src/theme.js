import { createTheme } from '@mui/material/styles';



const theme = createTheme({
  palette: {
    primary: {
      main: '#3a7bd5', // Serene blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#cfdef3', // Soft blue/gray
      contrastText: '#232b2b',
    },
    background: {
      default: 'radial-gradient(ellipse at top left, #b0b7c3 0%, #232b2b 100%)',
      paper: '#fafdff',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: 22,
    },
    h5: {
      fontWeight: 600,
      fontSize: 18,
    },
    body1: {
      fontSize: 15,
    },
    body2: {
      fontSize: 14,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 16px 48px 0 rgba(34,43,43,0.22), 0 4px 16px 0 rgba(34,43,43,0.13)',
          background: 'linear-gradient(120deg, #fafdff 80%, #e0eafc 100%)',
          position: 'relative',
          zIndex: 2,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 8px 32px 0 rgba(34,43,43,0.15)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'uppercase',
          fontWeight: 700,
        },
      },
    },
  },
});

export default theme;
