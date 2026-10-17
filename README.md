# ClassOptima – Intelligent Class Allocation & Timetable Portal

ClassOptima is a MERN-stack (MongoDB, Express, React, Node.js) web portal that automatically builds a
clash-free weekly timetable for a college, and gives every user a portal of their own:

| Portal | What it does |
| --- | --- |
| **Admin** | Manage faculty (with availability), classrooms & labs, subjects and divisions. Run the CSP scheduling engine, see clashes, fine-tune by drag-and-drop with live conflict checking, lock slots, publish/unpublish, download PDFs. |
| **Professor** | Request a room for an extra lecture or meeting (students of the division are notified automatically). Personal weekly timetable, "Happening now" tracker, weekly workload gauge (theory/lab hours, hours per day), assigned subjects, update cabin & availability, PDF and calendar (.ics) export. |
| **Student** | Self-registration with division, division timetable, "Happening now" live lecture with countdown and room location, view any division, print, PDF and calendar export. Book an empty room or lab for group study, projects or meetings. Notifications for extra lectures. |

All data is stored in MongoDB. Login uses JWT with role-based access control on every API route.

---

## 1. Requirements

- **Node.js 18 or newer** (`node -v`)
- **MongoDB**: either a free **MongoDB Atlas** cluster (recommended) or MongoDB Community Server installed locally

## 2. Set up MongoDB

### Option A: MongoDB Atlas (cloud, free)
1. Sign up at <https://www.mongodb.com/cloud/atlas> and create a free **M0** cluster.
2. **Database Access** → *Add New Database User* → choose a username and password.
3. **Network Access** → *Add IP Address* → *Allow access from anywhere* (`0.0.0.0/0`) for the demo.
4. **Connect** → *Drivers* → copy the connection string. It looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`
5. Add the database name `classoptima` before the `?`:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/classoptima?retryWrites=true&w=majority`

### Option B: Local MongoDB
Install MongoDB Community Server and use `mongodb://127.0.0.1:27017/classoptima`.

## 3. Install and run

```bash
git clone https://github.com/shubhamgabhane1104/ClassOptima.git
cd ClassOptima

# install frontend + backend packages
npm run setup

# create the backend config file
cp server/.env.example server/.env      # Windows: copy server\.env.example server\.env
# then open server/.env and paste your MONGO_URI and set a JWT_SECRET

# load the sample college (teachers, rooms, subjects, divisions, students)
# and generate + publish a first timetable
npm run seed

# start backend (port 5000) and frontend (port 5173) together
npm run dev:all
```

Open **http://localhost:5173**.

> `npm run seed` **erases** the ClassOptima collections and reloads the sample data. Run it only when you want a fresh demo.

### Demo accounts (created by the seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@classoptima.edu.in` | `admin123` |
| Professor | `amit.sharma@classoptima.edu.in` (any faculty email) | `prof123` |
| Student | `rahul.verma@classoptima.edu.in` | `student123` |

The login page also has one-click buttons for these three accounts, useful during the viva.

## 4. Useful commands

| Command (from project root) | What it does |
| --- | --- |
| `npm run dev:all` | Run API + React together |
| `npm run dev` / `npm --prefix server run dev` | Run only the frontend / only the API |
| `npm run seed` | Reset the database with the sample college |
| `npm test` | Run the allocation engine tests (no database needed) |
| `npm --prefix server run test:bookings` | Room booking API tests (needs `npm run seed` and the API running) |
| `npm run lint` | Lint the frontend |
| `npm start` | Production: build React and serve it from Express on port 5000 |

## 5. Make it your college

- **Name, tagline and photos:** edit `src/config/college.js`. To use real photos of your campus and
  classrooms, copy them into `public/images/` (e.g. `campus.jpg`) and set
  `campus: '/images/campus.jpg'`. The default photos load from Unsplash, so they need internet.
- **Logo:** replace `src/components/layout/Crest.jsx` with an `<img>` of your logo.
- **College name on PDFs:** `COLLEGE_NAME` in `server/.env`.
- **Periods, timings and lunch break:** `server/config/constants.js` and `src/config/schedule.js` (keep them identical).
- **Sample data:** `server/seed/sampleCollegeData.js`.

