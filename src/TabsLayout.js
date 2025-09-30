import { useState } from 'react';
import { Tabs, Tab, Box, Button, TextField, Typography, MenuItem, Select, InputLabel, FormControl, Card, CardContent, CardHeader, Divider, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  fetchMergeRequests,
  fetchCommits,
  fetchBranches,
  fetchPipelines,
  fetchUsers,
  fetchProject
} from './api';
// Project list for dropdown (sorted alphabetically)
const PROJECTS = [
  { id: '70748405', name: 'astro-release-versions' },
  { id: '70014933', name: 'astro-release-versions-old' },
  { id: '65775762', name: 'featureflag_deployer' },
  { id: '64906744', name: 'dwcore' },
  { id: '64504551', name: 'empty' },
  { id: '62777796', name: 'unite-msc' },
  { id: '62214898', name: 'uii-releases' },
  { id: '62168680', name: 'uii-dbpr' },
  { id: '62141123', name: 'uii-tools-jenkins' },
  { id: '62141026', name: 'monolith-patching' },
  { id: '62096647', name: 'uii-devops' },
  { id: '62084299', name: 'uii-tools' },
  { id: '62041266', name: 'uii-extras' },
  { id: '62009521', name: 'tmp-configuration' },
  { id: '61826050', name: 'monolith-deploy' },
  { id: '61805298', name: 'monolith-archive' },
  { id: '61804613', name: 'uii-dw' },
  { id: '61721493', name: 'deployment-monolith' },
  { id: '61345786', name: 'release-versions' },
  { id: '61227191', name: 'monolith' },
  { id: '71904320', name: 'automation' },
  { id: '111519404', name: 'qa-automation' },
  { id: '71904329', name: 'api-test-automation' },
  { id: '71904346', name: 'automation-shared-resource' },
  { id: '71904336', name: 'prime-test-automation' },
  { id: '61183353', name: 'dev-monolith-migration' },
].sort((a, b) => a.name.localeCompare(b.name));


const tabConfig = [
  { label: 'Merge Requests', key: 'mergeRequests', params: ['project_id', 'start_date', 'end_date'] },
  { label: 'Commits', key: 'commits', params: ['project_id', 'start_date', 'end_date'] },
  { label: 'Branches', key: 'branches', params: ['project_id'] },
  { label: 'Pipelines', key: 'pipelines', params: ['project_id'] },
  { label: 'Users', key: 'users', params: ['project_id'] },
  { label: 'Project', key: 'project', params: ['project_id'] },
];

const apiMap = {
  mergeRequests: fetchMergeRequests,
  commits: fetchCommits,
  branches: fetchBranches,
  pipelines: fetchPipelines,
  users: fetchUsers,
  project: fetchProject,
};

