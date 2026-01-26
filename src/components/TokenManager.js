/**
 * TokenManager component - Manage GitLab token from UI
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Box,
  Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export default function TokenManager({ open, onClose }) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenStatus, setTokenStatus] = useState(null);

  useEffect(() => {
    if (open) {
      fetchTokenStatus();
    }
  }, [open]);

  const fetchTokenStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/config/token`);
      if (response.ok) {
        const data = await response.json();
        setTokenStatus(data);
      }
    } catch (err) {
      console.error('Error fetching token status:', err);
    }
  };

  const handleSave = async () => {
    if (!token || token.trim().length < 10) {
      setError('Token must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/config/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (response.ok) {
        setSuccess('Token updated successfully! The application will use the new token.');
        setTimeout(() => {
          onClose();
          setToken('');
          setSuccess('');
          // Reload page to ensure new token is used
          window.location.reload();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update token');
      }
    } catch (err) {
      setError('Failed to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToken('');
    setError('');
    setSuccess('');
    setShowToken(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VpnKeyIcon />
          <Typography variant="h6">Manage GitLab Token</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {tokenStatus && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Current token: {tokenStatus.has_token ? tokenStatus.token_preview : 'Not set'}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="GitLab Personal Access Token"
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your GitLab token (glpat-...)"
          margin="normal"
          helperText="Get your token from: https://gitlab.com/-/user_settings/personal_access_tokens"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowToken(!showToken)}
                  edge="end"
                >
                  {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !token.trim()}
        >
          {loading ? 'Saving...' : 'Save Token'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
