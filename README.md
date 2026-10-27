# TripMate 🌍

A clean, responsive, beginner-friendly MERN-stack web application designed for university semester evaluation that helps users plan and organize trips in one place.

---

## 👥 Team Responsibilities

- **Nishka Shah — Module 1 (Active)**
  - Repository Setup & Architecture
  - Trip Creation, Viewing, Editing, and Deletion
  - Curated Destination Exploration
  - Day-wise Itinerary Planning
- **Heer Shah — Module 2 (Future Work)**
  - Participant Management
  - Expense Splitting
  - Budget Summaries

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
│   │   ├── pages/               # Route pages (Dashboard, CreateTrip, etc.)
│   │   ├── services/            # Native fetch API wrappers
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express backend & MongoDB
│   ├── src/
│   │   ├── config/              # MongoDB connection
│   │   ├── controllers/         # Request handlers
│   │   ├── middlewares/         # Centralized error handler
│   │   ├── models/              # Mongoose schemas (Trip)
│   │   ├── routes/              # Express API routes
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # HTTP server entrypoint
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

Run backend tests:
```powershell
# Test MongoDB connection & server health
npm --prefix server run test:conn

# Test Trip Creation API & MongoDB persistence
npm --prefix server run test:trip
```

Build frontend for production:
```powershell
npm run build:client
```

---

## 📡 API Endpoints (Current Implementation)

| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/health` | Server health check | Active |
| `POST` | `/api/trips` | Create a new trip with validation | Active |
