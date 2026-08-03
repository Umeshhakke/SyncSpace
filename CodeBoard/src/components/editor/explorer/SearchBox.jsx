import { Search, X } from "lucide-react";

function SearchBox({ value, onChange }) {
    return (
        <div className="border-b border-slate-800 px-3 py-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Search files…"
                    className="w-full rounded-md border border-slate-700 bg-slate-950/95 py-2 pl-10 pr-10 text-sm text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700"
                />

                {value ? (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute right-3 top-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export default SearchBox;
