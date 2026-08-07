# ChatApp

A real-time chat application with direct messages, public/private/protected group chats, and live presence — built with Angular, Express, Socket.IO, and PostgreSQL (via Prisma).

## Features

- Email/password authentication, plus Google and Facebook OAuth login
- Direct messages, public groups, private groups, and password-protected groups
- Real-time messaging via Socket.IO
- Live presence (online/offline status) and live user list updates
- Emoji picker for messages
- Group management (add/remove members, delete group, leave group)

## Tech stack

- **Frontend:** Angular, Angular Material, RxJS, Signals
- **Backend:** Node.js, Express, Passport.js, Socket.IO
- **Database:** PostgreSQL, Prisma ORM

## Prerequisites

- Node.js (v18 or later recommended)
- npm
- PostgreSQL 

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd ChatApp
```

### 2. Backend setup

```bash
cd chat-app-backend
npm install
```

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

See [Environment variables](#environment-variables) below for details on each value.

Run database migrations:

```bash
npx prisma migrate dev
```

Start the backend dev server:

```bash
npm run start
```

The backend runs at `http://localhost:3000` by default.

### 3. Frontend setup

```bash
cd chat-app
npm install
npm start
```

The frontend runs at `http://localhost:4200` by default.

## Environment variables

The backend requires a `.env` file in `chat-app-backend/`. See `.env.example` for the full list. Summary:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret used to sign session |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Enables Google login when both are set. |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | No | Enables Facebook login when both are set. |

> Google and Facebook login are optional — the app runs normally with just email/password login if OAuth credentials aren't provided.