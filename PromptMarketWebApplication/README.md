# Prompt Marketplace Web Application

Simple AI prompt marketplace built as a student project.  
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

## Running the Project

- The backend server will:
  - automatically create the `PromptMarket` database (if it does not exist)
  - automatically create the required tables
  - serve the existing frontend

Open this URL in your browser:

```text
http://localhost:3000
```

You no longer need to run `python -m http.server` — Express serves the frontend automatically, and the database initializes on server start.

---

## Project Structure

```text
PromptMarketWebApplication
  frontend/            - HTML, CSS, and frontend JS
  backend/             - Express server and API routes
    server.js          - main server entry
    db.js              - database connection (MySQL)
    initDatabase.js    - database setup and seed data
    routes/            - API route handlers
  package.json         - npm scripts and dependencies
```

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

