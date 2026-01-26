# Code Structure Documentation

## Project Structure

```
GitlabInfoProjUI/
├── backend/                    # FastAPI backend application
│   ├── __pycache__/           # Python bytecode cache
│   ├── models/                # Data models and GitLab API clients
│   │   ├── __init__.py
│   │   ├── merge_request.py   # Merge request model and fetcher
│   │   ├── commit.py          # Commit model and fetcher
│   │   ├── branch.py          # Branch model and fetcher
│   │   ├── pipeline.py        # Pipeline model and fetcher
│   │   ├── user.py            # User model and fetcher
│   │   └── project.py         # Project model and fetcher
│   ├── main.py                # FastAPI application entry point
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Backend Docker configuration
│
├── ui/                        # React frontend application
│   ├── public/                # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/                   # React source code
│   │   ├── api.js             # API client functions
│   │   ├── App.js             # Root React component
│   │   ├── App.css            # App component styles
│   │   ├── App.test.js        # App component tests
│   │   ├── TabsLayout.js      # Main UI component with tabs
│   │   ├── theme.js           # Material-UI theme configuration
│   │   ├── index.js           # React entry point
│   │   ├── index.css          # Global styles
│   │   ├── service-worker.js  # PWA service worker
│   │   ├── serviceWorkerRegistration.js
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   ├── package.json           # Frontend dependencies
│   ├── package-lock.json
│   └── Dockerfile             # Frontend Docker configuration
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── API_DOCUMENTATION.md   # API endpoint documentation
│   ├── CODE_STRUCTURE.md      # This file
│   ├── GAP_ANALYSIS.md        # Gap analysis and improvements
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── QUICK_START.md         # Quick start guide
│   ├── USER_GUIDE.md          # User guide
│   └── AGENT_PROMPT.md        # Agent prompt for recreation
│
├── .github/                   # GitHub configuration
│   └── copilot-instructions.md
│
├── .vscode/                   # VS Code configuration
│   └── tasks.json            # VS Code tasks
│
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Root package.json (minimal)
├── README.md                  # Main project README
└── .gitignore                 # Git ignore rules
```

## Backend Structure

### Main Application (`backend/main.py`)

**Purpose**: FastAPI application entry point and API route definitions.

**Key Components**:
- FastAPI app instance
- CORS middleware configuration
- Six REST API endpoints
- Error handling with logging

**Structure**:
```python
app = FastAPI()
# CORS middleware
# Endpoint definitions
```

**Endpoints**:
1. `GET /merge-requests` → `get_merge_requests()`
2. `GET /commits` → `get_commits()`
3. `GET /branches` → `get_branches()`
4. `GET /pipelines` → `get_pipelines()`
5. `GET /users` → `get_users()`
6. `GET /project` → `get_project()`

**Error Handling Pattern**:
```python
try:
    # API call
    return {"items": [...]}
except Exception as e:
    logging.error(traceback.format_exc())
    return {"error": str(e), "trace": traceback.format_exc()}
```

### Models Directory (`backend/models/`)

Each model file follows a consistent pattern:

#### Pattern Structure
```python
class ModelName:
    """Data model for a GitLab entity."""
    def __init__(self, ...):
        # Initialize attributes
    
    @classmethod
    def from_gitlab(cls, data: dict) -> 'ModelName':
        # Convert GitLab API response to model instance

def fetch_model_from_gitlab(project: dict, ...) -> List[ModelName]:
    """Fetch data from GitLab API."""
    # Authentication
    # API request with pagination
    # Convert responses to models
    # Return list
```

#### Model Files

**1. `merge_request.py`**
- **Class**: `MergeRequest`
- **Attributes**: id, title, web_url, author, created_at, merged_at, state, source_branch, target_branch, reviewers, labels, merged_by
- **Function**: `fetch_merge_requests_from_gitlab(project, start_date, end_date)`
- **GitLab Endpoint**: `/api/v4/projects/{id}/merge_requests`
- **Pagination**: Yes (100 per page)
- **Date Filtering**: `updated_after` and `updated_before`

