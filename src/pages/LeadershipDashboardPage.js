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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { fetchTeamMembers, fetchUserWorkDashboard } from '../api';
import { PROJECTS } from '../utils/constants';
import { formatEST } from '../utils/formatters';
import { exportToCSV, exportToPDF } from '../utils/exporters';
import ErrorAlert from '../components/ErrorAlert';

const CHART_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];

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

function StatCard({ title, value, subtitle, accent }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderTop: `4px solid ${accent || '#2563eb'}`,
      }}
    >
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>{value}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
      </CardContent>
    </Card>
  );
}

function toShortDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
}

function averageLeadTimeHours(items) {
  const hours = (items || [])
    .map((item) => {
      const created = new Date(item.created_at);
      const merged = new Date(item.merged_at);
      if (Number.isNaN(created.getTime()) || Number.isNaN(merged.getTime())) return null;
      const diffHours = (merged.getTime() - created.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 ? diffHours : null;
    })
    .filter((v) => v !== null);

  if (!hours.length) return 0;
  const avg = hours.reduce((sum, val) => sum + val, 0) / hours.length;
  return Math.round(avg * 10) / 10;
}

function getUserShareData(perUser) {
  const total = (perUser || []).reduce((sum, row) => sum + (row.total_merged_mrs || 0), 0);
  return (perUser || []).map((row) => {
    const value = row.total_merged_mrs || 0;
    const share = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
    return { ...row, share };
  });
}

function getMultiUserTrendData(timelineRows, perUserRows) {
  const fallbackUsers = (perUserRows || []).map((r) => r.user).filter(Boolean);
  const users = new Set(fallbackUsers);

  (timelineRows || []).forEach((row) => {
    Object.keys(row || {}).forEach((k) => {
      if (k !== 'date') users.add(k);
    });
  });

  const userList = Array.from(users);
  const data = (timelineRows || []).map((row) => {
    const point = { date: toShortDate(row.date) };
    userList.forEach((user) => {
      point[user] = Number(row[user] || 0);
    });

    point.total = userList.reduce((sum, user) => sum + point[user], 0);
    return point;
  });

  return { userList, data };
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
        if (!cancelled) setUserOptions(data?.items || []);
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

  const totalMerged = dashboardData?.summary?.total_merged_mrs || 0;
  const usersCount = dashboardData?.summary?.users_count || 0;
  const reposCount = dashboardData?.summary?.unique_repos || 0;
  const items = dashboardData?.items || [];
  const avgLeadHours = averageLeadTimeHours(items);
  const mergedToMain = items.filter((item) => (item.target_branch || '').toLowerCase() === 'main').length;
  const mainPct = totalMerged > 0 ? Math.round((mergedToMain / totalMerged) * 100) : 0;

  const trend = useMemo(
    () => getMultiUserTrendData(dashboardData?.timeline || [], dashboardData?.per_user || []),
    [dashboardData]
  );

  const repoChartData = useMemo(
    () => (dashboardData?.repo_breakdown || []).slice(0, 8).map((r) => ({
      repo: r.repo_path.split('/').slice(-1)[0] || r.repo_path,
      count: r.count,
      fullRepo: r.repo_path,
    })),
    [dashboardData]
  );

  const userShareData = useMemo(
    () => getUserShareData(dashboardData?.per_user || []),
    [dashboardData]
  );

  const topUser = userShareData[0];

  return (
    <Box sx={{ width: '100%', maxWidth: '2100px', p: { xs: 2, md: 4 }, mx: 'auto' }}>
      <Stack spacing={1.2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'common.white' }}>Leadership Work Dashboard</Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.92)', maxWidth: '1200px' }}>
          Executive view of delivery throughput, contributor balance, repository distribution, and cycle-time efficiency.
          Select users and a date range to evaluate team value delivery from merged GitLab work.
        </Typography>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} lg={3}>
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

              <Grid item xs={12} sm={6} lg={2}>
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

              <Grid item xs={12} sm={6} lg={2}>
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

              <Grid item xs={12} lg={4}>
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

              <Grid item xs={12} lg={1}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!canRun || loading}
                  startIcon={<PlayArrowIcon />}
                  onClick={handleGenerate}
                  sx={{ height: 40, mt: { lg: 0.5 } }}
                >
                  {loading ? 'Loading' : 'Generate'}
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
            <Grid item xs={6} md={3} lg={2}>
              <StatCard title="Scope" value={projectName} subtitle="Selected reporting scope" accent="#8b5cf6" />
            </Grid>
            <Grid item xs={6} md={3} lg={2}>
              <StatCard title="Merged MRs" value={totalMerged} subtitle="Total delivery count" accent="#2563eb" />
            </Grid>
            <Grid item xs={6} md={3} lg={2}>
              <StatCard title="Active Users" value={usersCount} subtitle="Contributors selected" accent="#0ea5e9" />
            </Grid>
            <Grid item xs={6} md={3} lg={2}>
              <StatCard title="Repos Touched" value={reposCount} subtitle="Unique repositories" accent="#10b981" />
            </Grid>
            <Grid item xs={6} md={3} lg={2}>
              <StatCard title="Main Branch Share" value={`${mainPct}%`} subtitle={`${mergedToMain} of ${totalMerged} merges`} accent="#f59e0b" />
            </Grid>
            <Grid item xs={6} md={3} lg={2}>
              <StatCard title="Avg Lead Time" value={`${avgLeadHours}h`} subtitle="Created to merged" accent="#ef4444" />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={7}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <TrendingUpIcon color="primary" fontSize="small" />
                    <Typography variant="h6">Merge Trend by User (Daily)</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tracks daily merged work per selected contributor to show consistency, spikes, and cross-user distribution.
                  </Typography>
                  <Box sx={{ height: 360 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        {trend.userList.map((user, idx) => (
                          <Line
                            key={user}
                            type="monotone"
                            dataKey={user}
                            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#111827"
                          strokeDasharray="5 3"
                          strokeWidth={2}
                          dot={false}
                          name="Total"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Contribution Share by User</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Percentage split of merged delivery across selected contributors.
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userShareData}
                          dataKey="total_merged_mrs"
                          nameKey="user"
                          innerRadius={60}
                          outerRadius={96}
                          paddingAngle={2}
                          label={({ user, share }) => `${user}: ${share}%`}
                        >
                          {userShareData.map((entry, idx) => (
                            <Cell key={`slice-${entry.user}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, _, props) => [`${value} merged`, props?.payload?.user || 'User']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  {topUser ? (
                    <Chip
                      color="primary"
                      variant="outlined"
                      label={`Top contributor: ${topUser.user} (${topUser.total_merged_mrs} merged)`}
                    />
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Per-User Throughput</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Compares total merged vs merged-to-main volume for each selected user.
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.per_user || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                        <XAxis dataKey="user" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_merged_mrs" fill="#2563eb" name="Total Merged" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="merged_to_main" fill="#14b8a6" name="Merged to Main" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Repository Load Distribution</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Highlights which repositories carry most merged delivery volume.
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={repoChartData} layout="vertical" margin={{ top: 10, right: 28, left: 36, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="repo" width={190} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value, _, payload) => [`${value} merged`, payload?.payload?.fullRepo || 'Repo']} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
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
                      <TableRow key={row.user} hover>
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
                    onClick={() => exportToPDF(items || [], workItemHeaders, 'merged-work-items.pdf', 'Merged Work Items')}
                  >
                    PDF
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(items || [], workItemHeaders, 'merged-work-items.csv')}
                  >
                    CSV
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {workItemHeaders.map((h) => (
                        <TableCell key={h.key} sx={{ fontWeight: 700, backgroundColor: 'background.paper', zIndex: 1 }}>{h.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={`${item.id}-${item.web_url}`} hover>
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
