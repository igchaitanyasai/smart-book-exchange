# Smart Book Exchange

A complete full-stack web application built with React (Vite), Node.js, Express, and Supabase.
This project allows users to register, login, list books for sale, and request books from other users.

## Features

- **Authentication:** Secure user signup and login via Supabase Auth.
- **Authorization:** API routes protected by JWT verification. Only owners can edit/delete their listings.
- **Book Management:** Users can add books, view their own books, mark them as sold, and delete them.
- **Browse & Search:** Dynamic grid of available books with real-time title search.
- **Request System:** Users can request to buy a book and view their incoming/outgoing requests.
- **Premium UI:** Glassmorphism design, vibrant gradients, and smooth micro-animations.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Vanilla CSS, React Router, date-fns, Lucide React
- **Backend:** Node.js, Express.js, CORS, jsonwebtoken, Supabase JS Client
- **Database:** Supabase (PostgreSQL)

---

## 🚀 Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of the `schema.sql` file in the root of this repository.
4. Run the SQL query to create the `books` and `requests` tables.

### 2. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in the `.env` variables:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_SERVICE_KEY`: Your Supabase Service Role Key (Project Settings -> API). **Never share this key!**
5. Start the backend server:
   ```bash
   node server.js
   ```
   The server will run on `http://localhost:5000`.

### 3. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in the `.env` variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key.
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:5173`.

---

## 🌐 Deployment Guide

### Deploying the Backend (Render)

1. Create an account on [Render](https://render.com).
2. Create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add Environment Variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`).
8. Deploy!
*(Remember to update the frontend API URLs from `http://localhost:5000` to your new Render URL).*

### Deploying the Frontend (Vercel)

1. Create an account on [Vercel](https://vercel.com).
2. Create a new Project and import your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Framework Preset will automatically detect **Vite**.
5. Add Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
6. Deploy!
