# ClassOptima: Intelligent Class Allocation & Timetable Portal

ClassOptima is a full-stack **MERN** (MongoDB, Express, React, Node.js) web portal for a college.
It automatically builds a **clash-free weekly timetable** for every division using a constraint
satisfaction (CSP) scheduling engine. Admins, professors and students each get their own portal.

Before ClassOptima, the timetable was made by hand in a spreadsheet. That takes days, and it is easy to
book one teacher or one room twice at the same time. ClassOptima does it in under a second, checks
every change for clashes, and publishes the result straight to faculty and students.

---

## Table of contents

1. [Features](#1-features)
2. [Tech stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Getting started](#4-getting-started)
5. [Team workflow (shared Atlas database)](#5-team-workflow-shared-atlas-database)
6. [Useful commands](#6-useful-commands)
7. [How the allocation engine works](#7-how-the-allocation-engine-works)
8. [Room bookings and extra lectures](#8-room-bookings-and-extra-lectures)
9. [Security](#9-security)
10. [Make it your college (branding and theme)](#10-make-it-your-college-branding-and-theme)
11. [Project structure](#11-project-structure)
12. [Database models](#12-database-models)
13. [REST API](#13-rest-api-apiv1)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Features

### Admin portal
- Dashboard with live counters: faculty, halls and labs, subjects, divisions, students and upcoming bookings.
- Manage **faculty** (designation, cabin, weekly and daily hour limits, weekly availability grid),
  **classrooms & labs** (type and capacity), **subjects** (theory or practical, hours per week, lab type)
  and **divisions** (programme, semester, strength, subject–teacher mapping).
- **Students** list with filters by programme, semester and division, plus search.
- **Timetable generator**: one click runs the CSP engine for all divisions.
  - View the timetable by division or by faculty.
  - Live clash report.
  - Drag and drop a lecture to another period. The move is checked before it is saved.
  - Change a lecture's room, lock a slot so it is kept when you generate again, or remove a slot.
  - **Publish / unpublish** to the professor and student portals.
- **Room bookings**: see every booking and extra lecture, and cancel any of them.
- Download the timetable of any division or teacher as a **PDF**.

### Professor portal
- Personal weekly timetable, with a **"Happening now"** card showing the current or next lecture.
- **Workload** gauge: theory and lab hours, hours per day, and assigned subjects.
- **Book a room** for an extra lecture or a meeting. The students of that division are notified automatically.
- Profile & availability: update cabin, phone and the periods they are available.
- Separate **Change password** tab.
- Export the timetable as PDF or as a calendar file (`.ics`) for Google Calendar or Outlook.

### Student portal
- Self-registration: name, roll number and division.
- Division timetable with a live **"Happening now"** card (countdown and room).
- View any other division's timetable. Print, PDF and calendar export.
- **Book an empty room or lab** for group study, project work or meetings.
- **Notifications** (bell icon and a notices panel) for extra lectures and cancelled bookings.
- Separate **Change password** tab.

### Common
- College-portal look: maroon and marigold theme, college seal, campus photo banners.
- One-click demo login buttons on the login page.
- Logs out automatically when the tab or browser is closed or the page is refreshed.

---

## 2. Tech stack

| Layer | Technology | Used for |
| --- | --- | --- |
| **Frontend** | **React 19** | Component-based user interface for all three portals |
| | **Vite 8** | Development server with hot reload, and the production build |
| | **React Router 7** | Page routing and role-protected routes |
| | **lucide-react** | Icons |
| | **Plain CSS** with CSS variables | College theme, responsive layout, print styles |
| | **@fontsource** (Bitter, Nunito Sans) | Fonts bundled with the app, so no internet is needed |
| | HTML5 Drag and Drop API | Moving lectures in the timetable grid |
| **Backend** | **Node.js 18+** | JavaScript runtime for the server |
| | **Express 4** | REST API under `/api/v1` |
| | **Mongoose 8** | MongoDB schemas, validation and queries |
| | **JSON Web Token (jsonwebtoken)** | Login tokens (valid for 8 hours) |
| | **bcryptjs** | Password hashing |
| | **PDFKit** | Timetable PDF generation |
| | cors, dotenv | Cross-origin requests and environment configuration |
| **Database** | **MongoDB Atlas** (cloud) or local MongoDB | Shared data for the whole team |
| **Algorithm** | Constraint Satisfaction Problem solver (custom code) | Backtracking, MRV heuristic, penalty scoring, greedy fallback |
| **Tools** | Git & GitHub | Version control and team collaboration |
| | ESLint | Code quality checks for the frontend |
| | nodemon, concurrently | Auto-restarting API; running API and frontend with one command |
| | MongoDB Compass | Viewing the Atlas data |
| | VS Code | Editor |

---

## 3. Architecture

```
 ┌──────────────────────────┐   HTTPS / JSON + JWT   ┌───────────────────────────┐   Mongoose   ┌──────────────────┐
 │  React 19 + Vite (5173)  │ ─────────────────────▶ │  Node.js + Express (5000)  │ ───────────▶ │  MongoDB Atlas   │
 │  Admin / Professor /     │ ◀───────────────────── │  /api/v1 REST routes       │ ◀─────────── │  (classoptima)   │
 │  Student portals         │     data, PDF files    │  Auth + RBAC middleware    │              └──────────────────┘
 └──────────────────────────┘                        │  CSP allocation engine     │
                                                     │  Conflict detector         │
                                                     │  Booking service           │
                                                     │  PDF export (PDFKit)       │
                                                     └───────────────────────────┘
```

- In development, Vite forwards every `/api` request to the Express server on port 5000.
- In production (`npm start`), React is built and Express serves the built files and the API from port 5000.

---

## 4. Getting started

### Requirements
- **Node.js 18 or newer** (check with `node -v`)
- **Git**
- **MongoDB**: a free **MongoDB Atlas** cluster (recommended) or MongoDB Community Server installed locally

### Step 1: Get the code

```bash
git clone https://github.com/shubhamgabhane1104/ClassOptima.git
cd ClassOptima
npm run setup            # installs frontend and backend packages
```

### Step 2: Create `server/.env`

```bash
cp server/.env.example server/.env        # Windows: copy server\.env.example server\.env
```

Open `server/.env` and fill in:

| Variable | Example | Meaning |
| --- | --- | --- |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/classoptima?retryWrites=true&w=majority` | Database connection. Keep `/classoptima` before the `?`. |
| `JWT_SECRET` | any long random string | Used to sign login tokens |
| `PORT` | `5000` | API port |
| `COLLEGE_NAME` | `ClassOptima Institute of Technology` | Shown on PDFs |
| `TIMEZONE` | `Asia/Kolkata` | Used by the "Happening now" tracker |

**Team members:** get the exact `MONGO_URI` privately from the project owner. Never share it in a group chat
and never commit it.

#### Setting up MongoDB Atlas (only the project owner, once)
1. Create a free **M0** cluster at <https://www.mongodb.com/cloud/atlas>.
2. **Database Access** → add a database user with a password.
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere) so every team member can connect.
4. **Connect → Drivers** → copy the connection string and add `/classoptima` before the `?`.

### Step 3: Load sample data (only once, only one person)

```bash
npm run seed
```

This loads a sample college and generates and publishes a first timetable. The sample has
9 faculty, 5 lecture halls, 3 labs, 14 subjects, 3 divisions and sample students.

> ⚠️ `npm run seed` **erases** all ClassOptima data and reloads the sample. On a shared Atlas database this
> wipes everyone's data, so only one person should run it, and only when a fresh demo is wanted.

### Step 4: Run

```bash
npm run dev:all
```

Open **http://localhost:5173**. The terminal should show `MongoDB connected: ...mongodb.net/classoptima`.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@classoptima.edu.in` | `admin123` |
| Professor | `amit.sharma@classoptima.edu.in` (or any faculty email) | `prof123` |
| Student | `rahul.verma@classoptima.edu.in` | `student123` |

---

## 5. Team workflow (shared Atlas database)

All team members connect to the **same Atlas database**, so everyone sees the same data.

**Every time, before you start work:**
```bash
git pull origin master
npm run setup            # only needed when package.json changed
npm run dev:all
```

**After making changes:**
```bash
git add .
git status               # make sure server/.env is NOT in the list
git commit -m "short description of the change"
git push origin master
```

Rules:
- `server/.env` is in `.gitignore`. Set it up **once**. `git pull` never changes or deletes it.
  You only need it again after a fresh `git clone` into a new folder.
- **Never commit `server/.env`**. It contains the database password.
- **Do not run `npm run seed`** on the shared database unless the whole team agrees.

---

## 6. Useful commands

Run these from the project root.

| Command | What it does |
| --- | --- |
| `npm run setup` | Install frontend and backend packages |
| `npm run dev:all` | Run the API (port 5000) and React (port 5173) together |
| `npm run dev` | Run only the frontend |
| `npm --prefix server run dev` | Run only the API |
| `npm run seed` | Reset the database with the sample college (erases data) |
| `npm test` | Allocation engine tests (no database needed) |
| `npm --prefix server run test:bookings` | Room booking API tests (needs seeded data and the API running) |
| `npm run lint` | Lint the frontend code |
| `npm run build` | Production build of the frontend |
| `npm start` | Build React and serve everything from Express on port 5000 |

---

## 7. How the allocation engine works

Timetabling is modelled as a **Constraint Satisfaction Problem (CSP)**
(`server/services/allocationEngine.js`).

- **Variables:** every lecture block that must be placed: one per theory hour, one per 2-hour lab.
- **Domain:** (day, starting period, room). Monday to Saturday × 7 periods, with a lunch recess after period 4.
- **Hard constraints** (never broken):
  - no teacher, room or division is booked twice at the same time
  - room capacity is at least the division's strength
  - practicals only in a matching lab, theory only in lecture halls
  - the teacher's availability and daily hour limit are respected
  - lab blocks never cross the lunch break
- **Soft constraints** (minimised with a penalty score):
  - the same theory subject twice in one day
  - more than 3 periods in a row for one teacher
  - free gaps in a division's day
  - late-starting days and uneven spread across the week
- **Search:**
  - Backtracking with the **MRV (Minimum Remaining Values)** heuristic: the lecture with the fewest
    possible places is scheduled next, and labs win ties.
  - **Least-penalty value ordering**: the best-scoring place is tried first.
  - **Locked slots** stay fixed.
  - If the search budget runs out, a **greedy fallback** places what it can and reports exactly which
    lectures could not be placed and why.
- **Conflict detector** (`conflictDetector.js`): checks every manual drag-and-drop move before it is
  saved, and produces the clash report on the generator page.

The sample college (3 divisions, 48 lecture blocks) is solved in well under a second.

---

## 8. Room bookings and extra lectures

Students and professors open **Book a room** and enter the purpose, number of people, room type, date,
start time, duration and reason. While they fill in the form, the page shows which rooms are free.
On submit, the server (`bookingService.js`) allocates a room immediately if one is free.

A room is chosen only if all of these hold:
- No weekly lecture or other booking uses it at that time.
- It seats everyone and matches the requested type. The smallest suitable room is picked, so big halls stay free.
- Students cannot book during their own lectures. An extra lecture needs both the professor and the division to be free.

Limits: 8:00 AM to 7:00 PM, Monday to Saturday, up to 3 hours, up to 60 days ahead.
A student can hold at most 3 upcoming bookings.

If no room is free, the reply explains why and suggests up to 4 free times.

**Extra lectures:** every student of the division gets a notification, and the lecture appears on both the
professor's and the students' timetable for that week. Cancelling a booking (by its owner or the admin)
frees the room and notifies everyone affected.

---

## 9. Security

- Passwords are hashed with **bcrypt** and never sent back by the API.
- **JWT** authentication. Tokens expire after 8 hours.
- **Role-based access control (RBAC)**: every API route checks the role (admin, professor or student).
  For example, only an admin can generate or publish a timetable.
- The token is kept **in memory only**, so closing the tab or browser, or refreshing the page, logs the user out.
- Secrets (database URI, JWT secret) live in `server/.env`, which is git-ignored.

---

## 10. Make it your college (branding and theme)

| What | Where |
| --- | --- |
| College name, tagline, city | `src/config/college.js` |
| Campus, classroom and student photos | Put the images in `public/images/` and set their paths in `src/config/college.js`, e.g. `campus: '/images/campus.jpg'` |
| College logo | Put it at `public/images/logo.png` and add `logo: '/images/logo.png',` in `src/config/college.js`. With no logo set, the built-in seal is used (`src/components/layout/Crest.jsx`). |
| Theme colours and fonts | CSS variables at the top of `src/styles/index.css` (`--brand`, `--accent`, `--paper`, …) |
| College name on PDFs | `COLLEGE_NAME` in `server/.env` |
| Periods, timings, lunch break | `server/config/constants.js` and `src/config/schedule.js` (keep them identical) |
| Sample data | `server/seed/sampleCollegeData.js` |

**Current theme**

| Colour | Hex | Used for |
| --- | --- | --- |
| Maroon | `#7a1f2e` | Header, buttons, headings |
| Marigold | `#e0912f` | Highlights, active menu, "today" |
| Slate-blue | `#3f6a8c` | Theory lectures |
| Teal | `#2a7a6c` | Lab sessions |

Fonts: **Bitter** for headings and **Nunito Sans** for text.

---

## 11. Project structure

```
ClassOptima/
├── index.html, vite.config.js, package.json      React + Vite frontend (root)
├── public/                    favicon, your college images (public/images/)
├── src/
│   ├── main.jsx, App.jsx      entry point and role-based routes
│   ├── config/                college.js (branding), schedule.js (days and periods)
│   ├── context/               AuthContext.jsx (login state)
│   ├── services/              api.js (fetch + JWT), calendarExport.js (.ics)
│   ├── components/
│   │   ├── layout/            AppShell (header + sidebar), Crest (college seal)
│   │   ├── common/            ui.jsx (Modal, PageHeader, Field…), Toast, Notifications
│   │   ├── timetable/         TimetableGrid (drag and drop), LiveClassBanner, UpcomingExtras
│   │   └── AvailabilityPicker.jsx
│   ├── pages/
│   │   ├── auth/              Login, Register
│   │   ├── admin/             AdminDashboard, TimetableGenerator, TeacherManager, ClassroomManager,
│   │   │                      SubjectManager, SectionManager, StudentList, BookingList, CrudManager
│   │   ├── professor/         ProfessorDashboard, ProfessorProfile
│   │   ├── student/           StudentDashboard
│   │   └── shared/            RoomBookingPage, ChangePassword
│   └── styles/index.css       theme, layout, print styles
└── server/
    ├── index.js               Express app
    ├── .env.example           template for server/.env
    ├── config/                db.js (MongoDB connection), constants.js (periods)
    ├── middleware/            authMiddleware.js (JWT + RBAC), error handler
    ├── models/                User, Teacher, Student, Classroom, Subject, ClassSection,
    │                          TimetableSlot, RoomBooking, Notification
    ├── controllers/           auth, resource (CRUD + stats), allocation, portal, booking, export (PDF)
    ├── routes/index.js        all /api/v1 routes
    ├── services/              allocationEngine.js (CSP), conflictDetector.js,
    │                          timetableService.js, bookingService.js
    ├── seed/                  sampleCollegeData.js, seedRunner.js
    └── tests/                 allocation.test.js, bookings.api.test.js
```

---

## 12. Database models

| Collection | Main fields |
| --- | --- |
| **User** | name, email, hashed password, role (`admin` / `professor` / `student`), link to Teacher or Student |
| **Teacher** | name, department, designation, cabin, phone, max hours per week and per day, weekly availability |
| **Student** | name, roll number, department, semester, division |
| **Classroom** | room number, building, floor, type (lecture hall or a kind of lab), capacity, projector |
| **Subject** | code, name, department, semester, theory or practical, hours per week, credits, preferred room type |
| **ClassSection** | name, department, semester, division, strength, class teacher, subjects with their assigned teachers |
| **TimetableSlot** | division, subject, teacher, room, day, period, start and end time, locked, published |
| **RoomBooking** | requester, purpose (study, meeting, extra lecture), room, date, time, attendees, status |
| **Notification** | recipient user or division, title, message, read-by list |

---

## 13. REST API (`/api/v1`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Log in; returns a JWT and the profile |
| POST | `/auth/register` | Public | Student self-registration |
| GET | `/auth/me` | Logged in | Current user and profile |
| PATCH | `/auth/password` | Logged in | Change password |
| GET | `/public/sections` | Public | Division list for sign-up |
| GET | `/stats` | Admin | Dashboard counters and timetable status |
| GET / POST / PUT / DELETE | `/teachers`, `/classrooms`, `/subjects`, `/sections` | Admin | Resource CRUD |
| GET / DELETE | `/students` | Admin | Registered students |
| POST | `/allocation/generate` | Admin | Run the CSP engine |
| GET | `/allocation/timetable` | Admin | Full timetable (draft or published) |
| GET | `/allocation/conflicts` | Admin | Clash report |
| POST | `/allocation/validate` | Admin | Check a drag-and-drop move before saving |
| PATCH | `/allocation/slots/:id` | Admin | Move a slot or change its room |
| PATCH | `/allocation/slots/:id/lock` | Admin | Lock or unlock a slot |
| DELETE | `/allocation/slots/:id` | Admin | Remove a slot |
| PATCH | `/allocation/publish` | Admin | Publish or withdraw the timetable |
| GET | `/professor/schedule`, `/professor/workload` | Professor | Own timetable with live status; workload |
| GET / PUT | `/professor/profile` | Professor | Cabin, phone, availability |
| GET | `/student/timetable?section=` | Logged in | Published timetable of a division |
| POST | `/bookings` | Student / Professor | Request a room or schedule an extra lecture |
| GET | `/bookings/availability` | Logged in | Free rooms for a given date and time |
| GET | `/bookings/mine`, `/bookings/feed` | Student / Professor | Own bookings; upcoming extras for the user's timetable |
| GET | `/bookings/my-divisions` | Professor | Divisions and subjects the professor teaches |
| PATCH | `/bookings/:id/cancel` | Owner / Admin | Cancel a booking and free the room |
| GET | `/bookings` | Admin | All bookings |
| GET / PATCH | `/notifications`, `/notifications/read` | Logged in | List notifications; mark all as read |
| GET | `/export/pdf/:sectionId` | Logged in | Division timetable PDF |
| GET | `/export/pdf/teacher/:teacherId` (or `me`) | Admin / the professor | Faculty timetable PDF |

---

## 14. Troubleshooting

| Problem | Fix |
| --- | --- |
| "Incorrect email or password" with the correct demo login | The app is not connected to the shared database. Check that `server/.env` exists and that its `MONGO_URI` matches the team's exactly, including `/classoptima`. The terminal must show `...mongodb.net/classoptima`, not `127.0.0.1`. Do not run seed to fix this. |
| `MongoDB connection error: bad auth` | Wrong username or password in `MONGO_URI`. Special characters in the password must be URL-encoded (`@` → `%40`). |
| SSL / timeout error with Atlas | Add `0.0.0.0/0` in Atlas **Network Access**, or try another network (for example a mobile hotspot). |
| `querySrv ECONNREFUSED` | DNS problem on some networks. `server/config/db.js` already uses Google/Cloudflare DNS; restart the server. |
| "Cannot reach the ClassOptima server" | The API is not running. Use `npm run dev:all`. |
| Fonts or styles look wrong after `git pull` | Run `npm run setup`, then press `Ctrl + F5` in the browser. |
| Students see "Timetable not published yet" | Admin → Timetable Generator → **Publish**. Any manual change unpublishes it until you publish again. |
| Logged out after a refresh | This is intended (in-memory session). Log in again. |
| Photos do not show | The default photos load from the internet. Put your own in `public/images/` (see section 10). |