---

## 6. Project structure

```
ClassOptima/
├── index.html, vite.config.js, package.json      React + Vite frontend (root)
├── src/
│   ├── config/          college.js (branding), schedule.js (days, periods)
│   ├── context/         AuthContext.jsx (login state, JWT)
│   ├── services/        api.js (fetch + JWT), calendarExport.js (.ics)
│   ├── components/
│   │   ├── layout/      AppShell (header + sidebar), Crest
│   │   ├── common/      Modal, Toast, PageHeader, PhotoBanner, Stat…
│   │   ├── timetable/   TimetableGrid (drag-and-drop), LiveClassBanner
│   │   └── AvailabilityPicker.jsx
│   ├── pages/
│   │   ├── auth/        Login, Register (students)
│   │   ├── admin/       AdminDashboard, TimetableGenerator, TeacherManager,
│   │   │                ClassroomManager, SubjectManager, SectionManager, StudentList
│   │   ├── professor/   ProfessorDashboard, ProfessorProfile
│   │   └── student/     StudentDashboard
│   └── styles/index.css College portal theme (navy + gold), print styles
└── server/
    ├── index.js                 Express app
    ├── config/                  db.js (MongoDB), constants.js (periods)
    ├── middleware/              authMiddleware (JWT + RBAC), errorHandler
    ├── models/                  User, Teacher, Student, Classroom, Subject, ClassSection, TimetableSlot
    ├── controllers/             auth, resource (CRUD + stats), allocation, portal, export (PDF)
    ├── routes/index.js          All /api/v1 routes
    ├── services/                allocationEngine.js (CSP), conflictDetector.js, timetableService.js
    ├── seed/                    sampleCollegeData.js, seedRunner.js
    └── tests/allocation.test.js
```

## 7. REST API (`/api/v1`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Log in, returns JWT + profile |
| POST | `/auth/register` | Public | Student self-registration |
| GET | `/auth/me` | Logged in | Current user with profile |
| PATCH | `/auth/password` | Logged in | Change password |
| GET | `/public/sections` | Public | Division list for sign-up / picker |
| GET | `/stats` | Admin | Dashboard counters + timetable status |
| GET/POST/PUT/DELETE | `/teachers`, `/classrooms`, `/subjects`, `/sections` | Admin | Resource CRUD |
| GET/DELETE | `/students` | Admin | Registered students |
| POST | `/allocation/generate` | Admin | Run the CSP engine |
| GET | `/allocation/timetable?section=&teacher=` | Admin | Full (draft or published) timetable |
| GET | `/allocation/conflicts` | Admin | Clash report |
| POST | `/allocation/validate` | Admin | Check a drag-and-drop move before saving |
| PATCH | `/allocation/slots/:id` | Admin | Move / change room (validated; locks the slot) |
| PATCH | `/allocation/slots/:id/lock` | Admin | Lock or unlock a slot |
| DELETE | `/allocation/slots/:id` | Admin | Remove a slot |
| PATCH | `/allocation/publish` | Admin | Publish (`{publish:true}`) or withdraw |
| GET | `/professor/schedule`, `/professor/workload` | Professor | Own timetable + live status, workload |
| GET/PUT | `/professor/profile` | Professor | Cabin, phone, availability |
| GET | `/student/timetable?section=` | Logged in | Published timetable of a division + live status |
| POST | `/bookings` | Student / Professor | Request a room; an empty room is allocated immediately or the reply explains why not, with suggested free times |
| GET | `/bookings/availability?date&startTime&durationMinutes&attendees&roomType` | Logged in | Free rooms for a time (live preview in the form) |
| GET | `/bookings/mine`, `/bookings/feed` | Student / Professor | Own bookings; upcoming bookings and extra lectures for the user's timetable |
| GET | `/bookings/my-divisions` | Professor | Divisions and subjects the professor teaches |
| PATCH | `/bookings/:id/cancel` | Owner / Admin | Cancel and release the room (notifies affected users) |
| GET | `/bookings` | Admin | All bookings |
| GET / PATCH | `/notifications`, `/notifications/read` | Logged in | Notifications and mark-all-read |
| GET | `/export/pdf/:sectionId` | Logged in | Division timetable PDF |
| GET | `/export/pdf/teacher/:teacherId` (or `me`) | Admin / own professor | Faculty timetable PDF |

