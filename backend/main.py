

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from models.merge_request import fetch_merge_requests_from_gitlab
from models.commit import fetch_commits_from_gitlab
from models.branch import fetch_branches_from_gitlab
from models.pipeline import fetch_pipelines_from_gitlab
from models.user import fetch_project_users_from_gitlab
from models.project import fetch_project_from_gitlab
import traceback
import logging


app = FastAPI()

# Allow CORS for local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/merge-requests")
def get_merge_requests(project_id: int, start_date: str, end_date: str):
    project = {"id": project_id}
    try:
        mrs = fetch_merge_requests_from_gitlab(project, start_date, end_date)
        return {"items": [mr.__dict__ for mr in mrs]}
    except Exception as e:
        logging.error(traceback.format_exc())
        return {"error": str(e), "trace": traceback.format_exc()}



@app.get("/commits")
def get_commits(project_id: int, start_date: str, end_date: str):
    project = {"id": project_id}
    try:
        commits = fetch_commits_from_gitlab(project, start_date, end_date)
        return {"items": [c.__dict__ for c in commits]}
    except Exception as e:
        logging.error(traceback.format_exc())
        return {"error": str(e), "trace": traceback.format_exc()}



@app.get("/branches")
def get_branches(project_id: int):
    project = {"id": project_id}
    try:
        branches = fetch_branches_from_gitlab(project)
        return {"items": [b.__dict__ for b in branches]}
    except Exception as e:
        logging.error(traceback.format_exc())
        return {"error": str(e), "trace": traceback.format_exc()}



@app.get("/pipelines")
def get_pipelines(project_id: int):
    project = {"id": project_id}
    try:
        pipelines = fetch_pipelines_from_gitlab(project)
        return {"items": [p.__dict__ for p in pipelines]}
    except Exception as e:
        logging.error(traceback.format_exc())
        return {"error": str(e), "trace": traceback.format_exc()}



@app.get("/users")
def get_users(project_id: int):
    project = {"id": project_id}
    try:
        users = fetch_project_users_from_gitlab(project)
        return {"items": [u.__dict__ for u in users]}
    except Exception as e:
        logging.error(traceback.format_exc())
        return {"error": str(e), "trace": traceback.format_exc()}



@app.get("/project")
def get_project(project_id: int):
    try:
        project = fetch_project_from_gitlab(project_id)
        return project.__dict__
    except Exception as e:
        logging.error(traceback.format_exc())
        return {"error": str(e), "trace": traceback.format_exc()}
