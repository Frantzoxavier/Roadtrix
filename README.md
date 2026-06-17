# RoadTrix — Transportation Operations Platform

A full-stack logistics SaaS MVP for internal dispatch operations. Dispatchers assign loads, drivers accept and complete them via mobile app, and admins monitor everything in real-time.

---

## Architecture

```
roadtrix/
├── backend/          Node.js + Express + Prisma + PostgreSQL + Socket.IO
├── admin-dashboard/  Next.js 14 + TailwindCSS + TanStack Query
├── mobile-app/       Expo (React Native) + Zustand
└── shared/           Shared TypeScript types
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)

---

### 1. Backend

```bash
cd backend
npm install

# Copy and configure env
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET in .env

# Run migrations and seed
npx prisma migrate dev --name init
npx prisma db seed

# Start dev server
npm run dev
```

Backend runs on **http://localhost:4000**

---

### 2. Admin Dashboard

```bash
cd admin-dashboard
npm install

cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

npm run dev
```

Dashboard runs on **http://localhost:3000**

**Demo logins:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@roadtrix.com | Admin@123 |
| Dispatcher | dispatcher@roadtrix.com | Dispatch@123 |

---

### 3. Mobile App

```bash
cd mobile-app
npm install

cp .env.example .env
# EXPO_PUBLIC_API_URL=http://<your-local-ip>:4000
# (use your machine's LAN IP, not localhost, for physical devices)

npx expo start
```

**Demo driver login:**
- Email: `james.rodriguez@roadtrix.com`
- Password: `Driver@123`

> 10 driver accounts are seeded. All use password `Driver@123`.

---

## Features

### Admin Dashboard
- **Dashboard** — Live KPIs: revenue, profit, active loads, driver fleet
- **Loads** — Create, assign, track loads through full lifecycle
- **Drivers** — Manage driver profiles, status, vehicle info
- **Dispatch Board** — Real-time view of drivers on trip and open loads
- **Payments** — Track and process driver payouts
- **Analytics** — Revenue/profit charts, top driver leaderboard

### Mobile App (Driver)
- Login with driver credentials
- Toggle availability status
- View assigned and upcoming loads
- Accept or decline load assignments
- Live trip navigation (Google Maps)
- Step-by-step delivery flow
- Proof of delivery with camera/photo upload

### Backend API
- JWT authentication with role-based access (ADMIN / DISPATCHER / DRIVER)
- Full load lifecycle management
- Real-time location tracking via Socket.IO
- Automatic payment creation on delivery
- Analytics with growth metrics

---

## Load Status Flow

```
OPEN → ASSIGNED → ACCEPTED → EN_ROUTE_PICKUP → PICKED_UP → EN_ROUTE_DELIVERY → DELIVERED → COMPLETED
                                                                                          ↘ CANCELLED
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Realtime | Socket.IO |
| Admin UI | Next.js 14, TailwindCSS, TanStack Query, Chart.js |
| Mobile | Expo 50, React Native, Zustand, React Navigation |
| Auth | JWT (access tokens), bcryptjs |
| Maps | react-native-maps (Google Maps) |
| File Upload | Multer (proof of delivery images) |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Any | Current user |
| GET | /api/drivers | Admin/Disp | List drivers |
| POST | /api/drivers | Admin/Disp | Create driver |
| GET | /api/drivers/me | Driver | Own profile |
| GET | /api/loads | Any | List loads |
| POST | /api/loads | Admin/Disp | Create load |
| POST | /api/loads/:id/assign | Admin/Disp | Assign driver |
| POST | /api/loads/:id/accept | Driver | Accept load |
| POST | /api/loads/:id/deliver | Driver | Submit POD |
| GET | /api/analytics | Admin/Disp | Analytics data |
| GET | /api/payments | Admin/Disp | List payments |
| PATCH | /api/payments/:id/process | Admin/Disp | Mark paid |

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/roadtrix
JWT_SECRET=your-super-secret-key
PORT=4000
UPLOAD_DIR=./uploads
```

### Admin Dashboard (`admin-dashboard/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Mobile App (`mobile-app/.env`)
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```
