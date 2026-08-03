import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Copy, Check, ArrowRight, ChevronLeft, RefreshCw } from "lucide-react";

/** Generate a human-readable room code: XXX-XXXX-XXX */
function generateRoomCode() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous i/l/0/o/1
    const segment = (len) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

function CreateRoom() {
    const navigate = useNavigate();
    const [roomCode] = useState(generateRoomCode);
    const [username, setUsername] = useState(() => {
        const saved = window.localStorage.getItem("codeboard-username");
        return saved || "";
    });
    const [copied, setCopied] = useState(false);

    const roomUrl = `${window.location.origin}/room/${roomCode}`;

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(roomUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [roomUrl]);

    const handleEnter = (e) => {
        e.preventDefault();
        const name = username.trim() || `User-${Math.floor(1000 + Math.random() * 9000)}`;
        window.localStorage.setItem("codeboard-username", name);
        navigate(`/room/${roomCode}?username=${encodeURIComponent(name)}`);
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
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Code2 size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Create a Room</h1>
                            <p className="text-slate-400 text-sm">Share the code or URL to invite others</p>
                        </div>
                    </div>

                    {/* Room Code Display */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Your Room Code
                        </label>
                        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                            <span className="flex-1 font-mono text-2xl font-bold text-indigo-300 tracking-widest text-center select-all">
                                {roomCode}
                            </span>
                            <button
                                id="btn-copy-code"
                                type="button"
                                onClick={handleCopy}
                                title="Copy room URL"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-all duration-200"
                            >
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Shareable URL */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Shareable Link
                        </label>
                        <div
                            className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-slate-400 text-sm font-mono truncate cursor-pointer hover:bg-slate-800/60 transition-colors"
                            onClick={handleCopy}
                            title="Click to copy"
                        >
                            {roomUrl}
                        </div>
                    </div>

                    <div className="h-px bg-slate-800/60 mb-6" />

                    {/* Username form */}
                    <form onSubmit={handleEnter}>
                        <div className="mb-5">
                            <label htmlFor="create-username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Your Display Name
                            </label>
                            <input
                                id="create-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name (optional)"
                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            />
                        </div>
                        <button
                            id="btn-enter-room"
                            type="submit"
                            className="group w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-400/30 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Enter Room
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Share the room code or link — others can join without signing up.
                </p>
            </div>
        </div>
    );
}

export default CreateRoom;
