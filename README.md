# GitLab Project Manager UI

A modern, full-stack web application for connecting to GitLab and retrieving merge requests, commits, branches, pipelines, users, and project information. Designed for automation bug tracking - identifying the last check-ins between timeframes that might be causing breakage in any project or repository.

## 🎯 Purpose

This utility helps teams:
- Track merge requests and commits within specific timeframes
- Identify changes that may have caused automation failures
- Analyze project activity across multiple repositories
- Generate reports for debugging and analysis

## ✨ Features

- **Comprehensive GitLab Integration**: Access merge requests, commits, branches, pipelines, users, and project details
- **Time-based Filtering**: Filter merge requests and commits by date range
- **Tabbed Interface**: Easy navigation between different data types
- **Formatted Output**: Human-readable results with emojis and structured formatting
- **Copy to Clipboard**: One-click copying of results
- **Modern UI**: Premium Material-UI design with responsive layout
- **Docker Support**: Containerized deployment with Docker Compose
- **Real-time Data**: Direct integration with GitLab API v4

## 🏗️ Architecture

- **Backend**: FastAPI (Python) - RESTful API server
- **Frontend**: React 19 + Material-UI v7 - Modern web interface
- **API**: GitLab API v4 integration
- **Deployment**: Docker & Docker Compose support

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (3.11+ recommended)
- Node.js 16+ (20+ recommended)
- GitLab Personal Access Token

### 1. Clone Repository
```bash
git clone <repository-url>
cd GitlabInfoProjUI
```

### 2. Backend Setup

**Windows (PowerShell)**:
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
$env:GITLAB_TOKEN="your-gitlab-token-here"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/macOS**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GITLAB_TOKEN="your-gitlab-token-here"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd ui
npm install
npm start
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

For detailed setup instructions, see [docs/QUICK_START.md](docs/QUICK_START.md).

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, components, and design patterns
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference with endpoints and examples
- **[CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md)** - Code organization, module structure, and patterns
- **[GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md)** - Identified gaps, improvements, and recommendations
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guides for development and production
- **[QUICK_START.md](docs/QUICK_START.md)** - Step-by-step setup guide
- **[USER_GUIDE.md](docs/USER_GUIDE.md)** - User manual and usage instructions

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Set environment variables
export GITLAB_TOKEN="your-gitlab-token-here"

# Build and start services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

For detailed Docker deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📋 Usage

1. **Select Project**: Choose a project from the dropdown
2. **Set Date Range**: Select start and end dates (for Merge Requests and Commits)
3. **Choose Tab**: Navigate to the desired data type (Merge Requests, Commits, Branches, etc.)
4. **Generate**: Click the "Generate" button to fetch data
5. **View Results**: Results are displayed in a formatted, readable format
6. **Copy Results**: Click the copy icon to copy results to clipboard

### Supported Data Types

- **Merge Requests**: Filtered by date range, includes author, reviewers, merge status
- **Commits**: Filtered by date range, includes author, dates, messages
- **Branches**: All branches with author information
- **Pipelines**: All CI/CD pipelines with status
- **Users**: All project members
- **Project**: Project metadata and details

## 🔧 Configuration

### Environment Variables

**Backend**:
- `GITLAB_TOKEN` (required): GitLab Personal Access Token
- `GITLAB_BASE_URL` (optional): GitLab instance URL (default: `https://gitlab.com`)
- `PORT` (optional): Backend server port (default: `8000`)

**Frontend**:
- `REACT_APP_API_BASE` (optional): Backend API URL (default: `http://localhost:8000`)

For detailed configuration options, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#configuration).

## 🛠️ Development

### Project Structure
```
GitlabInfoProjUI/
├── backend/          # FastAPI backend
│   ├── models/      # Data models and GitLab API clients
│   └── main.py      # FastAPI application
├── ui/              # React frontend
│   └── src/         # React components and logic
└── docs/            # Documentation
```

For detailed code structure, see [docs/CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md).

### Adding New Features

1. **New Endpoint**: Add to `backend/main.py` and create model in `backend/models/`
2. **New UI Tab**: Add to `tabConfig` in `ui/src/TabsLayout.js`
3. **New API Function**: Add to `ui/src/api.js`

## 🔍 API Endpoints

| Endpoint | Method | Parameters | Description |
|----------|--------|-----------|-------------|
| `/merge-requests` | GET | `project_id`, `start_date`, `end_date` | Get merge requests in date range |
| `/commits` | GET | `project_id`, `start_date`, `end_date` | Get commits in date range |
| `/branches` | GET | `project_id` | Get all branches |
| `/pipelines` | GET | `project_id` | Get all pipelines |
| `/users` | GET | `project_id` | Get project members |
| `/project` | GET | `project_id` | Get project details |

For complete API documentation, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## 🎨 UI Features

- **Material-UI Design**: Modern, premium look and feel
- **Responsive Layout**: Works on desktop and tablet devices
- **Tab Navigation**: Easy switching between data types
- **Date Pickers**: Intuitive date selection
- **Formatted Results**: Human-readable output with emojis
- **Copy Functionality**: One-click result copying
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during API calls

## 🔒 Security

- GitLab token stored in environment variables (not in code)
- CORS configured for specific origins
- HTTPS recommended for production
- Input validation on API endpoints

**⚠️ Security Recommendations**:
- Enable SSL verification in production
- Add authentication for backend endpoints
- Implement rate limiting
- Use secure secret management

For security improvements, see [docs/GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md#security-gaps).

## 📊 Example Output

```
===== Project: monolith | Type: Merge Requests | Date Range: 01/01/2026 - 01/26/2026 | Total: 3 | Open: 0, Merged: 3, Closed: 0 =====

🔄 ***************** Merged Merge Requests: *****************
🔎 MR Title: update qc4.properties
🔗 MR Link: https://gitlab.com/ascensus-gs/products/depot/monolith/-/merge_requests/2631
✍️ Author: Mohan Pillai
👥 Reviewers: Abhitosh Fani, Priyal Patel
👥 Merged by: John Doe
📅 Created At: 01/15/2026 14:52:14
📅 Merged At: 01/15/2026 15:05:24
🔀 features/fix401inqc4 → main
------------------------------------------------------------
```

## 🐛 Troubleshooting

### Common Issues

**Token not set**:
```bash
# Verify token is set
echo $GITLAB_TOKEN  # Linux/macOS
$env:GITLAB_TOKEN  # PowerShell

# Set token
export GITLAB_TOKEN="your-token"  # Linux/macOS
$env:GITLAB_TOKEN="your-token"    # PowerShell
```

**Connection refused**:
- Verify backend is running on port 8000
- Check `REACT_APP_API_BASE` environment variable
- Ensure CORS is configured correctly

**Module not found**:
- Activate virtual environment
- Run `pip install -r requirements.txt`

For detailed troubleshooting, see [docs/QUICK_START.md](docs/QUICK_START.md#troubleshooting-guide) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#troubleshooting).

## 🚧 Known Limitations & Improvements

See [docs/GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md) for:
- Identified gaps and issues
- Improvement recommendations
- Implementation roadmap
- Priority-based fixes

## 🤝 Contributing

1. Review the architecture and code structure documentation
2. Follow existing code patterns
3. Add tests for new features
4. Update documentation as needed

## 📝 License

[Add your license information here]

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Material-UI](https://mui.com/)
- [GitLab API](https://docs.gitlab.com/ee/api/)

---

For questions or issues, please refer to the documentation in the `docs/` directory or open an issue in the repository.
