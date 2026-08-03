import { Sun, Moon, Monitor } from "lucide-react";

function ThemeSettings({ isDark, setIsDark }) {
    const theme = isDark ? "dark" : "light";

    const applyTheme = (mode) => {
        if (mode === "dark") {
            setIsDark(true);
        } else if (mode === "light") {
            setIsDark(false);
        } else {
            // system
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setIsDark(prefersDark);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Theme</h3>

            <div className="flex flex-col gap-3">
                <button
                    onClick={() => applyTheme("light")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition ${
                        theme === "light"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                    <Sun size={18} className="text-slate-600 dark:text-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Light</span>
                    {theme === "light" && (
                        <span className="ml-auto text-xs text-blue-500">✓</span>
                    )}
                </button>

                <button
                    onClick={() => applyTheme("dark")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition ${
                        theme === "dark"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                    <Moon size={18} className="text-slate-600 dark:text-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Dark</span>
                    {theme === "dark" && (
                        <span className="ml-auto text-xs text-blue-500">✓</span>
                    )}
                </button>

                <button
                    onClick={() => applyTheme("system")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition ${
                        theme === "system"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                    <Monitor size={18} className="text-slate-600 dark:text-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">System</span>
                    {theme === "system" && (
                        <span className="ml-auto text-xs text-blue-500">✓</span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default ThemeSettings;