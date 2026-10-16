# 🎓 ClassOptima – Intelligent Class Allocation System

> An automated, conflict-free timetable allocation platform built with the MERN stack (MongoDB, Express, React, Node.js) and Constraint Satisfaction Problem (CSP) scheduling algorithms.

---

## 🚀 Key Features

- **Multi-Role RBAC**: Tailored dashboards for Administrators, Faculty, and Students.
- **Conflict-Free Scheduling Engine**: Algorithmic backtracking preventing classroom, teacher, and slot clashes.
- **Resource Management**: Dynamic availability grids for teachers and room capacity tracking.
- **Timetable Matrix**: Interactive weekly matrix with Theory and Lab distinction.
- **Export & Portals**: PDF timetable exports and personalized faculty/student views.

---

## 🔐 Authentication & RBAC Architecture

ClassOptima implements stateless, token-based authentication using **JSON Web Tokens (JWT)**, **bcrypt** password hashing, and client-side **ProtectedRoute** route guards.

### 🛡️ Role-Based Access Control (RBAC) Matrix

| Resource / Action | Admin | Professor | Student | Middleware Guard |
| :--- | :---: | :---: | :---: | :--- |
| **User & Role Management** | ✅ Full Access | ❌ Denied | ❌ Denied | `requireRole(['admin'])` |
| **Faculty & Classrooms** | ✅ Full CRUD | ❌ Denied | ❌ Denied | `requireRole(['admin'])` |
| **Curriculum & Subjects** | ✅ Full CRUD | ❌ Denied | ❌ Denied | `requireRole(['admin'])` |
| **Run Timetable Engine** | ✅ Execute | ❌ Denied | ❌ Denied | `requireRole(['admin'])` |
| **Personal Schedule** | ✅ All Views | ✅ Assigned Slots | ✅ Batch Slots | `verifyToken` |
| **Live Timetable Matrix** | ✅ Full Grid | ✅ Full Grid | ✅ Full Grid | `verifyToken` |
| **Export Timetable (PDF)** | ✅ Enabled | ✅ Enabled | ✅ Enabled | Public / Authenticated |

---

## 📡 Authentication API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public / Admin | Register new user with hashed password |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and return signed JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch current profile using `Bearer <token>` |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Vanilla CSS Design System, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas / Mongoose
- **Security**: JWT (`jsonwebtoken`), `bcryptjs`, CORS, Dotenv

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/shubhamgabhane1104/ClassOptima.git
cd ClassOptima
