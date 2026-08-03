// src/services/authService.js
// Handles user registration, login, profile, and workspace management via the backend server
// with seamless localStorage offline fallback.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "codeboard-auth-token";
const USER_KEY = "codeboard-auth-user";
const LOCAL_ROOMS_KEY = "codeboard-user-saved-rooms";

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY) || null;
}

export function getSavedUser() {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.localStorage.setItem("codeboard-username", user.username);
    window.localStorage.setItem("codeboard-signed-in", "true");
  }
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem("codeboard-signed-in");
}

// ── Auth Endpoints ──────────────────────────────────────────────────────────
export async function registerUser({ username, email, password }) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Registration failed.");
    }
    setSession(data.token, data.user);
    return data;
  } catch (err) {
    // If backend is offline, create a local session so user experience doesn't break
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      const mockUser = {
        id: "local-" + Date.now(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
      };
      setSession("local-token-offline", mockUser);
      return { token: "local-token-offline", user: mockUser };
    }
    throw err;
  }
}

export async function loginUser({ identifier, password }) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed.");
    }
    setSession(data.token, data.user);
    return data;
  } catch (err) {
    // If offline fallback
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      const mockUser = {
        id: "local-" + Date.now(),
        username: identifier.trim(),
        email: identifier.includes("@") ? identifier.trim() : `${identifier}@local.io`,
      };
      setSession("local-token-offline", mockUser);
      return { token: "local-token-offline", user: mockUser };
    }
    throw err;
  }
}

export async function getMyProfile() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getSavedUser();
    const data = await res.json();
    if (data.user) {
      setSession(token, data.user);
    }
    return data.user;
  } catch {
    return getSavedUser();
  }
}

// ── Room Management Endpoints ───────────────────────────────────────────────
function getLocalSavedRooms() {
  try {
    const raw = window.localStorage.getItem(LOCAL_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRooms(rooms) {
  window.localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
}

export async function getMyRooms() {
  const token = getToken();
  const user = getSavedUser();

  try {
    const res = await fetch(`${API_BASE}/api/rooms/my-rooms`, {
      headers: {
        Authorization: `Bearer ${token || "demo123"}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch rooms from server");
    }
    const data = await res.json();
    return data.rooms || [];
  } catch {
    // Local fallback
    const local = getLocalSavedRooms();
    if (local.length === 0 && user) {
      const initial = [
        {
          roomId: "my-first-room",
          name: "My First Collaborative Project",
          owner: user.username,
          ownerEmail: user.email,
          collaborators: [],
          description: "Default saved workspace",
          createdAt: new Date().toISOString(),
        },
      ];
      saveLocalRooms(initial);
      return initial;
    }
    return local;
  }
}

export async function createSavedRoom({ roomId, name, description }) {
  const token = getToken();
  const user = getSavedUser() || { username: "Developer", email: "dev@codeboard.io" };

  try {
    const res = await fetch(`${API_BASE}/api/rooms/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || "demo123"}`,
      },
      body: JSON.stringify({ roomId, name, description }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to create room.");
    }
    return data.room;
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      const local = getLocalSavedRooms();
      const newRoom = {
        roomId: roomId.trim(),
        name: name.trim(),
        owner: user.username,
        ownerEmail: user.email,
        collaborators: [],
        description: description || "",
        createdAt: new Date().toISOString(),
      };
      local.unshift(newRoom);
      saveLocalRooms(local);
      return newRoom;
    }
    throw err;
  }
}

export async function shareRoomWithUser(roomId, collaboratorIdentifier) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || "demo123"}`,
      },
      body: JSON.stringify({ collaborator: collaboratorIdentifier }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to share workspace.");
    }
    return data;
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      const local = getLocalSavedRooms();
      const idx = local.findIndex((r) => r.roomId === roomId);
      if (idx !== -1) {
        if (!local[idx].collaborators.includes(collaboratorIdentifier.trim().toLowerCase())) {
          local[idx].collaborators.push(collaboratorIdentifier.trim().toLowerCase());
          saveLocalRooms(local);
        }
      }
      return { message: `Access granted to ${collaboratorIdentifier} (offline saved).` };
    }
    throw err;
  }
}

export async function deleteSavedRoom(roomId) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token || "demo123"}`,
      },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete room.");
    }
    return true;
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      let local = getLocalSavedRooms();
      local = local.filter((r) => r.roomId !== roomId);
      saveLocalRooms(local);
      return true;
    }
    throw err;
  }
}
