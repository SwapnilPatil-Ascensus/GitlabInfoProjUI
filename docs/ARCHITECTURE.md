# GitLab Project Manager UI - Architecture Documentation

## Overview

The GitLab Project Manager UI is a full-stack web application designed to connect to GitLab and retrieve merge requests, commits, branches, pipelines, users, and project information. The primary use case is automation bug tracking - identifying the last check-ins between timeframes that might be causing breakage in any project or repository.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│                  (React + Material-UI)                       │
│                     Port: 3000                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
                       │ (CORS enabled)
┌──────────────────────▼──────────────────────────────────────┐
│                  FastAPI Backend                            │
│                    Port: 8000                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints (main.py)                             │  │
│  │  - /merge-requests                                   │  │
│  │  - /commits                                         │  │
│  │  - /branches                                        │  │
│  │  - /pipelines                                       │  │
│  │  - /users                                           │  │
│  │  - /project                                         │  │
│  └──────────────┬─────────────────────────────────────┘  │
│                 │                                         │
│  ┌──────────────▼─────────────────────────────────────┐  │
│  │  Data Models (models/)                              │  │
│  │  - merge_request.py                                │  │
│  │  - commit.py                                       │  │
│  │  - branch.py                                       │  │
│  │  - pipeline.py                                     │  │
│  │  - user.py                                         │  │
│  │  - project.py                                      │  │
│  └──────────────┬─────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────┘
                   │ GitLab API v4
                   │ (HTTPS)
