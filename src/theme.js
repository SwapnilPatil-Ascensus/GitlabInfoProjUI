import { createTheme } from '@mui/material/styles';

// Premium color palette
const lightPalette = {
  primary: {
    main: '#6366f1', // Indigo
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#fff',
  },
  secondary: {
    main: '#8b5cf6', // Purple
    light: '#a78bfa',
    dark: '#7c3aed',
    contrastText: '#fff',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
  background: {
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paper: '#ffffff',
  },
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
  },
};

const darkPalette = {
  primary: {
    main: '#818cf8',
    light: '#a5b4fc',
    dark: '#6366f1',
    contrastText: '#fff',
  },
  secondary: {
    main: '#a78bfa',
    light: '#c4b5fd',
    dark: '#8b5cf6',
    contrastText: '#fff',
  },
  success: {
    main: '#34d399',
    light: '#6ee7b7',
    dark: '#10b981',
  },
  warning: {
    main: '#fbbf24',
    light: '#fcd34d',
    dark: '#f59e0b',
  },
  error: {
    main: '#f87171',
    light: '#fca5a5',
    dark: '#ef4444',
  },
  info: {
    main: '#60a5fa',
    light: '#93c5fd',
    dark: '#3b82f6',
  },
  background: {
    default: '#0f172a',
    paper: '#1e293b',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
  },
  mode: 'dark',
};

// Create light theme
export const lightTheme = createTheme({
  palette: lightPalette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
      fontSize: 20,
      letterSpacing: '-0.3px',
    },
    h6: {
      fontWeight: 600,
      fontSize: 18,
    },
    body1: {
      fontSize: 15,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 14,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 15,
          minHeight: 56,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

// Create dark theme
export const darkTheme = createTheme({
  palette: darkPalette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
      fontSize: 20,
      letterSpacing: '-0.3px',
    },
    h6: {
      fontWeight: 600,
      fontSize: 18,
    },
    body1: {
      fontSize: 15,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 14,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 15,
          minHeight: 56,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(129, 140, 248, 0.16)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

// Default export (light theme for backward compatibility)
export default lightTheme;
