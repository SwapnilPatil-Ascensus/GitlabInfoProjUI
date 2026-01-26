# Quick Setup Guide

> **Fastest way to get the application running**

## ⚡ 5-Minute Setup

### Prerequisites Check
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] GitLab Personal Access Token ready

### Step 1: Clone & Navigate
```bash
git clone <repository-url>
cd GitlabInfoProjUI
```

### Step 2: Backend Setup (Terminal 1)

**Windows:**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
$env:GITLAB_TOKEN="your-token-here"
cd ..
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GITLAB_TOKEN="your-token-here"
cd ..
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Frontend Setup (Terminal 2)
```bash
cd ui
npm install
npm start
```

### Step 4: Open Browser
Go to: **http://localhost:3000**

---

## ✅ Verification

- ✅ Backend running: Check http://localhost:8000/health
- ✅ Frontend running: Check http://localhost:3000
- ✅ No errors in terminal

---

## 🆘 Having Issues?

See [README.md](README.md#-troubleshooting) or [docs/QUICK_START.md](docs/QUICK_START.md#troubleshooting-guide)

---

**That's it! You're ready to use the application.**
