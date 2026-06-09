<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GitScope: GitHub Profile Analyzer & Dashboard

> [!NOTE]
> **Google AI Studio Reference App (Model)**: You can view and interact with this application's AI Studio instance here: [https://ai.studio/apps/21641e99-45e6-4156-adc2-79486a597ec5](https://ai.studio/apps/21641e99-45e6-4156-adc2-79486a597ec5)

GitScope is a modern, responsive, and visually stunning web application that allows users to analyze GitHub profiles, visualize developer statistics, explore repository breakdowns, track activity streaks, and compare profiles side-by-side.

Built with a robust React frontend and an Express proxy server, GitScope integrates GitHub OAuth for higher rate limits and direct account sync.


---

## 🚀 Features

- **📊 Comprehensive Profile Stats**: Instantly query any GitHub user to view bio, followers/following, location, website, and total public repositories.
- **🍰 Language Breakdown Chart**: Visualize the user's primary languages with a custom, color-coded interactive Recharts pie chart.
- **📅 Activity Streak Calendar**: View contribution heatmaps directly inside the dashboard using an integrated GitHub Calendar component.
- **⭐ Top Repositories Card Grid**: Browse repositories sorted by star count, complete with forks, languages, and dynamic descriptions.
- **⚔️ Versus Mode (Comparison)**: Compare two GitHub profiles side-by-side with dynamic highlights showcasing who has more stars, repositories, or followers.
- **🌓 Dark Mode Support**: Sleek transition between Light and Dark mode using Tailwind CSS v4 variables.
- **📄 PDF Export**: Download a beautiful PDF report of any analyzed profile with a single click.
- **🔒 GitHub OAuth Login**: Secure login process to authenticate users, fetch personal stats, and bypass rate limits.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Exporting**: `html2canvas` & `jspdf`

### Backend
- **Server**: [Express.js](https://expressjs.com/) with TypeScript runner (`tsx`)
- **Session Handling**: `express-session` & `cookie-parser`
- **API Proxy**: Safe, server-to-server proxying of GitHub REST API requests

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A GitHub account (for OAuth/tokens)

### 1. Clone & Install Dependencies
Navigate to the project directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` (or `.env.local`) file in the root directory and define the following variables:

```env
# GitHub Personal Access Token (Optional, for higher rate-limiting on public requests)
GITHUB_TOKEN=your_personal_access_token_here

# GitHub OAuth Credentials (Required for Login functionality)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Session Secret (For express-session cookie encryption)
SESSION_SECRET=your_session_secret_here

# Gemini API Key (For future AI integrations / AI Studio deployment)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Development Server
Start the Express backend and the Vite dev server in middleware mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see GitScope in action!

---

## 🏗️ Production Build

To compile a highly optimized production bundle:
```bash
npm run build
```
This outputs all static assets to the `dist/` directory, which will be served automatically by Express when `NODE_ENV` is set to `production`.

---

## 📂 Project Structure

```
├── src/
│   ├── lib/
│   │   └── utils.ts         # Utility functions and language colors mapping
│   ├── App.tsx              # Main dashboard React application & Versus mode
│   ├── main.tsx             # React entry point
│   ├── types.ts             # TypeScript definitions for GitHub API data
│   └── index.css            # Custom fonts and Tailwind CSS configuration
├── server.ts                # Express backend (GitHub OAuth callback & API proxy)
├── package.json             # Dependencies and build scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 📖 API Reference

GitScope's Express backend acts as a session manager and proxy layer to securely fetch statistics from the GitHub API and manage user sessions.

### Authentication Endpoints
- **`GET /api/auth/github`**: Fetches the GitHub Client ID configuration and redirects the user to the GitHub OAuth authorize screen.
- **`GET /api/auth/callback`**: Handles the callback code from GitHub, retrieves the access token, fetches the user's profile, saves the session, and triggers a window closure event.
- **`GET /api/auth/me`**: Returns the session details of the currently authenticated user.
- **`POST /api/auth/logout`**: Destroys the active session and logs the user out.

### Proxy Endpoints
- **`GET /api/github/user/:username`**: Proxies the request to fetch details for a specific user (`/users/{username}`).
- **`GET /api/github/repos/:username`**: Fetches up to 100 repositories of a specific user (`/users/{username}/repos`), sorted by update time.
- **`GET /api/github/events/:username`**: Fetches the last 10 public events of a specific user (`/users/{username}/events/public`).

---

## 🔗 External References

Refer to the official documentation below for the APIs and libraries used:
- **[GitHub REST API Docs](https://docs.github.com/en/rest)**: Documentation for GitHub REST API v3.
- **[Vite 6 Configuration](https://vitejs.dev/)**: For Vite bundler options and environment variables.
- **[Tailwind CSS v4 Guide](https://tailwindcss.com/)**: For custom styles, utilities, and dark mode configuration.
- **[Google Gen AI JS SDK](https://github.com/google/generative-ai-js)**: Details on incorporating Gemini models with `@google/genai`.
- **[Recharts Documentation](https://recharts.org/)**: Configuration for the language breakdown charts.
- **[React GitHub Calendar](https://github.com/grubersjo/react-github-calendar)**: Component reference for drawing GitHub style contributions calendars.