**2. `commit.py`**
- **Class**: `Commit`
- **Attributes**: id, short_id, title, author_name, authored_date, committed_date, message, web_url
- **Function**: `fetch_commits_from_gitlab(project, start_date, end_date)`
- **GitLab Endpoint**: `/api/v4/projects/{id}/repository/commits`
- **Pagination**: Yes (100 per page)
- **Date Filtering**: `since` and `until`

**3. `branch.py`**
- **Class**: `Branch`
- **Attributes**: name, merged, protected, default, web_url, commit_id, author_name
- **Function**: `fetch_branches_from_gitlab(project)`
- **GitLab Endpoint**: `/api/v4/projects/{id}/repository/branches`
- **Pagination**: Yes (100 per page)
- **Special Logic**: Fetches first commit to determine author

**4. `pipeline.py`**
- **Class**: `Pipeline`
- **Attributes**: id, status, ref, web_url, sha, created_at, updated_at
- **Function**: `fetch_pipelines_from_gitlab(project)`
- **GitLab Endpoint**: `/api/v4/projects/{id}/pipelines`
- **Pagination**: Yes (100 per page)

**5. `user.py`**
- **Class**: `User`
- **Attributes**: id, username, name, state, web_url, avatar_url, created_at
- **Function**: `fetch_project_users_from_gitlab(project)`
- **GitLab Endpoint**: `/api/v4/projects/{id}/members/all`
- **Pagination**: Yes (100 per page)

**6. `project.py`**
- **Class**: `Project`
- **Attributes**: id, name, path_with_namespace, web_url, description, visibility, default_branch, created_at, last_activity_at
- **Function**: `fetch_project_from_gitlab(project_id)`
- **GitLab Endpoint**: `/api/v4/projects/{id}`
- **Pagination**: No (single object)

### Common Patterns in Models

#### 1. Authentication
```python
token = os.environ.get('GITLAB_TOKEN')
if not token:
    raise RuntimeError("Token environment variable 'GITLAB_TOKEN' not set.")
headers = {"PRIVATE-TOKEN": token}
```

#### 2. Pagination
```python
page = 1
while True:
    params['page'] = page
    resp = requests.get(url, headers=headers, params=params, verify=False)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        break
    items.extend([Model.from_gitlab(item) for item in data])
    if len(data) < 100:
        break
    page += 1
```

#### 3. SSL Verification Disabled
```python
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# Used in all requests: verify=False
```

## Frontend Structure

### Entry Point (`ui/src/index.js`)

**Purpose**: React application entry point.

**Responsibilities**:
- Initialize React root
- Set up Material-UI ThemeProvider
- Register service worker (unregistered)
- Enable web vitals reporting

### Root Component (`ui/src/App.js`)

**Purpose**: Root React component.

**Structure**:
```jsx
<CssBaseline />
<Container>
  <Typography>Title</Typography>
  <TabsLayout />
</Container>
```

**Dependencies**:
- Material-UI: CssBaseline, Container, Typography
- TabsLayout component

### Main UI Component (`ui/src/TabsLayout.js`)

**Purpose**: Main UI component with tabbed interface and form handling.

**Key Features**:
- Tab navigation (6 tabs)
- Dynamic form generation based on tab configuration
- API integration
- Result formatting and display
- Copy-to-clipboard functionality

**State Management**:
```javascript
const [tab, setTab] = useState(0);
const [params, setParams] = useState({});
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [copied, setCopied] = useState(false);
```

**Configuration**:
- `tabConfig`: Array defining tabs, labels, and required parameters
- `apiMap`: Maps tab keys to API functions
- `PROJECTS`: Hardcoded project list (sorted alphabetically)

**Form Generation**:
- Project dropdown (Select component)
- Date pickers (DatePicker component)
- Dynamic based on `tabConfig[tab].params`

