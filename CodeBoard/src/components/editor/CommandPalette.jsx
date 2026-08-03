import { useMemo } from "react";

function CommandPalette({ open, query, onClose, onQueryChange, commands }) {
    const filtered = useMemo(() => {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) {
            return commands;
        }

        return commands.filter((command) =>
            command.label.toLowerCase().includes(lowerQuery)
        );
    }, [commands, query]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
                <div className="border-b border-slate-700 px-4 py-3">
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                onClose();
                            }
                        }}
                        placeholder="Type a command..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
                    />
                </div>

                <div className="max-h-96 overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500">
                            No matching commands.
                        </div>
                    ) : (
                        filtered.map((command) => (
                            <button
                                key={command.label}
                                type="button"
                                onClick={() => {
                                    command.onSelect();
                                    onClose();
                                }}
                                className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                            >
                                <div className="font-medium">{command.label}</div>
                                {command.description ? (
                                    <div className="mt-1 text-xs text-slate-500">
                                        {command.description}
                                    </div>
                                ) : null}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