┌──────────────────▼──────────────────────────────────────┐
│              GitLab.com API                              │
│         (https://gitlab.com/api/v4)                     │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 19.1.1
- **UI Library**: Material-UI (MUI) v7.3.1
- **Date Picker**: @mui/x-date-pickers v8.9.2
- **HTTP Client**: Axios v1.11.0
- **Date Utilities**: date-fns v4.1.0
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **PWA Support**: Service Worker enabled

### Backend
- **Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **HTTP Client**: requests (Python)
- **Python Version**: 3.11+ (Docker), 3.8+ (local)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: VS Code with tasks configuration

## Component Architecture

### Frontend Components

#### 1. App Component (`App.js`)
- **Purpose**: Root component, sets up theme and layout
- **Responsibilities**:
  - Initialize Material-UI theme provider
  - Set up global CSS baseline
  - Render main container with title
  - Delegate to TabsLayout component

#### 2. TabsLayout Component (`TabsLayout.js`)
- **Purpose**: Main UI component with tabbed interface
- **Responsibilities**:
  - Manage tab state and navigation
  - Handle parameter input (project selection, date ranges)
  - Coordinate API calls through api.js
  - Format and display results
  - Provide copy-to-clipboard functionality
- **State Management**:
  - `tab`: Current active tab index
  - `params`: Form parameters (project_id, dates)
  - `result`: API response data
  - `loading`: Loading state
  - `error`: Error state
  - `copied`: Copy button feedback state

#### 3. API Client (`api.js`)
- **Purpose**: Centralized API communication layer
- **Responsibilities**:
  - Define base API URL (configurable via env)
  - Export functions for each endpoint
  - Handle HTTP requests via Axios

#### 4. Theme Configuration (`theme.js`)
- **Purpose**: Material-UI theme customization
- **Features**:
  - Custom color palette (blue theme)
  - Typography settings
  - Component style overrides (Cards, Buttons, Papers)

### Backend Architecture

#### 1. Main Application (`main.py`)
- **Purpose**: FastAPI application entry point
- **Responsibilities**:
  - Define FastAPI app instance
  - Configure CORS middleware
  - Define REST API endpoints
  - Handle request/response transformation
  - Error handling and logging

#### 2. Data Models (`models/`)
Each model follows a consistent pattern:
- **Class Definition**: Data structure for the entity
- **from_gitlab()**: Class method to convert GitLab API response to model
- **fetch_*_from_gitlab()**: Function to retrieve data from GitLab API

**Models**:
- `merge_request.py`: Merge requests with reviewers, author, merge status
- `commit.py`: Commits with author, dates, messages
- `branch.py`: Branches with protection status, author
- `pipeline.py`: CI/CD pipelines with status, ref, SHA
- `user.py`: Project members/users
- `project.py`: Project metadata

## Data Flow

### Request Flow
1. User selects project and parameters in UI
2. User clicks "Generate" button
3. TabsLayout calls appropriate function from `api.js`
4. Axios sends HTTP GET request to FastAPI backend
5. FastAPI endpoint receives request and extracts parameters
6. Endpoint calls model's fetch function
7. Model function makes GitLab API request with authentication
8. GitLab API returns JSON data
9. Model function converts JSON to model objects
10. Endpoint serializes models to dictionaries
11. Response sent back to frontend
12. TabsLayout formats and displays results

### Error Flow
1. Error occurs at any step (network, API, parsing)
2. Exception caught and logged
3. Error message returned in response
4. Frontend displays error to user

## API Design

### REST Endpoints

All endpoints follow RESTful conventions:
- **Method**: GET
- **Response Format**: JSON
- **Error Format**: `{"error": "message", "trace": "stack trace"}`

#### Endpoints

| Endpoint | Parameters | Description |
|----------|-----------|-------------|
| `/merge-requests` | `project_id`, `start_date`, `end_date` | Get merge requests in date range |
| `/commits` | `project_id`, `start_date`, `end_date` | Get commits in date range |
| `/branches` | `project_id` | Get all branches |
| `/pipelines` | `project_id` | Get all pipelines |
| `/users` | `project_id` | Get project members |
| `/project` | `project_id` | Get project details |

### Date Format
- **Input**: `MM/DD/YYYY` (e.g., "01/26/2026")
- **API Conversion**: ISO 8601 format for GitLab API
- **Display**: EST timezone formatted as `MM/DD/YYYY HH:mm:ss`

## Security

### Authentication
- **GitLab Token**: Stored in environment variable `GITLAB_TOKEN`
- **Token Type**: Personal Access Token (PAT)
- **Storage**: Environment variable (not in code)
- **Transmission**: HTTPS to GitLab API

### CORS Configuration
- **Allowed Origins**: `http://localhost:3000` (development)
- **Allowed Methods**: All (`*`)
- **Allowed Headers**: All (`*`)
- **Credentials**: Enabled

### Security Considerations
- SSL verification disabled for GitLab API (development only - should be enabled in production)
- No authentication required for backend endpoints (consider adding in production)
- Token exposed in environment (consider secure storage in production)

## Configuration

### Environment Variables

#### Backend
- `GITLAB_TOKEN`: GitLab personal access token (required)

#### Frontend
- `REACT_APP_API_BASE`: Backend API base URL (default: `http://localhost:8000`)

### Project List
- Hardcoded in `TabsLayout.js` as `PROJECTS` constant
- Contains project ID and name mappings
- Sorted alphabetically

## Deployment

### Development
- **Backend**: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Frontend**: `npm start` (runs on port 3000)

### Docker
- **Backend Dockerfile**: Python 3.11-slim base image
- **Frontend Dockerfile**: Node 20-slim base image
- **Docker Compose**: Orchestrates both services

### Ports
- **Backend**: 8000
- **Frontend**: 3000

## Scalability Considerations

### Current Limitations
- No caching mechanism
- No rate limiting
- Sequential API calls (no batching)
- No pagination in UI (backend handles pagination)
- Hardcoded project list

### Potential Improvements
- Add Redis caching for GitLab API responses
- Implement rate limiting
- Add request batching
- Dynamic project list from GitLab API
- Add database for historical data
- Implement background jobs for large queries

## Monitoring & Logging

### Current State
- Basic error logging with traceback
- No structured logging
- No metrics collection
- No health check endpoints

### Recommended Additions
- Structured logging (JSON format)
- Request/response logging middleware
- Health check endpoint (`/health`)
- Performance metrics
- Error tracking (Sentry, etc.)

## Testing

### Current State
- No automated tests
- Manual testing only

### Recommended Additions
- Unit tests for models
- Integration tests for API endpoints
- Frontend component tests
- E2E tests with Playwright/Cypress
- API contract tests

## Future Enhancements

1. **Multi-project Analysis**: Compare changes across multiple projects
2. **Time-based Filtering**: More granular time range options
3. **Export Functionality**: CSV/Excel export of results
4. **Search & Filter**: Filter results by author, branch, status
5. **Dashboard**: Visual analytics and charts
6. **Notifications**: Alert on specific changes
7. **GitLab Webhook Integration**: Real-time updates
8. **User Authentication**: Multi-user support with roles
9. **Project Management**: Add/remove projects dynamically
10. **Historical Tracking**: Store and compare historical data
