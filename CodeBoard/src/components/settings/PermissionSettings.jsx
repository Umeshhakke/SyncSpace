import { useState } from "react";

function PermissionsSettings() {
    const [permission, setPermission] = useState("edit"); // "view" | "edit" | "admin"

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Permissions</h3>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Anyone with the link</span>
                    <select
                        value={permission}
                        onChange={(e) => setPermission(e.target.value)}
                        className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded px-2 py-1 text-sm"
                    >
                        <option value="view">Can view</option>
                        <option value="edit">Can edit</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Allow downloading</span>
                    <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Allow copying</span>
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-600 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white dark:bg-slate-300 rounded-full absolute top-0.5 left-0.5 shadow"></div>
                    </div>
                </div>

                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                    These permissions apply to all members of this workspace.
                </div>
            </div>
        </div>
    );
}

export default PermissionsSettings;