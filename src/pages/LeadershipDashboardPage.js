import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { fetchTeamMembers, fetchUserWorkDashboard } from '../api';
import { PROJECTS } from '../utils/constants';
import { formatEST } from '../utils/formatters';
import { exportToCSV, exportToPDF } from '../utils/exporters';
import ErrorAlert from '../components/ErrorAlert';

const userSummaryHeaders = [
  { key: 'user', label: 'User' },
  { key: 'total_merged_mrs', label: 'Merged MRs' },
  { key: 'merged_to_main', label: 'Merged to Main' },
  { key: 'repos_touched', label: 'Repos Touched' },
  { key: 'last_merged_at', label: 'Last Merged At', transform: (v) => formatEST(v) },
];

const workItemHeaders = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'state', label: 'State' },
  { key: 'author_name', label: 'Author' },
  { key: 'merged_by_name', label: 'Merged By' },
  { key: 'source_branch', label: 'Source Branch' },
  { key: 'target_branch', label: 'Target Branch' },
  { key: 'created_at', label: 'Created At', transform: (v) => formatEST(v) },
  { key: 'merged_at', label: 'Merged At', transform: (v) => formatEST(v) },
  { key: 'repo_path', label: 'Repository' },
  { key: 'web_url', label: 'URL' },
];

function StatCard({ title, value, subtitle }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{value}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
      </CardContent>
    </Card>
  );
}

