# Prompt — AI Prompt Marketplace

Simple AI prompt marketplace built as a student team project.  
Backend: Node.js + Express + MySQL. Frontend: static HTML/CSS/JS served by Express.

---

## Requirements

- Node.js
- MySQL (running locally)

---

## Project Setup

1. **Open the project folder**
   - Open `PromptMarketWebApplication` in your editor.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Make sure MySQL is running**
   - Local MySQL server must be started.

4. **Ensure MySQL credentials are:**
   - user: `root`
   - password: `admin`

5. **Start the server**
   ```bash
   npm start
   ```

---

## Demo Accounts

Use these accounts for quick demo/testing (local only):

| Role  | Username | Password    |
|-------|----------|------------|
| Admin | `admin`  | `Admin123!` |
| User  | `demo`   | `Demo123!`  |

---

## Running the Project

- The backend server will:
  - automatically create the `PromptMarket` database (if it does not exist)
  - automatically create the required tables
  - insert starter data (admin user, categories, tags, example prompt)
  - serve the existing frontend

Open this URL in your browser:

```text
http://localhost:3000
```

You do **not** need to run `python -m http.server` — Express serves the frontend automatically, and the database initializes on server start.

---

## Project Structure

```text
PromptMarketWebApplication
  frontend/            - HTML, CSS, and frontend JS
  backend/             - Express server and API routes
    server.js          - main server entry
    db.js              - database connection (MySQL)
    initDatabase.js    - database setup and seed data
    routes/            - API route handlers (e.g., prompts)
  package.json         - npm scripts and dependencies
```

---

## Notes for Teammates

- Always run commands from the `PromptMarketWebApplication` folder.
- Standard workflow:
  ```bash
  npm install   # first time
  npm start     # run the app
  ```
- Backend and frontend both run at `http://localhost:3000`.
- Database and seed data are handled automatically; no manual SQL scripts are needed.

---

## Design System

- **Header:** `#705a89`
+- **Background:** `#fbf4eb`
+- **Primary accent:** `#b3c4b5`
+- **Text:** `#2a1a1a`
+- **Font:** Google Fonts – Poppins

---

## Features Overview

- **Navbar** – Logo, search, Explore, Create Prompt (when logged in), Login/Register or avatar menu.
- **Explore page** – Browse prompts with filters, sorting, and search.
- **Prompt detail page** – View prompt content; vote, save, follow creator, report, and see comments.
- **Create prompt page** – Form for title, description, category, tags, model, and prompt content.
- **Profile page** – Tabs for posts, comments, saved prompts, and voting history.
- **Account settings** – Update profile, change password, delete account (with confirmation).
- **Moderation page** – Admin-only list of reported prompts with remove/ban actions.

---

## Git Workflow

Basic commands for committing and syncing with the repository:

```bash
git status
git add .
git commit -m "commit message"
git push origin main
git pull origin main
```

One-time remote setup (if not configured yet):

```bash
git remote add origin https://github.com/YOUR_USERNAME/CIS490-Prompt-Data-Analysis.git
git branch -M main
git push -u origin main
```

Use these commands to keep your local changes committed and pushed to GitHub.

---

## Troubleshooting

- **MySQL access denied**
  - Check that MySQL is running and the credentials match:
    - user: `root`
    - password: `admin`

- **Port 3000 already in use**
  - Another server is using port 3000.
  - Close the other server/terminal using that port, then run:
    ```bash
    npm start
    ```

- **`npm install` failed**
  - Delete `node_modules` (if it exists) and run:
    ```bash
    npm install
    ```
  - Make sure you have a current Node.js version installed.
