import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Code2, ArrowRight, ChevronLeft, Hash } from "lucide-react";

function JoinRoom() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [roomCode, setRoomCode] = useState(searchParams.get("room") || "");
    const [username, setUsername] = useState(() => {
        return window.localStorage.getItem("codeboard-username") || "";
    });
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const code = roomCode.trim().toLowerCase();
        if (!code) {
            setError("Please enter a room code or paste a room URL.");
            return;
        }

        // Support pasting a full URL — extract the room code from it
        let finalCode = code;
        try {
            const url = new URL(code);
            // e.g. http://localhost:5173/room/abc-1234-def
            const parts = url.pathname.split("/");
            const roomIdx = parts.indexOf("room");
            if (roomIdx !== -1 && parts[roomIdx + 1]) {
                finalCode = parts[roomIdx + 1];
            }
        } catch {
            // Not a URL, use as-is
        }

        const name = username.trim() || `User-${Math.floor(1000 + Math.random() * 9000)}`;
        window.localStorage.setItem("codeboard-username", name);
        navigate(`/room/${encodeURIComponent(finalCode)}?username=${encodeURIComponent(name)}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full opacity-5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500 rounded-full opacity-5 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Back */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back to home
                </button>

                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Hash size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Join a Room</h1>
                            <p className="text-slate-400 text-sm">Enter the room code or paste a link</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Room Code Input */}
                        <div className="mb-5">
                            <label htmlFor="join-room-code" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Room Code or URL
                            </label>
                            <input
                                id="join-room-code"
                                type="text"
                                value={roomCode}
                                onChange={(e) => {
                                    setRoomCode(e.target.value);
                                    setError("");
                                }}
                                placeholder="e.g. abc-1234-xyz or paste a link"
                                className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:ring-2 transition-all text-sm font-mono ${
                                    error
                                        ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20"
                                        : "border-slate-700/50 focus:border-violet-500/60 focus:ring-violet-500/20"
                                }`}
                                autoFocus
                            />
                            {error && (
                                <p className="mt-2 text-red-400 text-xs">{error}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div className="mb-6">
                            <label htmlFor="join-username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Your Display Name
                            </label>
                            <input
                                id="join-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name (optional)"
                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
                            />
                        </div>

                        <button
                            id="btn-join"
                            type="submit"
                            className="group w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-400/30 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Join Room
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
                        <p className="text-slate-500 text-sm">
                            Don&apos;t have a room?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/create")}
                                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                Create one
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JoinRoom;