**Result Formatting**:
- `formatResult()`: Formats API response based on tab type
- Custom formatting for Merge Requests, Commits, Branches
- EST timezone conversion
- Status breakdown (for Merge Requests)

### API Client (`ui/src/api.js`)

**Purpose**: Centralized API communication.

**Structure**:
```javascript
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export const fetchMergeRequests = (params) => axios.get(...);
export const fetchCommits = (params) => axios.get(...);
// ... other functions
```

**Functions**:
- All functions use Axios GET requests
- Parameters passed as query string
- Returns Axios promise

### Theme Configuration (`ui/src/theme.js`)

**Purpose**: Material-UI theme customization.

**Configuration**:
- **Palette**: Primary blue (#3a7bd5), secondary blue/gray
- **Typography**: Roboto font family, custom sizes
- **Components**: Custom styles for Cards, Papers, Buttons
- **Background**: Gradient background

## Configuration Files

### Backend Dependencies (`backend/requirements.txt`)
```
fastapi
uvicorn
```

**Note**: Missing `requests` dependency (should be added)

### Frontend Dependencies (`ui/package.json`)
- React 19.1.1
- Material-UI v7.3.1
- Axios 1.11.0
- Date pickers and utilities

### Docker Configuration

**Backend Dockerfile**:
- Base: `python:3.11-slim`
- Installs requirements
- Runs uvicorn on port 8000

**Frontend Dockerfile**:
- Base: `node:20-slim`
- Installs npm dependencies
- Runs `npm start` on port 3000

**Docker Compose**:
- Orchestrates backend and frontend services
- Volume mounts for development
- Port mappings

## Code Quality Observations

### Strengths
1. **Consistent Patterns**: Models follow similar structure
2. **Separation of Concerns**: Clear separation between frontend and backend
3. **Modular Design**: Each model is in its own file
4. **Error Handling**: Consistent error handling pattern
5. **Type Hints**: Python models use type hints

### Areas for Improvement
1. **Missing Dependencies**: `requests` not in requirements.txt
2. **Code Duplication**: Similar pagination logic in each model
3. **Hardcoded Values**: Project list, base URL, SSL verification
4. **No Validation**: No input validation on API endpoints
5. **No Logging Configuration**: Basic logging without structure
6. **No Tests**: No automated tests
7. **SSL Verification Disabled**: Security concern
8. **No Environment Configuration**: Limited environment variable usage

## Module Dependencies

### Backend Dependencies
```
fastapi → uvicorn → Python
requests → GitLab API
os → Environment variables
datetime → Date parsing
typing → Type hints
logging → Error logging
traceback → Error traces
urllib3 → SSL warnings
```

### Frontend Dependencies
```
react → react-dom
@mui/material → @mui/icons-material
@mui/x-date-pickers → date-fns
axios → HTTP client
```

## Data Flow Between Modules

```
User Input (TabsLayout)
    ↓
API Call (api.js)
    ↓
HTTP Request (Axios)
    ↓
FastAPI Endpoint (main.py)
    ↓
Model Function (models/*.py)
    ↓
GitLab API (requests)
    ↓
Response Processing
    ↓
Model Objects
    ↓
JSON Serialization
    ↓
HTTP Response
    ↓
Frontend Display (TabsLayout)
```

## Extension Points

### Adding New Endpoints
1. Create model in `backend/models/new_model.py`
2. Add endpoint in `backend/main.py`
3. Add API function in `ui/src/api.js`
4. Add tab configuration in `ui/src/TabsLayout.js`
5. Add formatting logic in `formatResult()` function

### Adding New Features
1. **Caching**: Add caching layer in models or main.py
2. **Authentication**: Add auth middleware in main.py
3. **Validation**: Add Pydantic models for request validation
4. **Logging**: Add structured logging middleware
5. **Testing**: Add test files in `backend/tests/` and `ui/src/__tests__/`
