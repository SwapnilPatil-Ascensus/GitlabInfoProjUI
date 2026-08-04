/**
 * Utility functions for formatting data
 */

/**
 * Format ISO date string to EST timezone
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date string (MM/DD/YYYY HH:mm:ss)
 */
export function formatEST(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
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
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const get = type => parts.find(p => p.type === type)?.value || '';
    return `${get('month')}/${get('day')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
  } catch {
    return isoString;
  }
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  } catch {
    return '';
  }
}

/**
 * Get date preset range
 * @param {number} days - Number of days ago
 * @returns {Object} Object with startDate and endDate (MM/DD/YYYY format)
 */
export function getDatePreset(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * Convert object to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header objects with key and label
 * @returns {string} CSV string
 */
export function convertToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  // Create header row
  const headerRow = headers.map(h => h.label).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(h => {
      const value = h.transform ? h.transform(item[h.key]) : (item[h.key] || '');
      // Escape commas and quotes in CSV
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Download data as file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format result for display - Enhanced with detailed information
 */
export function formatResult(result, currentTab, params, projects) {
  function formatEST(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
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
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
      const get = type => parts.find(p => p.type === type)?.value || '';
      return `${get('month')}/${get('day')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
    } catch {
      return isoString;
    }
  }
  
  const project = projects.find(p => p.id === params.project_id);
  const projectName = project ? project.name : params.project_id;
  const type = currentTab.label;
  let dateRange = '';
  if (params.start_date && params.end_date) {
    // Format dates to match expected format (M/D/YYYY)
    const formatDateForHeader = (dateStr) => {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Remove leading zeros from month and day
          const month = parseInt(parts[0], 10).toString();
          const day = parseInt(parts[1], 10).toString();
          const year = parts[2];
          return `${month}/${day}/${year}`;
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };
    dateRange = `| Date Range: ${formatDateForHeader(params.start_date)} - ${formatDateForHeader(params.end_date)}`;
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
  
  // Format Merge Requests with enhanced details
  if ((type === 'Merge Requests' || type === 'Team Merge Report') && Array.isArray(result.items)) {
    const items = result.items;
    const merged = items.filter(item => item.state && item.state.toLowerCase() === 'merged');
    const opened = items.filter(item => item.state && item.state.toLowerCase() === 'opened');
    const closed = items.filter(item => item.state && item.state.toLowerCase() === 'closed');

    function formatSection(sectionItems, sectionTitle) {
      if (sectionItems.length === 0) return '';
      return [
        `🔄 ***************** ${sectionTitle} *****************`,
        sectionItems.map(item => {
          // Extract reviewers - handle both array and object formats
          let reviewers = '';
          if (Array.isArray(item.reviewers)) {
            reviewers = item.reviewers.map(r => {
              if (typeof r === 'string') return r;
              return r.name || r.username || '';
            }).filter(Boolean).join(', ');
          } else if (item.reviewers) {
            reviewers = String(item.reviewers);
          }
          
          // Extract merged_by
          const mergedBy = item.merged_by 
            ? (item.merged_by.name || item.merged_by.username || '')
            : '';
          
          // Extract author
          const author = item.author 
            ? (item.author.name || item.author.username || '')
            : '';
          
          // Build formatted output - matching exact approved format
          // Core required fields (matching approved format)
          const lines = [
            `🔎 MR Title: ${item.title || ''}`,
            item.web_url ? `🔗 MR Link: ${item.web_url}` : '',
            author ? `✍️ Author: ${author}` : '',
            reviewers ? `👥 Reviewers: ${reviewers}` : '',
            mergedBy ? `👥 Merged by: ${mergedBy}` : '',
            item.created_at ? `📅 Created At: ${formatEST(item.created_at)}` : '',
            item.merged_at ? `📅 Merged At: ${formatEST(item.merged_at)}` : '',
            item.source_branch && item.target_branch ? `🔀 ${item.source_branch} → ${item.target_branch}` : '',
          ];
          
          // Additional helpful fields for debugging (added after core format)
          if (item.updated_at && item.updated_at !== item.merged_at && item.updated_at !== item.created_at) {
            lines.push(`🔄 Updated At: ${formatEST(item.updated_at)}`);
          }
          if (item.id) {
            lines.push(`🆔 MR ID: ${item.id}`);
          }
          if (Array.isArray(item.labels) && item.labels.length > 0) {
            lines.push(`🏷️ Labels: ${item.labels.join(', ')}`);
          }
          if (item.state) {
            lines.push(`📊 State: ${item.state}`);
          }
          // Add description if available (helpful for debugging)
          if (item.description) {
            const desc = item.description.length > 200 
              ? item.description.substring(0, 200) + '...' 
              : item.description;
            lines.push(`📝 Description: ${desc.replace(/\n/g, ' ')}`);
          }
          
          return lines.join('\n') + '\n------------------------------------------------------------';
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

  // Format Commits with enhanced details
  if (type === 'Commits' && Array.isArray(result.items)) {
    return (
      header +
      result.items.map(item => {
        const lines = [
          `🔎 Commit Title: ${item.title || item.message?.split('\n')[0] || ''}`,
          item.web_url ? `🔗 Commit Link: ${item.web_url}` : '',
          item.id ? `🔁 Commit ID: ${item.id.substring(0, 8)} (${item.id})` : '',
          item.short_id ? `🆔 Short ID: ${item.short_id}` : '',
          item.author_name ? `✍️ Author: ${item.author_name}` : '',
          item.authored_date ? `📅 Authored At: ${formatEST(item.authored_date)}` : '',
          item.committed_date ? `📅 Committed At: ${formatEST(item.committed_date)}` : '',
          item.message ? `💬 Message: ${item.message}` : '',
        ].filter(Boolean);
        return lines.join('\n') + '\n------------------------------------------------------------';
      }).join('\n')
    );
  }

  // Format Branches with enhanced details
  if (type === 'Branches' && Array.isArray(result.items)) {
    return (
      header +
      result.items.map(item => {
        const lines = [
          `🌿 Branch Name: ${item.name || ''}`,
          item.web_url ? `🔗 Branch URL: ${item.web_url}` : '',
          item.author_name ? `✍️ Author: ${item.author_name}` : '',
          item.commit_id ? `🔁 Latest Commit: ${item.commit_id.substring(0, 8)}` : '',
          item.protected !== undefined ? `🔒 Protected: ${item.protected ? 'Yes' : 'No'}` : '',
          item.merged !== undefined ? `🔀 Merged: ${item.merged ? 'Yes' : 'No'}` : '',
          item.default !== undefined ? `⭐ Default: ${item.default ? 'Yes' : 'No'}` : '',
        ].filter(Boolean);
        return lines.join('\n') + '\n--------------------------------------------------------------------------------';
      }).join('\n')
    );
  }

  // Format Pipelines with enhanced details
  if (type === 'Pipelines' && Array.isArray(result.items)) {
    return (
      header +
      result.items.map(item => {
        const statusEmoji = {
          'success': '✅',
          'failed': '❌',
          'running': '🔄',
          'pending': '⏳',
          'canceled': '🚫',
          'skipped': '⏭️'
        }[item.status] || '📊';
        
        const lines = [
          `${statusEmoji} Pipeline Status: ${item.status || ''}`,
          item.id ? `🆔 Pipeline ID: ${item.id}` : '',
          item.ref ? `🌿 Branch/Ref: ${item.ref}` : '',
          item.sha ? `🔁 SHA: ${item.sha.substring(0, 8)} (${item.sha})` : '',
          item.web_url ? `🔗 Pipeline Link: ${item.web_url}` : '',
          item.created_at ? `📅 Created At: ${formatEST(item.created_at)}` : '',
          item.updated_at ? `🔄 Updated At: ${formatEST(item.updated_at)}` : '',
        ].filter(Boolean);
        return lines.join('\n') + '\n------------------------------------------------------------';
      }).join('\n')
    );
  }

  // Format Users with enhanced details
  if (type === 'Users' && Array.isArray(result.items)) {
    return (
      header +
      result.items.map(item => {
        const lines = [
          `👤 Name: ${item.name || ''}`,
          item.username ? `🆔 Username: ${item.username}` : '',
          item.id ? `🆔 User ID: ${item.id}` : '',
          item.state ? `📊 State: ${item.state}` : '',
          item.web_url ? `🔗 Profile URL: ${item.web_url}` : '',
          item.avatar_url ? `🖼️ Avatar: ${item.avatar_url}` : '',
          item.created_at ? `📅 Created At: ${formatEST(item.created_at)}` : '',
        ].filter(Boolean);
        return lines.join('\n') + '\n------------------------------------------------------------';
      }).join('\n')
    );
  }

  // Format Project details
  if (type === 'Project' && result) {
    const lines = [
      `📁 Project Name: ${result.name || ''}`,
      result.path_with_namespace ? `📂 Path: ${result.path_with_namespace}` : '',
      result.id ? `🆔 Project ID: ${result.id}` : '',
      result.web_url ? `🔗 Project URL: ${result.web_url}` : '',
      result.description ? `📝 Description: ${result.description}` : '',
      result.visibility ? `👁️ Visibility: ${result.visibility}` : '',
      result.default_branch ? `🌿 Default Branch: ${result.default_branch}` : '',
      result.created_at ? `📅 Created At: ${formatEST(result.created_at)}` : '',
      result.last_activity_at ? `🔄 Last Activity: ${formatEST(result.last_activity_at)}` : '',
    ].filter(Boolean);
    return header + lines.join('\n');
  }
  
  // Fallback for unknown types
  return header + JSON.stringify(result, null, 2);
}
