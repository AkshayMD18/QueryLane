# Intelligent CSV Analysis & Query Platform

An AI-powered tabular data assistant designed to upload CSV files, automatically structure them into an SQLite database, and run natural language queries translated to SQL.

For full architecture and design details, see [PROJECT_DOCUMENTATION.md](file:///c:/VSC/MyProjests/CsvAnalysis/PROJECT_DOCUMENTATION.md).

---

## 📂 Project Structure

- `backend/`: NestJS + TypeORM + SQLite + LangChain application.
- `frontend/`: React + Vite + TypeScript + Tailwind CSS application.

---

## 🚀 Step-by-Step Setup Guide

Follow these instructions to set up and run the project locally.

### 📋 Prerequisites

Ensure you have **Node.js** (v18 or higher) installed:
```bash
node -v
npm -v
```

### 🗄️ Database (SQLite)
This project uses **SQLite**, which is a serverless, zero-configuration database engine.
- **Do I need to install an SQLite server?** No. SQLite is embedded directly into the Node.js backend. Running `npm install` in the `backend` folder will automatically install the `sqlite3` library. The database file will be automatically created as `backend/db.sqlite` when you launch the backend.
- **Optional (To inspect database files manually)**:
  - You can install a GUI manager like **[DB Browser for SQLite](https://sqlitebrowser.org/)** to open and inspect the `db.sqlite` file.
  - Or, if you are using VS Code, install the **SQLite Viewer** extension.


---

### 🖥️ Step 1: Backend Setup

1. **Navigate to the backend folder**:
   ```powershell
   cd backend
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Configure Environment Variables**:
   Ensure you have a `.env` file in the `backend/` directory with your OpenRouter API key.
   - Path: `backend/.env`
   - Content:
     ```env
     OPENROUTER_API_KEY=your_openrouter_api_key_here
     ```

4. **Run the backend**:
   ```powershell
   npm run start:dev
   ```
   The server starts on `http://localhost:3000`.

---

### 🎨 Step 2: Frontend Setup

Open a **new terminal window** and run the following:

1. **Navigate to the frontend folder**:
   ```powershell
   cd frontend
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Configure Environment Variables**:
   Ensure you have a `.env` file in the `frontend/` directory pointing to the backend.
   - Path: `frontend/.env`
   - Content:
     ```env
     VITE_API_BASE_URL=http://localhost:3000
     ```

4. **Run the frontend**:
   ```powershell
   npm run dev
   ```
   Open the local server URL (usually `http://localhost:5173`) in your web browser.