## 8. How the allocation engine works

Scheduling is modelled as a **Constraint Satisfaction Problem**:

- **Variables:** every lecture that must be placed: one per theory hour, one per 2-hour lab block.
- **Domain:** (day, starting period, room). Mon–Sat × 7 periods, lunch recess after period 4.
- **Hard constraints** (never broken): teacher clash, room clash, division clash, room capacity ≥ division
  strength, practicals only in matching labs (theory in lecture halls), teacher availability, teacher daily
  hour limit, lab blocks never cross lunch.
- **Soft constraints** (minimised by a penalty score): same theory subject twice a day, more than 3 periods in a
  row for a teacher, free periods in a division's day, late-starting days, uneven spread across the week.
- **Search:** backtracking with **MRV** (always place the lecture with the fewest remaining options next; labs
  win ties) and **least-penalty value ordering**. Locked slots are kept fixed. If the search budget runs out the
  engine falls back to a greedy pass and reports exactly which lectures could not be placed and why.

The sample college (3 divisions, 48 lecture blocks) is solved in well under a second with zero backtracks;
the tests also check a 6-division case. Run `npm test` to see it.

## 9. Room bookings and extra lectures

Students and professors book a room from **Book a room** in their portal by giving the purpose, number of
people, room type, date, start time, duration and reason. While they fill the form, the page shows which rooms
are free. On submit the server allocates a room immediately when one is available:

- A room is free when no weekly lecture uses it on that weekday at an overlapping time and no other booking holds it.
- It must seat everyone and match the requested type (extra lectures default to a lecture hall for theory and
  the subject's lab type for practicals). The smallest suitable room is chosen so big halls stay free.
- Students cannot book during their own division's lectures; an extra lecture needs the professor and the
  division to be free. Bookings run 8:00 AM to 7:00 PM, Monday to Saturday, up to 3 hours, up to 60 days ahead.
  Students can hold 3 upcoming bookings at a time.
- If nothing is free, the reply says why and suggests up to 4 free times.

When a professor books an extra lecture, every student of that division gets a notification (bell icon in the
top bar and **Notices** on the dashboard), and the lecture appears on both the professor's and the students'
timetable next to the date of that week, plus in the **Extra lectures and room bookings** list. Cancelling,
by the requester or by the admin in **Room bookings**, releases the room and notifies everyone affected.
If the admin regenerates the timetable and a weekly lecture now overlaps a booking, the generator lists it as
a warning.

## 10. Team workflow

Pull the latest code before you start and after a teammate pushes:

```bash
git pull origin master
npm run setup            # only needed when package.json changed
```

**Never commit `server/.env`** (it holds your database password). It is in `.gitignore`; share
`server/.env.example` instead.

## 11. Troubleshooting

| Problem | Fix |
| --- | --- |
| `MongoDB connection error: bad auth` | Wrong username/password in `MONGO_URI`. Special characters in the password must be URL-encoded (`@` → `%40`). |
| `querySrv ENOTFOUND` / timeout with Atlas | Add your IP in Atlas *Network Access*, or your network blocks Atlas; try a mobile hotspot. |
| Login says "Cannot reach the ClassOptima server" | The API is not running. Use `npm run dev:all`, or start `npm --prefix server run dev`. |
| Login says "Incorrect email or password" for demo accounts | Run `npm run seed` once. |
| Students see "Timetable not published yet" | Admin → Timetable Generator → **Publish**. Any manual change unpublishes until you publish again. |
| Background photos do not show | They load from the internet; put your own photos in `public/images/` (see section 5). |
