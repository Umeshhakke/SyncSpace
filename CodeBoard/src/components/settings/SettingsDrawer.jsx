import { X } from "lucide-react";
import ThemeSettings from "./ThemeSettings";
import WorkspaceSettings from "./WorkspaceSettings";
import PermissionsSettings from "./PermissionSettings";

function SettingsDrawer({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                        <X size={18} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>

                <div className="space-y-8 divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="pt-4 first:pt-0">
                        <ThemeSettings />
                    </div>
                    <div className="pt-4">
                        <WorkspaceSettings />
                    </div>
                    <div className="pt-4">
                        <PermissionsSettings />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsDrawer;