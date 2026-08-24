# GitLab Project Manager UI

> **A premium, full-stack web application for GitLab project analytics and automation bug tracking**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.128.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.3.1-007FFF?logo=mui)](https://mui.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start (5 Minutes)](#-quick-start-5-minutes)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Usage Guide](#-usage-guide)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)

---

## 🎯 Overview

**GitLab Project Manager UI** is a modern, premium web application designed to help teams track GitLab project activity and identify changes that may have caused automation failures. It provides a comprehensive interface for analyzing merge requests, commits, branches, pipelines, and project information within specific timeframes.

### Purpose

This utility is specifically designed for:
- **Automation Bug Tracking**: Identify the last check-ins between timeframes that might be causing breakage
- **Change Analysis**: Track merge requests and commits within specific date ranges
- **Project Monitoring**: Analyze project activity across multiple repositories
- **Debugging Support**: Generate detailed reports for troubleshooting

### Technology Stack

- **Backend**: FastAPI (Python 3.11+) - High-performance REST API
- **Frontend**: React 19 + Material-UI v7 - Modern, premium UI
- **API Integration**: GitLab API v4
- **Deployment**: Docker & Docker Compose support

---

## 🚀 Quick Start (5 Minutes)

> **💡 For the absolute fastest setup, see [SETUP.md](SETUP.md) - Copy-paste ready commands!**

### Prerequisites

Before you begin, ensure you have:
- ✅ **Python 3.8+** (3.11+ recommended) - [Download Python](https://www.python.org/downloads/)
- ✅ **Node.js 16+** (20+ recommended) - [Download Node.js](https://nodejs.org/)
- ✅ **GitLab Personal Access Token** - [Create Token](https://gitlab.com/-/user_settings/personal_access_tokens)
  - Required scopes: `api` or `read_api`

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd GitlabInfoProjUI
```

### Step 2: Set Up Backend (Terminal 1)

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
$env:GITLAB_TOKEN="your-gitlab-token-here"
$env:QTEST_BEARER_TOKEN="your-qtest-token-here"
$env:QTEST_BASE_URL="https://ascensus.qtestnet.com"
$env:QTEST_VERIFY_SSL="false"
cd ..
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GITLAB_TOKEN="your-gitlab-token-here"
export QTEST_BEARER_TOKEN="your-qtest-token-here"
export QTEST_BASE_URL="https://ascensus.qtestnet.com"
export QTEST_VERIFY_SSL="false"
cd ..
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

> **💡 Tip**: To set the token permanently on Windows, use: `setx GITLAB_TOKEN "your-token"` (then restart terminal)

### qTest Local Setup

For local qTest access, create a file named [`.env.local`](.env.local) in the repository root and add your qTest values there. The backend loads `.env.local` first, then `.env`, so local overrides stay on your machine.

Minimum qTest entries:

```powershell
QTEST_BASE_URL=https://ascensus.qtestnet.com
QTEST_BEARER_TOKEN=your-qtest-token-here
QTEST_VERIFY_SSL=false
```

If qTest is using a trusted certificate chain in your environment, you can set `QTEST_VERIFY_SSL=true` instead.

### Step 3: Set Up Frontend (Terminal 2)

```bash
cd ui
npm install
npm start
```

### Step 4: Access the Application

- 🌐 **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser
- 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📚 **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (Interactive Swagger UI)

### ✅ Verify Installation

1. Backend should show: `INFO: Application startup complete.`
2. Frontend should automatically open in your browser
3. You should see the "GitLab Project Manager" interface

**That's it! You're ready to use the application.**

> 📖 **Need more details?** See [Quick Start Guide](docs/QUICK_START.md) for step-by-step instructions with troubleshooting.

---

## ✨ Features

### Core Functionality
- 🔍 **Merge Requests Analysis**: Filter by date range, view author, reviewers, merge status
- 📝 **Commits Tracking**: Track commits with author, dates, and messages
- 🌿 **Branch Management**: View all branches with creator information
- 🔄 **Pipeline Monitoring**: Monitor CI/CD pipeline status and execution
- 👥 **User Management**: View project members and their details
- 📊 **Project Overview**: Get comprehensive project metadata

### Premium UI Features
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 🔎 **Search & Filter**: Real-time search across results
- 📥 **Export Functionality**: Export to CSV or Excel
- 📅 **Date Presets**: Quick date range selection (Today, Last 7/30/90 days)
- 💡 **Info Tooltips**: Contextual help throughout the interface
- 📋 **Copy to Clipboard**: One-click result copying
- ⚡ **Smooth Animations**: Premium feel with transitions and hover effects

### Technical Features
- ⚡ **Caching**: In-memory caching for improved performance
- 🔒 **Input Validation**: Pydantic models for request validation
- 📝 **Structured Logging**: Comprehensive logging for debugging
- 🐳 **Docker Support**: Easy deployment with Docker Compose
- 🔄 **Auto-reload**: Hot reload for development

---

## 📁 Project Structure

```
GitlabInfoProjUI/
│
├── 📂 backend/                    # FastAPI Backend
│   ├── 📂 models/                # Data models (MergeRequest, Commit, Branch, etc.)
│   │   ├── merge_request.py
│   │   ├── commit.py
│   │   ├── branch.py
│   │   ├── pipeline.py
│   │   ├── user.py
│   │   └── project.py
│   ├── 📂 services/              # Business logic layer
│   │   └── gitlab_service.py
│   ├── 📂 utils/                 # Shared utilities
│   │   ├── gitlab_client.py      # Shared GitLab API client
│   │   └── cache.py              # Caching implementation
│   ├── 📂 schemas/               # Request/response validation
│   │   └── requests.py
│   ├── config.py                 # Configuration management
│   ├── main.py                   # FastAPI application entry point
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile
│
├── 📂 ui/                        # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/        # Reusable UI components
│   │   │   ├── ThemeProvider.js
│   │   │   ├── DarkModeToggle.js
│   │   │   ├── SearchFilter.js
│   │   │   ├── ExportButton.js
│   │   │   ├── DatePresetSelector.js
│   │   │   ├── ErrorAlert.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── InfoTooltip.js
│   │   ├── 📂 utils/            # Utility functions
│   │   │   ├── constants.js     # App constants and config
│   │   │   ├── formatters.js     # Data formatting utilities
│   │   │   └── exporters.js     # CSV/Excel export functions
│   │   ├── App.js                # Root component
│   │   ├── TabsLayout.js         # Main UI component
│   │   ├── api.js                # API client
│   │   └── theme.js             # Material-UI theme configuration
│   ├── package.json
│   └── Dockerfile
│
├── 📂 docs/                      # Comprehensive Documentation
│   ├── README.md                 # Documentation index
│   ├── QUICK_START.md            # Detailed setup guide
│   ├── USER_GUIDE.md             # User manual
│   ├── ARCHITECTURE.md           # System architecture
│   ├── API_DOCUMENTATION.md      # API reference
│   ├── CODE_STRUCTURE.md         # Code organization
│   ├── DEPLOYMENT.md             # Deployment guides
│   └── GAP_ANALYSIS.md           # Improvements and roadmap
│
├── docker-compose.yml            # Docker Compose configuration
├── .gitignore                   # Git ignore rules
└── README.md                     # This file
```

> 📖 **Detailed Structure**: See [Code Structure Documentation](docs/CODE_STRUCTURE.md) for complete module descriptions.

---

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

### Getting Started
- 📘 **[Quick Start Guide](docs/QUICK_START.md)** - Step-by-step setup with troubleshooting
- 👤 **[User Guide](docs/USER_GUIDE.md)** - How to use the application

### Technical Documentation
- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** - System design, components, data flow
- 🔌 **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- 📁 **[Code Structure](docs/CODE_STRUCTURE.md)** - Code organization and patterns

### Operations
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- 🔍 **[Gap Analysis](docs/GAP_ANALYSIS.md)** - Improvements and roadmap

### Documentation Index
- 📚 **[Documentation Index](docs/README.md)** - Complete documentation navigation

---

## 📋 Usage Guide

### Basic Workflow

1. **Select Project**: Choose a project from the dropdown menu
2. **Set Parameters**: 
   - For Merge Requests/Commits: Select start and end dates
   - Use date presets for quick selection (Today, Last 7/30/90 days)
3. **Choose Tab**: Navigate to the desired data type
4. **Generate**: Click the "Generate" button
5. **View Results**: Results appear in formatted, readable format
6. **Search/Filter**: Use the search box to filter results
7. **Export**: Click "Export" to download as CSV or Excel
8. **Copy**: Click the copy icon to copy results to clipboard

### Supported Data Types

| Tab | Description | Parameters |
|-----|-------------|------------|
| **Merge Requests** | View merge requests with author, reviewers, merge status | Project, Start Date, End Date |
| **Commits** | Track commits with author, dates, messages | Project, Start Date, End Date |
| **Branches** | View all branches with creator information | Project |
| **Pipelines** | Monitor CI/CD pipeline status | Project |
| **Users** | View project members | Project |
| **Project** | Get project metadata and details | Project |

### Output Format

Results are displayed in a human-readable format with emojis and structured sections:

```
**===== Project: monolith | Type: Merge Requests | Date Range: 12/8/2025 - 12/9/2025 | Total: 21 | Open: 4, Merged: 17, Closed: 0 =====**

🔄 ***************** Merged Merge Requests: *****************
🔎 MR Title: change datetime
🔗 MR Link: https://gitlab.com/...
✍️ Author: Sam Peaslee
👥 Reviewers: Abhitosh Fani, Priyal Patel
👥 Merged by: Abhitosh Fani
📅 Created At: 12/03/2025 14:06:08
📅 Merged At: 12/08/2025 18:24:05
🔀 feature/ALPHA-6507-2 → main
------------------------------------------------------------
```

> 📖 **Detailed Usage**: See [User Guide](docs/USER_GUIDE.md) for complete usage instructions.

---

## 🔧 Configuration

### Environment Variables

#### Backend (Required)
```bash
GITLAB_TOKEN=your-gitlab-personal-access-token
```

#### Backend (Optional)
```bash
GITLAB_BASE_URL=https://gitlab.com          # Default: https://gitlab.com
GITLAB_VERIFY_SSL=false                     # Default: false (for corporate proxy)
PORT=8000                                   # Default: 8000
CORS_ORIGINS=http://localhost:3000          # Default: http://localhost:3000,http://localhost:3001
CACHE_ENABLED=true                          # Default: true
CACHE_TTL=300                               # Default: 300 seconds
LOG_LEVEL=INFO                              # Default: INFO
```

#### Frontend (Optional)
```bash
REACT_APP_API_BASE=http://localhost:8000    # Default: http://localhost:8000
```

### Setting Environment Variables

**Windows (PowerShell) - Current Session:**
```powershell
$env:GITLAB_TOKEN="your-token-here"
```

**Windows (PowerShell) - Permanent:**
```powershell
setx GITLAB_TOKEN "your-token-here"
# Restart terminal after running setx
```

**Linux/macOS - Current Session:**
```bash
export GITLAB_TOKEN="your-token-here"
```

**Linux/macOS - Permanent:**
```bash
echo 'export GITLAB_TOKEN="your-token-here"' >> ~/.bashrc
source ~/.bashrc
```

> 📖 **Configuration Details**: See [Deployment Guide](docs/DEPLOYMENT.md#configuration) for complete configuration options.

---

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Set environment variable
export GITLAB_TOKEN="your-gitlab-token-here"

# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

> 📖 **Docker Details**: See [Deployment Guide](docs/DEPLOYMENT.md#docker-deployment) for complete Docker instructions.

---

## 🐛 Troubleshooting

### Common Issues

#### ❌ Backend won't start
**Problem**: `Token environment variable 'GITLAB_TOKEN' not set.`
```powershell
# Solution: Set the token
$env:GITLAB_TOKEN="your-token-here"
```

#### ❌ Connection refused / Network error
**Problem**: Frontend can't connect to backend
- ✅ Verify backend is running on port 8000
- ✅ Check backend logs for errors
- ✅ Ensure CORS is configured correctly

#### ❌ SSL Certificate Error
**Problem**: `SSLCertVerificationError` when fetching from GitLab
- ✅ SSL verification is disabled by default (for corporate proxy compatibility)
- ✅ If still seeing errors, check `GITLAB_VERIFY_SSL` setting

#### ❌ Module not found
**Problem**: `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Solution: Install dependencies
cd backend
pip install -r requirements.txt
```

#### ❌ Frontend won't compile
**Problem**: Missing dependencies or build errors
```bash
# Solution: Reinstall dependencies
cd ui
rm -rf node_modules package-lock.json
npm install
```

### Quick Fixes

1. **Kill all processes** (Windows):
   ```powershell
   taskkill /F /IM python.exe
   taskkill /F /IM node.exe
   ```

2. **Restart from scratch**:
   - Close all terminals
   - Open new terminal
   - Follow Quick Start steps again

> 📖 **More Help**: See [Quick Start Guide - Troubleshooting](docs/QUICK_START.md#troubleshooting-guide) for detailed solutions.

---

## 🛠️ Development

### Project Architecture

The application follows a modular architecture:

```
Frontend (React) → API Client → Backend (FastAPI) → Service Layer → GitLab Client → GitLab API
```

**Key Components:**
- **Frontend**: React components with Material-UI
- **Backend API**: FastAPI REST endpoints
- **Service Layer**: Business logic separation
- **GitLab Client**: Shared API client utility
- **Caching**: In-memory cache with TTL

> 📖 **Architecture Details**: See [Architecture Documentation](docs/ARCHITECTURE.md) for complete system design.

### Adding New Features

#### Add New Endpoint
1. Create model in `backend/models/`
2. Add service method in `backend/services/gitlab_service.py`
3. Add endpoint in `backend/main.py`
4. Add API function in `ui/src/api.js`
5. Add tab configuration in `ui/src/utils/constants.js`
6. Add formatting in `ui/src/utils/formatters.js`

#### Add New UI Component
1. Create component in `ui/src/components/`
2. Import and use in `TabsLayout.js` or `App.js`
3. Add to exports in `ui/src/components/__init__.js`

> 📖 **Development Guide**: See [Code Structure](docs/CODE_STRUCTURE.md) for extension points and patterns.

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd ui
npm test
```

---

## 📊 API Endpoints

| Endpoint | Method | Parameters | Description |
|----------|--------|-----------|-------------|
| `/health` | GET | - | Health check endpoint |
| `/merge-requests` | GET | `project_id`, `start_date`, `end_date` | Get merge requests in date range |
| `/commits` | GET | `project_id`, `start_date`, `end_date` | Get commits in date range |
| `/branches` | GET | `project_id` | Get all branches |
| `/pipelines` | GET | `project_id` | Get all pipelines |
| `/users` | GET | `project_id` | Get project members |
| `/project` | GET | `project_id` | Get project details |
| `/cache/clear` | POST | - | Clear application cache |
| `/cache/stats` | GET | - | Get cache statistics |

> 📖 **Complete API Reference**: See [API Documentation](docs/API_DOCUMENTATION.md) for detailed endpoint documentation.

---

## 🔒 Security

### Current Security Features
- ✅ GitLab token stored in environment variables
- ✅ CORS configured for specific origins
- ✅ Input validation with Pydantic models
- ✅ Structured error handling

### Security Recommendations
- ⚠️ **Production**: Enable SSL verification (`GITLAB_VERIFY_SSL=true`)
- ⚠️ **Production**: Add authentication for backend endpoints
- ⚠️ **Production**: Implement rate limiting
- ⚠️ **Production**: Use secure secret management (AWS Secrets Manager, HashiCorp Vault)

> 📖 **Security Details**: See [Gap Analysis](docs/GAP_ANALYSIS.md#security-gaps) for security improvements.

---

## 🚧 Known Limitations

- Project list is currently hardcoded (can be made dynamic)
- No user authentication (add for production)
- SSL verification disabled by default (for corporate proxy compatibility)
- No rate limiting (add for production)

> 📖 **Improvements**: See [Gap Analysis](docs/GAP_ANALYSIS.md) for complete list and roadmap.

---

## 📝 Changelog

### Version 2.0.0 (Current)
- ✨ Premium UI with dark mode support
- ✨ Search and filter functionality
- ✨ CSV/Excel export capabilities
- ✨ Modular architecture refactoring
- ✨ Caching layer implementation
- ✨ Enhanced error handling
- ✨ Comprehensive documentation

### Version 1.0.0
- 🎉 Initial release
- Basic GitLab integration
- Tabbed interface
- Formatted output

---

## 🤝 Contributing

1. Review [Architecture Documentation](docs/ARCHITECTURE.md)
2. Follow [Code Structure](docs/CODE_STRUCTURE.md) patterns
3. Add tests for new features
4. Update documentation
5. Follow existing code style

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
**Attribution requirement:** The copyright notice in the app footer (“© [year] Swapnil Patil. All rights reserved.”) must be retained in all forks and derivative works. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Material-UI](https://mui.com/) - React component library
- [GitLab API](https://docs.gitlab.com/ee/api/) - GitLab REST API

---

## 📞 Support & Resources

- 📚 **Documentation**: See [`docs/`](docs/) directory
- 🐛 **Issues**: Check [Troubleshooting](#-troubleshooting) section
- 💡 **Questions**: Refer to [User Guide](docs/USER_GUIDE.md) or [Quick Start](docs/QUICK_START.md)

---

**⭐ If you find this project useful, please consider giving it a star!**

---

*Last Updated: January 2026*
