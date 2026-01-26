/**
 * Export utilities for CSV and Excel
 */
import * as XLSX from 'xlsx';
import { convertToCSV, downloadFile } from './formatters';

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with key, label, and optional transform
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, headers, filename = 'export.csv') {
  const csv = convertToCSV(data, headers);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with key, label, and optional transform
 * @param {string} filename - Output filename
 */
export function exportToExcel(data, headers, filename = 'export.xlsx') {
  // Prepare worksheet data
  const worksheetData = [
    headers.map(h => h.label), // Header row
    ...data.map(item => 
      headers.map(h => {
        const value = h.transform ? h.transform(item[h.key]) : (item[h.key] || '');
        return value;
      })
    )
  ];
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const colWidths = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // Write file
  XLSX.writeFile(wb, filename);
}

/**
 * Get export headers for merge requests
 */
export function getMergeRequestHeaders() {
  return [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'state', label: 'State' },
    { key: 'author', label: 'Author', transform: (val) => val?.name || '' },
    { key: 'source_branch', label: 'Source Branch' },
    { key: 'target_branch', label: 'Target Branch' },
    { key: 'created_at', label: 'Created At' },
    { key: 'merged_at', label: 'Merged At' },
    { key: 'web_url', label: 'URL' },
  ];
}

/**
 * Get export headers for commits
 */
export function getCommitHeaders() {
  return [
    { key: 'id', label: 'Commit ID', transform: (val) => val?.substring(0, 8) || '' },
    { key: 'title', label: 'Title' },
    { key: 'author_name', label: 'Author' },
    { key: 'authored_date', label: 'Authored Date' },
    { key: 'committed_date', label: 'Committed Date' },
    { key: 'web_url', label: 'URL' },
  ];
}

/**
 * Get export headers for branches
 */
export function getBranchHeaders() {
  return [
    { key: 'name', label: 'Branch Name' },
    { key: 'author_name', label: 'Author' },
    { key: 'protected', label: 'Protected', transform: (val) => val ? 'Yes' : 'No' },
    { key: 'merged', label: 'Merged', transform: (val) => val ? 'Yes' : 'No' },
    { key: 'default', label: 'Default', transform: (val) => val ? 'Yes' : 'No' },
    { key: 'web_url', label: 'URL' },
  ];
}

/**
 * Get export headers for pipelines
 */
export function getPipelineHeaders() {
  return [
    { key: 'id', label: 'Pipeline ID' },
    { key: 'status', label: 'Status' },
    { key: 'ref', label: 'Branch' },
    { key: 'sha', label: 'SHA', transform: (val) => val?.substring(0, 8) || '' },
    { key: 'created_at', label: 'Created At' },
    { key: 'web_url', label: 'URL' },
  ];
}

/**
 * Get export headers for users
 */
export function getUserHeaders() {
  return [
    { key: 'id', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'state', label: 'State' },
    { key: 'web_url', label: 'URL' },
  ];
}
