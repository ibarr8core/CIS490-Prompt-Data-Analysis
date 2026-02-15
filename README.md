# CIS490 Prompt – Prompt Marketplace

A static UI for a prompt marketplace (Canva-style design). No backend or JavaScript; HTML and CSS only for preview.

## Repository structure

### `PromptMarketWebApplication/`

| Path | Description |
|------|-------------|
| **`server.py`** | Local HTTP server for UI preview. Serves the `frontend` folder on port 8000 and opens `http://localhost:8000/pages/` in your browser. |
| **`frontend/`** | All UI assets and pages. |
| **`frontend/index.html`** | Root page; redirects to the app. |
| **`frontend/css/theme.css`** | Design tokens: palette (purple, brown, beige, sage), typography, spacing, borders. |
| **`frontend/css/components.css`** | Reusable components: nav, cards, buttons, forms, profile/prompt layouts, auth cards. |
| **`frontend/pages/explore.html`** | Explore page: filters, trending prompts grid, popular creators. |
| **`frontend/pages/login.html`** | Login page: username/password form and error callout. |
| **`frontend/pages/register.html`** | Register page: sign-up form and validation callout. |
| **`frontend/pages/profile.html`** | Profile page: avatar, username, followers/following, tabs (Posts, Comments, Saved, etc.), achievements. |
| **`frontend/pages/prompt.html`** | Prompt detail page: author, prompt text, tags, image placeholder, upvotes/comments/downloads. |
| **`doc/ui-spec.md`** | UI specification / design notes (if present). |

## How to run the Python server

1. Open a terminal in the repo (or in `PromptMarketWebApplication`).
2. Run:
   ```bash
   python PromptMarketWebApplication/server.py
   ```
   Or from inside `PromptMarketWebApplication`:
   ```bash
   python server.py
   ```
3. The server starts at **http://localhost:8000** and opens **http://localhost:8000/pages/** in your browser.
4. Stop the server with **Ctrl+C**.

Requires Python 3 (no extra packages).

## Git: commit, comment, and push

### One-time setup (if needed)

```bash
git remote add origin https://github.com/YOUR_USERNAME/CIS490-Prompt-Data-Analysis.git
git branch -M main
```

### Commit with a message and push

```bash
# Stage all changes
git add .

# Commit with a message (comment)
git commit -m "Your commit message here"

# Push to GitHub (e.g. main)
git push -u origin main
```

### Example workflow

```bash
git add .
git commit -m "Add README and update explore page"
git push origin main
```

### Useful commands

| Command | Purpose |
|--------|--------|
| `git status` | See what's changed and staged. |
| `git add .` | Stage all changes. |
| `git add path/to/file` | Stage specific file(s). |
| `git commit -m "message"` | Commit with a short message. |
| `git push origin main` | Push commits to GitHub (`main` branch). |
| `git pull origin main` | Get latest changes from GitHub. |
