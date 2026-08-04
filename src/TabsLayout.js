/**
 * TabsLayout - Main component with tabbed interface
 * Refactored with premium UI, search, filter, export, and dark mode support
 */
import { useState, useMemo, useEffect } from 'react';
import { 
  Autocomplete,
  Tabs, Tab, Box, Button, TextField, Typography, MenuItem, Select, 
  InputLabel, FormControl, Card, CardContent, CardHeader, Divider, 
  IconButton, Tooltip, Chip, Stack, Fade, ToggleButtonGroup, ToggleButton,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled } from '@mui/material/styles';

import {
  fetchMergeRequests,
  fetchCommits,
  fetchBranches,
  fetchPipelines,
  fetchUsers,
  fetchProject,
  fetchTeamMergeReport,
  fetchTeamMembers
} from './api';
import { PROJECTS, TAB_CONFIG } from './utils/constants';
import { formatResult } from './utils/formatters';
import { 
  getMergeRequestHeaders, getCommitHeaders, getBranchHeaders, 
  getPipelineHeaders, getUserHeaders 
} from './utils/exporters';

// Components
import InfoTooltip from './components/InfoTooltip';
import SearchFilter from './components/SearchFilter';
import ExportButton from './components/ExportButton';
import DatePresetSelector from './components/DatePresetSelector';
import ErrorAlert from './components/ErrorAlert';
import LoadingSpinner from './components/LoadingSpinner';
import DarkModeToggle from './components/DarkModeToggle';

const apiMap = {
  mergeRequests: fetchMergeRequests,
  commits: fetchCommits,
  branches: fetchBranches,
  pipelines: fetchPipelines,
  users: fetchUsers,
  project: fetchProject,
  teamMergeReport: fetchTeamMergeReport,
};

const StyledTabsContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(3),
  '& .MuiTabs-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(30, 41, 59, 0.8)' 
      : 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: theme.spacing(1),
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: 'fadeIn 0.5s ease-out',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

