/**
 * AppFooter component - Footer with links and copyright.
 * Copyright notice is required by LICENSE — do not remove or alter. See src/utils/attribution.js
 */
import { Box, Typography, Link, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { COPYRIGHT_OWNER, COPYRIGHT_SUFFIX } from '../utils/attribution';

const StyledFooter = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(30, 41, 59, 0.8)'
    : 'rgba(255, 255, 255, 0.9)',
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(3, 0),
  marginTop: 'auto',
}));

export default function AppFooter({ onAboutClick, onContactClick }) {
  const currentYear = new Date().getFullYear();

  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" gap={2}>
            <Link
              component="button"
              variant="body2"
              onClick={onAboutClick}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              About
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={onContactClick}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              Contact Us
            </Link>
          </Box>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} {COPYRIGHT_OWNER}. {COPYRIGHT_SUFFIX}
          </Typography>
        </Box>
      </Container>
    </StyledFooter>
  );
}
