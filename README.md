# Invoice Management System

**Developed by [Akihitori](https://github.com/akihitori)** _B.Tech Computer Science & Engineering | JG University_

A full-stack invoice management application built with a focus on security, modern UI, and efficient data handling.

## Tech Stack

- **Backend:** C# .NET 8 Web API
- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion
- **Database:** PostgreSQL
- **Security:** JWT Authentication with Password Salting & Hashing (HMACSHA512)

## Key Features

- **Secure Authentication:** Full Register and Login flow with JWT token-based authorization.
- **Protected Routes:** Dashboard and Invoice data are restricted to authenticated users only.
- **Dynamic Dashboard:** Three-column layout featuring active, completed, and deleted invoice management.
- **Interactive UI:** Smooth transitions and modals powered by Framer Motion.

## Setup & Installation

1. **Backend:**
   - Update `appsettings.json` with your PostgreSQL connection string.
   - Set a secure `Token` in `AppSettings`.
   - Run `dotnet watch run`.

2. **Frontend:**
   - Navigate to `/frontend`.
   - Run `npm install` and `npm run dev`.

## Security Highlights

- Passwords are never stored in plain text; they are hashed with a unique salt per user.
- Emails are normalized to lowercase and trimmed to prevent duplicate account issues.
- API endpoints are protected using `[Authorize]` attributes in .NET.