export default function TabsLayout() {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(0);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);
  const [filteredResult, setFilteredResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [teamMemberOptions, setTeamMemberOptions] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMemberInput, setTeamMemberInput] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  // MR state filter: which states to include (open, merged, closed)
  const [mrStateFilter, setMrStateFilter] = useState({ open: true, merged: true, closed: true });

  const currentTab = TAB_CONFIG[tab];

  // For Merge Requests: filter items by selected states (opened/merged/closed)
  const stateFilteredResult = useMemo(() => {
    if (currentTab.key !== 'mergeRequests' || !result?.items) return result;
    const allowed = [];
    if (mrStateFilter.open) allowed.push('opened');
    if (mrStateFilter.merged) allowed.push('merged');
    if (mrStateFilter.closed) allowed.push('closed');
    if (allowed.length === 0) return { ...result, items: [] };
    const items = result.items.filter(item => item.state && allowed.includes(item.state.toLowerCase()));
    return { ...result, items };
  }, [currentTab.key, result, mrStateFilter]);

  // Base result: state-filtered for MR, else raw result. Display = search-filtered or base.
  const baseResult = currentTab.key === 'mergeRequests' ? stateFilteredResult : result;
  const displayResult = filteredResult || baseResult;

  // Get export headers based on current tab
  const getExportHeaders = () => {
    switch (currentTab.key) {
      case 'mergeRequests':
        return getMergeRequestHeaders();
      case 'commits':
        return getCommitHeaders();
      case 'branches':
        return getBranchHeaders();
      case 'pipelines':
        return getPipelineHeaders();
      case 'users':
        return getUserHeaders();
      case 'teamMergeReport':
        return getMergeRequestHeaders();
      default:
        return [];
    }
  };

  // Get search fields based on current tab
  const getSearchFields = () => {
    switch (currentTab.key) {
      case 'mergeRequests':
        return ['title', 'author.name', 'source_branch', 'target_branch'];
      case 'commits':
        return ['title', 'author_name', 'message'];
      case 'branches':
        return ['name', 'author_name'];
      case 'pipelines':
        return ['ref', 'status'];
      case 'users':
        return ['name', 'username'];
      case 'teamMergeReport':
        return ['title', 'author.name', 'author.username', 'merged_by.name', 'source_branch', 'target_branch'];
      default:
        return [];
    }
  };

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (dates, presetLabel) => {
    setParams(prev => ({
      ...prev,
      start_date: dates.startDate,
      end_date: dates.endDate,
    }));
    setSelectedPreset(presetLabel);
  };

  useEffect(() => {
    let cancelled = false;

    const loadBranches = async () => {
      if (
        currentTab.key !== 'teamMergeReport' ||
        !params.project_id ||
        params.project_id === 'qa-automation-group'
      ) {
        setBranchOptions([]);
        setBranchesLoading(false);
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
  }, [currentTab.key, params.project_id]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const loadTeamMembers = async () => {
      if (currentTab.key !== 'teamMergeReport' || !params.project_id) {
        setTeamMemberOptions([]);
        setTeamMembersLoading(false);
        return;
      }

      setTeamMembersLoading(true);
      try {
        const { data } = await fetchTeamMembers({
          project_id: params.project_id,
          q: teamMemberInput || undefined,
          limit: 100,
        });
        if (!cancelled) {
          setTeamMemberOptions(data?.items || []);
        }
      } catch {
        if (!cancelled) setTeamMemberOptions([]);
      } finally {
        if (!cancelled) setTeamMembersLoading(false);
      }
    };

    timer = setTimeout(loadTeamMembers, 250);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [currentTab.key, params.project_id, teamMemberInput]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFilteredResult(null); // Clear filtered results when generating new data
    const tabKey = currentTab.key;
    const requestParams = { ...params };

    if (tabKey === 'teamMergeReport') {
      requestParams.team_members = selectedTeamMembers
        .map((member) => member.username || member.name)
        .filter(Boolean)
        .join(',');

      if (!requestParams.team_members) {
        delete requestParams.team_members;
      }
    }
    
    try {
      const { data } = await apiMap[tabKey](requestParams);
      setResult(data);
      // Clear filtered result so displayResult uses the new result
      setFilteredResult(null);
    } catch (e) {
      const errorMessage = e?.response?.data?.detail || e?.response?.data?.error || e?.message || 'Error fetching data';
      setError({ message: errorMessage, response: e?.response });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = typeof formatResult(displayResult, currentTab, params, PROJECTS) === 'string'
      ? formatResult(displayResult, currentTab, params, PROJECTS)
      : '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (e, newTab) => {
    setTab(newTab);
    setResult(null);
    setFilteredResult(null);
    setError(null);
    setParams({});
    setSelectedPreset(null);
    setBranchOptions([]);
    setBranchesLoading(false);
    setTeamMemberOptions([]);
    setTeamMemberInput('');
    setSelectedTeamMembers([]);
    setTeamMembersLoading(false);
  };

  const isFormValid = () => {
    if (!params.project_id) return false;
    if (currentTab.params.includes('start_date') && !params.start_date) return false;
    if (currentTab.params.includes('end_date') && !params.end_date) return false;
    return true;
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: 1400,
      minHeight: '100vh',
      p: { xs: 2, sm: 3, md: 4 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      margin: '0 auto',
    }}>
      {/* Header with Dark Mode Toggle */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          GitLab Project Manager
        </Typography>
        <DarkModeToggle />
      </Box>

      {/* Tabs */}
      <StyledTabsContainer>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
          }}
        >
          {TAB_CONFIG.map((t, i) => (
            <Tab 
              key={t.key} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t.label}
                  <InfoTooltip description={t.description} />
                </Box>
              } 
            />
          ))}
        </Tabs>
      </StyledTabsContainer>

      {/* Parameters Card */}
      <StyledCard>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5">{currentTab.label} Parameters</Typography>
              <InfoTooltip description={currentTab.description} />
            </Box>
          }
        />
        <Divider />
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3, maxWidth: 500 }}>
              {/* Date Presets for date range tabs */}
              {currentTab.params.includes('start_date') && currentTab.params.includes('end_date') && (
                <DatePresetSelector 
                  onSelect={handlePresetSelect}
                  selectedPreset={selectedPreset}
                />
              )}

              {currentTab.params.map((p) => {
                if (p === 'project_id') {
                  return (
                    <FormControl key={p} size="small" sx={{ width: '100%' }}>
                      <InputLabel id="project-select-label">Project</InputLabel>
                      <Select
                        labelId="project-select-label"
                        id="project-select"
                        value={params[p] || ''}
                        label="Project"
                        onChange={e => handleParamChange(p, e.target.value)}
                        required
                      >
                        {PROJECTS.map(proj => (
                          <MenuItem key={proj.id} value={proj.id}>{proj.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }
                if (p === 'start_date' || p === 'end_date') {
                  const label = p === 'start_date' ? 'Start Date' : 'End Date';
                  return (
                    <DatePicker
                      key={p}
                      label={label}
                      value={params[p] ? new Date(params[p]) : null}
                      onChange={date => {
                        const formatted = date ? new Date(date).toLocaleDateString('en-US') : '';
                        handleParamChange(p, formatted);
                      }}
                      format="MM/dd/yyyy"
                      slotProps={{
                        textField: {
                          size: 'small',
                          required: true,
                          fullWidth: true,
                        }
                      }}
                    />
                  );
                }
                if (p === 'target_branch' && currentTab.key === 'teamMergeReport') {
                  return (
                    <FormControl key={p} size="small" sx={{ width: '100%' }}>
                      <InputLabel id="target-branch-select-label">Target Branch (Optional)</InputLabel>
                      <Select
                        labelId="target-branch-select-label"
                        id="target-branch-select"
                        value={params[p] || ''}
                        label="Target Branch (Optional)"
                        onChange={e => handleParamChange(p, e.target.value)}
                        disabled={!params.project_id || branchesLoading}
                      >
                        <MenuItem value="">All Branches</MenuItem>
                        {branchOptions.map(branchName => (
                          <MenuItem key={branchName} value={branchName}>{branchName}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }
                if (p === 'team_members') {
                  return (
                    <Autocomplete
                      key={p}
                      multiple
                      options={teamMemberOptions}
                      loading={teamMembersLoading}
                      value={selectedTeamMembers}
                      inputValue={teamMemberInput}
                      onInputChange={(_, newInputValue) => setTeamMemberInput(newInputValue)}
                      onChange={(_, newValue) => {
                        setSelectedTeamMembers(newValue);
                        handleParamChange(
                          'team_members',
                          newValue.map((member) => member.username || member.name).filter(Boolean)
                        );
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => option?.name || option?.username || ''}
                      noOptionsText={teamMemberInput ? 'No matching team members' : 'Start typing a name'}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Typography variant="body2">{option.name || option.username || ''}</Typography>
                        </Box>
                      )}
                      renderInput={(inputParams) => (
                        <TextField
                          {...inputParams}
                          label="Team Members (Optional)"
                          placeholder="Type: venk"
                          helperText="Type to search and select multiple team members"
                          size="small"
                          fullWidth
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
                  );
                }
                if (p === 'merged_by') {
                  return (
                    <TextField
                      key={p}
                      label="Merged By (Optional)"
                      value={params[p] || ''}
                      onChange={e => handleParamChange(p, e.target.value)}
                      placeholder="Example: your GitLab username"
                      size="small"
                      fullWidth
                    />
                  );
                }
                return (
                  <TextField
                    key={p}
                    label={p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={params[p] || ''}
                    onChange={e => handleParamChange(p, e.target.value)}
                    size="small"
                    fullWidth
                  />
                );
              })}
            </Box>
          </LocalizationProvider>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={loading || !isFormValid()}
            startIcon={loading ? null : <PlayArrowIcon />}
            sx={{ 
              px: 4, 
              py: 1.5, 
              fontSize: 16, 
              fontWeight: 600,
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              '&:hover:not(:disabled)': {
                transform: 'scale(1.05)',
                boxShadow: 6,
              },
              '&:active:not(:disabled)': {
                transform: 'scale(0.98)',
              },
              animation: loading ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }}
          >
            {loading ? 'Loading...' : 'Generate'}
          </Button>
        </CardContent>
      </StyledCard>

      {/* Error Alert */}
      <ErrorAlert error={error} onClose={() => setError(null)} />

      {/* Loading Spinner */}
      {loading && <LoadingSpinner message="Fetching data from GitLab..." />}

      {/* Results Card */}
      {displayResult && !loading && (
        <Fade in={true} timeout={600}>
          <StyledCard
            sx={{
              animation: 'slideInUp 0.5s ease-out',
              '@keyframes slideInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" color="primary.main" fontWeight={700}>
                    {currentTab.label} Results
                  </Typography>
                  {displayResult.items && (
                    <Chip 
                      label={`${displayResult.items.length} items`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              }
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  {displayResult.items && displayResult.items.length > 0 && (
                    <ExportButton
                      data={displayResult.items}
                      headers={getExportHeaders()}
                      filename={`${currentTab.key}-${params.project_id}`}
                    />
                  )}
                  <Tooltip title={copied ? "Copied!" : "Copy results"} arrow>
                    <IconButton
                      aria-label="copy"
                      onClick={handleCopy}
                      color={copied ? 'success' : 'default'}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            />
            <Divider />
            <CardContent>
              {/* Search Filter - Always visible when we have results */}
              {/* MR state filter: Open / Merged / Closed - only for Merge Requests tab */}
              {currentTab.key === 'mergeRequests' && baseResult?.items && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Filter by state (select one or more):
                  </Typography>
                  <ToggleButtonGroup
                    value={['open', 'merged', 'closed'].filter(k => mrStateFilter[k])}
                    onChange={(_, newValues) => {
                      if (newValues === null) return;
                      setMrStateFilter({
                        open: newValues.includes('open'),
                        merged: newValues.includes('merged'),
                        closed: newValues.includes('closed'),
                      });
                      setFilteredResult(null);
                    }}
                    aria-label="MR state filter"
                    sx={{ flexWrap: 'wrap', gap: 0.5 }}
                  >
                    <ToggleButton value="open" aria-label="Open">
                      Open
                    </ToggleButton>
                    <ToggleButton value="merged" aria-label="Merged">
                      Merged
                    </ToggleButton>
                    <ToggleButton value="closed" aria-label="Closed">
                      Closed
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {displayResult && displayResult.items && Array.isArray(displayResult.items) && (
                <SearchFilter
                  data={baseResult?.items ?? displayResult.items}
                  onFiltered={(filteredItems) => {
                    const originalResult = baseResult || displayResult;
                    if (filteredItems && Array.isArray(filteredItems)) {
                      setFilteredResult({ ...originalResult, items: filteredItems });
                    } else {
                      setFilteredResult(null);
                    }
                  }}
                  searchFields={getSearchFields()}
                  placeholder={`Search ${currentTab.label.toLowerCase()}...`}
                />
              )}

              {/* Results Display */}
              {currentTab.key === 'teamMergeReport' && Array.isArray(displayResult.items) && displayResult.items.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360, mb: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Author</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Merged By</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Source Branch</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Target Branch</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Merged At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>URL</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayResult.items.map((item) => (
                        <TableRow key={`${item.id}-${item.web_url}`}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.state}</TableCell>
                          <TableCell>{item.author?.name || item.author?.username || ''}</TableCell>
                          <TableCell>{item.merged_by?.name || item.merged_by?.username || ''}</TableCell>
                          <TableCell>{item.source_branch}</TableCell>
                          <TableCell>{item.target_branch}</TableCell>
                          <TableCell>{item.created_at}</TableCell>
                          <TableCell>{item.merged_at}</TableCell>
                          <TableCell>
                            <a href={item.web_url} target="_blank" rel="noreferrer">Open</a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ 
                fontFamily: 'monospace', 
                fontSize: 14, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                p: 2,
                borderRadius: 2,
                backgroundColor: 'background.default',
                maxHeight: '70vh',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  },
                },
              }}>
                {formatResult(displayResult, currentTab, params, PROJECTS)}
              </Box>

              {/* Empty State */}
              {(!displayResult.items || displayResult.items.length === 0) && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No results found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or date range
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Fade>
      )}
    </Box>
  );
}
