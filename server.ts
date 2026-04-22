import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    accessToken?: string;
    user?: any;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "gitsprite-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  const GITHUB_API_BASE = "https://api.github.com";

  // Helper for fetching from GitHub
  const fetchGitHub = async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitScope-App",
    };

    if (token) {
      headers.Authorization = `token ${token}`;
    } else if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, message: errorData.message || "GitHub API error" };
    }
    return response.json();
  };

  // Auth Routes
  app.get("/api/auth/github", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GitHub Client ID not configured" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      scope: "read:user repo",
      allow_signup: "true",
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get(["/api/auth/callback", "/api/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send("No code provided");

    try {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (tokenData.error) throw new Error(tokenData.error_description);

      const accessToken = tokenData.access_token;
      const userData = await fetchGitHub("/user", accessToken);

      req.session.accessToken = accessToken;
      req.session.user = userData;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. Closing...</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      res.status(500).send(`Auth error: ${error.message}`);
    }
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: req.session.user || null });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Proxy Routes
  app.get("/api/github/user/:username", async (req, res) => {
    try {
      const userData = await fetchGitHub(`/users/${req.params.username}`, req.session.accessToken);
      res.json(userData);
    } catch (error: any) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/github/repos/:username", async (req, res) => {
    try {
      const repos = await fetchGitHub(`/users/${req.params.username}/repos?per_page=100&sort=updated`, req.session.accessToken);
      res.json(repos);
    } catch (error: any) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/github/events/:username", async (req, res) => {
    try {
      const events = await fetchGitHub(`/users/${req.params.username}/events/public?per_page=10`, req.session.accessToken);
      res.json(events);
    } catch (error: any) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
