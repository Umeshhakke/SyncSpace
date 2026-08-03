import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui";
import {
    Share2,
    Settings,
    LogOut,
    Copy,
    Check,
    X,
    Sun,
    Moon,
    Monitor,
    ChevronDown,
} from "lucide-react";
import SettingsDrawer from "../settings/SettingsDrawer";
import { useWorkspace } from "../../context/WorkspaceContext";
import { getSavedUser } from "../../services/authService";
import socketService from "../../services/socketService";

/* =========================================================
   Collaborator Avatars
========================================================= */

function Collaborators({ users }) {
    const maxDisplay = 4;
    const displayed = users.slice(0, maxDisplay);
    const extra = users.length - maxDisplay;

    return (
        <div className="flex items-center -space-x-2">
            {displayed.map((user) => (
                <div
                    key={user.id}
                    title={user.name}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow"
                    style={{ backgroundColor: user.color }}
                >
                    {user.name[0]}
                </div>
            ))}
            {extra > 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-700">
                    +{extra}
                </div>
            )}
        </div>
    );
}

/* =========================================================
   Share Popover (unchanged)
========================================================= */

function SharePopover({ open, onClose, roomUrl }) {
    const [copied, setCopied] = useState(false);

    async function copyLink() {
        await navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!open) return null;

    return (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Share Board</h3>
                <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
                    <X size={16} />
                </button>
            </div>
            <p className="mb-2 text-xs text-slate-500">
                Anyone with this link can edit this board.
            </p>
            <div className="flex gap-1.5">
                <input
                    readOnly
                    value={roomUrl}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm"
                />
                <button
                    onClick={copyLink}
                    className="rounded-lg bg-blue-600 px-2.5 text-white hover:bg-blue-700"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>
            {copied && (
                <p className="mt-2 text-xs text-green-600">Link copied successfully.</p>
            )}
        </div>
    );
}

/* =========================================================
   Theme Switcher Dropdown
========================================================= */

function ThemeSwitcher({ darkMode, setDarkMode }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const getThemeLabel = () => {
        if (darkMode === true) return "Dark";
        if (darkMode === false) return "Light";
        return "System";
    };

    const applyTheme = (mode) => {
        setDarkMode(mode);
        setIsOpen(false);
    };

    useEffect(() => {
        function handleOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm hover:bg-slate-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                {darkMode === true ? (
                    <Moon size={15} />
                ) : darkMode === false ? (
                    <Sun size={15} />
                ) : (
                    <Monitor size={15} />
                )}
                <span className="text-xs font-medium">{getThemeLabel()}</span>
                <ChevronDown size={12} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-10 z-50 w-36 rounded-lg border border-slate-200 bg-white shadow-lg p-1">
                    <button
                        onClick={() => applyTheme(false)}
                        className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs ${
                            darkMode === false ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                        }`}
                    >
                        <Sun size={14} />
                        Light
                        {darkMode === false && <Check size={12} className="ml-auto" />}
                    </button>
                    <button
                        onClick={() => applyTheme(true)}
                        className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs ${
                            darkMode === true ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                        }`}
                    >
                        <Moon size={14} />
                        Dark
                        {darkMode === true && <Check size={12} className="ml-auto" />}
                    </button>
                    <button
                        onClick={() => applyTheme(null)}
                        className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs ${
                            darkMode === null ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                        }`}
                    >
                        <Monitor size={14} />
                        System
                        {darkMode === null && <Check size={12} className="ml-auto" />}
                    </button>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   Header
========================================================= */

function Header() {
    const navigate = useNavigate();
    const { participants, notifications, connectionStatus } = useWorkspace();

    const [darkMode, setDarkMode] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const shareRef = useRef(null);

    const roomUrl = `${window.location.origin}${window.location.pathname}`;

    const handleLeave = () => {
        socketService.leaveRoom();
        const user = getSavedUser();
        if (user) {
            navigate("/dashboard");
        } else {
            navigate("/");
        }
    };

    useEffect(() => {
        const isDark =
            darkMode === true ||
            (darkMode === null &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    useEffect(() => {
        function handleOutside(e) {
            if (shareRef.current && !shareRef.current.contains(e.target)) {
                setShareOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const users = participants.map((participant) => ({
        id: participant.clientId || participant.userId || participant.name,
        name: participant.username || participant.name,
        color: participant.color || "hsl(220, 80%, 60%)",
    }));

    return (
        <header className="relative h-14 rounded-xl border border-slate-200 bg-white px-4 shadow-sm flex items-center justify-between">
            {notifications.length > 0 && (
                <div className="absolute left-1/2 top-full z-10 flex -translate-x-1/2 gap-2 pt-3">
                    {notifications.map(({ id, message }) => (
                        <div
                            key={id}
                            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg"
                        >
                            {message}
                        </div>
                    ))}
                </div>
            )}
            {/* LEFT */}
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">CodeBoard</h1>
            </div>

            {/* CENTER */}
            <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                    {/* optional breadcrumbs/board name */}
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {connectionStatus || "Connecting"}
                </div>
                <Collaborators users={users} />
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {users.length} online
                </div>
 
                {/* Theme Switcher */}
                <ThemeSwitcher darkMode={darkMode} setDarkMode={setDarkMode} />

                {/* Share */}
                <div ref={shareRef} className="relative">
                    <Button
                        variant="secondary"
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                        onClick={() => setShareOpen(!shareOpen)}
                    >
                        <Share2 size={15} />
                        Share
                    </Button>
                    <SharePopover
                        open={shareOpen}
                        onClose={() => setShareOpen(false)}
                        roomUrl={roomUrl}
                    />
                </div>

                {/* Settings */}
                <Button
                    variant="secondary"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                    onClick={() => setSettingsOpen(true)}
                >
                    <Settings size={15} />
                    Settings
                </Button>

                {/* Leave */}
                <Button
                    variant="danger"
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                    onClick={handleLeave}
                >
                    <LogOut size={15} />
                    Leave
                </Button>
            </div>

            {/* Settings Drawer */}
            <SettingsDrawer
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                isDark={darkMode}
                setIsDark={setDarkMode}
            />
        </header>
    );
}

export default Header;
