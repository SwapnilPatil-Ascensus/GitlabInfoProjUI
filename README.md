

# GitLab Project Manager UI

A modern, modular web UI for GitLab analytics and reporting, built with FastAPI (backend) and React + Material-UI (frontend).

## Features
- Tabbed UI for Merge Requests, Commits, Branches, Pipelines, Users, Project Details
- Project dropdown and date pickers for parameter entry
- Results formatted for easy reading, including:
  - Merge Requests: author, reviewers, merged by, links, branches, and timestamps
  - Commits: title, author, dates, commit ID, message
  - Branches: branch name, web url, and branch creator (author)
- Docker and Docker Compose support
- VS Code tasks for easy local dev
- Real-time data pulled from GitLab API
- Modern UI with light grey background and Material-UI cards

## Quick Start
See `docs/QUICK_START.md` for a step-by-step guide.

## Setup (Summary)
1. Clone the repo and install dependencies for backend and frontend

2. Set your `GITLAB_TOKEN` environment variable (PowerShell):
  - For the current session: `$env:GITLAB_TOKEN="glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"`
  - For all future sessions: `setx GITLAB_TOKEN "glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"` (then restart terminal)
3. Start backend (port 8000) and frontend (port 3000) as shown below
4. Open http://localhost:3000 in your browser


## Usage
- Select a project and date range, then click Generate on any tab
- View analytics and reporting results in a modern UI
- See `docs/USER_GUIDE.md` for more details

## Backend Start Example (PowerShell)
```powershell
cd backend
venv\Scripts\activate
$env:GITLAB_TOKEN="glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Permanent Token (Optional)
```powershell
setx GITLAB_TOKEN "glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"
# Restart your terminal before running the backend
```

## Documentation
- `README.md` (this file)
- `docs/QUICK_START.md` (step-by-step setup)
- `docs/USER_GUIDE.md` (detailed usage)
- `docs/AGENT_PROMPT.md` (prompt for recreating this project with an agent)

## Customization
- Add analytics/reporting logic to `backend/models/`
- Edit React UI in `ui/src/` for custom tabs, forms, and result layouts

## Example Output Formats
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

---
For advanced usage, see the user guide and agent prompt in the `docs/` folder.
