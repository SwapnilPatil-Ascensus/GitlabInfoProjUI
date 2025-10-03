
# User Guide: GitLab Project Manager UI

## Overview
This UI provides a modern, tabbed interface for GitLab analytics and reporting. Each tab corresponds to a report type (Merge Requests, Commits, Branches, Pipelines, Users, Project Details). Enter parameters, click Generate, and view results instantly.

## Running the App

### Local Development
- Backend (FastAPI):
  ```powershell
  cd backend
  python -m venv venv

  venv\Scripts\activate  # On Windows
  pip install -r requirements.txt
  # Set your GitLab token for the current session (PowerShell):
  $env:GITLAB_TOKEN="glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"
  uvicorn main:app --reload --host 0.0.0.0 --port 8000

  # To set the token permanently (for all future sessions), run this in PowerShell:
  # setx GITLAB_TOKEN "glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"
  # Restart your terminal before running the backend

  # Ensure that the GITLAB_TOKEN is set before running the backend
  # This is crucial for the application to function correctly.
  ```
- Frontend (React):
  ```powershell
  cd ui
  npm install
  npm start
  ```

### Docker Compose
```powershell
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## Usage
1. Open http://localhost:3000 in your browser.
2. Select a tab for the desired report type.
3. Choose a project from the dropdown and set a date range (if required).
4. Click the Generate button to fetch and display results.
5. Results are formatted for easy reading, with links and metadata.


## What to Expect
- Tabbed UI for all analytics/reporting types
- Project dropdown and date pickers for parameters
- Results formatted as:
  ```
  ===== Project: monolith | Type: Merge Requests | Date Range: 07/30/2025 - 07/31/2025 | Total: 3 =====
  🔄 ***************** Merged Merge Requests: *****************
  🔎 MR Title: update qc4.properties
  🔗 MR Link: https://gitlab.com/ascensus-gs/products/depot/monolith/-/merge_requests/2631
  ✍️ Author: Mohan Pillai
  👥 Reviewers: Abhitosh Fani, Priyal Patel
  👥 Merged by: John Doe
  � Created At: 2025-07-30T19:52:14.879Z
  📅 Merged At: 2025-07-30T20:05:24.175Z
  🔀 features/fix401inqc4 → main
  ------------------------------------------------------------

  ===== Project: automation | Type: Branches | Date Range: 8/1/2025 - 8/6/2025 | Total: 2 =====
  Branch Name: Main
  web url: https://gitlab.com/api/v4/projects/71904320/repository/branches/main
  Author: Swapnil Patil
  -------------------------------------------------------------------------------------------
  Branch Name: feature/qa-80
  web url: https://gitlab.com/api/v4/projects/71904320/repository/branches/feature/qa-80
  Author: venkatesh mallela
  -------------------------------------------------------------------------------------------
  ```
- Real-time data from GitLab

## Troubleshooting
- If the UI is stuck on loading, ensure the backend is running and `GITLAB_TOKEN` is set
- For CORS errors, backend must be on port 8000 and frontend on 3000
- Check terminal logs for Python errors (tracebacks are now returned in API responses)
- If Docker Compose fails, check port conflicts and logs


## Customization
- Add analytics/reporting logic to `backend/models/`
- Edit React UI in `ui/src/` for custom tabs, forms, and result layouts
- UI background is now light grey for a modern look

---
For advanced usage, see the README.md and `docs/AGENT_PROMPT.md`.
