/**
 * TabsLayout - Main component with tabbed interface
 * Refactored with premium UI, search, filter, export, and dark mode support
 */
import { useState, useMemo } from 'react';
import { 
  Tabs, Tab, Box, Button, TextField, Typography, MenuItem, Select, 
  InputLabel, FormControl, Card, CardContent, CardHeader, Divider, 
  IconButton, Tooltip, Chip, Stack, Fade
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
  fetchProject
} from './api';
import { PROJECTS, TAB_CONFIG } from './utils/constants';
import { formatResult, getDatePreset } from './utils/formatters';
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

  const currentTab = TAB_CONFIG[tab];
  // Use filtered result if available, otherwise use original result
  const displayResult = filteredResult || result;

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

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFilteredResult(null); // Clear filtered results when generating new data
    const tabKey = currentTab.key;
    
    try {
      const { data } = await apiMap[tabKey](params);
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
              {displayResult && displayResult.items && Array.isArray(displayResult.items) && (
                <SearchFilter
                  data={result?.items || displayResult.items}
                  onFiltered={(filteredItems) => {
                    // Always use the original result as base, not displayResult
                    const originalResult = result || displayResult;
                    if (filteredItems && Array.isArray(filteredItems)) {
                      // Update filtered result with filtered items
                      setFilteredResult({ ...originalResult, items: filteredItems });
                    } else {
                      // If no filtered items, clear filter to show original
                      setFilteredResult(null);
                    }
                  }}
                  searchFields={getSearchFields()}
                  placeholder={`Search ${currentTab.label.toLowerCase()}...`}
                />
              )}

              {/* Results Display */}
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
