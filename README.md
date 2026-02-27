# EmailScheduler — Professional Email Automation Platform

A production-ready, SaaS-style email scheduling web application built with **React + Tailwind CSS** (frontend) and **Node.js + Express** (backend).

## 📁 Project Structure

```
root/
├── client/                  # React (Vite) frontend
│   ├── src/
│   │   ├── components/      # Navbar, Hero, Dashboard, Scheduler, Contact, Footer
│   │   ├── context/         # ThemeContext (dark/light toggle)
│   │   ├── hooks/           # useCountUp, useInView
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Tailwind + custom animations
│   ├── index.html
│   ├── vite.config.js       # Vite config with API proxy
│   ├── tailwind.config.js
│   └── package.json
├── server/                  # Express API backend
│   ├── server.mjs           # Full API server
│   ├── .env                 # Environment variables (local)
│   ├── .env.example
│   └── package.json
├── agent/                   # (legacy) original agent code
├── package.json             # Root scripts (concurrently)
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Copy `server/.env.example` to `server/.env` and fill in your Gmail credentials:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

> **Gmail App Password**: Go to Google Account → Security → 2FA → App Passwords → Generate one for "Mail".

### 3. Run development servers

```bash
npm run dev
```

This starts both:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

The Vite dev server proxies `/api/*` requests to the backend automatically.

## 🔌 API Endpoints

| Method | Path                   | Description                       |
|--------|------------------------|-----------------------------------|
| POST   | `/api/send-email`      | Send email instantly              |
| POST   | `/api/schedule-emails` | Batch schedule emails             |
| GET    | `/api/stats`           | Dashboard analytics               |
| GET    | `/api/scheduled-emails`| List all scheduled email entries  |
| GET    | `/api/health`          | Health check                      |

### POST /api/send-email
```json
{
  "senderName": "John",
  "senderEmail": "john@gmail.com",
  "recipientName": "Jane",
  "recipientEmail": "jane@example.com",
  "subject": "Hello {{recipientName}}",
  "message": "Hi {{recipientName}}, this is {{senderName}}."
}
```

### POST /api/schedule-emails
```json
{
  "emails": [
    {
      "senderName": "John",
      "senderEmail": "john@gmail.com",
      "recipientName": "Jane",
      "recipientEmail": "jane@example.com",
      "subject": "Scheduled Report",
      "message": "Hello {{recipientName}}",
      "scheduledAt": "2026-03-01T09:00:00Z"
    }
  ]
}
```

## ⏰ How Scheduling Works

**Old approach (broken):**
- Used `CronJob` with `M H * * *` pattern → fires **daily** at that time, not once at a specific date
- `.txt` file only stored `HH:MM` with no date awareness
- Sent an immediate "test" email on every startup, bypassing scheduling entirely

**New approach (fixed):**
- Uses `setTimeout` with the exact millisecond delay calculated from `Date.now()` to the target datetime
- One-shot: fires exactly once at the scheduled time, then completes
- In-memory `Map` tracks status: `pending` → `scheduled` → `sent` / `failed`
- Fully non-blocking — does not hold up the Express event loop
- Validates that scheduled time is strictly in the future

## 🎨 Theme Toggle

Uses Tailwind's `darkMode: "class"` strategy. The `ThemeContext` provider:
1. Reads preference from `localStorage` (defaults to dark)
2. Toggles the `dark` class on `<html>`
3. Persists choice back to `localStorage`

## 📌 Placeholder Replacement

In subject and message body, these placeholders are replaced before sending:
- `{{senderName}}` → the sender's name
- `{{recipientName}}` → the recipient's name

## 🧪 Testing Checklist

| Test                          | Expected Result                       |
|-------------------------------|---------------------------------------|
| Send Now                      | Email delivered immediately            |
| Schedule 1 min future         | Email arrives exactly at scheduled time|
| Schedule 5 min future         | Email arrives exactly at scheduled time|
| Past time                     | Rejected with error message            |
| Empty fields                  | Validation error                       |
| Invalid email format          | Validation error                       |
| Add to List → Confirm         | Status changes: pending → scheduled    |

## 🌐 Deployment

### Frontend → Vercel

1. Connect the `client/` directory (or set root to `client`)
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Backend → Render / Railway

1. Connect the `server/` directory
2. Build command: `npm install`
3. Start command: `node server.mjs`
4. Environment variables:
   - `EMAIL_USER`, `EMAIL_PASS`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `PORT=5000`

## 📜 License

MIT
