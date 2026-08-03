# CodeBoard — Full Production Deployment Guide (Vercel + Render)

This guide provides step-by-step instructions for hosting the **CodeBoard Frontend** on **Vercel** and the **Real-Time Collaboration & Auth Server** on **Render.com**.

---

## 🌐 Architecture Overview

```mermaid
graph TD
    subgraph "Vercel (Frontend Hosting)"
        A[Client Browser / User] -->|HTTPS : Live SPA App| B[CodeBoard React + Vite App<br/>Vercel CDN]
    end

    subgraph "Render.com (Backend Hosting)"
        B -->|REST API : /api/auth, /api/rooms| C[Express API Server<br/>https://syncspace-server.onrender.com]
        B -->|WebSocket WSS : Yjs Real-Time CRDT| D[Yjs WebSocket Server<br/>wss://syncspace-server.onrender.com/:roomId]
        B -->|Socket.IO WSS : Room Signaling & Chat| E[Socket.IO Server<br/>wss://syncspace-server.onrender.com/socket.io]
    end

    subgraph "Database Layer"
        C & D -->|Mongoose ORM| F[(MongoDB Atlas<br/>or Built-in JSON Fallback)]
    end
```

---

## 🚀 Part 1: Deploying the Backend (`Server`) to Render.com

Render.com supports Express REST APIs, Socket.IO, and Yjs WebSockets natively on a single HTTPS/WSS endpoint.

### Step 1: Push Your Code to GitHub
Ensure the `Server` folder is in a GitHub repository (either as its own repository or a subfolder in a monorepo).

### Step 2: Create a New Web Service on Render
1. Log in to [Render.com](https://render.com) and click **+ New** → **Web Service**.
2. Connect your GitHub repository containing the `Server` code.
3. Configure the following service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `codeboard-server` (or your preferred name) |
| **Region** | Choose the region closest to your users |
| **Branch** | `main` (or `master`) |
| **Root Directory** | Leave blank if standalone, or set to `Server` if in a monorepo |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free** (or Starter/Standard for production) |

### Step 3: Add Environment Variables in Render Dashboard
Go to the **Environment** tab in your Render Web Service settings and add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Optional: Render automatically binds to the correct port |
| `JWT_SECRET` | `your_secure_random_hex_string` | Secret key for signing user auth tokens |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster0.mongodb.net/codeboard?retryWrites=true&w=majority` | **Optional:** MongoDB Atlas URI. If omitted, the server gracefully uses built-in JSON file fallback storage. |

### Step 4: Deploy and Get Your Backend URL
1. Click **Create Web Service**.
2. Once deployed, Render will assign a live URL like:
   `https://codeboard-server.onrender.com`
3. **Test your server health check** by opening in your browser:
   `https://codeboard-server.onrender.com/health`
   You should see: `{"status":"Server is running","mongoConnected":true}` (or `false` if using fallback storage).

---

## ⚡ Part 2: Deploying the Frontend (`CodeBoard`) to Vercel

Vercel is optimized for React + Vite Single Page Applications (SPAs) and global edge CDN caching.

### Step 1: Check `vercel.json` SPA Configuration
We have already included a `vercel.json` file in the root of your `CodeBoard` directory. This is **critical** because it tells Vercel to rewrite all routes (`/dashboard`, `/room/:roomId`, `/create`, `/join`) to `/index.html` so users never get a `404 Not Found` error when refreshing the page:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Create a New Project on Vercel
1. Log in to [Vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository containing the `CodeBoard` folder.
3. Configure the Project Settings:
   * **Framework Preset:** `Vite` (Vercel automatically detects this).
   * **Root Directory:** Click *Edit* and select `CodeBoard` (if it is inside a parent workspace folder).
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`

### Step 3: Add Environment Variables in Vercel Dashboard
In the **Environment Variables** section before deploying, add:

| Variable Name | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://codeboard-server.onrender.com` | **Replace** with your actual Render URL from Part 1. Do **NOT** include a trailing `/`. |

### Step 4: Deploy
1. Click **Deploy**.
2. Vercel will build your React app (`vite build`) and deploy it globally in ~45 seconds.
3. Your app will be live at `https://your-app-name.vercel.app`!

---

## 🧪 Part 3: Post-Deployment Verification Checklist

Once both services are deployed, follow these steps to verify full functionality:

- [ ] **1. Test Landing Page & Anonymous Room Creation**
  - Go to your Vercel URL (`https://your-app-name.vercel.app`).
  - Click **New Room** → **Create & Launch Workspace**.
  - Confirm that you are redirected to `/room/XXX-XXXX-XXX` and that the Monaco Editor and Whiteboard load.

- [ ] **2. Test Real-Time Collaborative Sync across Devices**
  - Open the same Room URL in an Incognito window or on another computer/phone.
  - Type code in the editor — verify that changes appear instantly in the second browser window via WebSockets (`wss://codeboard-server.onrender.com`).
  - Draw on the Whiteboard — verify that strokes sync across both clients.

- [ ] **3. Test User Registration & Authentication**
  - Return to the Landing Page and click **Sign In**.
  - Switch to the **Create Account** tab and register a new user (`username`, `email`, `password`).
  - Confirm that you are signed in and that the **"My Dashboard"** badge appears in the navbar.

- [ ] **4. Test Registered User Dashboard (`/dashboard`)**
  - Click **My Dashboard** in the navbar.
  - Click **+ New Workspace**, name it (e.g., `Production Full-Stack Demo`), and click **Create & Launch**.
  - Return to `/dashboard` and click **Open Workspace →** to confirm one-click direct access without re-entering a room code.

---

## 💡 Troubleshooting & Notes

1. **Free Tier Cold Starts on Render:**
   * Render Free tier services spin down after 15 minutes of inactivity. When the first user opens CodeBoard after inactivity, the first API call or WebSocket connection may take **30–50 seconds** to wake up the server. Subsequent connections are instantaneous.
2. **CORS / Origin Policy:**
   * Our Express server (`server.js`) and Socket.IO configuration (`socketHandler.js`) are configured with `cors({ origin: "*" })`, meaning your Vercel domain is automatically permitted to connect without CORS errors.
3. **MongoDB Connection Warning in Logs:**
   * If you do not provide a `MONGO_URI`, your Render logs will show:  
     `⚠️ MongoDB not connected - switching to persistent JSON fallback store in server/data/.`  
     This is **normal** — the server will continue to run and persist all user accounts and workspaces reliably.
