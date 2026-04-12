# 🏆 Grade Master 2.0

Grade Master 2.0 is a secure, real-time competition evaluation platform built for seamless judging and live results tracking. It allows administrators to set up scoring criteria, manage participants, and register judges. Judges can securely log in to score projects, while a live leaderboard calculates real-time standings.

---

## 🚀 Tech Stack

- **Frontend Framework:** Next.js (React)
- **Styling:** Tailwind CSS & Lucide React (Icons)
- **Backend & Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with Role-Based Redirection
- **Security:** PostgreSQL Row Level Security (RLS)

---

## 🛠️ Features

### 🔐 Advanced Authentication
- Dedicated login portal with role-based routing (Admins are sent to the management panel, Judges are sent to the scoring panel).
- Secure password-based authentication powered by Supabase.

### 🎛️ Admin Control Center
- **Criteria Management:** Add scoring categories and define their percentage weights.
- **Participant Registration:** Log competition booths, project titles, and team/student names.
- **Judge Management:** Register and authorize official event judges directly from the UI without touching the database dashboard.

### 🌟 Judge Panel
- Clean, focused interface for grading.
- Automatic constraint handling (scores are locked between 0 and 10).
- Instant, automated final weighted score calculations for each booth.

### 📊 Real-Time Leaderboard
- Live-updating competition podium.
- Fetches and averages all judge inputs dynamically to prevent bias.
- Beautifully stylized UI with visual trophy indicator cues for 1st, 2nd, and 3rd place.

---

## 🔒 Database & Security Setup

This application utilizes a custom relational PostgreSQL schema on Supabase. To prevent unauthorized score tampering or data breaches, **Row Level Security (RLS)** is active on all tables with strict policies:
- **Profiles:** Users can only view their own accounts; Admins manage all.
- **Criteria & Participants:** Publicly readable but strictly writable only by Admins.
- **Scores:** Publicly readable (for the leaderboard) but writable exclusively by authenticated Judges.

---

## ⚙️ How to Run Locally

1. **Clone or download the repository.**
2. **Install dependencies:**
   ```bash
   npm install