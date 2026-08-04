import { Container, Box, Typography, Card, CardContent, Divider, Chip, Stack } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HubIcon from '@mui/icons-material/Hub';

function SectionCard({ title, icon, children }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            GitLab Project Manager
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            A reporting workspace for leadership and QA automation teams to track merged work, contributor throughput, and repository-level delivery patterns from GitLab.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Leadership Dashboard" color="primary" variant="outlined" />
            <Chip label="GitLab Usage Report" color="primary" variant="outlined" />
            <Chip label="CSV/PDF Export" color="primary" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      <SectionCard title="What You Can Do" icon={<InsightsIcon color="primary" fontSize="small" />}>
        <Typography variant="body2" sx={{ mb: 1.2 }}>
          Use the Leadership Dashboard to monitor team delivery over time with KPI cards and charts.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1.2 }}>
          Use the GitLab Usage Report to run detailed merge activity queries with filters for project scope, dates, team members, branch, and merged-by user.
        </Typography>
        <Typography variant="body2">
          Export summary and detail datasets in CSV or PDF for leadership readouts and audit reviews.
        </Typography>
      </SectionCard>

      <SectionCard title="How To Use" icon={<FactCheckIcon color="primary" fontSize="small" />}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          1. Select a scope (project or automation group) and date range.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          2. Choose one or more users when building leadership views.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          3. Generate the report, review KPIs/charts, then drill into the detailed table.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          4. In GitLab Usage, click table headers to sort results and use search for quick filtering.
        </Typography>
        <Typography variant="body2">
          5. Export data for communication, handoff, or evidence capture.
        </Typography>
      </SectionCard>

      <SectionCard title="Data Sources" icon={<HubIcon color="primary" fontSize="small" />}>
        <Typography variant="body2" sx={{ mb: 1.2 }}>
          The app reads merge requests and related metadata from GitLab APIs via a FastAPI backend.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1.2 }}>
          Team member lookups and multi-repository aggregation are supported for automation group reporting.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tip: keep your GitLab token updated in Manage Token to ensure all endpoints return complete data.
        </Typography>
      </SectionCard>

      <Box sx={{ mt: 1, px: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Stack: React + Material UI frontend, FastAPI backend, GitLab API integration.
        </Typography>
      </Box>
    </Container>
  );
}
