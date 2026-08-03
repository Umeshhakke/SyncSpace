import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Code2,
    Users,
    Zap,
    ArrowRight,
    Plus,
    LogIn,
    Sparkles,
    ShieldCheck,
    Terminal,
    Layout,
    Share2,
    Check,
    Copy,
    User,
    LogOut,
    Lock,
    LayoutDashboard
} from "lucide-react";
import { registerUser, loginUser, getSavedUser, clearSession } from "../services/authService";

/** Generate a human-readable room code: XXX-XXXX-XXX */
function generateRoomCode() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    const segment = (len) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

export default function LandingPage() {
    const navigate = useNavigate();

    // ── Sign-in & user state ──────────────────────────────────────────────────
    const [username, setUsername] = useState(() => {
        const saved = getSavedUser();
        return saved?.username || window.localStorage.getItem("codeboard-username") || "";
    });
    const [isSignedIn, setIsSignedIn] = useState(() => {
        return !!getSavedUser() || window.localStorage.getItem("codeboard-signed-in") === "true";
    });
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [authTab, setAuthTab] = useState("signin"); // "signin" | "register"
    const [modalName, setModalName] = useState(username || "");
    const [modalEmail, setModalEmail] = useState("");
    const [modalPassword, setModalPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // ── Room workspace form state ─────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("create"); // "create" | "join"
    const [customRoomId, setCustomRoomId] = useState(generateRoomCode);
    const [joinRoomId, setJoinRoomId] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // Save username & auth status via Backend/Service
    const handleSignIn = async (e) => {
        e.preventDefault();
        setError("");
        setAuthLoading(true);

        try {
            if (authTab === "register") {
                if (!modalName.trim() || !modalEmail.trim() || !modalPassword) {
                    setError("Please complete all registration fields.");
                    setAuthLoading(false);
                    return;
                }
                const res = await registerUser({
                    username: modalName.trim(),
                    email: modalEmail.trim(),
                    password: modalPassword,
                });
                setUsername(res.user.username);
                setIsSignedIn(true);
                setShowSignInModal(false);
            } else {
                const identifier = (modalEmail || modalName).trim();
                if (!identifier || !modalPassword) {
                    setError("Please provide username/email and password.");
                    setAuthLoading(false);
                    return;
                }
                const res = await loginUser({
                    identifier,
                    password: modalPassword,
                });
                setUsername(res.user.username);
                setIsSignedIn(true);
                setShowSignInModal(false);
            }
        } catch (err) {
            setError(err.message || "Authentication failed.");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignOut = () => {
        clearSession();
        setIsSignedIn(false);
        setUsername("");
    };

    // ── Copy room code helper ─────────────────────────────────────────────────
    const handleCopyCode = useCallback((code) => {
        const url = `${window.location.origin}/room/${code}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, []);

    // ── Launch workspace ──────────────────────────────────────────────────────
    const handleLaunchWorkspace = (e) => {
        e.preventDefault();
        setError("");

        const nameToUse = username.trim() || `Developer-${Math.floor(1000 + Math.random() * 9000)}`;
        window.localStorage.setItem("codeboard-username", nameToUse);
        setUsername(nameToUse);

        if (activeTab === "create") {
            const roomToCreate = customRoomId.trim() || generateRoomCode();
            navigate(`/room/${roomToCreate}?username=${encodeURIComponent(nameToUse)}`);
        } else {
            const targetRoom = joinRoomId.trim();
            if (!targetRoom) {
                setError("Please enter a valid Room ID to join.");
                return;
            }
            navigate(`/room/${targetRoom}?username=${encodeURIComponent(nameToUse)}`);
        }
    };

    const scrollToWorkspace = () => {
        document.getElementById("workspace-card")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900 relative">
            
            {/* Soft Light-mode Ambient Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-indigo-500/10 rounded-full blur-[140px]" />
                <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] bg-blue-500/10 rounded-full blur-[160px]" />
                <div className="absolute -bottom-40 left-1/4 w-[750px] h-[750px] bg-violet-500/10 rounded-full blur-[180px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
            <nav className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl sticky top-0 shadow-xs">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <Code2 size={22} className="text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                                CodeBoard
                                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Live
                                </span>
                            </span>
                            <span className="block text-xs text-slate-500 font-medium">CRDT Collaborative IDE</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <a href="#workspace-card" className="hover:text-indigo-600 transition-colors">Workspace</a>
                        <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
                        <a href="#runtimes" className="hover:text-indigo-600 transition-colors">Supported Languages</a>
                    </div>

                    {/* Sign-In & CTA Area */}
                    <div className="flex items-center gap-3">
                        {isSignedIn && username ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate("/dashboard")}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-sm font-bold shadow-xs transition-all"
                                >
                                    <LayoutDashboard size={15} />
                                    My Dashboard
                                </button>
                                <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-full pl-4 pr-1.5 py-1.5 shadow-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-sm font-semibold text-slate-800">{username}</span>
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
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setModalName(username || "");
                                    setShowSignInModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold transition-all shadow-xs hover:border-slate-300"
                            >
                                <User size={16} className="text-indigo-600" />
                                Sign In
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={scrollToWorkspace}
                            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════ HERO & WORKSPACE LAUNCHER ═══════════════════════ */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24">
                <div className="max-w-5xl mx-auto text-center mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-xs">
                        <Sparkles size={14} className="text-indigo-600" />
                        Zero Server Lag • CRDT Synchronized • 10+ Languages
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        Collaborate. Code.<br />
                        <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                            Create in Real Time.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                        Bring your team into a shared cloud IDE with instant VS Code editing, multi-language code execution, and an interactive whiteboard.
                    </p>

                    {/* Live Indicator */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium shadow-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Yjs CRDT Engine Online & Ready for Instant Synchronization</span>
                    </div>
                </div>

                {/* ════════════════ WORKSPACE CARD ════════════════ */}
                <div id="workspace-card" className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/90 relative">
                    {/* Card Top Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { setActiveTab("create"); setError(""); }}
                                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    activeTab === "create"
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <Plus size={16} />
                                New Room
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab("join"); setError(""); }}
                                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    activeTab === "join"
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <LogIn size={16} />
                                Join Existing Room
                            </button>
                        </div>

                        {isSignedIn && (
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold">
                                <ShieldCheck size={14} />
                                Signed in
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLaunchWorkspace} className="space-y-5">
                        {/* 1. Display Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                Your Display Name
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. Alice Cooper"
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* 2. Room ID / Code */}
                        {activeTab === "create" ? (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Temporary Room ID
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setCustomRoomId(generateRoomCode())}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                                    >
                                        ↻ Generate Random Code
                                    </button>
                                </div>
                                <div className="relative">
                                    <Terminal size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={customRoomId}
                                        onChange={(e) => setCustomRoomId(e.target.value)}
                                        placeholder="e.g. project-alpha"
                                        className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-mono font-medium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCopyCode(customRoomId)}
                                        title="Copy shareable link"
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors p-1"
                                    >
                                        {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                    <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                                    A secure temporary workspace will be created instantly. You can give access to anyone by sharing the link.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Room ID or Code
                                </label>
                                <div className="relative">
                                    <Share2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={joinRoomId}
                                        onChange={(e) => setJoinRoomId(e.target.value)}
                                        placeholder="e.g. abc-defg-hij"
                                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-mono font-medium"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 font-medium">
                                    Enter the Room ID shared by your teammate to sync with their editor.
                                </p>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-base shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group"
                        >
                            {activeTab === "create" ? "Create & Launch Workspace" : "Join Workspace"}
                        </button>
                    </form>

                    {/* Sign in prompt for anonymous users */}
                    {!isSignedIn && (
                        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setModalName(username || "");
                                    setShowSignInModal(true);
                                }}
                                className="text-xs text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 font-semibold"
                            >
                                <Lock size={13} className="text-slate-400" />
                                Want to preserve your room across sessions? <span className="underline text-indigo-600 font-bold">Sign in →</span>
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* ═══════════════════════ FEATURES GRID ═══════════════════════ */}
            <section id="features" className="relative z-10 py-24 px-6 border-t border-slate-200/80 bg-slate-50/70">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 block">
                            Built for Teams & Classrooms
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                            Everything You Need to Build Together
                        </h2>
                        <p className="text-slate-600 text-base font-medium">
                            No setup, no server lag, no overwritten files. Engineered from the ground up with CRDT technology.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1 */}
                        <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <Layout size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Collaborative Whiteboard</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-normal">
                                Draw shapes, system diagrams, and architectural flows together on a synchronized canvas alongside your code.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Code2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Code Editor</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-normal">
                                Write and edit code in real time with a powerful Monaco-based VS Code environment, syntax highlighting, and tabs.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-violet-400 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">CRDT Real-Time Sync</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-normal">
                                Mathematical Yjs synchronization guarantees convergence. Multiple teammates can edit different lines simultaneously without overwriting.
                            </p>
                        </div>

                        {/* Card 4 */}
                        <div className="p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Peer Presence</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-normal">
                                See who is actively editing, track colored user cursors, and share temporary room links with zero account friction.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
            <section id="how-it-works" className="relative z-10 py-24 px-6 border-t border-slate-200 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
                            Simple 3-Step Workflow
                        </span>
                        <h2 className="text-3xl font-extrabold text-slate-900">
                            From Zero to Collaborative Coding in Seconds
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Step 1 */}
                        <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200 text-center relative shadow-xs">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-indigo-600/20">
                                1
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Create a Room</h3>
                            <p className="text-sm text-slate-600">
                                Enter your display name and generate a unique room ID right on this page. No passwords or databases required.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200 text-center relative shadow-xs">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-indigo-600/20">
                                2
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Share the Link</h3>
                            <p className="text-sm text-slate-600">
                                Send the room URL to teammates, interviewees, or students. They join instantly by clicking the link.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200 text-center relative shadow-xs">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-indigo-600/20">
                                3
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Code & Execute</h3>
                            <p className="text-sm text-slate-600">
                                Write code in 10+ languages, test with Pyodide Wasm or Wandbox cloud compilers, and sketch diagrams on the whiteboard.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ SUPPORTED LANGUAGES ═══════════════════════ */}
            <section id="runtimes" className="relative z-10 py-20 px-6 border-t border-slate-200 bg-slate-50/60">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Supported Execution Runtimes</h2>
                    <p className="text-slate-600 text-sm max-w-xl mx-auto mb-10 font-medium">
                        Run scripts directly inside your browser or via cloud compilers without leaving the editor.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { name: "JavaScript", badge: "Browser Native (0ms)" },
                            { name: "TypeScript", badge: "Instant Type-Strip" },
                            { name: "Python 3.11", badge: "Pyodide Wasm" },
                            { name: "Java", badge: "Wandbox API" },
                            { name: "C++ 17", badge: "Wandbox API" },
                            { name: "HTML5 & CSS3", badge: "Sandboxed Preview" },
                            { name: "Markdown", badge: "Rich HTML Render" },
                            { name: "JSON", badge: "Validator & Formatter" }
                        ].map((lang) => (
                            <div key={lang.name} className="px-5 py-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
                                <span className="font-bold text-sm text-slate-800">{lang.name}</span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {lang.badge}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ BOTTOM CTA ═══════════════════════ */}
            <section className="relative z-10 py-24 px-6 border-t border-slate-200 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
                        Ready to Build Together?
                    </h2>
                    <p className="text-slate-600 text-base mb-8 max-w-xl mx-auto font-medium">
                        Create your workspace now and invite your teammates in seconds.
                    </p>
                    <button
                        type="button"
                        onClick={scrollToWorkspace}
                        className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                    >
                        Launch Your First Room
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ═══════════════════════ FOOTER ═══════════════════════ */}
            <footer className="relative z-10 border-t border-slate-200 py-12 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
                            <Code2 size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight">CodeBoard</span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                        © {new Date().getFullYear()} CodeBoard. Real-time collaborative code editor & whiteboard.
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-600 font-semibold">
                        <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">Documentation</a>
                        <a href="#runtimes" className="hover:text-indigo-600 transition-colors">Languages</a>
                    </div>
                </div>
            </footer>

            {/* ═══════════════════════ SIGN-IN MODAL (LIGHT MODE) ═══════════════════════ */}
            {showSignInModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setShowSignInModal(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors font-bold text-lg"
                        >
                            ✕
                        </button>

                        {/* Modal Header & Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setAuthTab("signin"); setError(""); }}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                        authTab === "signin"
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthTab("register"); setError(""); }}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                        authTab === "register"
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    {authTab === "register" ? "Display Name / Username" : "Username or Email"}
                                </label>
                                <input
                                    type="text"
                                    value={modalName}
                                    onChange={(e) => setModalName(e.target.value)}
                                    placeholder={authTab === "register" ? "e.g. AliceCooper" : "e.g. alice@example.com"}
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-semibold"
                                    required
                                    autoFocus
                                />
                            </div>

                            {authTab === "register" && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={modalEmail}
                                        onChange={(e) => setModalEmail(e.target.value)}
                                        placeholder="alice@example.com"
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={modalPassword}
                                    onChange={(e) => setModalPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSignInModal(false)}
                                    className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                                >
                                    {authLoading ? "Please wait..." : authTab === "register" ? "Register & Enter →" : "Sign In →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
