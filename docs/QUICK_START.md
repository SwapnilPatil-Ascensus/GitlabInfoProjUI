# Quick Start Guide: GitLab Project Manager UI

## Prerequisites
- Python 3.8+
- Node.js (v16+ recommended)
- npm
- GitLab personal access token (set as `GITLAB_TOKEN`)

## Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone <repo-url>
cd GitlabInfoProjUI
```

### 2. Install and Start the Backend

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Set your GitLab token for the current session:
$env:GITLAB_TOKEN="your-gitlab-token-here"

# Start backend from project root (required for proper imports):
cd ..
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set your GitLab token:
export GITLAB_TOKEN="your-gitlab-token-here"

# Start backend from project root:
cd ..
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**To set token permanently:**
- **Windows**: `setx GITLAB_TOKEN "your-token-here"` (then restart terminal)
- **Linux/macOS**: Add `export GITLAB_TOKEN="your-token-here"` to `~/.bashrc` or `~/.zshrc`

### 3. Install and Start the Frontend
```powershell
cd ../ui
npm install
npm start
```

- Backend runs at: http://localhost:8000
- Frontend runs at: http://localhost:3000

### 4. (Optional) Run with Docker Compose
```powershell
docker-compose up --build
```

## Usage
- Open http://localhost:3000 in your browser.
- Select a project and date range, then click Generate on any tab.
- View formatted analytics and reporting results.


## What to Expect
- Tabbed UI for Merge Requests, Commits, Branches, Pipelines, Users, Project Details
- Parameter forms (project dropdown, date pickers)
- Results formatted for easy reading, including:
  - Merge Requests: author, reviewers, merged by, links, branches, and timestamps
  - Commits: title, author, dates, commit ID, message
  - Branches: branch name, web url, and branch creator (author)
- Real-time data pulled from GitLab
- Modern UI with light grey background


## Troubleshooting Guide

If you encounter issues, follow these steps before asking for help or running the troubleshooting agent:

### 1. Kill All Open Backend Sessions
- On Windows, open PowerShell and run:
  ```powershell
  taskkill /F /IM uvicorn.exe
  taskkill /F /IM python.exe
  taskkill /F /IM cmd.exe
  taskkill /F /IM powershell.exe
  ```
- Close all open terminals and PowerShell windows.
- Open a new PowerShell window and start fresh.

### 2. Common Issues & Solutions

**Issue:** `Token environment variable 'GITLAB_TOKEN' not set.`
- **Solution:**
  - Set the token for the current session: `$env:GITLAB_TOKEN="your-gitlab-token-here"`
  - Or set it permanently: `setx GITLAB_TOKEN "your-gitlab-token-here"` (then restart your terminal)
  - Always set the token before running the backend.
  - Get your token from: https://gitlab.com/-/user_settings/personal_access_tokens

**Issue:** `net::ERR_CONNECTION_REFUSED` or UI shows `Network Error`
- **Solution:**
  - Ensure the backend is running and listening on port 8000.
  - Check that you started the backend after setting the token.
  - Kill all backend sessions and restart as above.

**Issue:** `ModuleNotFoundError: No module named 'requests'`
- **Solution:**
  - Activate your virtual environment: `venv\Scripts\activate`
  - Run: `pip install -r requirements.txt`

**Issue:** CORS errors in browser console
- **Solution:**
  - Ensure backend is running on port 8000 and frontend on 3000.
  - Do not change the default ports unless you update CORS settings in the backend.

**Issue:** UI stuck on loading or not updating
- **Solution:**
  - Refresh the browser.
  - Check backend logs for errors.
  - Ensure both backend and frontend are running.

**General Steps for Any Issue:**
1. Kill all open backend and terminal sessions.
2. Open a new PowerShell window.
3. Activate your virtual environment.
4. Set the `GITLAB_TOKEN` for the session.
5. Start the backend.
6. Start the frontend.
7. Check logs for errors and refer to this guide.

---
If you ask an agent for help, they will refer to these steps and guide you through them.

---
For more details, see `README.md` and `docs/USER_GUIDE.md`.
