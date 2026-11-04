# TripMate 🌍

A clean, responsive, beginner-friendly MERN-stack web application designed for university semester evaluation that helps users plan trips, manage travel participants, and invite companions in one place.

---

## 👥 Team Responsibilities & Progress

- **Nishka Shah — Module 1**
  - Repository Setup & Architecture ✅
  - Trip Creation, Viewing, Editing, and Deletion ✅
  - Curated Destination Exploration ✅
  - Day-wise Itinerary Planning (Foundational Routes) ✅
  - Automated Testing for Trip Creation & Editing (`npm --prefix server run test:trip`, `npm --prefix server run test:trip-edit`) ✅

- **Heer Shah — Module 2**
  - **Part 1: Participant Management & Trip Invitations** ✅
    - Unique 6-character Trip Invite Codes & 1-Click Copy
    - Shareable Join Links & Direct Join Flow (`/join/:code`)
    - Automated Testing for Invitations (`npm --prefix server run test:participant`)
  - **Part 2: Add & Remove Participants with Persistence in MongoDB** ✅
    - Participant Directory with Roles (Organizer / Member) & Status (Confirmed / Invited)
    - Add Participants directly with validation (duplicate detection, email format validation, required fields)
    - Remove Participants with MongoDB persistence (`trip.participants.pull`) and sole-organizer integrity checks
    - Update/Toggle Participant Roles (Organizer <-> Member) with database persistence
    - Query Participants directly (`GET /api/trips/:id/participants`) with role breakdowns
    - Automated Testing for Participant Persistence (`npm --prefix server run test:participant-persistence`)

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router v6, Lucide Icons
- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: MongoDB with Mongoose
- **API Client**: Native `fetch()` API
- **Concurrency**: `concurrently` (multi-workspace runner)

---

## 📁 Project Structure

```
TripMate/
├── client/                      # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/          # Reusable UI components (Navbar, etc.)
│   │   ├── data/                # Static catalogs (destinations.js)
│   │   ├── pages/               # Route pages (Dashboard, CreateTrip, TripDetails, JoinTrip, etc.)
│   │   ├── services/            # Native fetch API wrappers (tripService)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express backend & MongoDB
│   ├── src/
│   │   ├── config/              # MongoDB connection
│   │   ├── controllers/         # Request handlers (tripController)
│   │   ├── middlewares/         # Centralized error handler
│   │   ├── models/              # Mongoose schemas (Trip with Participant subdocument)
│   │   ├── routes/              # Express API routes (tripRoutes)
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # HTTP server entrypoint
│   ├── test-connection.js       # Database connectivity verification test
│   ├── test-trip-creation.js    # Trip creation API verification test (Module 1 - Part 1)
│   ├── test-trip-editing.js     # Trip editing API verification test (Module 1 - Part 2)
│   ├── test-participants-invitations.js # Participant & Invitation verification test (Module 2 - Part 1)
│   ├── test-participant-persistence.js  # Add & Remove Participant Persistence verification test (Module 2 - Part 2)
│   ├── .env.example             # Configuration template
│   └── package.json
├── .gitignore
├── package.json                 # Root script runner
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Environment Setup
The backend uses environment variables. Copy `.env.example` to create your local `.env`:
```powershell
cp server/.env.example server/.env
```
Default `.env` configuration:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tripmate
CLIENT_URL=http://localhost:5173
```

### 2. Install Dependencies
Install all root, backend, and frontend dependencies:
```powershell
npm run install:all
```

### 3. Run Development Servers
Start both backend and frontend concurrently:
```powershell
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing

Run backend automated verification suites:
```powershell
# 1. Test MongoDB connection & server health
npm --prefix server run test:conn

# 2. Test Trip Creation API & MongoDB persistence (Module 1 - Part 1)
npm --prefix server run test:trip

# 3. Test Trip Editing API & Validation (Module 1 - Part 2)
npm --prefix server run test:trip-edit

# 4. Test Participant Management & Trip Invitations (Module 2 - Part 1 - Heer Shah)
npm --prefix server run test:participant

# 5. Test Add & Remove Participants with Persistence in MongoDB (Module 2 - Part 2 - Heer Shah)
npm --prefix server run test:participant-persistence

# 6. Test Day-Wise Itinerary Management & Persistence (Module 1 - Part 3 - Nishka Shah)
npm --prefix server run test:itinerary
```

Build frontend for production:
```powershell
npm run build:client
```

---

## 📡 API Endpoints

### 🩺 Health & Diagnostic
| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/health` | Server health & timestamp check | Active |

### ✈️ Trips Workspace (Module 1 — Nishka Shah)
| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/trips` | Get all trips with participant count | Active |
| `POST` | `/api/trips` | Create a new trip with validation & initial organizer | Active |
| `GET` | `/api/trips/:id` | Get single trip details with participants | Active |
| `PUT` | `/api/trips/:id` | Update trip metadata (name, destination, dates, description) | Active |
| `GET` | `/api/trips/invite/:inviteCode` | Fetch public preview of trip by invite code | Active |
| `POST` | `/api/trips/join` | Join a trip using an invite code | Active |

### 📅 Day-Wise Itinerary Management (Module 1 — Nishka Shah)
| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/trips/:id/itinerary` | Retrieve trip activities sorted chronologically | Active |
| `POST` | `/api/trips/:id/itinerary` | Add an activity to a specific day with boundary checks | Active |
| `PUT` | `/api/trips/:id/itinerary/:activityId` | Update an existing activity (title, date, time, location, notes) | Active |
| `DELETE` | `/api/trips/:id/itinerary/:activityId` | Remove an activity from the itinerary with MongoDB persistence | Active |

### 👥 Participant Management & Persistence (Module 2 — Heer Shah)
| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/trips/:id/participants` | Retrieve all participants and role breakdown counts | Active |
| `POST` | `/api/trips/:id/participants` | Add a participant with duplicate validation & MongoDB persistence | Active |
| `PUT` | `/api/trips/:id/participants/:participantId` | Update participant role (Organizer/Member) with persistence | Active |
| `DELETE` | `/api/trips/:id/participants/:participantId` | Remove participant from MongoDB subdocuments with integrity checks | Active |
| `POST` | `/api/trips/:id/invite` | Generate invitation code and record invited participant | Active |
