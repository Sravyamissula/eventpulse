# Local Development & Setup Guide

This guide walks through configuring and running the EventPulse platform locally from scratch.

---

## 1. Prerequisites

- **Java Development Kit (JDK):** Version 21 LTS
- **Node.js:** Version 18.17+ or 20+
- **PostgreSQL:** Version 15+ (PostgreSQL 17.4 recommended)
- **Git**

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Ensure the following environment variables are set in your execution environment:

| Variable | Description | Example Local Value |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection string | `jdbc:postgresql://localhost:5432/eventpulse` |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password | `your_postgres_password` |
| `PORT` | Spring Boot HTTP port | `8081` |
| `EVENTPULSE_JWT_SECRET` | 256-bit+ HMAC-SHA256 secret (min 32 bytes) | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` |
| `EVENTPULSE_AI_SERVICE_URL` | Python AI service endpoint | `http://localhost:8000` |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend API client base URL | `http://localhost:8081` |

> **Security Note:** In production, `EVENTPULSE_JWT_SECRET` and `SPRING_DATASOURCE_PASSWORD` must be injected via secure secret managers (e.g. AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets). The backend enforces fail-fast startup if `EVENTPULSE_JWT_SECRET` is unset.

---

## 3. Database Initialization

1. Connect to PostgreSQL and create the `eventpulse` database:
   ```sql
   CREATE DATABASE eventpulse;
   ```
2. When the backend starts, Flyway automatically runs all database migrations:
   - `V1__init_schema.sql`: Creates core tables, multi-tenant foreign keys, and indexes.
   - `V2__seed_initial_data.sql`: Seeds initial baseline configuration.
3. Hibernate is configured with `ddl-auto=validate`, ensuring schema matches JPA entities strictly without runtime schema tampering.

---

## 4. Starting the Backend

From the repository root:

```powershell
# Set environment variables in PowerShell
$env:EVENTPULSE_JWT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
$env:SPRING_DATASOURCE_PASSWORD = "your_postgres_password"

# Build and run using the Maven wrapper
cd backend
.\mvnw.cmd clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Verify backend health:
```bash
curl http://localhost:8081/actuator/health
```

---

## 5. Starting the Frontend

From the repository root:

```bash
cd frontend
npm install
npm run build
npm run start
```

Access the frontend at `http://localhost:3000`.

---

## 6. Running End-to-End Red-Team Audit

To run the complete 64-assertion HTTP automated verification suite against your running backend:

```bash
node scripts/redteam-audit.js
```
