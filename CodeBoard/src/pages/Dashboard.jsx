import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  Plus,
  Share2,
  Trash2,
  ExternalLink,
  User,
  LogOut,
  Users,
  Calendar,
  Check,
  Copy,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Lock,
  Unlock,
} from "lucide-react";
import {
  getSavedUser,
  getMyRooms,
  createSavedRoom,
  shareRoomWithUser,
  deleteSavedRoom,
  clearSession,
} from "../services/authService";

/** Generate a human-readable room code: XXX-XXXX-XXX */
function generateRoomCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const segment = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // ── Auth User State ────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => getSavedUser());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // ── Create Modal State ─────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomId, setNewRoomId] = useState(generateRoomCode);
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Share Modal State ──────────────────────────────────────────────────────
  const [shareModalRoom, setShareModalRoom] = useState(null);
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");
  const [sharing, setSharing] = useState(false);

  // ── Load Rooms on Mount ────────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRooms();
      setRooms(data);
    } catch (err) {
      setError("Could not fetch saved workspaces. Showing offline list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      // If not logged in, redirect to landing page
      navigate("/");
      return;
    }
    loadRooms();
  }, [user, navigate, loadRooms]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    clearSession();
    navigate("/");
  };

  const handleCopyLink = (roomId) => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(roomId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  /**
   * Direct opening of a particular room without typing any code!
   * Autofills the room ID and navigates directly to the workspace.
   */
  const handleOpenWorkspaceDirectly = (roomId) => {
    const username = user?.username || "Developer";
    navigate(`/room/${roomId}?username=${encodeURIComponent(username)}`);
  };

  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomId.trim()) {
      setError("Please provide a name and Room ID.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const created = await createSavedRoom({
        roomId: newRoomId.trim(),
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
      });
      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomDesc("");
      setNewRoomId(generateRoomCode());
      // Open immediately
      handleOpenWorkspaceDirectly(created.roomId);
    } catch (err) {
      setError(err.message || "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!collaboratorInput.trim() || !shareModalRoom) return;
    setSharing(true);
    setShareSuccess("");
    try {
      const res = await shareRoomWithUser(shareModalRoom.roomId, collaboratorInput.trim());
      setShareSuccess(res.message || "Access granted successfully!");
      setCollaboratorInput("");
      await loadRooms();
    } catch (err) {
      setError(err.message || "Failed to grant access.");
    } finally {
      setSharing(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await deleteSavedRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
    } catch (err) {
      alert(err.message || "Could not delete workspace.");
    }
  };

  // Filter rooms by search query
  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.roomId?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo & Direct Entry Link */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Code2 size={20} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  CodeBoard
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Dashboard
                  </span>
                </span>
                <span className="block text-xs text-slate-500 font-medium">Saved Workspaces & Access Control</span>
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setNewRoomId(generateRoomCode());
                setShowCreateModal(true);
                setError("");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} />
              New Workspace
            </button>

            {user && (
              <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-full pl-4 pr-1.5 py-1.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-800">{user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════ MAIN CONTENT ═══════════════════════ */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Top Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={13} />
              Registered User Dashboard
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
              Welcome back, {user?.username || "Developer"}
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              Manage your saved collaborative rooms, share access with teammates, or launch directly into code.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Error / Offline Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-xs font-bold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ════════════════ WORKSPACES LIST ════════════════ */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            Loading your workspaces...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-6">
              <FolderOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Saved Workspaces Yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 font-medium">
              Create a saved workspace to keep your code, whiteboards, and collaborator access permissions preserved forever.
            </p>
            <button
              type="button"
              onClick={() => {
                setNewRoomId(generateRoomCode());
                setShowCreateModal(true);
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create Your First Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const isOwner =
                (room.owner && room.owner.toLowerCase() === (user?.username || "").toLowerCase()) ||
                (room.ownerEmail && room.ownerEmail.toLowerCase() === (user?.email || "").toLowerCase());

              return (
                <div
                  key={room.roomId}
                  className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Role Badge & Copy Code */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                          isOwner
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isOwner ? "Owner" : "Collaborator"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(room.roomId)}
                        title="Copy shareable room URL"
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                      >
                        {room.roomId}
                        {copiedId === room.roomId ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    {/* Room Name */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6">
                      {room.description || "Collaborative real-time CRDT coding workspace."}
                    </p>

                    {/* Collaborator Stats */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
                      <Users size={14} className="text-slate-400" />
                      <span>
                        {room.collaborators?.length || 0} Collaborator(s) with Access
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShareModalRoom(room);
                          setShareSuccess("");
                          setCollaboratorInput("");
                        }}
                        title="Share / give access to user"
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.roomId)}
                          title="Delete saved room"
                          className="p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Direct Launch Button (Autofills Code) */}
                    <button
                      type="button"
                      onClick={() => handleOpenWorkspaceDirectly(room.roomId)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                      Open Workspace
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ═══════════════════════ CREATE WORKSPACE MODAL ═══════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors font-bold text-lg"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Create Saved Workspace</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              This room will be permanently saved to your account and dashboard.
            </p>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. React Component Library"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Room ID / Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewRoomId(generateRoomCode())}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    ↻ Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  placeholder="e.g. react-library-101"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-mono font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What are you building here?"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Launch →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════ SHARE WORKSPACE MODAL ═══════════════════════ */}
      {shareModalRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShareModalRoom(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors font-bold text-lg"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Give Access to Room
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Share "{shareModalRoom.name}" with a collaborator by their username or email. They will see it on their dashboard.
            </p>

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Collaborator Username or Email
                </label>
                <input
                  type="text"
                  value={collaboratorInput}
                  onChange={(e) => setCollaboratorInput(e.target.value)}
                  placeholder="e.g. alice@example.com or alice"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-semibold"
                  required
                  autoFocus
                />
              </div>

              {shareSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check size={14} />
                  {shareSuccess}
                </div>
              )}

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShareModalRoom(null)}
                  className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sharing}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {sharing ? "Granting..." : "Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
