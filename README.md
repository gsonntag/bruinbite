# CS 35L Project for Eggert Spring 2025

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

### Database Setup

Start the PostgreSQL database using Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install Go dependencies:
   ```bash
   go mod download
   ```

3. Install golang-migrate:
   - On Windows (using Scoop):
     ```bash
     scoop install migrate
     ```
   - On macOS (using Homebrew):
     ```bash
     brew install golang-migrate
     ```
   - Or download the binary directly from the [golang-migrate releases page](https://github.com/golang-migrate/migrate/releases)

4. Set up your database connection variables in db.env.

5. Run database migrations:
   ```bash
   migrate -path ./migrations/ -database "$DATABASE_URL" up
   ```

6. Start the backend server:
   ```bash
   go run main.go
   ```

The backend server will start on `http://localhost:8080`. You can test it by making a request to `http://localhost:8080/ping`

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will start on `http://localhost:3000`
