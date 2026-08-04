// Simple API client for backend endpoints
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export const fetchMergeRequests = (params) => axios.get(`${API_BASE}/merge-requests`, { params });
export const fetchCommits = (params) => axios.get(`${API_BASE}/commits`, { params });
export const fetchBranches = (params) => axios.get(`${API_BASE}/branches`, { params });
export const fetchPipelines = (params) => axios.get(`${API_BASE}/pipelines`, { params });
export const fetchUsers = (params) => axios.get(`${API_BASE}/users`, { params });
export const fetchProject = (params) => axios.get(`${API_BASE}/project`, { params });
export const fetchTeamMergeReport = (params) => axios.get(`${API_BASE}/team-merge-report`, { params });
export const fetchTeamMembers = (params) => axios.get(`${API_BASE}/team-members`, { params });
export const fetchUserWorkDashboard = (params) => axios.get(`${API_BASE}/user-work-dashboard`, { params });
