# RepoAI

RepoAI is a powerful full-stack application designed to ingest and analyze code repositories using Artificial Intelligence. It enables users to upload or clone repositories, process their content using background workers to generate vector embeddings, and interact with the codebase through an intelligent chat interface. The system leverages real-time updates to track ingestion progress and provides a seamless developer experience.

## Technologies Used

RepoAI is built as a monorepo using the following modern technologies:

### Backend

-   **Runtime:** Node.js, TypeScript
-   **Framework:** Express.js
-   **Database:** PostgreSQL (with `pgvector` for AI embeddings)
-   **ORM:** Prisma
-   **Queue & Caching:** Redis, BullMQ
-   **AI Integration:** OpenAI API (GPT models), Tiktoken (Token counting)
-   **Real-time:** Socket.IO

### Frontend

-   **Framework:** React
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS, DaisyUI
-   **State Management:** Zustand
-   **Real-time:** Socket.IO Client
-   **Syntax Highlighting:** React Syntax Highlighter

### Infrastructure

-   **Containerization:** Docker, Docker Compose
-   **Tooling:** Concurrently, ESLint

## How to Run

You can run RepoAI either using Docker (recommended for easiest setup) or locally for development.

### Prerequisites

-   [Docker](https://www.docker.com/) & Docker Compose (for Docker method)
-   [Node.js](https://nodejs.org/) (v18+ recommended) (for Local method)
-   OpenAI API Key

### Environment Variables

Before running, ensure you have your environment variables set up.
Create a `.env` file in the `backend` directory (for local dev) or ensure these are available to Docker.

**Required Variables:**

```env
# Backend
PORT=4000
DATABASE_URL="postgres://app:app@localhost:5432/appdb" # Update host if not running locally
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=your_openai_api_key_here

# Frontend
VITE_API_BASE_URL=http://localhost:4000 # Adjust if necessary
```

### Method 1: Docker (Recommended)

1.  Clone the repository.
2.  Set the `OPENAI_API_KEY` in your environment or passed to the docker context.
3.  Run the following command in the root directory:

    ```bash
    docker-compose up --build
    ```

    This will start the Database, Redis, Backend API, and Frontend Web Service.

    -   Frontend: `http://localhost:3010`
    -   Backend: `http://localhost:4000`

### Method 2: Local Development

1.  **Install Dependencies:**
    Run the following command in the root directory to install dependencies for both frontend and backend (recursively, or manually in each folder):

    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```

2.  **Start Infrastructure:**
    You need PostgreSQL and Redis running. You can use Docker for just the services:

    ```bash
    docker-compose up -d db redis
    ```

3.  **Run the App:**
    From the root directory, run:

    ```bash
    npm run dev
    ```

    This uses `concurrently` to start both the backend server (API & Worker) and the frontend Vite server.
