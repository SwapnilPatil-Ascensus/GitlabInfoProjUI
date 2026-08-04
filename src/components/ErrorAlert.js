/**
 * ErrorAlert component - Displays user-friendly error messages
 */
import { Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

export default function ErrorAlert({ error, onClose }) {
  const [open, setOpen] = useState(!!error);

  useEffect(() => {
    setOpen(!!error);
  }, [error]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for collapse animation
    }
  };

  if (!error) return null;

  // Parse error message
  const stringifyDetail = (detail) => {
    if (detail == null) return '';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item?.msg) {
            const loc = Array.isArray(item.loc) ? item.loc.join('.') : item.loc;
            return loc ? `${loc}: ${item.msg}` : item.msg;
          }
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        })
        .join(' | ');
    }
    if (typeof detail === 'object') {
      if (detail.msg) return detail.msg;
      try {
        return JSON.stringify(detail);
      } catch {
        return String(detail);
      }
    }
    return String(detail);
  };

  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    if (err?.response?.data?.detail) return stringifyDetail(err.response.data.detail);
    if (err?.response?.data?.error) return stringifyDetail(err.response.data.error);
    if (err?.message) return err.message;
    return 'An unexpected error occurred. Please try again.';
  };

  const getErrorTitle = (err) => {
    if (err?.response?.status === 400) return 'Validation Error';
    if (err?.response?.status === 401) return 'Authentication Error';
    if (err?.response?.status === 403) return 'Access Denied';
    if (err?.response?.status === 404) return 'Not Found';
    if (err?.response?.status === 500) return 'Server Error';
    if (err?.code === 'NETWORK_ERROR') return 'Network Error';
    return 'Error';
  };

  const message = getErrorMessage(error);
  const title = getErrorTitle(error);

  return (
    <Collapse in={open}>
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ 
          mb: 2,
          borderRadius: 2,
          animation: 'fadeIn 0.3s ease-in',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Collapse>
  );
}
