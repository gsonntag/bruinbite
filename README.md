# CS 35L Project for Eggert Spring 2025

https://github.com/user-attachments/assets/31de819a-ea03-45b9-b837-e3795513bf51

# BruinBite

BruinBite has a Next.js frontend, Go backend, and PostgreSQL database.

## Project Structure

```
bruinbite/
├── frontend/          # Next.js frontend application
├── backend/           # Go backend server
└── db/                # Database configuration and migrations ## to-do?
```

## Local Development Setup

Make sure you install [Docker](https://www.docker.com/), which can be found at the provided link.

### Database Setup

Start the PostgreSQL database using Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Backend Setup

DISCLAIMER: These setup instructions are intended for Unix-like systems.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Run starter script to install dependencies and set up Python venv:
   ```bash
   ./start.sh
   ```

3. Close process and ensure your database connection variables are set in db.env (default should be fine for local production).

4. Start the backend server (the final command in this script contains `go run main.go`):
   ```bash
   ./start.sh
   ```

The backend server will start on `http://localhost:8080`, and automatically populate the tables with data from the UCLA website. You can test it by making a request to `http://localhost:8080/ping`

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Edit .env.local file if necessary, stored at ./frontend/.env.local

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will start on `http://localhost:3000`
