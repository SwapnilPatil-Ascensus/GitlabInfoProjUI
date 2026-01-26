# Deployment & Configuration Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Python**: 3.8 or higher (3.11+ recommended)
- **Node.js**: 16.x or higher (20.x recommended)
- **npm**: Comes with Node.js
- **Git**: For cloning the repository
- **GitLab Personal Access Token**: Required for API access

### Optional Software
- **Docker**: 20.x or higher (for containerized deployment)
- **Docker Compose**: 2.x or higher (for multi-container deployment)
- **VS Code**: Recommended IDE with extensions

### GitLab Token Setup
1. Log in to GitLab
2. Go to **Settings** → **Access Tokens**
3. Create a new token with the following scopes:
   - `api` (Full API access)
   - `read_api` (Read-only API access)
4. Copy the token (you won't be able to see it again)

## Local Development Setup

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd GitlabInfoProjUI
```

### Step 2: Backend Setup

#### Windows (PowerShell)
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Set GitLab token for current session
$env:GITLAB_TOKEN="your-token-here"

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Linux/macOS
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set GitLab token
export GITLAB_TOKEN="your-token-here"

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Permanent Token Setup (Windows)
```powershell
# Set token permanently (requires terminal restart)
setx GITLAB_TOKEN "your-token-here"
```

#### Permanent Token Setup (Linux/macOS)
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export GITLAB_TOKEN="your-token-here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Frontend Setup

```bash
cd ui
npm install
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

### Step 4: Verify Installation

1. Backend should be running on `http://localhost:8000`
2. Frontend should be running on `http://localhost:3000`
3. Open `http://localhost:3000` in your browser
4. Select a project and date range, then click "Generate"

## Docker Deployment

### Using Docker Compose (Recommended)

#### Build and Start Services
```bash
docker-compose up --build
```

This will:
- Build both backend and frontend images
- Start both services
- Map ports 8000 (backend) and 3000 (frontend)

#### Run in Detached Mode
```bash
docker-compose up -d --build
```

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### Stop Services
```bash
docker-compose down
```

#### Rebuild After Changes
```bash
docker-compose up --build --force-recreate
```

### Using Individual Dockerfiles

#### Backend Only
```bash
cd backend
docker build -t gitlab-ui-backend .
docker run -p 8000:8000 -e GITLAB_TOKEN="your-token-here" gitlab-ui-backend
```

#### Frontend Only
```bash
cd ui
docker build -t gitlab-ui-frontend .
docker run -p 3000:3000 -e REACT_APP_API_BASE="http://localhost:8000" gitlab-ui-frontend
```

### Docker Compose with Environment File

Create `.env` file in project root:
```env
GITLAB_TOKEN=your-token-here
REACT_APP_API_BASE=http://localhost:8000
```

Update `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - GITLAB_TOKEN=${GITLAB_TOKEN}
  frontend:
    environment:
      - REACT_APP_API_BASE=${REACT_APP_API_BASE}
```

Then run:
```bash
docker-compose up --build
```

## Production Deployment

### Backend Deployment Options

#### Option 1: Cloud Platform (AWS, Azure, GCP)

**AWS (Elastic Beanstalk or EC2)**
1. Create EC2 instance or Elastic Beanstalk environment
2. Install Python 3.11
3. Clone repository
4. Set up virtual environment
5. Install dependencies
6. Set environment variables
7. Use systemd or supervisor to run uvicorn
8. Configure reverse proxy (nginx) for port 80/443
9. Set up SSL certificate (Let's Encrypt)

**Example systemd service** (`/etc/systemd/system/gitlab-ui-backend.service`):
```ini
[Unit]
Description=GitLab UI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/gitlab-ui/backend
Environment="GITLAB_TOKEN=your-token"
ExecStart=/opt/gitlab-ui/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Option 2: Docker on Server
1. Install Docker and Docker Compose on server
2. Clone repository
3. Create `.env` file with production values
4. Run `docker-compose up -d`
5. Configure reverse proxy (nginx) for SSL

**Example nginx configuration**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Option 3: Container Orchestration (Kubernetes)

**Example Kubernetes Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-ui-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gitlab-ui-backend
  template:
    metadata:
      labels:
        app: gitlab-ui-backend
    spec:
      containers:
      - name: backend
        image: gitlab-ui-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: GITLAB_TOKEN
          valueFrom:
            secretKeyRef:
              name: gitlab-secrets
              key: token
---
apiVersion: v1
kind: Service
metadata:
  name: gitlab-ui-backend
spec:
  selector:
    app: gitlab-ui-backend
  ports:
  - port: 80
    targetPort: 8000
```

### Frontend Deployment Options

#### Option 1: Static Hosting (Netlify, Vercel, AWS S3)

**Build for Production**:
```bash
cd ui
npm run build
```

This creates a `build/` directory with static files.

**Netlify Deployment**:
1. Connect GitHub repository to Netlify
2. Set build command: `cd ui && npm install && npm run build`
3. Set publish directory: `ui/build`
4. Add environment variable: `REACT_APP_API_BASE=https://api.yourdomain.com`

**Vercel Deployment**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Follow prompts
4. Set environment variables in Vercel dashboard

**AWS S3 + CloudFront**:
1. Build frontend: `cd ui && npm run build`
2. Upload `build/` contents to S3 bucket
3. Configure S3 bucket for static website hosting
4. Create CloudFront distribution
5. Set environment variable in build process

#### Option 2: Docker on Server
Same as backend, but serve static files with nginx:

**Dockerfile for production**:
```dockerfile
FROM node:20-slim as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Configuration

### Backend Configuration

#### CORS Settings
Edit `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### GitLab Base URL
Currently hardcoded. To make configurable, add to environment:
```python
import os
GITLAB_BASE_URL = os.environ.get("GITLAB_BASE_URL", "https://gitlab.com")
```

### Frontend Configuration

#### API Base URL
Set via environment variable:
```bash
# Development
REACT_APP_API_BASE=http://localhost:8000

# Production
REACT_APP_API_BASE=https://api.yourdomain.com
```

#### Project List
Currently hardcoded in `ui/src/TabsLayout.js`. To make dynamic:
1. Create API endpoint to fetch projects
2. Fetch on component mount
3. Store in state

## Environment Variables

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITLAB_TOKEN` | Yes | - | GitLab Personal Access Token |
| `GITLAB_BASE_URL` | No | `https://gitlab.com` | GitLab instance URL |
| `PORT` | No | `8000` | Backend server port |
| `LOG_LEVEL` | No | `INFO` | Logging level |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_BASE` | No | `http://localhost:8000` | Backend API URL |

### Setting Environment Variables

#### Development (Windows PowerShell)
```powershell
$env:GITLAB_TOKEN="your-token"
$env:REACT_APP_API_BASE="http://localhost:8000"
```

#### Development (Linux/macOS)
```bash
export GITLAB_TOKEN="your-token"
export REACT_APP_API_BASE="http://localhost:8000"
```

#### Production (Docker)
```bash
docker run -e GITLAB_TOKEN="your-token" ...
```

#### Production (Systemd)
Add to service file:
```ini
Environment="GITLAB_TOKEN=your-token"
```

## Troubleshooting

### Backend Issues

#### Issue: "Token environment variable 'GITLAB_TOKEN' not set"
**Solution**:
1. Verify token is set: `echo $GITLAB_TOKEN` (Linux) or `$env:GITLAB_TOKEN` (PowerShell)
2. Set token before starting server
3. For permanent setup, add to shell profile

#### Issue: "ModuleNotFoundError: No module named 'requests'"
**Solution**:
1. Activate virtual environment
2. Run `pip install -r requirements.txt`
3. Verify `requests` is in requirements.txt

#### Issue: Port 8000 already in use
**Solution**:
```bash
# Find process
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/macOS

# Kill process or use different port
uvicorn main:app --port 8001
```

#### Issue: CORS errors
**Solution**:
1. Verify frontend URL is in `allow_origins`
2. Check backend is running
3. Verify ports match

### Frontend Issues

#### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"
**Solution**:
1. Verify backend is running on port 8000
2. Check `REACT_APP_API_BASE` is correct
3. Verify no firewall blocking connection

#### Issue: Blank page or build errors
**Solution**:
1. Clear cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install`
4. Rebuild: `npm run build`

#### Issue: Environment variables not working
**Solution**:
1. Variables must start with `REACT_APP_`
2. Restart dev server after changing variables
3. Rebuild for production after changing variables

### Docker Issues

#### Issue: Container exits immediately
**Solution**:
1. Check logs: `docker-compose logs backend`
2. Verify environment variables are set
3. Check Dockerfile CMD is correct

#### Issue: Cannot connect to backend from frontend container
**Solution**:
1. Use service name in docker-compose: `http://backend:8000`
2. Verify both services are in same network
3. Check docker-compose network configuration

#### Issue: Build fails
**Solution**:
1. Clear Docker cache: `docker-compose build --no-cache`
2. Verify Dockerfile syntax
3. Check for missing files in COPY commands

## Health Checks

### Backend Health Check
```bash
curl http://localhost:8000/docs
```

Should return FastAPI Swagger documentation.

### Frontend Health Check
```bash
curl http://localhost:3000
```

Should return HTML page.

## Monitoring

### Recommended Monitoring Tools
- **Application**: New Relic, Datadog, Sentry
- **Infrastructure**: Prometheus, Grafana
- **Logs**: ELK Stack, CloudWatch, Papertrail

### Health Check Endpoint (To Be Added)
```python
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}
```

## Security Checklist

- [ ] SSL/TLS enabled in production
- [ ] GitLab token stored securely (not in code)
- [ ] CORS configured for specific origins
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Authentication added (if needed)
- [ ] Error messages don't expose sensitive info
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Regular security audits

## Performance Optimization

### Backend
- Enable gzip compression
- Add response caching
- Implement connection pooling
- Add request timeout handling

### Frontend
- Enable code splitting
- Add lazy loading
- Optimize bundle size
- Add service worker caching
- Use CDN for static assets

## Backup & Recovery

### Backup Strategy
1. **Code**: Git repository (already version controlled)
2. **Configuration**: Store in version control or secure vault
3. **Secrets**: Use secret management service

### Recovery Procedure
1. Clone repository
2. Restore environment variables
3. Rebuild and deploy
4. Verify functionality
