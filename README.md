# TaskFlow – MERN Task Manager

A full-stack task manager where users register, log in, and manage their own tasks.

## Features
- User registration and login with JWT authentication and bcrypt password hashing
- Add, complete, and delete tasks (full CRUD REST API)
- Each user can only see and change their own tasks
- React frontend that talks to an Express + MongoDB backend

## Tech Stack
React.js (Vite), Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs

## Run Locally
1. Install Node.js and MongoDB (or use a free MongoDB Atlas connection string).
2. Backend:
   ```
   cd server
   npm install
   cp .env.example .env     # then edit MONGO_URI and JWT_SECRET
   npm run dev
   ```
3. Frontend (new terminal):
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open the URL shown by Vite (usually http://localhost:5173).

## API Endpoints
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Create an account |
| POST | /api/auth/login | Log in, returns a JWT |
| GET | /api/tasks | Get your tasks |
| POST | /api/tasks | Add a task |
| PUT | /api/tasks/:id | Update title or done status |
| DELETE | /api/tasks/:id | Delete a task |
