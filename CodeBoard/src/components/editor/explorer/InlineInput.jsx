import { useEffect, useRef } from "react";

function InlineInput({ value, onChange, onSubmit, onCancel, placeholder }) {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
        }
    }

    return (
        <div className="border-b border-slate-800 px-3 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
                <button
                    type="button"
                    onClick={onSubmit}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-100 transition hover:bg-slate-700"
                >
                    Create
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default InlineInput;
