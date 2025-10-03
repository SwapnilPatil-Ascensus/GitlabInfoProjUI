# Agent Prompt for Recreating This Project from Scratch

## Project Overview
Build a modern, modular GitLab analytics/reporting tool with:
- FastAPI backend (Python)
- React frontend (Material-UI)
- Docker and VS Code support
- Tabbed UI for each report type (Merge Requests, Commits, Branches, Pipelines, Users, Project Details)
- Parameter forms and formatted results

## Step-by-Step Prompt for an AI Agent

1. **Scaffold the Backend:**
   - Create a FastAPI project in a `backend/` folder.
   - Add endpoints for `/merge-requests`, `/commits`, `/branches`, `/pipelines`, `/users`, `/project`.
   - Each endpoint should call modular analytics/reporting logic (separate Python modules).
   - Add CORS middleware for `http://localhost:3000`.
   - Use environment variable `GITLAB_TOKEN` for GitLab API access.
   - For the current session (PowerShell): `$env:GITLAB_TOKEN="glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"`
   - For all future sessions: `setx GITLAB_TOKEN "glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"` (then restart terminal)

2. **Scaffold the Frontend:**
   - Create a React app in a `ui/` folder using Material-UI.
   - Implement a tabbed layout: one tab per report type.
   - Each tab should have a parameter form (project dropdown, date pickers, etc.).
   - Use Axios to call backend endpoints and display results in a formatted, readable way.

3. **Wire Up Backend and Frontend:**
   - Ensure all API endpoints are called from the UI.
   - Format results as specified (see README for example output).
   - Always set `GITLAB_TOKEN` before starting the backend.

4. **Add Docker Support:**
   - Add Dockerfile for backend and frontend.
   - Add `docker-compose.yml` to orchestrate both services.

5. **Add VS Code Tasks:**
   - Add `.vscode/tasks.json` for easy local dev (backend, frontend, Docker Compose).

6. **Write Documentation:**
   - `README.md` with setup, usage, customization, and troubleshooting.
   - `docs/USER_GUIDE.md` for end users.
   - This `AGENT_PROMPT.md` for future automation.


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


## Tips for the Agent
- Keep code modular and clean.
- Use environment variables for secrets.
- Make the UI modern and user-friendly (light grey background, Material-UI cards)
- Document every step and file.
- Test each endpoint and UI tab.

---
This file can be used as a detailed prompt for any AI agent to recreate the project from scratch.
