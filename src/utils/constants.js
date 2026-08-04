/**
 * Application constants and configuration
 */

// Project list for dropdown (sorted alphabetically)
export const PROJECTS = [
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
  { id: '71904320', name: 'automation - automation' },
  { id: '71904329', name: 'automation - api-test-automation' },
  { id: '71904346', name: 'automation - automation-shared-resource' },
  { id: '71904336', name: 'automation - prime-test-automation' },
  { id: 'qa-automation-group', name: '# qa-automation' },
  { id: '61183353', name: 'dev-monolith-migration' },
].sort((a, b) => a.name.localeCompare(b.name));

// Tab configuration
export const TAB_CONFIG = [
  { 
    label: 'Merge Requests', 
    key: 'mergeRequests', 
    params: ['project_id', 'start_date', 'end_date'],
    description: 'View merge requests within a date range. Shows author, reviewers, merge status, and branch information.'
  },
  { 
    label: 'Commits', 
    key: 'commits', 
    params: ['project_id', 'start_date', 'end_date'],
    description: 'View commits within a date range. Shows commit messages, authors, and timestamps.'
  },
  { 
    label: 'Branches', 
    key: 'branches', 
    params: ['project_id'],
    description: 'View all branches in the project. Shows branch name, protection status, and creator.'
  },
  { 
    label: 'Pipelines', 
    key: 'pipelines', 
    params: ['project_id'],
    description: 'View CI/CD pipelines. Shows pipeline status, branch, and execution details.'
  },
  { 
    label: 'Users', 
    key: 'users', 
    params: ['project_id'],
    description: 'View all project members. Shows user names, usernames, and account status.'
  },
  { 
    label: 'Project', 
    key: 'project', 
    params: ['project_id'],
    description: 'View project details including name, description, visibility, and activity information.'
  },
];

// Date preset options
export const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Custom', days: null },
];
