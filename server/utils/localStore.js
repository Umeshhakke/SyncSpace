// server/utils/localStore.js
// Fallback JSON-based local store when MongoDB is not running locally, ensuring zero errors.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(ROOMS_FILE)) {
    // Initialize with a default sample room so new users have a demo room ready
    const demoRooms = [
      {
        roomId: "demo-room-101",
        name: "Welcome Demo Workspace",
        owner: "demo",
        ownerEmail: "demo@codeboard.io",
        collaborators: [],
        description: "Starter collaborative workspace",
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(demoRooms, null, 2), "utf-8");
  }
}

function readJson(file) {
  ensureFiles();
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = {
  // --- USERS ---
  getUsers: () => readJson(USERS_FILE),
  findUserByEmailOrUsername: (identifier) => {
    const users = readJson(USERS_FILE);
    const lower = identifier.toLowerCase();
    return users.find(
      (u) =>
        u.email.toLowerCase() === lower ||
        u.username.toLowerCase() === lower
    );
  },
  createUser: async ({ username, email, password }) => {
    const users = readJson(USERS_FILE);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeJson(USERS_FILE, users);
    return newUser;
  },

  // --- ROOMS ---
  getRooms: () => readJson(ROOMS_FILE),
  findRoomById: (roomId) => {
    const rooms = readJson(ROOMS_FILE);
    return rooms.find((r) => r.roomId === roomId);
  },
  findRoomsByUser: (username, email) => {
    const rooms = readJson(ROOMS_FILE);
    const lowerUser = (username || "").toLowerCase();
    const lowerEmail = (email || "").toLowerCase();

    return rooms.filter((r) => {
      const isOwner =
        (r.owner && r.owner.toLowerCase() === lowerUser) ||
        (r.ownerEmail && r.ownerEmail.toLowerCase() === lowerEmail);
      const isCollab =
        Array.isArray(r.collaborators) &&
        r.collaborators.some(
          (c) =>
            c.toLowerCase() === lowerUser || c.toLowerCase() === lowerEmail
        );
      return isOwner || isCollab;
    });
  },
  createRoom: ({ roomId, name, owner, ownerEmail, description }) => {
    const rooms = readJson(ROOMS_FILE);
    const newRoom = {
      roomId: roomId.trim(),
      name: name.trim(),
      owner: owner.trim(),
      ownerEmail: (ownerEmail || "").trim().toLowerCase(),
      collaborators: [],
      description: description || "",
      createdAt: new Date().toISOString(),
    };
    rooms.push(newRoom);
    writeJson(ROOMS_FILE, rooms);
    return newRoom;
  },
  addCollaborator: (roomId, collaboratorIdentifier) => {
    const rooms = readJson(ROOMS_FILE);
    const idx = rooms.findIndex((r) => r.roomId === roomId);
    if (idx === -1) return null;

    const lower = collaboratorIdentifier.trim().toLowerCase();
    if (!rooms[idx].collaborators.includes(lower)) {
      rooms[idx].collaborators.push(lower);
      writeJson(ROOMS_FILE, rooms);
    }
    return rooms[idx];
  },
  deleteRoom: (roomId, username) => {
    let rooms = readJson(ROOMS_FILE);
    const initialLen = rooms.length;
    rooms = rooms.filter(
      (r) =>
        !(
          r.roomId === roomId &&
          r.owner &&
          r.owner.toLowerCase() === (username || "").toLowerCase()
        )
    );
    writeJson(ROOMS_FILE, rooms);
    return rooms.length < initialLen;
  },
};
