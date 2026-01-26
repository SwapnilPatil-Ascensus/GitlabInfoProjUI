/**
 * AboutPage component - Information about the application
 */
import { Container, Box, Typography, Card, CardContent, Paper, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import GitHubIcon from '@mui/icons-material/GitHub';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BugReportIcon from '@mui/icons-material/BugReport';
import TimelineIcon from '@mui/icons-material/Timeline';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

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

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
              <GitHubIcon sx={{ fontSize: 64, color: 'primary.main' }} />
            </Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              GitLab Project Manager
            </Typography>
            <Typography variant="h6" color="text.secondary">
              A premium web application for GitLab project analytics and automation bug tracking
            </Typography>
          </Box>
        </CardContent>
      </HeaderCard>

      <StyledCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            About This Application
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" paragraph>
            GitLab Project Manager is a modern, full-stack web application designed to help teams 
            track GitLab project activity and identify changes that may have caused automation failures. 
            It provides a comprehensive interface for analyzing merge requests, commits, branches, 
            pipelines, and project information within specific timeframes.
          </Typography>
          <Typography variant="body1" paragraph>
            This utility is specifically designed for <strong>automation bug tracking</strong> - 
            helping teams identify the last check-ins between timeframes that might be causing breakage 
            in any project or repository. By providing detailed, formatted reports with all relevant 
            information, it makes it easier to pinpoint which changes actually broke the system.
          </Typography>
        </CardContent>
      </StyledCard>

      <StyledCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Key Features
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <FeatureBox>
            <AnalyticsIcon color="primary" />
            <Box>
              <Typography variant="h6" gutterBottom>
                Comprehensive GitLab Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access merge requests, commits, branches, pipelines, users, and project details 
                directly from your GitLab instance. Filter by date ranges and get detailed information 
                about each change.
              </Typography>
            </Box>
          </FeatureBox>

          <FeatureBox>
            <BugReportIcon color="primary" />
            <Box>
              <Typography variant="h6" gutterBottom>
                Automation Bug Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Identify the last check-ins between timeframes that might be causing breakage. 
                Get formatted reports with author information, reviewers, merge status, and timestamps 
                to quickly identify problematic changes.
              </Typography>
            </Box>
          </FeatureBox>

          <FeatureBox>
            <TimelineIcon color="primary" />
            <Box>
              <Typography variant="h6" gutterBottom>
                Time-based Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filter merge requests and commits by specific date ranges. Use quick presets (Today, 
                Last 7/30/90 days) or select custom date ranges for precise analysis.
              </Typography>
            </Box>
          </FeatureBox>
        </CardContent>
      </StyledCard>

      <StyledCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            How It Works
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" component="div">
            <ol>
              <li style={{ marginBottom: '12px' }}>
                <strong>Select a Project:</strong> Choose a GitLab project from the dropdown menu.
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Set Date Range:</strong> For Merge Requests and Commits, select start and end dates 
                or use quick presets.
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Choose Data Type:</strong> Navigate to the desired tab (Merge Requests, Commits, 
                Branches, Pipelines, Users, or Project Details).
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Generate Report:</strong> Click the "Generate" button to fetch and display the data.
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Analyze Results:</strong> View formatted results with all relevant information. 
                Use search/filter to find specific items, export to CSV/Excel, or copy to clipboard.
              </li>
            </ol>
          </Typography>
        </CardContent>
      </StyledCard>

      <StyledCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Technology Stack
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" paragraph>
            <strong>Backend:</strong> FastAPI (Python) - High-performance REST API with automatic 
            documentation, input validation, and caching.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Frontend:</strong> React 19 + Material-UI v7 - Modern, premium UI with dark mode 
            support, search, filter, and export capabilities.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>API Integration:</strong> GitLab API v4 - Direct integration with GitLab for real-time data.
          </Typography>
        </CardContent>
      </StyledCard>

      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          For detailed documentation, setup instructions, and API reference, please refer to the 
          documentation in the <code>docs/</code> directory or visit the project repository.
        </Typography>
      </Paper>
    </Container>
  );
}
