import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Users, Zap, ArrowRight, Plus, LogIn } from "lucide-react";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full opacity-5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500 rounded-full opacity-5 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600 rounded-full opacity-[0.02] blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-4xl text-center">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Code2 size={24} className="text-white" />
                    </div>
                    <span className="text-3xl font-bold text-white tracking-tight">CodeBoard</span>
                </div>

                {/* Hero */}
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight">
                    Code Together,<br />
                    <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                        In Real Time
                    </span>
                </h1>
                <p className="text-lg text-slate-400 max-w-xl mx-auto mb-12">
                    A collaborative code editor with instant sync, multi-language support,
                    and shared whiteboards — no account needed.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-14">
                    {[
                        { icon: Zap, label: "Instant sync" },
                        { icon: Users, label: "Multi-user" },
                        { icon: Code2, label: "10+ languages" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm backdrop-blur-sm">
                            <Icon size={14} className="text-indigo-400" />
                            {label}
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        id="btn-create-room"
                        onClick={() => navigate("/create")}
                        className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-400/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} />
                        Create a Room
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        id="btn-join-room"
                        onClick={() => navigate("/join")}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/50 hover:border-slate-600/50 text-slate-200 font-semibold text-base transition-all duration-200 backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <LogIn size={20} />
                        Join a Room
                    </button>
                </div>
            </div>

            <p className="relative z-10 mt-16 text-slate-600 text-sm">
                No sign-up required — just create a room and share the link.
            </p>
        </div>
    );
}

export default Home;
