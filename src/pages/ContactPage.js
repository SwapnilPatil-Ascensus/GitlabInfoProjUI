/**
 * ContactPage component - Contact information
 */
import { Container, Box, Typography, Card, CardContent, Paper, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';

const HeaderCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[6],
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 255, 0.95) 100%)',
  animation: 'fadeInDown 0.6s ease-out',
  '@keyframes fadeInDown': {
    from: {
      opacity: 0,
      transform: 'translateY(-20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
}));

const ContactInfoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.05)' 
    : 'rgba(0, 0, 0, 0.02)',
  borderRadius: theme.shape.borderRadius,
}));

export default function ContactPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <HeaderCard>
        <CardContent>
          <Box textAlign="center">
            <Box
              sx={{
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                },
                display: 'inline-block',
                mb: 2,
              }}
            >
              <PersonIcon sx={{ fontSize: 64, color: 'primary.main' }} />
            </Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Contact Us
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Get in touch for questions, feedback, or support
            </Typography>
          </Box>
        </CardContent>
      </HeaderCard>

      <StyledCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Contact Information
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <ContactInfoBox>
            <PersonIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Swapnil Patil
              </Typography>
            </Box>
          </ContactInfoBox>

          <ContactInfoBox>
            <EmailIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Email
              </Typography>
              <Typography 
                variant="body1" 
                component="a" 
                href="mailto:swapnil.patil@ascensus.com"
                sx={{ 
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                swapnil.patil@ascensus.com
              </Typography>
            </Box>
          </ContactInfoBox>
        </CardContent>
      </StyledCard>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          How to Reach Us
        </Typography>
        <Typography variant="body1" paragraph>
          For questions about the application, feature requests, bug reports, or general inquiries, 
          please feel free to reach out via email. We'll do our best to respond in a timely manner.
        </Typography>
        <Typography variant="body1" paragraph>
          If you're experiencing issues with the application, please check the troubleshooting section 
          in the documentation first, as many common issues can be resolved quickly.
        </Typography>
      </Paper>
    </Container>
  );
}
