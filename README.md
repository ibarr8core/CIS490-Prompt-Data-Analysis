# Prompt — AI Prompt Marketplace

A **frontend-only** web app for sharing and discovering AI prompts. No backend, no database. Uses localStorage for demo data and a fake login session.

## Tech

- HTML, CSS, JavaScript
- Google Fonts (Poppins)
- localStorage for users, prompts, comments, votes, saves, follows, reports

## Run locally

From the repo root:

```bash
cd PromptMarketWebApplication
python run_local.py
```

Or from anywhere:

```bash
python path/to/PromptMarketWebApplication/run_local.py
```

Opens **http://localhost:8080/** in your browser. Stop with **Ctrl+C**.

Requires Python 3 (no extra packages).

## Demo login

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `Admin123!` |
| User  | `demo`   | `Demo123!`  |

## Project structure

```
PromptMarketWebApplication/
├── run_local.py          # Serves frontend on port 8080, opens browser
└── frontend/
    ├── index.html        # Landing (Login, Register, Continue to Explore)
    ├── app.js            # Navbar injection, routing, localStorage, page inits
    ├── css/
    │   ├── theme.css     # Variables, typography, layout, spacing
    │   └── components.css  # Navbar, cards, forms, buttons, tabs, modals
    └── pages/
        ├── login.html
        ├── register.html
        ├── forgotpassword.html
        ├── resetpassword.html
        ├── explore.html      # Browse prompts, filters, sort, creators
        ├── prompt.html       # Prompt detail, vote, save, follow, report, comments
        ├── comments.html     # Comments for a prompt, add/delete
        ├── postcreation.html # Create New Prompt (login required)
        ├── profile.html      # Posts, comments, saved, upvoted, downvoted (login required)
        ├── accountsettings.html  # Profile & password (login required)
        └── moderation.html   # Reported prompts (admin only)
```

## Features

- **Navbar** (injected by `app.js`): Logo, search, Explore, Create (when logged in), Login/Register or avatar dropdown.
- **Auth** (localStorage): Login, register, forgot/reset password (demo). Session stored as `sessionUser`.
- **Explore**: Filter by model and category, sort (Trending / New / Top), search; prompt cards and popular creators.
- **Prompt detail**: Upvote, downvote, save, follow creator, report; comments preview and “View all comments.”
- **Create prompt**: Title, description, category, tags, model, thumbnail URL, prompt content; validation and redirect to new prompt.
- **Profile**: Tabs for posts, comments, saved, upvoted, downvoted; achievements panel.
- **Account settings**: Update profile, change password, delete account (with confirm).
- **Moderation** (admin): List reported prompts; remove prompt or ban user (demo only).

## Design

- **Header:** `#705a89`
- **Background:** `#fbf4eb`
- **Primary accent:** `#b3c4b5`
- **Text:** `#2a1a1a`
- Thin borders, pill-style primary buttons, card layout.

## Commit and push

From the repo root (e.g. `CIS490-Prompt-Data-Analysis`):

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**One-time setup** (if the remote isn’t set yet):

```bash
git remote add origin https://github.com/YOUR_USERNAME/CIS490-Prompt-Data-Analysis.git
git branch -M main
git push -u origin main
```

| Command | Purpose |
|--------|---------|
| `git status` | See changed and staged files |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit with a message |
| `git push origin main` | Push to GitHub |
| `git pull origin main` | Pull latest from GitHub |