export default function TabsLayout() {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(0);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const tabKey = tabConfig[tab].key;
    try {
      const { data } = await apiMap[tabKey](params);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const currentTab = tabConfig[tab];

  return (
    <Box sx={{
      width: '100%',
      maxWidth: 1200,
      minHeight: '100vh',
      p: { xs: 1, sm: 3, md: 6 },
      background: '#e0eafc',
      display: 'flex',
      borderRadius: 3,
      boxShadow: '10px 12px 12px 0 rgba(104, 139, 139, 0.1)',
      flexDirection: 'column',
      alignItems: 'flex-start',
      margin: '0 auto',
    }}>
      <Box sx={{ width: '100%', maxWidth: 1200, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => { setTab(v); setResult(null); setError(null); }}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            background: '#c1d4fcff',
            borderRadius: 3,
            boxShadow: '10px 12px 12px 0 rgba(104, 139, 139, 0.1)',
          }}
        >
          {tabConfig.map((t, i) => <Tab label={t.label} key={t.key} sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 1 }} />)}
        </Tabs>
      </Box>
      <Card sx={{ width: '100%', maxWidth: 1200, mb: 3, borderRadius: 2, boxShadow: '0 4px 16px 0 rgba(34,43,43,0.10)', background: '#d5d8c9ff' }}>
        <CardHeader
          title={<Typography variant="h4" sx={{ mb: 1 }}>{currentTab.label} Parameters</Typography>}
        />
        <Divider />
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, width: '100%', maxWidth: 400 }}>
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
                        sx={{ fontWeight: 600 }}
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
                  // Use same style for both, but bold and colored text
                  const label = p === 'start_date' ? 'Start Date' : 'End Date';
                  const color = p === 'start_date' ? '#183153' : '#b8860b';
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
                          value: params[p] || '',
                          onChange: e => {
                            handleParamChange(p, e.target.value);
                          },
                          required: true,
                          sx: {
                            width: '100%',
                            fontWeight: 700,
                            color,
                            '& .MuiInputBase-input': { fontWeight: 700, color },
                            '& .MuiInputLabel-root': { fontWeight: 700, color },
                          },
                        }
                      }}
                    />
                  );
                }
                if (p.includes('date')) {
                  // fallback for any other date fields
                  return (
                    <DatePicker
                      key={p}
                      label={p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      value={params[p] ? new Date(params[p]) : null}
                      onChange={date => {
                        const formatted = date ? new Date(date).toLocaleDateString('en-US') : '';
                        handleParamChange(p, formatted);
                      }}
                      format="MM/dd/yyyy"
                      slotProps={{
                        textField: {
                          size: 'small',
                          value: params[p] || '',
                          onChange: e => {
                            handleParamChange(p, e.target.value);
                          },
                          sx: { width: '100%' },
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
                    sx={{ width: '100%' }}
                  />
                );
              })}
            </Box>
          </LocalizationProvider>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={
              loading ||
              (currentTab.params.includes('start_date') && !params.start_date) ||
              (currentTab.params.includes('end_date') && !params.end_date)
            }
            sx={{ mt: 2, px: 5, py: 1.5, fontSize: 18, borderRadius: 3, boxShadow: 3 }}
          >
            {loading ? 'Loading...' : 'Generate'}
          </Button>
        </CardContent>
      </Card>
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      {result && (
        <Card sx={{ width: '100%', maxWidth: 1200, borderRadius: 2, boxShadow: '0 6px 24px 0 rgba(34,43,43,0.13)', background: '#f4f1f5ff', mb: 4 }}>
          <CardHeader
            title={<Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, fontSize: 22 }}>{currentTab.label} Results</Typography>}
            action={
              <Tooltip title="Copy result content" arrow>
                <IconButton
                  aria-label="copy"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      typeof formatResult(result, currentTab, params) === 'string'
                        ? formatResult(result, currentTab, params)
                        : ''
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  sx={{ ml: 2 }}
                >
                  <ContentCopyIcon color={copied ? 'success' : 'action'} />
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />
          <CardContent>
            <Box sx={{ fontFamily: 'monospace', fontSize: 15, color: '#232b2b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', p: 1 }}>
              {formatResult(result, currentTab, params)}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// Format output as specified
function formatResult(result, currentTab, params) {
  // Helper to convert ISO string to EST and format as 'YYYY-MM-DD hh:mm:ss'
  function formatEST(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      // Convert to EST (America/New_York)
      const options = {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      // Format: MM/DD/YYYY HH:mm:ss
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
      const get = type => parts.find(p => p.type === type)?.value || '';
      return `${get('month')}/${get('day')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
    } catch {
      return isoString;
    }
  }
  // Project name lookup
  const project = PROJECTS.find(p => p.id === params.project_id);
  const projectName = project ? project.name : params.project_id;
  const type = currentTab.label;
  let dateRange = '';
  if (params.start_date && params.end_date) {
    dateRange = `| Date Range: ${params.start_date} - ${params.end_date}`;
  }
  let total = '';
  let statusBreakdown = '';
  if (Array.isArray(result.items)) {
    const items = result.items;
    const openCount = items.filter(item => item.state && item.state.toLowerCase() === 'opened').length;
    const mergedCount = items.filter(item => item.state && item.state.toLowerCase() === 'merged').length;
    const closedCount = items.filter(item => item.state && item.state.toLowerCase() === 'closed').length;
    total = `| Total: ${items.length}`;
    statusBreakdown = `| Open: ${openCount}, Merged: ${mergedCount}, Closed: ${closedCount}`;
  } else if (result.total) {
    total = `| Total: ${result.total}`;
  }
  let header = `===== Project: ${projectName} | Type: ${type} ${dateRange} ${total} ${statusBreakdown} =====\n`;
  // Example: format merge requests, commits, etc.
  if (type === 'Merge Requests' && Array.isArray(result.items)) {
    const items = result.items;
    const merged = items.filter(item => item.state && item.state.toLowerCase() === 'merged');
    const opened = items.filter(item => item.state && item.state.toLowerCase() === 'opened');
    const closed = items.filter(item => item.state && item.state.toLowerCase() === 'closed');

    function formatSection(sectionItems, sectionTitle) {
      if (sectionItems.length === 0) return '';
      return [
        `🔄 ***************** ${sectionTitle} *****************`,
        sectionItems.map(item => {
          const reviewers = Array.isArray(item.reviewers)
            ? item.reviewers.map(r => r.name).filter(Boolean).join(', ')
            : (item.reviewers || '');
          const mergedBy = item.merged_by && item.merged_by.name ? item.merged_by.name : '';
          return [
            `🔎 MR Title: ${item.title || ''}`,
            item.web_url ? `🔗 MR Link: ${item.web_url}` : '',
            item.author && item.author.name ? `✍️ Author: ${item.author.name}` : '',
            reviewers ? `👥 Reviewers: ${reviewers}` : '',
            mergedBy ? `👥 Merged by: ${mergedBy}` : '',
            item.created_at ? `� Created At: ${formatEST(item.created_at)}` : '',
            item.merged_at ? `📅 Merged At: ${formatEST(item.merged_at)}` : '',
            item.source_branch && item.target_branch ? `🔀 ${item.source_branch} → ${item.target_branch}` : '',
            '------------------------------------------------------------',
          ].filter(Boolean).join('\n');
        }).join('\n')
      ].join('\n');
    }

    const mergedSection = formatSection(merged, 'Merged Merge Requests:');
    const openedSection = formatSection(opened, 'Opened Merge Requests:');
    const closedSection = formatSection(closed, 'Closed Merge Requests:');

    return [
      `**${header.trim()}**`,
      mergedSection,
      openedSection,
      closedSection
    ].filter(Boolean).join('\n\n');
  }

  if (type === 'Branches' && Array.isArray(result.items)) {
    return (
      header +
      result.items.map(item => {
        return [
            '\n',
          `Branch Name: ${item.name || ''}`,
          item.web_url ? `web url: ${item.web_url}` : '',
          item.author_name ? `Author: ${item.author_name}` : '',
          '--------------------------------------------------------------------------------',
        ].filter(Boolean).join('\n');
      }).join('\n')
    );
  }

  if (type === 'Commits' && Array.isArray(result.items)) {
    return (
      header +
      result.items.map(item => {
        return [
          `🔎 Commit Title: ${item.title || item.message || ''}`,
          item.web_url ? `🔗 Commit Link: ${item.web_url}` : '',
          item.author_name ? `✍️ Author: ${item.author_name}` : '',
          item.authored_date ? `📅 Authored At: ${item.authored_date}` : '',
          item.committed_date ? `📅 Committed At: ${item.committed_date}` : '',
          item.id ? `🔁 Commit ID: ${item.id.substring(0, 8)}` : '',
          item.message ? `� Message: ${item.message}` : '',
          '------------------------------------------------------------',
        ].filter(Boolean).join('\n');
      }).join('\n')
    );
  }
 // fallback
  return header + JSON.stringify(result, null, 2);
}
