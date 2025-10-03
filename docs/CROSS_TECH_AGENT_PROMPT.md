# Cross-Technology Agent Prompt: Recreate Full GitLab Analytics App

Use this document as an authoritative specification to rebuild the entire application in ANY modern web stack (e.g., Python/FastAPI + React as original, OR Java/Spring Boot + React, OR Node/NestJS + Vue, etc.). Maintain functional parity, data shapes, endpoints, and output formatting.

---
## 1. Product Goal
Deliver a web-based GitLab project analytics & reporting UI with:
- Backend service exposing REST endpoints for: merge requests, commits, branches, pipelines, users (project members), and project metadata.
- Frontend single-page app providing a tabbed interface, parameter forms (project ID, date range), and classic formatted text output blocks.
- Environment variable for private access token (`GITLAB_TOKEN`).
- Docker + Compose for local orchestration.
- Reusable core formatting contract (so UI & CLI could share patterns later).

Non-goals: advanced auth (OAuth), persistence layer, caching, metrics collection (unless trivially added), job queues.

---
## 2. Functional Requirements
| Domain | Endpoint (HTTP GET) | Required Params | Description |
|--------|---------------------|-----------------|-------------|
| Merge Requests | /merge-requests | project_id:int, start_date, end_date (MM/DD/YYYY) | List all merge requests updated in date window. |
| Commits | /commits | project_id:int, start_date, end_date (MM/DD/YYYY) | List commits authored in date window. |
| Branches | /branches | project_id:int | List branches + inferred creator (first commit author). |
| Pipelines | /pipelines | project_id:int | List pipelines (recent, paginated). |
| Users | /users | project_id:int | List project members. |
| Project | /project | project_id:int | Retrieve project metadata. |

Rules:
- All endpoints return JSON: `{ "items": [...] }` except `/project` which returns an object.
- Errors return `{ "error": str, "trace"?: str }` (trace optional in production).
- `start_date`/`end_date` accepted as `MM/DD/YYYY`; convert internally to ISO 8601 when calling GitLab API.
- Pagination: loop until empty page or < page size (100) items.

---
## 3. Data Models (Canonical Fields)
Represent these fields regardless of language used.

### MergeRequest
```
{
  id: number,
  title: string,
  web_url: string,
  author: { name?: string, username?: string },
  created_at: string (ISO),
  merged_at?: string (ISO),
  state: string,          // opened, merged, closed, locked
  source_branch: string,
  target_branch: string,
  reviewers: [{ name?: string }],
  labels: string[],
  merged_by?: { name?: string }
}
```

### Commit
```
{
  id: string,
  short_id: string,
  title: string,
  author_name: string,
  authored_date: string,
  committed_date: string,
  message: string,
  web_url?: string
}
```

### Branch
```
{
  name: string,
  merged?: boolean,
  protected?: boolean,
  default?: boolean,
  web_url?: string,
  commit_id?: string,
  author_name?: string   // derived via first commit lookup
}
```

### Pipeline
```
{
  id: number,
  status: string,   // success, failed, running, canceled, skipped, etc.
  ref: string,
  web_url: string,
  sha: string,
  created_at?: string,
  updated_at?: string
}
```

### User
```
{
  id: number,
  username: string,
  name: string,
  state: string,
  web_url: string,
  avatar_url?: string,
  created_at?: string
}
```

### Project
```
{
  id: number,
  name: string,
  path_with_namespace: string,
  web_url: string,
  description?: string,
  visibility?: string,
  default_branch?: string,
  created_at?: string,
  last_activity_at?: string
}
```

---
## 4. External API Contract (GitLab)
Base: `https://gitlab.com/api/v4` (use PRIVATE-TOKEN header = `GITLAB_TOKEN`).

Key endpoints consumed:
- `/projects/:id/merge_requests?updated_after=<iso>&updated_before=<iso>&scope=all&per_page=100&page=N`
- `/projects/:id/repository/commits?since=<iso>&until=<iso>&per_page=100&page=N`
- `/projects/:id/repository/branches?per_page=100&page=N`
- `/projects/:id/pipelines?per_page=100&page=N`
- `/projects/:id/members/all?per_page=100&page=N`
- `/projects/:id`
- (Optional branch creator inference) `/projects/:id/repository/commits?ref_name=<branch>&per_page=1&order=asc`

Must disable or handle SSL warnings if choosing to ignore certificates (Python example used `verify=False`; in other stacks prefer proper trust configuration instead).

---
## 5. Environment & Configuration
Environment variable: `GITLAB_TOKEN` (required – fail fast with clear error if missing).
Optional future config: base API URL override (`GITLAB_BASE_URL`).

All network timeouts recommended: 30s connect/read; implement simple retry (2 attempts) for transient 5xx.

---
## 6. Error Handling Conventions
Return consistent JSON envelope:
```
Success list: { "items": [ ... ] }
Success object: { <fields> }
Error: { "error": "Message", "details"?: <object>, "trace"?: <string dev-only> }
```
Log stack traces server-side only. Do not expose raw trace in production mode (introduce `APP_ENV=dev|prod`).

