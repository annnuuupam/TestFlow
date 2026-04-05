# TestFlow — Online Test System 🚀

> **Production-grade SaaS examination platform** built with React + Spring Boot + MySQL

[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://www.mysql.com/)

---

## 📁 Project Structure

```
Online-Test-System/
├── backend/              # Spring Boot REST API
│   ├── src/main/java/com/ots/
│   │   ├── config/       # Security, CORS, Swagger
│   │   ├── controller/   # REST endpoints
│   │   ├── dto/          # Request/Response DTOs
│   │   ├── entity/       # JPA entities
│   │   ├── enums/        # Role, Status, QuestionType...
│   │   ├── exception/    # GlobalExceptionHandler
│   │   ├── repository/   # Spring Data JPA repos
│   │   ├── security/     # JWT, AuthFilter
│   │   └── service/      # Business logic
│   └── src/main/resources/
│       ├── application.yml
│       └── schema.sql
├── frontend/             # React + Vite + TypeScript
│   └── src/
│       ├── api/          # Axios functions
│       ├── hooks/        # useTimer, useDebounce
│       ├── layouts/      # AuthLayout, AdminLayout, StudentLayout
│       ├── pages/        # auth/, admin/, student/
│       ├── routes/       # AppRouter, ProtectedRoute
│       ├── store/        # Zustand auth store
│       ├── types/        # TypeScript interfaces
│       └── utils/        # Helpers
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + Vite + TypeScript |
| Styling   | Tailwind CSS + ShadCN UI (Radix) |
| Charts    | Recharts |
| Code Editor | Monaco Editor |
| State     | Zustand |
| Routing   | React Router v6 |
| Backend   | Spring Boot 3.2 (Java 17) |
| Security  | Spring Security 6 + JWT (JJWT 0.12) |
| ORM       | Spring Data JPA + Hibernate |
| Database  | MySQL 8.0 |
| Docs      | Springdoc OpenAPI / Swagger UI |
| Docker    | Docker Compose (multi-service) |

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended — no local Java/MySQL needed)

```bash
git clone https://github.com/annnuuupam/Online-Test-System.git
cd Online-Test-System
docker compose up --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

---

### Option 2: Local Development

#### Backend Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8.x running locally

```bash
# 1. Create DB
mysql -u root -p -e "CREATE DATABASE ots_db; CREATE USER 'ots_user'@'localhost' IDENTIFIED BY 'ots_password'; GRANT ALL ON ots_db.* TO 'ots_user'@'localhost';"

# 2. Run backend
cd backend
./mvnw spring-boot:run

# Backend runs at http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

#### Frontend Prerequisites
- Node.js 18+

```bash
cd frontend
npm install
npm run dev

# Frontend runs at http://localhost:5173
```

---

## 🔐 Authentication

JWT-based, stateless. All protected endpoints require:
```
Authorization: Bearer <your_jwt_token>
```

**Default admin account** (create via Swagger after startup):
```
POST /api/auth/register
```
Then manually update role to ADMIN in MySQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Admin — Tests
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/tests` | ADMIN |
| POST | `/api/admin/tests` | ADMIN |
| PUT | `/api/admin/tests/{id}` | ADMIN |
| DELETE | `/api/admin/tests/{id}` | ADMIN |
| PUT | `/api/admin/tests/{id}/toggle` | ADMIN |
| POST | `/api/admin/tests/{id}/sections` | ADMIN |
| DELETE | `/api/admin/tests/sections/{id}` | ADMIN |

### Admin — Questions & Users
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/admin/questions` | ADMIN |
| PUT | `/api/admin/questions/{id}` | ADMIN |
| DELETE | `/api/admin/questions/{id}` | ADMIN |
| POST | `/api/admin/questions/bulk` | ADMIN |
| GET | `/api/admin/users` | ADMIN |
| PUT | `/api/admin/users/{id}/toggle-status` | ADMIN |
| PUT | `/api/admin/users/{id}/role` | ADMIN |
| GET | `/api/admin/analytics/overview` | ADMIN |

### Student
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tests` | STUDENT/ADMIN |
| GET | `/api/tests/{id}` | STUDENT/ADMIN |
| POST | `/api/tests/{id}/attempt` | STUDENT/ADMIN |
| PUT | `/api/attempts/{id}/answer` | STUDENT/ADMIN |
| POST | `/api/attempts/{id}/submit` | STUDENT/ADMIN |
| GET | `/api/attempts/{id}/result` | STUDENT/ADMIN |
| GET | `/api/attempts/me` | STUDENT/ADMIN |
| GET | `/api/leaderboard/{examId}` | STUDENT/ADMIN |

---

## 📊 Features

### Admin
- ✅ Dashboard with analytics charts (line, pie, bar)
- ✅ Create/Edit/Delete tests with sections
- ✅ Add MCQ, Multi-select, Coding questions
- ✅ Bulk CSV question import
- ✅ Negative marking configuration
- ✅ Schedule tests (start/end time)
- ✅ Enable/disable tests
- ✅ User management (search, block, role change)
- ✅ Announcements system
- ✅ Results and export

### Student
- ✅ Test listing with full details
- ✅ Timed test engine with countdown timer
- ✅ Question palette with status indicators
- ✅ Save & resume in-progress attempts
- ✅ Mark questions for review
- ✅ Monaco Editor for coding questions
- ✅ Auto-submit on timeout
- ✅ Results with pie chart breakdown
- ✅ Leaderboard with podium

---

## 🌐 Deployment

| Platform | What |
|----------|------|
| **Vercel** | React frontend (static) |
| **Render** | Spring Boot backend (free tier) |
| **Railway** | MySQL + Spring Boot |
| **AWS EC2** | Full stack via Docker Compose |

---

## 👨‍💻 Developer

**Anupam Kumar**  
- [GitHub](https://github.com/annnuuupam)
- [LinkedIn](https://www.linkedin.com/in/anupam3062/)
- [Email](mailto:anupamkumar3062@gmail.com)

---

## 📝 License

MIT License
