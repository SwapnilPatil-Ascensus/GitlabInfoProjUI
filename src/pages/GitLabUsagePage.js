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
  Tooltip,
  IconButton,
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
  TablePagination,
  TableSortLabel,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { fetchBranches, fetchTeamMembers, fetchTeamMergeReport } from '../api';
import { PROJECTS } from '../utils/constants';
import { formatEST } from '../utils/formatters';
import { exportToCSV, exportToPDF } from '../utils/exporters';
import ErrorAlert from '../components/ErrorAlert';

const tableHeaders = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'state', label: 'State' },
  { key: 'author', label: 'Author', transform: (v) => v?.name || v?.username || '' },
  { key: 'merged_by', label: 'Merged By', transform: (v) => v?.name || v?.username || '' },
  { key: 'source_branch', label: 'Source Branch' },
  { key: 'target_branch', label: 'Target Branch' },
  { key: 'created_at', label: 'Created At', transform: (v) => formatEST(v) },
  { key: 'merged_at', label: 'Merged At', transform: (v) => formatEST(v) },
  { key: 'web_url', label: 'URL' },
];

function normalize(text) {
  return String(text || '').toLowerCase();
}

function FieldHelpLabel({ label, help, required = false }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
        {label}
        {required ? <Box component="span" sx={{ color: 'error.main' }}> *</Box> : null}
      </Typography>
      <Tooltip title={help} arrow>
        <IconButton size="small" sx={{ p: 0.2 }}>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function GitLabUsagePage() {
  const [params, setParams] = useState({
    project_id: 'qa-automation-group',
    start_date: '',
    end_date: '',
    target_branch: '',
    merged_by: '',
  });
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [teamMemberInput, setTeamMemberInput] = useState('');
  const [teamMemberOptions, setTeamMemberOptions] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortBy, setSortBy] = useState('merged_at');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    let cancelled = false;
    const loadBranches = async () => {
      if (!params.project_id || params.project_id === 'qa-automation-group') {
        setBranchOptions([]);
        return;
      }

      setBranchesLoading(true);
      try {
        const { data } = await fetchBranches({ project_id: params.project_id });
        if (cancelled) return;
        const names = (data?.items || [])
          .map((b) => b.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setBranchOptions(names);
      } catch {
        if (!cancelled) setBranchOptions([]);
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };

    loadBranches();
    return () => {
      cancelled = true;
    };
  }, [params.project_id]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!params.project_id) {
        setTeamMemberOptions([]);
        return;
      }

      setTeamMembersLoading(true);
      try {
        const { data } = await fetchTeamMembers({
          project_id: params.project_id,
          q: teamMemberInput || undefined,
          limit: 100,
        });
        if (!cancelled) setTeamMemberOptions(data?.items || []);
      } catch {
        if (!cancelled) setTeamMemberOptions([]);
      } finally {
        if (!cancelled) setTeamMembersLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [params.project_id, teamMemberInput]);

  const canRun = Boolean(params.project_id && params.start_date && params.end_date);

  const filteredItems = useMemo(() => {
    const items = result?.items || [];
    if (!searchText.trim()) return items;

    const q = normalize(searchText);
    return items.filter((item) => [
      item.id,
      item.title,
      item.state,
      item.author?.name,
      item.author?.username,
      item.merged_by?.name,
      item.merged_by?.username,
      item.source_branch,
      item.target_branch,
      item.web_url,
      item.created_at,
      item.merged_at,
    ].some((v) => normalize(v).includes(q)));
  }, [result, searchText]);

  const sortedItems = useMemo(() => {
    const getSortValue = (item, key) => {
      switch (key) {
        case 'author':
          return item.author?.name || item.author?.username || '';
        case 'merged_by':
          return item.merged_by?.name || item.merged_by?.username || '';
        case 'created_at':
        case 'merged_at': {
          const t = new Date(item[key] || '').getTime();
          return Number.isNaN(t) ? 0 : t;
        }
        default:
          return item[key] ?? '';
      }
    };

    const directionFactor = sortDirection === 'asc' ? 1 : -1;
    return [...filteredItems].sort((a, b) => {
      const aVal = getSortValue(a, sortBy);
      const bVal = getSortValue(b, sortBy);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * directionFactor;
      }

      return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' }) * directionFactor;
    });
  }, [filteredItems, sortBy, sortDirection]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [sortedItems, page, rowsPerPage]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPage(0);

    const requestParams = {
      ...params,
      team_members: selectedTeamMembers
        .map((member) => member.username || member.name)
        .filter(Boolean)
        .join(','),
    };

    if (!requestParams.team_members) delete requestParams.team_members;
    if (!requestParams.target_branch) delete requestParams.target_branch;
    if (!requestParams.merged_by) delete requestParams.merged_by;

    try {
      const { data } = await fetchTeamMergeReport(requestParams);
      setResult(data);
    } catch (e) {
      const errorMessage = e?.response?.data?.detail || e?.response?.data?.error || e?.message || 'Error fetching team merge report';
      setError({ message: errorMessage, response: e?.response });
    } finally {
      setLoading(false);
    }
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, p: { xs: 2, md: 3 }, mx: 'auto' }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'common.white' }}>GitLab Usage Report</Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Team merge activity with focused table output for audits and leadership review.
          Use filters, search results quickly, and export only in CSV or PDF.
        </Typography>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} lg={3}>
                <FieldHelpLabel
                  label="Project Scope"
                  required
                  help="Choose a project or group scope. This controls where merge activity is collected from."
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="usage-project-label">Project Scope</InputLabel>
                  <Select
                    labelId="usage-project-label"
                    value={params.project_id}
                    label="Project Scope"
                    onChange={(e) => {
                      setParams((prev) => ({ ...prev, project_id: e.target.value, target_branch: '' }));
                      setSelectedTeamMembers([]);
                    }}
                  >
                    {PROJECTS.map((proj) => (
                      <MenuItem key={proj.id} value={proj.id}>{proj.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} lg={2}>
                <FieldHelpLabel
                  label="Start Date"
                  required
                  help="Beginning of the reporting window. Only merged requests on or after this date are included."
                />
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
                <FieldHelpLabel
                  label="End Date"
                  required
                  help="End of the reporting window. Only merged requests on or before this date are included."
                />
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

              <Grid item xs={12} lg={5}>
                <FieldHelpLabel
                  label="Team Members"
                  help="Optional filter. Select one or more users to limit results to specific contributors."
                />
                <Autocomplete
                  multiple
                  options={teamMemberOptions}
                  value={selectedTeamMembers}
                  loading={teamMembersLoading}
                  inputValue={teamMemberInput}
                  onInputChange={(_, value) => setTeamMemberInput(value)}
                  onChange={(_, values) => setSelectedTeamMembers(values)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  getOptionLabel={(option) => option?.name || option?.username || ''}
                  renderInput={(inputParams) => (
                    <TextField
                      {...inputParams}
                      size="small"
                      label="Team Members (Optional)"
                      placeholder="Type a name"
                      InputProps={{
                        ...inputParams.InputProps,
                        endAdornment: (
                          <>
                            {teamMembersLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {inputParams.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4} lg={3}>
                <FieldHelpLabel
                  label="Target Branch"
                  help="Optional filter. Limit the report to MRs merged into a specific target branch."
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="usage-branch-label">Target Branch (Optional)</InputLabel>
                  <Select
                    labelId="usage-branch-label"
                    label="Target Branch (Optional)"
                    value={params.target_branch}
                    onChange={(e) => setParams((prev) => ({ ...prev, target_branch: e.target.value }))}
                    disabled={!params.project_id || branchesLoading}
                  >
                    <MenuItem value="">All Branches</MenuItem>
                    {branchOptions.map((branch) => (
                      <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4} lg={3}>
                <FieldHelpLabel
                  label="Merged By"
                  help="Optional filter. Enter the GitLab username of the approver/merger to audit merge ownership."
                />
                <TextField
                  size="small"
                  label="Merged By (Optional)"
                  value={params.merged_by}
                  onChange={(e) => setParams((prev) => ({ ...prev, merged_by: e.target.value }))}
                  fullWidth
                  placeholder="GitLab username"
                />
              </Grid>

              <Grid item xs={12} md={4} lg={4}>
                <FieldHelpLabel
                  label="Search Results"
                  help="Client-side search across title, state, author, merged by, branches, dates, and URL."
                />
                <TextField
                  size="small"
                  label="Search Results"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPage(0);
                  }}
                  fullWidth
                  placeholder="Search title, user, branch..."
                />
              </Grid>

              <Grid item xs={12} lg={2}>
                <FieldHelpLabel
                  label="Run Report"
                  help="Runs the query with current filter criteria and refreshes the table and exports."
                />
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!canRun || loading}
                  startIcon={<PlayArrowIcon />}
                  onClick={handleGenerate}
                  sx={{ height: 40 }}
                >
                  {loading ? 'Loading...' : 'Generate'}
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </CardContent>
      </Card>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      {result && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Team Merge Activity</Typography>
                <Chip size="small" variant="outlined" color="primary" label={`${filteredItems.length} items`} />
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<DescriptionIcon />}
                  onClick={() => exportToPDF(sortedItems, tableHeaders, 'team-merge-activity.pdf', 'Team Merge Activity')}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportToCSV(sortedItems, tableHeaders, 'team-merge-activity.csv')}
                >
                  CSV
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 620 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1300, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((h) => (
                      <TableCell
                        key={h.key}
                        sx={{
                          fontWeight: 700,
                          backgroundColor: 'background.paper',
                          zIndex: 1,
                        }}
                      >
                        <TableSortLabel
                          active={sortBy === h.key}
                          direction={sortBy === h.key ? sortDirection : 'asc'}
                          onClick={() => handleSort(h.key)}
                        >
                          {h.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={`${item.id}-${item.web_url}`} hover>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.state}</TableCell>
                      <TableCell>{item.author?.name || item.author?.username || ''}</TableCell>
                      <TableCell>{item.merged_by?.name || item.merged_by?.username || ''}</TableCell>
                      <TableCell>{item.source_branch}</TableCell>
                      <TableCell>{item.target_branch}</TableCell>
                      <TableCell>{formatEST(item.created_at)}</TableCell>
                      <TableCell>{formatEST(item.merged_at)}</TableCell>
                      <TableCell>
                        <a href={item.web_url} target="_blank" rel="noreferrer">Open</a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={sortedItems.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 15, 25, 50]}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
