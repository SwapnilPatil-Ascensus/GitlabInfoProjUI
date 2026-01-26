# API Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: Configure via environment variable

## Authentication

All endpoints require a GitLab Personal Access Token to be set in the backend environment variable `GITLAB_TOKEN`. The token is used internally to authenticate with GitLab's API.

## Endpoints

### 1. Get Merge Requests

Retrieve merge requests for a project within a specified date range.

**Endpoint**: `GET /merge-requests`

**Query Parameters**:
- `project_id` (integer, required): GitLab project ID
- `start_date` (string, required): Start date in `MM/DD/YYYY` format
- `end_date` (string, required): End date in `MM/DD/YYYY` format

**Example Request**:
```http
GET /merge-requests?project_id=61227191&start_date=01/01/2026&end_date=01/26/2026
```

**Response**:
```json
{
  "items": [
    {
      "id": 1234,
      "title": "Update configuration",
      "web_url": "https://gitlab.com/.../merge_requests/1234",
      "author": {
        "name": "John Doe",
        "username": "johndoe"
      },
      "created_at": "2026-01-15T10:30:00Z",
      "merged_at": "2026-01-15T14:20:00Z",
      "state": "merged",
      "source_branch": "feature/new-feature",
      "target_branch": "main",
      "reviewers": [
        {
          "name": "Jane Smith",
          "username": "janesmith"
        }
      ],
      "labels": ["bugfix", "frontend"],
      "merged_by": {
        "name": "John Doe",
        "username": "johndoe"
      }
    }
  ]
}
```

**Error Response**:
```json
{
  "error": "Token environment variable 'GITLAB_TOKEN' not set.",
  "trace": "..."
}
```

**Notes**:
- Date range is based on `updated_at` field
- Returns merge requests with `scope=all` (all states)
- Results are paginated (100 per page) and sorted by `updated_at` descending
- Empty array returned if no merge requests found

---

### 2. Get Commits

Retrieve commits for a project within a specified date range.

**Endpoint**: `GET /commits`

**Query Parameters**:
- `project_id` (integer, required): GitLab project ID
- `start_date` (string, required): Start date in `MM/DD/YYYY` format
- `end_date` (string, required): End date in `MM/DD/YYYY` format

**Example Request**:
```http
GET /commits?project_id=61227191&start_date=01/01/2026&end_date=01/26/2026
```

**Response**:
```json
{
  "items": [
    {
      "id": "abc123def456...",
      "short_id": "abc123de",
      "title": "Fix bug in authentication",
      "author_name": "John Doe",
      "authored_date": "2026-01-15T10:30:00Z",
      "committed_date": "2026-01-15T10:30:00Z",
      "message": "Fix bug in authentication\n\nThis commit fixes...",
      "web_url": "https://gitlab.com/.../commit/abc123def456"
    }
  ]
}
```

**Error Response**: Same format as merge requests endpoint

**Notes**:
- Date range is based on commit date (`since` and `until` parameters)
- Results are paginated (100 per page)
- Empty array returned if no commits found

---

### 3. Get Branches

Retrieve all branches for a project.

**Endpoint**: `GET /branches`

**Query Parameters**:
- `project_id` (integer, required): GitLab project ID

**Example Request**:
```http
GET /branches?project_id=61227191
```

**Response**:
```json
{
  "items": [
    {
      "name": "main",
      "merged": false,
      "protected": true,
      "default": true,
      "web_url": "https://gitlab.com/api/v4/projects/61227191/repository/branches/main",
      "commit_id": "abc123def456...",
      "author_name": "John Doe"
    }
  ]
}
```

**Error Response**: Same format as merge requests endpoint

**Notes**:
- Returns all branches regardless of state
- Author name is determined from the first commit of each branch
- Results are paginated (100 per page)
- Empty array returned if no branches found

---

### 4. Get Pipelines

Retrieve all CI/CD pipelines for a project.

**Endpoint**: `GET /pipelines`

**Query Parameters**:
- `project_id` (integer, required): GitLab project ID

**Example Request**:
```http
GET /pipelines?project_id=61227191
```

**Response**:
```json
{
  "items": [
    {
      "id": 12345,
      "status": "success",
      "ref": "main",
      "web_url": "https://gitlab.com/.../pipelines/12345",
      "sha": "abc123def456...",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:35:00Z"
    }
  ]
}
```

**Error Response**: Same format as merge requests endpoint