---
## 7. Output Formatting Contract (Frontend Rendering)
Console-style formatted summary block for each query:
Header:
```
===== Project: <name or id> | Type: <Section Name> | Date Range: <Start> - <End> | Total: <N> =====
```
Merge Requests – group by status (Merged, Opened, Closed) with section banners:
```
🔄 ***************** Merged Merge Requests: *****************
🔎 MR Title: <title>
🔗 MR Link: <web_url>
✍️ Author: <author.name>
👥 Reviewers: <r1, r2>
👥 Merged by: <merged_by.name>
🕒 Created At: <EST local>
📅 Merged At: <EST local or -> N/A>
🔀 <source_branch> → <target_branch>
------------------------------------------------------------
```
Branches:
```
Branch Name: <name>
web url: <web_url>
Author: <author_name>
-------------------------------------------------------------------------------------------
```
Commits (first line message if long):
```
Commit: <short_id> | <title>
Author: <author_name>
Authored: <EST>
Message: <first line>
------------------------------------------------------------
```
Apply same style principles if reimplemented with different UI tech (e.g., server-side rendered, CLI, or desktop app). Use monospace formatting or preserve whitespace to keep alignment.

Timezone rule: Convert timestamps to US/Eastern (EST/EDT) for display; retain original ISO server-side.

---
## 8. Frontend Feature Requirements
- Tabbed navigation (6 tabs)
- Inputs per tab: Project ID (numeric, required). Date range on Merge Requests + Commits tabs only.
- Submit button triggers fetch; show loading indicator.
- Error display block (red accent) if API returns `error` field.
- Copy-to-clipboard button for formatted results.
- Responsive layout: stack forms on narrow (<600px) widths.

---
## 9. Suggested Tech Equivalents (Choose One Per Layer)
Backend Options:
- Python: FastAPI / Flask
- Java: Spring Boot (WebFlux or MVC)
- Node: NestJS / Express + TypeScript
- Go: Gin / Fiber

Frontend Options:
- React + MUI (baseline)
- Vue + Vuetify
- Angular + Angular Material
- Svelte + Svelte Material UI

Containerization:
- Single docker-compose orchestrating `<backend>` and `<frontend>` services.

---
## 10. Docker / Compose Specification
`docker-compose.yml` (conceptual):
```
services:
  backend:
    build: ./backend
    environment:
      - GITLAB_TOKEN=${GITLAB_TOKEN}
    ports: ["8000:8000"]
  frontend:
    build: ./ui
    environment:
      - REACT_APP_API_BASE=http://localhost:8000
    ports: ["3000:3000"]
    depends_on: [backend]
```
Add `.dockerignore` to reduce context (node_modules, venv, __pycache__).

---
## 11. Developer Tooling & Tasks
Provide equivalents for:
- Run backend (watch mode if supported)
- Run frontend dev server
- Compose build & up
- Lint / format (ESLint + Prettier or language-specific linters)

---
## 12. Performance & Pagination Notes
- GitLab allows up to 100 per page; loop until < 100.
- Avoid fetching more than necessary; optionally accept `max_pages` future parameter.
- Branch creator inference: makes an extra commit call per branch (optimize later via parallelism or caching).

---
## 13. Security & Secrets
- Never hardcode real tokens in committed code (token here is placeholder example).
- Support environment injection for container & local.
- Consider rate limiting/backoff if 429 encountered (future enhancement).

---
## 14. Extensibility Hooks
Future endpoints (not implemented yet but reserve structure):
- /issues
- /milestones
- /releases
Design models similarly and reuse pagination utility.

---
## 15. Minimal Success Validation Checklist
| Check | Criteria |
|-------|----------|
| Backend Start | Returns 200 at `/project?project_id=<id>` |
| MR Fetch | `/merge-requests` returns JSON with `items` array |
| UI Tabs | All six tabs render & submit without console errors |
| Formatting | Output block matches header + dashed separators |
| Timezone | Displayed times reflect EST offset |
| Docker | `docker compose up` serves UI at :3000 and API at :8000 |
| Token Missing | API returns clear error about GITLAB_TOKEN |

---
## 16. Migration to Another Stack (Guidance)
When porting to a new backend language:
1. Recreate data models exactly (naming stable; internal casing can follow language conventions).
2. Keep endpoint paths identical.
3. Preserve JSON shape (`items` envelope).
4. Adopt same query parameter names.
5. Implement shared formatting utility (even if only used client-side) to keep consistent textual output.

When porting UI framework:
1. Keep tabs & forms UX (Project ID, date range on MR/Commits only).
2. Preserve exact textual formatting (including emojis and separators).
3. Provide copy-to-clipboard feature.
4. Maintain light neutral background and elevated result card styling.

---
## 17. Troubleshooting Quick Reference
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 401/403 from GitLab | Expired token | Refresh `GITLAB_TOKEN` |
| Empty lists | Wrong project ID or date span | Verify numeric ID & adjust dates |
| CORS error | Origin not allowed | Add frontend origin to CORS config |
| Slow branch fetch | Extra per-branch commit lookup | Defer author inference or parallelize |
| Docker build fails | Missing dependency | Reinstall, verify lock files |
| Timezone incorrect | Conversion missing | Apply timezone library / offset |

---
## 18. Pseudocode (Backend Pattern Example)
```
GET /merge-requests:
  validate params
  token = env.GITLAB_TOKEN or fail
  loop pages:
    call /projects/:id/merge_requests with updated_after/before
    accumulate -> list
  return { items: serialize(list) }
```

---
## 19. Example Frontend Flow (Pseudo-React)
```
const handleSubmit = async () => {
  setLoading(true);
  const res = await api.fetchMergeRequests({ project_id, start_date, end_date });
  setRaw(res.items);
  setFormatted(formatMergeRequests(res.items));
  setLoading(false);
};
```

---
## 20. Final Agent Instructions
- Follow sections sequentially.
- After build: output validation checklist with PASS/FAIL.
- Do not invent endpoints not listed.
- Keep formatting EXACT.
- Provide concise summary at completion.

---
End of cross-technology reconstruction prompt.
