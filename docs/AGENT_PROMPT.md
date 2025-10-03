# Agent Prompt for Recreating This Project End-to-End

Use this file verbatim as a system / seed prompt to reliably regenerate the entire project from an empty workspace. Follow the ordered sections. Do NOT skip validation steps.

## 1. Goal
Create a full-stack GitLab analytics & reporting UI with:
1. FastAPI backend (Python)
2. React + Material-UI frontend
3. Modular analytics logic per domain (merge requests, commits, branches, pipelines, users, project info)
4. Structured, human-readable text output (classic terminal style with separators)
5. Docker + docker-compose for containerized dev
6. VS Code tasks for quick start
7. Re-creatable via this single prompt

## 2. High-Level Architecture
```
GitlabInfoProjUI/
  backend/
    main.py               # FastAPI app + routers
    models/
      merge_request.py
      commit.py
      branch.py
      pipeline.py
      project.py
      user.py
    requirements.txt
    Dockerfile
  ui/
    package.json
    src/
      index.js
      App.js
      TabsLayout.js       # Tab logic + forms + result rendering
      api.js              # Axios client
      theme.js            # MUI theme customization
    public/
    Dockerfile
  docker-compose.yml
  .vscode/tasks.json
  README.md
  docs/
    QUICK_START.md
    USER_GUIDE.md
    AGENT_PROMPT.md
```

## 3. Backend Requirements
Language: Python 3.11+ (virtual env `venv`).
Dependencies (minimal):
```
fastapi
uvicorn[standard]
httpx
python-dateutil
```
Design:
- One function per data retrieval concern in `models/*.py`.
- Each FastAPI endpoint: parse query params (project id/name, date range), call model function, post-process for formatting.
- Use `GITLAB_TOKEN` env var; validate at startup (raise HTTP 500 if missing).
- Add CORS for `http://localhost:3000`.

Endpoints (GET):
- `/merge-requests`
- `/commits`
- `/branches`
- `/pipelines`
- `/users`
- `/project`

Date handling: accept `start_date`, `end_date` (ISO or `YYYY-MM-DD`). Default to last 7 days if absent.

## 4. Frontend Requirements
Tooling: Create React App (or Vite) + Material-UI (MUI v5+).
Layout:
- AppBar + Tabs (Merge Requests, Commits, Branches, Pipelines, Users, Project Details)
- Each tab: form (project selector text field, date pickers, submit button) + results panel (monospace or pre-styled block)
- Light grey background, elevated cards for result sections.

API Layer:
- `api.js` exports functions: `fetchMergeRequests(params)`, etc. Base URL `http://localhost:8000`.

Formatting Rules (JS mirrors backend text spec):
- Header line: `===== Project: <name> | Type: <Section> | Date Range: <start> - <end> | Total: <n> =====`
- Use separator lines of dashes after each item.
- Merge Requests include: Title, Link, Author, Reviewers (comma-separated), Merged By, Created At (EST), Merged At (EST), Branch Flow `<source> → <target>`.
- Branches include: Name, Web URL, Author.
- Commits include: Title, Author, Date (EST), Commit ID (short), Message first line.

## 5. Environment Variable Instructions
PowerShell (current session):
```
$env:GITLAB_TOKEN="glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"
```
Persistent (requires new terminal):
```
setx GITLAB_TOKEN "glpat-FtgdSF6sUqPQqbQGMWlEBW86MQp1OmNxNTY3Cw.01.121pugvpk"
```
Backend MUST refuse to start (clear error) if token missing.

## 6. Docker Artifacts
Backend Dockerfile (slim Python, copy requirements then source, expose 8000, run uvicorn).
Frontend Dockerfile (node:lts, install, build, serve with `npm start` in dev or `serve -s build`).
`docker-compose.yml` services `backend` (8000) and `frontend` (3000) with env pass-through for token.

## 7. VS Code Tasks
Provide tasks:
- `Run Backend` -> activates venv & launches uvicorn
- `Run Frontend` -> `npm start`
- `Compose Up` -> `docker compose up --build`

## 8. Testing / Validation Steps
Manual smoke checklist:
1. Start backend with token set
2. GET `http://localhost:8000/merge-requests?project=<id>` returns JSON list
3. Run frontend; switch tabs; submit a request; formatted block appears
4. Error case (missing token) returns JSON error message

## 9. Troubleshooting (Embed key tips)
- 401 / 403 → invalid or expired token; reset env var.
- CORS error → ensure backend CORS origins include `http://localhost:3000`.
- Empty results → verify project ID and date range.
- Port conflict → change frontend to 3001 or backend to 8001.

## 10. Security Notes
- Do NOT commit real tokens in production. (Token shown here is placeholder for reconstruction.)
- Use `.env` or secret manager in real deployments.

## 11. Delivery Criteria
- All listed files created.
- Backend runs: `uvicorn main:app --reload --port 8000`.
- Frontend runs: `npm start` (shows tabs, working forms).
- Docker compose launches both: `http://localhost:3000` loads UI.
- Example outputs replicate formatting below.

## 12. Example Output (Canonical Reference)
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


## 13. Final Agent Guidance
- Treat this file as authoritative; prefer explicit instructions here over inference.
- Fail fast if `GITLAB_TOKEN` not set.
- Keep functions small; avoid duplicating formatting logic—centralize helpers if possible.
- After generation, print a short verification matrix (Backend OK / Frontend OK / Docker OK / Token Check).

---
End of agent prompt. Provide no extra commentary beyond success summaries when executing.