**Notes**:
- Returns all pipelines regardless of status
- Results are paginated (100 per page)
- Empty array returned if no pipelines found
- Status values: `success`, `failed`, `running`, `pending`, `canceled`, `skipped`

---

### 5. Get Users

Retrieve all project members/users.

**Endpoint**: `GET /users`

**Query Parameters**:
- `project_id` (integer, required): GitLab project ID

**Example Request**:
```http
GET /users?project_id=61227191
```

**Response**:
```json
{
  "items": [
    {
      "id": 123,
      "username": "johndoe",
      "name": "John Doe",
      "state": "active",
      "web_url": "https://gitlab.com/johndoe",
      "avatar_url": "https://gitlab.com/uploads/...",
      "created_at": "2020-01-15T10:30:00Z"
    }
  ]
}
```

**Error Response**: Same format as merge requests endpoint

**Notes**:
- Returns all project members (including inherited members)
- Uses `/members/all` endpoint to get all members
- Results are paginated (100 per page)
- Empty array returned if no users found

---

### 6. Get Project

Retrieve project details.

**Endpoint**: `GET /project`

**Query Parameters**:
- `project_id` (integer, required): GitLab project ID

**Example Request**:
```http
GET /project?project_id=61227191
```

**Response**:
```json
{
  "id": 61227191,
  "name": "monolith",
  "path_with_namespace": "ascensus-gs/products/depot/monolith",
  "web_url": "https://gitlab.com/ascensus-gs/products/depot/monolith",
  "description": "Project description",
  "visibility": "private",
  "default_branch": "main",
  "created_at": "2020-01-15T10:30:00Z",
  "last_activity_at": "2026-01-26T10:30:00Z"
}
```

**Error Response**: Same format as merge requests endpoint

**Notes**:
- Returns single project object (not array)
- Returns 404 if project not found or not accessible
- Visibility values: `private`, `internal`, `public`

---

## Error Handling

All endpoints follow a consistent error handling pattern:

### Error Response Format
```json
{
  "error": "Error message describing what went wrong",
  "trace": "Full Python traceback (development only)"
}
```

### Common Error Scenarios

1. **Missing GitLab Token**
   ```json
   {
     "error": "Token environment variable 'GITLAB_TOKEN' not set.",
     "trace": "..."
   }
   ```

2. **Invalid Project ID**
   ```json
   {
     "error": "404 Client Error: Not Found",
     "trace": "..."
   }
   ```

3. **Invalid Date Format**
   ```json
   {
     "error": "time data 'invalid-date' does not match format '%m/%d/%Y'",
     "trace": "..."
   }
   ```

4. **Network Errors**
   ```json
   {
     "error": "Connection error: ...",
     "trace": "..."
   }
   ```

## Rate Limiting

Currently, there is no rate limiting implemented. However, GitLab API has rate limits:
- **Unauthenticated**: 5 requests per second
- **Authenticated**: 10 requests per second

The application handles pagination automatically, but large result sets may take time to fetch.

## Pagination

All endpoints that return lists implement automatic pagination:
- **Page Size**: 100 items per page
- **Automatic**: Backend handles pagination internally
- **No Client Pagination**: All results are fetched and returned in a single response

For very large datasets, this may result in:
- Longer response times
- Higher memory usage
- Potential timeout issues

## Date Format

### Input Format
- **Format**: `MM/DD/YYYY`
- **Example**: `01/26/2026`
- **Timezone**: Assumed to be in local timezone, converted to ISO 8601

### Output Format
- **Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- **Display**: Converted to EST in frontend as `MM/DD/YYYY HH:mm:ss`

## CORS

CORS is enabled for the following:
- **Allowed Origin**: `http://localhost:3000` (development)
- **Allowed Methods**: All (`*`)
- **Allowed Headers**: All (`*`)
- **Credentials**: Enabled

For production, update CORS settings in `backend/main.py`.

## Response Times

Typical response times (may vary based on GitLab API and network):
- **Merge Requests**: 1-5 seconds (depending on date range)
- **Commits**: 1-5 seconds (depending on date range)
- **Branches**: 2-10 seconds (includes author lookup)
- **Pipelines**: 1-3 seconds
- **Users**: 0.5-2 seconds
- **Project**: 0.5-1 second

## Best Practices

1. **Date Ranges**: Use reasonable date ranges (e.g., 1-30 days) to avoid timeouts
2. **Error Handling**: Always check for `error` field in response
3. **Loading States**: Show loading indicators for better UX
4. **Caching**: Consider caching responses on client side for repeated queries
5. **Token Security**: Never expose GitLab token in frontend code
