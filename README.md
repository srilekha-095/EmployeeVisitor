# Visitor Register – Employee Visitor Management System

A MERN stack web application that lets a reception / administration team digitally record and manage visitors (clients, students, vendors, interview candidates), replacing the paper register.

## Features

- Add a new visitor record
- View all visitor records (paginated)
- Update visitor details
- Delete visitor records (with confirmation)
- Search by visitor name or mobile number
- Filter by status (Checked In / Checked Out)
- One-click check-out (records the check-out time automatically)
- Dashboard counters: total, today, checked in, checked out
- Server- and client-side validation
- Responsive UI (table on desktop, cards on mobile)
- Signup / login with JWT authentication
- Role-based access control (single `users` collection, 3 roles)

## Roles & Permissions

All accounts live in one `users` collection; the `role` field decides what a user can do.

| Capability                              | Employee | Visitor / Student        |
| --------------------------------------- | :------: | :----------------------: |
| Sign up                                 | needs company access code | open        |
| Register a visit                        | yes (walk-ins) | yes (own visit)    |
| View records                            | all      | only their own           |
| Search / filter / dashboard counts      | all records | own records           |
| Edit a record                           | any      | own, until checked out   |
| Set status / check a visitor out        | yes      | no (new visits are always "Checked In") |
| Delete a record                         | yes      | no                       |

Visitors and students have their details pre-filled from their profile, and the *Person to Meet* box suggests employee names.

## Visitor Information

Visitor Name · Mobile Number · Email Address · Organization/College Name · Person to Meet · Purpose of Visit · Date and Time of Visit · Status (Checked In / Checked Out)

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, lucide-react
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose

## Project Structure

```
backend/
  src/
    config/db.js               MongoDB connection
    controllers/               authController, userController, visitorController
    errors/                    custom error classes
    middlewares/               authMiddleware (authenticate + authorizeRoles), errorMiddleware, notFound
    models/                    User.js (one collection, 3 roles), Visitor.js
    routes/                    authRoutes, userRoutes, visitorRoutes
    utils/catchAsync.js
    app.js                     entry point
frontend/
  src/app/
    components/                StatusBadge, DeleteModal, StatsBar
    pages/                     Login, Register, VisitorList, VisitorForm
    AuthContext.jsx            login state + token handling
    api.js, utils.js, App.jsx  (App.jsx holds the protected routes)
```

## Prerequisites

- Node.js 18+
- MongoDB (local install or MongoDB Atlas)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit values if needed
npm run dev
```

`backend/.env`:

```env
PORT=5000
MONGO_DB=mongodb://127.0.0.1:27017/visitor_management
JWT_SECRET=replace_with_a_long_random_string
JWT_LIFETIME=1d
EMPLOYEE_SIGNUP_CODE=choose_a_company_access_code
CLIENT_URL=http://localhost:5173
```

- `JWT_SECRET` is required (the server refuses to start without it). Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- `EMPLOYEE_SIGNUP_CODE` is the code staff enter on the signup page to create an **Employee** account. Leave it empty to disable employee signup.

API base URL: `http://localhost:5000/api/v1`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Open `http://localhost:5173`.

### 3. First login

1. Go to **Create account**, choose **Employee**, and enter the `EMPLOYEE_SIGNUP_CODE` from your backend `.env` to create a staff account.
2. Create a **Visitor** and a **Student** account (use a private window or log out first) to see the restricted views.

## API Endpoints

Every endpoint except `register` and `login` needs the header `Authorization: Bearer <token>`.

| Method | Endpoint                  | Access            | Description                                   |
| ------ | ------------------------- | ----------------- | --------------------------------------------- |
| POST   | `/api/v1/auth/register`   | public            | Sign up (`role`: employee / visitor / student) |
| POST   | `/api/v1/auth/login`      | public            | Log in, returns `{ user, token }`             |
| GET    | `/api/v1/users/me`        | any user          | Current user                                  |
| GET    | `/api/v1/users/employees` | any user          | Employee names (for "Person to Meet")         |
| POST   | `/api/v1/visitors`        | any user          | Add a visitor record                          |
| GET    | `/api/v1/visitors`        | any user (scoped) | List. Query: `search`, `status`, `page`, `limit` |
| GET    | `/api/v1/visitors/stats`  | any user (scoped) | Dashboard counts                              |
| GET    | `/api/v1/visitors/:id`    | any user (scoped) | Get one visitor                               |
| PATCH  | `/api/v1/visitors/:id`    | any user (scoped) | Update a visitor                              |
| DELETE | `/api/v1/visitors/:id`    | employee only     | Delete a visitor                              |

"Scoped" means visitors and students only ever see or change records they created.

Example body for `POST /api/v1/auth/register`:

```json
{
  "name": "Riya Patel",
  "email": "riya@college.edu",
  "mobile": "9876543210",
  "password": "secret123",
  "role": "student",
  "organization": "ABC Engineering College"
}
```

(Employees send `"employeeCode"` instead of `"organization"`.)

Example body for `POST /api/v1/visitors`:

```json
{
  "name": "Ananya Sharma",
  "mobile": "9876543210",
  "email": "ananya@example.com",
  "organization": "ABC Engineering College",
  "personToMeet": "Mr. Rao (HR)",
  "purpose": "Interview",
  "status": "Checked In"
}
```

`visitDateTime` defaults to the current time if omitted.

## Validation Rules

- All visitor fields except date/time and status are required
- Password: at least 6 characters (stored hashed with bcrypt)
- Signup email must be unique
- Mobile number: exactly 10 digits
- Email: valid format
- Status: `Checked In` or `Checked Out`

## Deployment Notes

- Backend (e.g. Render): set `MONGO_DB` (Atlas URI), `JWT_SECRET`, `JWT_LIFETIME`, `EMPLOYEE_SIGNUP_CODE` and `CLIENT_URL` (your frontend URL).
- Frontend (e.g. Vercel/Netlify): set `VITE_API_URL` to your deployed backend URL + `/api/v1`.

## Screenshots

_Add screenshots of the visitor list, add/edit form and delete confirmation here._
