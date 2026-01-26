# GitLab Token Storage Location

## Where is the GitLab Token Saved?

The GitLab token is **NOT saved in the repository**. It is stored in a `.env` file in the project root directory, which is excluded from Git tracking for security reasons.

### Location

```
GitlabInfoProjUI/
├── .env                    ← Token is saved here (NOT in Git)
├── .env.example           ← Template file (this IS in Git)
├── .gitignore             ← Ensures .env is not committed
└── ...
```

### File Details

- **`.env` file**: Contains your actual GitLab token (gitignored, not committed)
- **`.env.example` file**: Template showing what variables are needed (committed to Git)

### How to Find/Edit the Token

#### Option 1: Using the UI (Recommended)
1. Click "Manage Token" in the header
2. View current token status (preview only)
3. Paste new token and click "Save Token"
4. Token is automatically saved to `.env` file

#### Option 2: Manual Edit
1. Navigate to project root: `C:\Development\Workspace\GitlabInfoProjUI\`
2. Open `.env` file (create it if it doesn't exist)
3. Add or update: `GITLAB_TOKEN=your-token-here`
4. Save the file

### Why It's Not in the Repository

- **Security**: Tokens are sensitive credentials
- **`.gitignore`**: The `.env` file is listed in `.gitignore`, so Git won't track it
- **Public Repository**: This allows the repo to be public without exposing your token

### Creating `.env` from Template

If `.env` doesn't exist, you can:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your token:
   ```
   GITLAB_TOKEN=your-actual-token-here
   ```

### Verification

To verify your token is set:

**Windows (PowerShell):**
```powershell
Get-Content .env | Select-String "GITLAB_TOKEN"
```

**Linux/macOS:**
```bash
grep GITLAB_TOKEN .env
```

**Or use the UI:**
- Click "Manage Token" in the header
- It will show token status (preview: first 4 and last 4 characters)

---

**Important**: Never commit the `.env` file to Git. It contains sensitive information!