function UserBarChart({ data }) {
  const maxVal = Math.max(1, ...(data || []).map((d) => d.total_merged_mrs || 0));

  return (
    <Stack spacing={1.5}>
      {(data || []).map((row) => {
        const widthPct = Math.max(2, Math.round(((row.total_merged_mrs || 0) / maxVal) * 100));
        return (
          <Box key={row.user}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.user}</Typography>
              <Typography variant="body2" color="text.secondary">{row.total_merged_mrs} merged</Typography>
            </Stack>
            <Box sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${widthPct}%`,
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, #2563eb, #0ea5e9)',
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function LeadershipDashboardPage() {
  const [params, setParams] = useState({
    project_id: 'qa-automation-group',
    start_date: '',
    end_date: '',
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!params.project_id) {
        setUserOptions([]);
        return;
      }

      setUsersLoading(true);
      try {
        const { data } = await fetchTeamMembers({
          project_id: params.project_id,
          q: userInput || undefined,
          limit: 100,
        });
        if (!cancelled) {
          setUserOptions(data?.items || []);
        }
      } catch {
        if (!cancelled) setUserOptions([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [params.project_id, userInput]);

  const canRun = Boolean(params.project_id && params.start_date && params.end_date && selectedUsers.length > 0);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const users = selectedUsers
        .map((u) => u.username || u.name)
        .filter(Boolean)
        .join(',');

      const { data } = await fetchUserWorkDashboard({
        ...params,
        users,
      });

      setDashboardData(data);
    } catch (e) {
      const errorMessage = e?.response?.data?.detail || e?.response?.data?.error || e?.message || 'Failed to load dashboard';
      setError({ message: errorMessage, response: e?.response });
    } finally {
      setLoading(false);
    }
  };

  const projectName = useMemo(() => {
    const match = PROJECTS.find((p) => p.id === params.project_id);
    return match ? match.name : params.project_id;
  }, [params.project_id]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, p: { xs: 2, md: 3 }, mx: 'auto' }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Leadership Work Dashboard</Typography>
        <Typography variant="body1" color="text.secondary">
          Leadership-oriented analytics for merged work delivery by selected users across GitLab repositories.
          Choose users and date range to visualize outcomes, review detailed activity, and export reports.
        </Typography>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="dashboard-project-label">Scope</InputLabel>
                  <Select
                    labelId="dashboard-project-label"
                    value={params.project_id}
                    label="Scope"
                    onChange={(e) => {
                      setParams((prev) => ({ ...prev, project_id: e.target.value }));
                      setSelectedUsers([]);
                    }}
                  >
                    {PROJECTS.map((proj) => (
                      <MenuItem key={proj.id} value={proj.id}>{proj.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Start Date"
                  value={params.start_date ? new Date(params.start_date) : null}
                  onChange={(date) => {
                    const value = date ? new Date(date).toLocaleDateString('en-US') : '';
                    setParams((prev) => ({ ...prev, start_date: value }));
                  }}
                  format="MM/dd/yyyy"
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="End Date"
                  value={params.end_date ? new Date(params.end_date) : null}
                  onChange={(date) => {
                    const value = date ? new Date(date).toLocaleDateString('en-US') : '';
                    setParams((prev) => ({ ...prev, end_date: value }));
                  }}
                  format="MM/dd/yyyy"
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={10}>
                <Autocomplete
                  multiple
                  options={userOptions}
                  value={selectedUsers}
                  loading={usersLoading}
                  inputValue={userInput}
                  onInputChange={(_, v) => setUserInput(v)}
                  onChange={(_, values) => setSelectedUsers(values)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  getOptionLabel={(option) => option?.name || option?.username || ''}
                  renderInput={(inputParams) => (
                    <TextField
                      {...inputParams}
                      size="small"
                      label="Users"
                      placeholder="Type user name"
                      helperText="Select one or more users"
                      InputProps={{
                        ...inputParams.InputProps,
                        endAdornment: (
                          <>
                            {usersLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {inputParams.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!canRun || loading}
                  startIcon={<PlayArrowIcon />}
                  onClick={handleGenerate}
                  sx={{ height: 40, mt: { md: 2.9 } }}
                >
                  {loading ? 'Loading...' : 'Generate'}
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </CardContent>
      </Card>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      {dashboardData && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StatCard title="Scope" value={projectName} subtitle="Selected reporting scope" />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard title="Merged MRs" value={dashboardData.summary?.total_merged_mrs || 0} />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard title="Users" value={dashboardData.summary?.users_count || 0} />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard title="Repositories" value={dashboardData.summary?.unique_repos || 0} />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Work Distribution by User</Typography>
                  <UserBarChart data={dashboardData.per_user || []} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Repository Contribution</Typography>
                  <Stack spacing={1}>
                    {(dashboardData.repo_breakdown || []).slice(0, 8).map((repo) => (
                      <Stack key={repo.repo_path} direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ mr: 2 }}>{repo.repo_path}</Typography>
                        <Chip size="small" label={`${repo.count} MRs`} />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Per-User Summary</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<DescriptionIcon />}
                    onClick={() => exportToPDF(dashboardData.per_user || [], userSummaryHeaders, 'user-summary.pdf', 'Per-User Summary')}
                  >
                    PDF
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(dashboardData.per_user || [], userSummaryHeaders, 'user-summary.csv')}
                  >
                    CSV
                  </Button>
                </Stack>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {userSummaryHeaders.map((h) => (
                        <TableCell key={h.key} sx={{ fontWeight: 700 }}>{h.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dashboardData.per_user || []).map((row) => (
                      <TableRow key={row.user}>
                        <TableCell>{row.user}</TableCell>
                        <TableCell>{row.total_merged_mrs}</TableCell>
                        <TableCell>{row.merged_to_main}</TableCell>
                        <TableCell>{row.repos_touched}</TableCell>
                        <TableCell>{formatEST(row.last_merged_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Detailed Merge Request Activity</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<DescriptionIcon />}
                    onClick={() => exportToPDF(dashboardData.items || [], workItemHeaders, 'merged-work-items.pdf', 'Merged Work Items')}
                  >
                    PDF
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(dashboardData.items || [], workItemHeaders, 'merged-work-items.csv')}
                  >
                    CSV
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {workItemHeaders.map((h) => (
                        <TableCell key={h.key} sx={{ fontWeight: 700 }}>{h.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dashboardData.items || []).map((item) => (
                      <TableRow key={`${item.id}-${item.web_url}`}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{item.state}</TableCell>
                        <TableCell>{item.author_name}</TableCell>
                        <TableCell>{item.merged_by_name}</TableCell>
                        <TableCell>{item.source_branch}</TableCell>
                        <TableCell>{item.target_branch}</TableCell>
                        <TableCell>{formatEST(item.created_at)}</TableCell>
                        <TableCell>{formatEST(item.merged_at)}</TableCell>
                        <TableCell>{item.repo_path}</TableCell>
                        <TableCell>
                          <a href={item.web_url} target="_blank" rel="noreferrer">Open</a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
